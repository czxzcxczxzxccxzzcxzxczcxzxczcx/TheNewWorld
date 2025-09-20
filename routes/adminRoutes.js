const express = require('express');
const { Post, User, fixPosts, fixProfile } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore
const router = express.Router();

// Helper function to check if user has admin access
async function hasAdminAccess(accountNumber, requiredRole = 'admin') {
    try {
        const user = await User.findOne({ accountNumber });
        if (!user) return false;
        
        const roleHierarchy = { user: 0, admin: 1, headAdmin: 2 };
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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        // Verify if the session ID exists in the session store
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        // Verify if the session ID exists in the session store
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        // Verify if the session ID exists in the session store
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

        // Check if user has admin access
        const hasAccess = await hasAdminAccess(accountNumber, 'admin');
        if (hasAccess) {
            return res.status(200).json({ success: true, message: 'Admin access verified' });
        } else {
            return res.status(200).json({ success: false, message: 'Admin access denied' });
        }
    } catch (error) {
        console.error('Error verifying admin access:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/getAllUsers', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;

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
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;

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

module.exports = router;

