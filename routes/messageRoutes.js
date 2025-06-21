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
    const { to, content } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        // Verify the sender's session
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId];
        const from = sender.accountNumber;

        // Validate sender and recipient
        const senderUser = await User.findOne({ accountNumber: from });
        const recipientUser = await User.findOne({ accountNumber: to });

        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'Sender not found' });
        }
        if (!recipientUser) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        // Generate a unique message ID
        const messageId = await generateUniqueMessageId();

        // Create and save the message
        const newMessage = new Message({
            messageId,
            from,
            to,
            content,
        });

        await newMessage.save();

        // Add the sender to the recipient's openDM array if not already present
        if (!recipientUser.openDM.includes(from)) {
            recipientUser.openDM.push(from);
            await recipientUser.save();
        }

        // Generate a notification for the recipient of the direct message
        const notification = await createNotification({
            from: sender.accountNumber,
            to: recipientUser.accountNumber,
            content: `${senderUser.username} sent you a message.`,
        });


        res.status(201).json({ success: true, message: 'Message sent successfully', messageData: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to delete a message
router.post('/deleteMessage', async (req, res) => {
    const { messageId, accountNumber } = req.body;

    try {
        // Find the message by ID
        const message = await Message.findOne({ messageId });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Ensure the user is either the sender or recipient of the message
        if (message.from !== accountNumber && message.to !== accountNumber) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this message' });
        }

        // Delete the message
        await Message.deleteOne({ messageId });

        res.status(200).json({ success: true, message: 'Message deleted successfully' });
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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId];
        const senderAccountNumber = sender.accountNumber;

        // Validate recipient
        const recipientUser = await User.findOne({ accountNumber: recipientAccountNumber });
        if (!recipientUser) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        // Add the recipient to the sender's openDM array if not already present
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });
        if (!senderUser.openDM.includes(recipientAccountNumber)) {
            senderUser.openDM.push(recipientAccountNumber);
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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId];
        const senderAccountNumber = sender.accountNumber;

        // Retrieve the sender's openDM array
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });

        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch user details for each account in openDM
        const openDMs = await User.find({ accountNumber: { $in: senderUser.openDM } }, 'accountNumber username pfp');

        // For each open DM, get the latest message time between the sender and the DM user
        const openDMsWithLatest = await Promise.all(openDMs.map(async (dmUser) => {
            const latestMessage = await Message.findOne({
                $or: [
                    { from: senderAccountNumber, to: dmUser.accountNumber },
                    { from: dmUser.accountNumber, to: senderAccountNumber }
                ]
            }).sort({ sentAt: -1 }).limit(1);
            return {
                accountNumber: dmUser.accountNumber,
                username: dmUser.username,
                pfp: dmUser.pfp,
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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const recipient = sessionStore[sessionId];
        const recipientAccountNumber = recipient.accountNumber;

        // Find users who have the requesting user in their openDM array
        const usersWithOpenDMs = await User.find(
            { openDM: recipientAccountNumber },
            'accountNumber username pfp'
        );

        res.status(200).json({ success: true, users: usersWithOpenDMs });
    } catch (error) {
        console.error('Error fetching users with open DMs:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/getMessages', async (req, res) => {
    const { from, to } = req.body;

    try {
        // Validate sender and recipient
        const sender = await User.findOne({ accountNumber: from });
        const recipient = await User.findOne({ accountNumber: to });

        if (!sender || !recipient) {
            return res.status(404).json({ success: false, message: 'Sender or recipient not found' });
        }
        // Fetch messages between the sender and recipient
        const messages = await Message.find({
            $or: [
                { from, to },
                { from: to, to: from }
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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId];
        const senderAccountNumber = sender.accountNumber;

        // Validate recipient
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });
        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove the recipient from the sender's openDM array if present
        const index = senderUser.openDM.indexOf(recipientAccountNumber);
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
