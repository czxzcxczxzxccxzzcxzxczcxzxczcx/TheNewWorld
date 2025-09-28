const express = require('express');
const { Post, User, Ticket, fixPosts, fixProfile } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore
const router = express.Router();

function normalizeAccountNumber(value) {
    if (value === null || value === undefined) return null;
    return String(value);
}

function buildTicketQuery(params = {}) {
    const { status, type, search } = params;
    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (type && type !== 'all') {
        filter.type = type;
    }

    const trimmedSearch = (search || '').trim();
    if (trimmedSearch) {
        const regex = new RegExp(trimmedSearch, 'i');
        const conditions = [
            { ticketId: regex },
            { title: regex },
            { username: regex },
            { reportedUsername: regex }
        ];

        if (/^\d+$/.test(trimmedSearch)) {
            const normalized = normalizeAccountNumber(trimmedSearch);
            conditions.push({ userId: normalized });
            conditions.push({ reportedUser: normalized });
        }

        filter.$or = conditions;
    }

    return filter;
}

// Helper function to get user from session
async function getUserFromSession(sessionId) {
    if (!sessionId) return null;
    return await sessionStore.get(sessionId);
}

// Helper function to check if user has admin access
async function hasAdminAccess(accountNumber, requiredRole = 'admin') {
    try {
        const normalizedAccountNumber = normalizeAccountNumber(accountNumber);
        if (!normalizedAccountNumber) return false;

        const user = await User.findOne({ accountNumber: normalizedAccountNumber });
        if (!user) return false;
        
        const roleHierarchy = { user: 0, moderator: 1, admin: 2, headAdmin: 3 };
        const userLevel = roleHierarchy[user.adminRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 1;
        
        return userLevel >= requiredLevel;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
} 
                
router.post('/updateData', async (req, res) => {
    const { accountNumber, field, value } = req.body;
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        } // Get user from session store
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        // Use the updateData function to update the user data
        const result = await User.findOneAndUpdate(
            { accountNumber: accountNumber },
            { $set: { [field]: value } },
            { new: true }
        );

        if (result) {
            return res.status(200).json({ success: true, message: 'User data updated successfully', user: result });
        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user data:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/fixPostData', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Get user from session store
        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        await fixPosts();
    } catch (error) {
        console.error('Error updating post data:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/fixUserData', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Get user from session store
        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        await fixProfile();
    } catch (error) {
        console.error('Error updating post data:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/updatePost', async (req, res) => {
    const { field, value, postId } = req.body;
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        } // Get user from session store
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        // Use the updatePost function to update the post data
        const result = await Post.findOneAndUpdate(
            { postId },
            { $set: { [field]: value } },
            { new: true }
        );

        if (result) {
            return res.status(200).json({ success: true, message: 'Post data updated successfully', post: result });
        } else {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
    } catch (error) {
        console.error('Error updating post data:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/verify', async (req, res) => {
    const sessionId = req.cookies.TNWID;  

    try {
        // Get user from session store
        const user = await getUserFromSession(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Get user's admin role from database
        const dbUser = await User.findOne({ accountNumber });
        if (!dbUser) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const role = dbUser.adminRole || 'user';

        // Check if user has admin access (admin level and above)
        const adminAccess = await hasAdminAccess(accountNumber, 'admin');

        // Check if user has support access (moderator level and above)
        const supportAccess = await hasAdminAccess(accountNumber, 'moderator');

        return res.status(200).json({
            success: true,
            role,
            adminRole: role,
            adminAccess,
            supportAccess,
            message: 'Access verified'
        });
    } catch (error) {
        console.error('Error verifying admin access:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/getAllUsers', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        } // Get user from session store
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        // Fetch all users
        const users = await User.find();
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/getAllPosts', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        } // Get user from session store
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        // Fetch all posts
        const posts = await Post.find();
        return res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/getAllMessages', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        } // Get user from session store
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        // Fetch all messages
        const { Message } = require('../utils/database/database');
        const messages = await Message.find();
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route for head admin to grant admin permissions
router.post('/grantAdmin', async (req, res) => {
    const { targetAccountNumber } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has head admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'headAdmin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Head admin access required' });
        }

        // Update target user's role to admin
        const targetUser = await User.findOneAndUpdate(
            { accountNumber: targetAccountNumber },
            { $set: { adminRole: 'admin' } },
            { new: true }
        );

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Admin permissions granted to ${targetUser.username}`,
            user: { username: targetUser.username, accountNumber: targetUser.accountNumber, adminRole: targetUser.adminRole }
        });
    } catch (error) {
        console.error('Error granting admin permissions:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route for head admin to revoke admin permissions
router.post('/revokeAdmin', async (req, res) => {
    const { targetAccountNumber } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has head admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'headAdmin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Head admin access required' });
        }

        // Update target user's role to regular user
        const targetUser = await User.findOneAndUpdate(
            { accountNumber: targetAccountNumber },
            { $set: { adminRole: 'user' } },
            { new: true }
        );

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Admin permissions revoked from ${targetUser.username}`,
            user: { username: targetUser.username, accountNumber: targetUser.accountNumber, adminRole: targetUser.adminRole }
        });
    } catch (error) {
        console.error('Error revoking admin permissions:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get all users with their admin roles (for head admin)
router.get('/getUsersWithRoles', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        // Check if user has head admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'headAdmin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Head admin access required' });
        }

        // Fetch all users with their roles
        const users = await User.find({}, 'username accountNumber adminRole').sort({ adminRole: -1, username: 1 });
        
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users with roles:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Search endpoints for the modern admin panel
router.post('/admin/searchUsers', async (req, res) => {
    const { query } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) {
            return res.status(200).json({ success: true, users: [] });
        }

        const searchRegex = new RegExp(trimmedQuery, 'i');
        const conditions = [
            { username: searchRegex },
            { bio: searchRegex }
        ];

        if (/^\d+$/.test(trimmedQuery)) {
            conditions.push({ accountNumber: normalizeAccountNumber(trimmedQuery) });
        }

        const users = await User.find({ $or: conditions }).limit(50);

        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/searchPosts', async (req, res) => {
    const { query } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) {
            return res.status(200).json({ success: true, posts: [] });
        }

        const searchRegex = new RegExp(trimmedQuery, 'i');
        const conditions = [
            { title: searchRegex },
            { content: searchRegex }
        ];

        conditions.push({ postId: trimmedQuery });

        if (/^\d+$/.test(trimmedQuery)) {
            conditions.push({ accountNumber: normalizeAccountNumber(trimmedQuery) });
        }

        const posts = await Post.find({ $or: conditions }).limit(50);

        return res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error('Error searching posts:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/searchComments', async (req, res) => {
    const { query } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) {
            return res.status(200).json({ success: true, comments: [] });
        }

        const searchRegex = new RegExp(trimmedQuery, 'i');
        const { Comment } = require('../utils/database/database');

        const conditions = [
            { content: searchRegex },
            { commentId: trimmedQuery },
            { postId: trimmedQuery }
        ];

        if (/^\d+$/.test(trimmedQuery)) {
            conditions.push({ accountNumber: normalizeAccountNumber(trimmedQuery) });
        }

        const comments = await Comment.find({ $or: conditions }).limit(50);

        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('Error searching comments:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/searchMessages', async (req, res) => {
    const { query } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const trimmedQuery = (query || '').trim();
        if (!trimmedQuery) {
            return res.status(200).json({ success: true, messages: [] });
        }

        const { Message } = require('../utils/database/database');
        const searchRegex = new RegExp(trimmedQuery, 'i');

        const conditions = [
            { content: searchRegex },
            { messageId: trimmedQuery }
        ];

        if (/^\d+$/.test(trimmedQuery)) {
            const normalized = normalizeAccountNumber(trimmedQuery);
            conditions.push({ senderAccountNumber: normalized });
            conditions.push({ recipientAccountNumber: normalized });
        }

        const messages = await Message.find({ $or: conditions }).limit(50);

        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error searching messages:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/admin/tickets', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { status, type, search } = req.query;
        const query = buildTicketQuery({ status, type, search });

        const tickets = await Ticket.find(query)
            .sort({ updatedAt: -1 })
            .limit(200);

        return res.status(200).json({ success: true, tickets });
    } catch (error) {
        console.error('Error fetching tickets for admin panel:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/searchTickets', async (req, res) => {
    const { status, type, query: search } = req.body || {};
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const query = buildTicketQuery({ status, type, search });
        const tickets = await Ticket.find(query)
            .sort({ updatedAt: -1 })
            .limit(200);

        return res.status(200).json({ success: true, tickets });
    } catch (error) {
        console.error('Error searching tickets for admin panel:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Get all comments endpoint
router.get('/getAllComments', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { Comment } = require('../utils/database/database');
        const comments = await Comment.find().limit(200);
        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Update endpoints for the modern admin panel
router.post('/admin/updateUser', async (req, res) => {
    const { id, username, bio, adminRole, verified } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const targetAccountNumber = normalizeAccountNumber(id);
        const targetUser = await User.findOne({ accountNumber: targetAccountNumber });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const allowedRoles = new Set(['user', 'moderator', 'admin', 'headAdmin']);
        const requesterHasHeadAdminAccess = await hasAdminAccess(accountNumber, 'headAdmin');

        let nextAdminRole = targetUser.adminRole || 'user';
        if (typeof adminRole === 'string' && allowedRoles.has(adminRole)) {
            nextAdminRole = adminRole;
        }

        const isGrantingHeadAdmin = nextAdminRole === 'headAdmin' && targetUser.adminRole !== 'headAdmin';
        if (isGrantingHeadAdmin && !requesterHasHeadAdminAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Head admin access required to grant head admin role' });
        }

        if (targetUser.adminRole === 'headAdmin' && !requesterHasHeadAdminAccess && nextAdminRole !== targetUser.adminRole) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Cannot modify head admin role' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { accountNumber: targetAccountNumber },
            { $set: { username, bio, adminRole: nextAdminRole, verified: !!verified } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/updatePost', async (req, res) => {
    const { id, title, content } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const updatedPost = await Post.findOneAndUpdate(
            { postId: id },
            { $set: { title, content } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        return res.status(200).json({ success: true, message: 'Post updated successfully', post: updatedPost });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/updateComment', async (req, res) => {
    const { id, content } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { Comment } = require('../utils/database/database');
        const updatedComment = await Comment.findOneAndUpdate(
            { commentId: id },
            { $set: { content } },
            { new: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        return res.status(200).json({ success: true, message: 'Comment updated successfully', comment: updatedComment });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/updateMessage', async (req, res) => {
    const { id, content } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { Message } = require('../utils/database/database');
        const updatedMessage = await Message.findOneAndUpdate(
            { messageId: id },
            { $set: { content } },
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        return res.status(200).json({ success: true, message: 'Message updated successfully', message: updatedMessage });
    } catch (error) {
        console.error('Error updating message:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/updateTicket', async (req, res) => {
    const { id, status, priority, assignedTo } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const ticket = await Ticket.findOne({ ticketId: id });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const allowedStatuses = new Set(['open', 'in_progress', 'closed']);
        if (status) {
            if (!allowedStatuses.has(status)) {
                return res.status(400).json({ success: false, message: 'Invalid ticket status' });
            }
            ticket.status = status;
        }

        const allowedPriorities = new Set(['low', 'medium', 'high']);
        if (priority) {
            if (!allowedPriorities.has(priority)) {
                return res.status(400).json({ success: false, message: 'Invalid ticket priority' });
            }
            ticket.priority = priority;
        }

        if (assignedTo !== undefined) {
            ticket.assignedTo = assignedTo ? normalizeAccountNumber(assignedTo) : null;
        }

        ticket.updatedAt = new Date();
        await ticket.save();

        return res.status(200).json({ success: true, message: 'Ticket updated successfully', ticket });
    } catch (error) {
        console.error('Error updating ticket:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Delete endpoints
router.post('/admin/deleteUser', async (req, res) => {
    const { id } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'headAdmin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Head admin access required to delete users' });
        }

        const deletedUser = await User.findOneAndDelete({ accountNumber: id });

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/deletePost', async (req, res) => {
    const { id } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const deletedPost = await Post.findOneAndDelete({ postId: id });

        if (!deletedPost) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/deleteComment', async (req, res) => {
    const { id } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { Comment } = require('../utils/database/database');
        const deletedComment = await Comment.findOneAndDelete({ commentId: id });

        if (!deletedComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/admin/deleteMessage', async (req, res) => {
    const { id } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (!sessionId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = normalizeAccountNumber(user.accountNumber);

        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
        }

        const { Message } = require('../utils/database/database');
        const deletedMessage = await Message.findOneAndDelete({ messageId: id });

        if (!deletedMessage) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        return res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;

