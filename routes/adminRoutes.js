const express = require('express');
const { Post, User, fixPosts, fixProfile } = require('../utils/database');
const sessionStore = require('../utils/sessionStore'); // Import sessionStore
const router = express.Router();

const matchId = 2369255378 
                
router.post('/updateData', async (req, res) => {
    const { field, value } = req.body;
    const sessionId = req.cookies.TNWID; // Retrieve session ID from cookies

    try {
        // Verify if the session ID exists in the session store
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user from session store
        const userId = Number(user.accountNumber); // Ensure userId is a number
        console.log(userId, matchId); // Debugging log

        // Verify if the userId matches matchId
        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
        }

        // Use the updateData function to update the user data
        const result = await User.findOneAndUpdate(
            { accountNumber: userId },
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
        const userId = Number(user.accountNumber); // Ensure userId is a number

        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
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
        const userId = Number(user.accountNumber); // Ensure userId is a number

        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
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
        const userId = Number(user.accountNumber); // Ensure userId is a number

        // Verify if the userId matches matchId
        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
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
        const userId = Number(user.accountNumber); // Ensure userId is a number
        console.log(userId, matchId); // Debugging log

        // Check if the userId matches matchId
        if (userId === matchId) {
            return res.status(200).json({ success: true, message: 'User ID matches matchId' });
        } else {
            return res.status(403).json({ success: false, message: 'User ID does not match matchId' });
        }
    } catch (error) {
        console.error('Error verifying matchId:', error);
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
        const userId = Number(user.accountNumber); // Ensure userId is a number

        // Verify if the userId matches matchId
        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
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
        const userId = Number(user.accountNumber); // Ensure userId is a number

        // Verify if the userId matches matchId
        if (userId !== matchId) {
            return res.status(403).json({ success: false, message: 'Unauthorized: User ID does not match' });
        }

        // Fetch all posts
        const posts = await Post.find();
        return res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;

