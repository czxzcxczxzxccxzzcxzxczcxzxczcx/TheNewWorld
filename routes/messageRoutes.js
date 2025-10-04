const express = require('express');
const { Message, User } = require('../utils/database/database');
const router = express.Router();
const sessionStore = require('../utils/database/sessionStore'); 
const { createNotification } = require('../utils/database/genNotification');

// Generate a unique message ID
const generateUniqueMessageId = async () => {
    let messageId;
    let messageExists = true;

    while (messageExists) {
        messageId = `message-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const existingMessage = await Message.findOne({ messageId });
        if (!existingMessage) {
            messageExists = false;
        }
    }
    return messageId;
};

// Route to send a message
router.post('/sendMessage', async (req, res) => {
    const { to, content = '', gifUrl = '', attachments = [] } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = await sessionStore.get(sessionId);
        const from = String(sender.accountNumber);
        const normalizedRecipientAccount = String(to);

        // Validate sender and recipient
        const senderUser = await User.findOne({ accountNumber: from });
        const recipientUser = await User.findOne({ accountNumber: normalizedRecipientAccount });

        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'Sender not found' });
        }
        if (!recipientUser) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        const normalizedGifUrl = typeof gifUrl === 'string' ? gifUrl.trim() : '';
        const normalizedAttachments = Array.isArray(attachments)
            ? attachments
                .map((attachment) => {
                    if (!attachment) return null;

                    if (typeof attachment === 'string') {
                        const cleanUrl = attachment.trim();
                        return cleanUrl ? { url: cleanUrl, type: 'image' } : null;
                    }

                    if (typeof attachment === 'object' && typeof attachment.url === 'string') {
                        const cleanUrl = attachment.url.trim();
                        if (!cleanUrl) return null;
                        return {
                            url: cleanUrl,
                            type: typeof attachment.type === 'string' && attachment.type.trim()
                                ? attachment.type.trim()
                                : 'image'
                        };
                    }

                    return null;
                })
                .filter(Boolean)
            : [];

        if (!trimmedContent && !normalizedGifUrl && !normalizedAttachments.length) {
            return res.status(400).json({ success: false, message: 'Message must include text, a GIF, or an attachment' });
        }

        // Generate a unique message ID
        const messageId = await generateUniqueMessageId();

        // Create and save the message
        const newMessage = new Message({
            messageId,
            from,
            to: normalizedRecipientAccount,
            content: trimmedContent,
            gifUrl: normalizedGifUrl,
            attachments: normalizedAttachments,
        });

        await newMessage.save();

        // Add the sender to the recipient's openDM array if not already present
        const recipientHasSender = Array.isArray(recipientUser.openDM)
            ? recipientUser.openDM.some((entry) => String(entry) === from)
            : false;
        if (!recipientHasSender) {
            recipientUser.openDM.push(from);
            await recipientUser.save();
        }

        // Generate a notification for the recipient of the direct message
        const notification = await createNotification({
            from,
            to: String(recipientUser.accountNumber),
            content: `${senderUser.username} sent you a message.`,
        });


    res.status(201).json({ success: true, message: 'Message sent successfully', messageData: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to delete a message
router.delete('/deleteMessage/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the user's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        const accountNumber = String(user.accountNumber);

        // Find the message by ID
        const message = await Message.findOne({ messageId });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Ensure the user is the sender of the message (only sender can delete)
        if (String(message.from) !== accountNumber) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        // Delete the message
        await Message.deleteOne({ messageId });

        res.status(200).json({ 
            success: true, 
            message: 'Message deleted successfully',
            deletedMessage: {
                messageId: message.messageId,
                from: message.from,
                to: message.to
            }
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to add a new open DM
router.post('/addOpenDM', async (req, res) => {
    const { recipientAccountNumber } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = await sessionStore.get(sessionId);
        const senderAccountNumber = String(sender.accountNumber);
        const normalizedRecipient = String(recipientAccountNumber);

        // Validate recipient
        const recipientUser = await User.findOne({ accountNumber: normalizedRecipient });
        if (!recipientUser) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        // Add the recipient to the sender's openDM array if not already present
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });
        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'Sender not found' });
        }

        const senderHasRecipient = Array.isArray(senderUser.openDM)
            ? senderUser.openDM.some((entry) => String(entry) === normalizedRecipient)
            : false;

        if (!senderHasRecipient) {
            senderUser.openDM.push(normalizedRecipient);
            await senderUser.save();
        }

        res.status(200).json({ success: true, message: 'Open DM added successfully' });
    } catch (error) {
        console.error('Error adding open DM:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get open DMs
router.post('/getOpenDMs', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

    const sender = await sessionStore.get(sessionId);
    const senderAccountNumber = String(sender.accountNumber);

        // Retrieve the sender's openDM array
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });

        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const normalizedOpenDMs = Array.isArray(senderUser.openDM)
            ? senderUser.openDM.map((entry) => String(entry))
            : [];

        // Fetch user details for each account in openDM
        const openDMs = await User.find({ accountNumber: { $in: normalizedOpenDMs } }, 'accountNumber username pfp verified');

        // For each open DM, get the latest message time between the sender and the DM user
        const openDMsWithLatest = await Promise.all(openDMs.map(async (dmUser) => {
            const latestMessage = await Message.findOne({
                $or: [
                    { from: senderAccountNumber, to: String(dmUser.accountNumber) },
                    { from: String(dmUser.accountNumber), to: senderAccountNumber }
                ]
            }).sort({ sentAt: -1 }).limit(1);
            return {
                accountNumber: dmUser.accountNumber,
                username: dmUser.username,
                pfp: dmUser.pfp,
                verified: !!dmUser.verified,
                latestMessageTime: latestMessage ? latestMessage.sentAt : null,
                latestMessageContent: latestMessage ? latestMessage.content : null
            };
        }));

        res.status(200).json({ success: true, openDMs: openDMsWithLatest });
    } catch (error) {
        console.error('Error fetching open DMs:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get users with open DMs containing messages with the requesting user
router.post('/getIncomingDMs', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

    const recipient = await sessionStore.get(sessionId);
    const recipientAccountNumber = String(recipient.accountNumber);

        // Find users who have the requesting user in their openDM array
        const usersWithOpenDMs = await User.find(
            { openDM: recipientAccountNumber },
            'accountNumber username pfp verified'
        );

        res.status(200).json({ success: true, users: usersWithOpenDMs });
    } catch (error) {
        console.error('Error fetching users with open DMs:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/getMessages', async (req, res) => {
    const { from, to } = req.body;
    const normalizedFrom = String(from);
    const normalizedTo = String(to);

    try {
        // Validate sender and recipient
        const sender = await User.findOne({ accountNumber: normalizedFrom });
        const recipient = await User.findOne({ accountNumber: normalizedTo });

        if (!sender || !recipient) {
            return res.status(404).json({ success: false, message: 'Sender or recipient not found' });
        }
        // Fetch messages between the sender and recipient
        const messages = await Message.find({
            $or: [
                { from: normalizedFrom, to: normalizedTo },
                { from: normalizedTo, to: normalizedFrom }
            ]
        }).sort({ sentAt: 1 }); // Sort messages by sentAt in ascending order

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to remove an open DM
router.post('/removeOpenDM', async (req, res) => {
    const { recipientAccountNumber } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = await sessionStore.get(sessionId);
        const senderAccountNumber = String(sender.accountNumber);
        const normalizedRecipient = String(recipientAccountNumber);

        // Validate recipient
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });
        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove the recipient from the sender's openDM array if present
        const index = Array.isArray(senderUser.openDM)
            ? senderUser.openDM.findIndex((entry) => String(entry) === normalizedRecipient)
            : -1;
        if (index !== -1) {
            senderUser.openDM.splice(index, 1);
            await senderUser.save();
        }

        res.status(200).json({ success: true, message: 'Open DM removed successfully' });
    } catch (error) {
        console.error('Error removing open DM:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
