const express = require('express');
const { Ticket, User } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Helper to retrieve user data from the session store
async function getUserFromSession(sessionId) {
    if (!sessionId) return null;
    return await sessionStore.get(sessionId);
}

// Helper function to check if user has support access (moderator, admin, or headAdmin)
async function hasSupportAccess(accountNumber, requiredRole = 'moderator') {
    try {
        const user = await User.findOne({ accountNumber });
        if (!user) return false;
        
        const roleHierarchy = { user: 0, moderator: 1, admin: 2, headAdmin: 3 };
        const userLevel = roleHierarchy[user.adminRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 1;
        
        return userLevel >= requiredLevel;
    } catch (error) {
        console.error('Error checking support access:', error);
        return false;
    }
}

// Generate unique ticket ID
function generateTicketId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `TNW-${timestamp}-${randomStr}`.toUpperCase();
}

// Create a new support ticket
router.post('/support/create-ticket', async (req, res) => {
    const { type, title, description, reportedUser } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        // Validate required fields
        if (!type || !title || !description) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // For user reports, validate reported user exists
        let reportedUserData = null;
        if (type === 'user_report') {
            if (!reportedUser) {
                return res.status(400).json({ success: false, message: 'Reported user is required for user reports' });
            }
            
            reportedUserData = await User.findOne({ accountNumber: reportedUser });
            if (!reportedUserData) {
                return res.status(400).json({ success: false, message: 'Reported user not found' });
            }
        }

        const ticketId = generateTicketId();
        const initialMessage = {
            messageId: uuidv4(),
            senderId: user.accountNumber,
            senderUsername: user.username,
            senderRole: 'user',
            content: description,
            timestamp: new Date(),
            isInternal: false
        };

        const newTicket = new Ticket({
            ticketId,
            userId: user.accountNumber,
            username: user.username,
            type,
            title,
            description,
            reportedUser: reportedUserData ? reportedUserData.accountNumber : null,
            reportedUsername: reportedUserData ? reportedUserData.username : null,
            messages: [initialMessage]
        });

        await newTicket.save();

        return res.status(201).json({ 
            success: true, 
            message: 'Ticket created successfully',
            ticketId: ticketId
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Get user's tickets
router.get('/support/my-tickets', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        const tickets = await Ticket.find({ userId: user.accountNumber })
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, tickets });

    } catch (error) {
        console.error('Error fetching user tickets:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Get single ticket details
router.get('/support/ticket/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check if user owns the ticket or has support access
        const hasAccess = ticket.userId === user.accountNumber || 
                         await hasSupportAccess(user.accountNumber);
        
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Filter internal messages for regular users
        if (!await hasSupportAccess(user.accountNumber)) {
            ticket.messages = ticket.messages.filter(msg => !msg.isInternal);
        }

        return res.status(200).json({ success: true, ticket });

    } catch (error) {
        console.error('Error fetching ticket:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Add message to ticket
router.post('/support/ticket/:ticketId/message', async (req, res) => {
    const { ticketId } = req.params;
    const { content, isInternal } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check if user owns the ticket or has support access
        const hasAccess = ticket.userId === user.accountNumber || 
                         await hasSupportAccess(user.accountNumber);
        
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Only support staff can send internal messages
        const canSendInternal = await hasSupportAccess(user.accountNumber);
        const messageIsInternal = isInternal && canSendInternal;

        const newMessage = {
            messageId: uuidv4(),
            senderId: user.accountNumber,
            senderUsername: user.username,
            senderRole: user.adminRole || 'user',
            content: content.trim(),
            timestamp: new Date(),
            isInternal: messageIsInternal
        };

        ticket.messages.push(newMessage);
        ticket.updatedAt = new Date();
        
        // Update status if it's closed and user is replying
        if (ticket.status === 'closed' && ticket.userId === user.accountNumber) {
            ticket.status = 'open';
        }

        await ticket.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Message added successfully',
            newMessage 
        });

    } catch (error) {
        console.error('Error adding message to ticket:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// SUPPORT PANEL ROUTES (Moderator/Admin only)

// Get all tickets for support panel
router.get('/support/support-panel/tickets', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        const hasAccess = await hasSupportAccess(user.accountNumber);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Support access required' });
        }

        const { status, type } = req.query;
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (type && type !== 'all') {
            filter.type = type;
        }

        const tickets = await Ticket.find(filter)
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, tickets });

    } catch (error) {
        console.error('Error fetching support tickets:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Update ticket status
router.post('/support/support-panel/ticket/:ticketId/status', async (req, res) => {
    const { ticketId } = req.params;
    const { status, assignedTo } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }

        const hasAccess = await hasSupportAccess(user.accountNumber);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Support access required' });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (status) {
            ticket.status = status;
        }

        if (assignedTo !== undefined) {
            ticket.assignedTo = assignedTo;
        }

        ticket.updatedAt = new Date();
        await ticket.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Ticket updated successfully',
            ticket 
        });

    } catch (error) {
        console.error('Error updating ticket status:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;