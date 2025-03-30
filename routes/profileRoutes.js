
const express = require('express');
const { Post, User } = require('../utils/database');

const sessionStore = require('../utils/sessionStore'); // Import sessionStore


const router = express.Router();

// Returns profile information
router.get('/get/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({username: user.username, accountNumber: user.accountNumber, bio: user.bio, followers: user.followers, following: user.following, posts: user.posts, pfp: user.pfp,});
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/getUserInfo', (req, res) => {
    const sessionId = req.cookies.TNWID;  

    if (sessionId && sessionStore[sessionId]) {
        const user = sessionStore[sessionId];  
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

router.post('/viewAllUsers', async (req, res) => {
    try {
        if (User) {
            const users = await User.find();
            console.log(users);
            res.json({success: true,message: 'Successfully retrieved all users',});
        }

    } catch (err) {
        console.error("Error fetching users:", err);
        res.json({
            success: false,
            message: 'Error fetching users from the database'
        });
    }
});

router.post('/updateSettings', async (req, res) => {
    const { bio,pfp,username } = req.body;
    const sessionId = req.cookies.TNWID;  
    try {
        if (sessionId && sessionStore[sessionId]) {
            const user = sessionStore[sessionId];  
            const accountNumber = user.accountNumber;

            await User.findOneAndUpdate(
                { accountNumber },
                { $set: { bio: bio, pfp: pfp, username: username } },
                { new: true }
            );
            
            return res.json({ success: true, message: 'done' });
        } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        } 

    } catch (error) {
        console.error("Error updating password:", error);
    }
});

module.exports = router;