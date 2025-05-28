const express = require('express');
const { User, Notification } = require('../utils/database');
const { createNotification } = require('../utils/database/genNotification');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore


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

// Returns the profile page
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

// Route to follow or unfollow a user
router.post('/follow', async (req, res) => {
    const { recipientAccountNumber } = req.body; // The account number of the user to be followed/unfollowed
    const sessionId = req.cookies.TNWID; // Get session ID from cookies

    try {
        // Verify the sender's session
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId]; // Get sender's user data from session
        const senderAccountNumber = sender.accountNumber;

        // Ensure sender and recipient are not the same
        if (senderAccountNumber === recipientAccountNumber) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }

        // Find both sender and recipient in the database
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });
        const recipientUser = await User.findOne({ accountNumber: recipientAccountNumber });

        if (!senderUser || !recipientUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the sender is already following the recipient
        if (senderUser.following.includes(recipientAccountNumber)) {
            // Reverse the follow action (unfollow)
            senderUser.following = senderUser.following.filter(follow => 
                follow && recipientAccountNumber && follow.toString() !== recipientAccountNumber.toString()
            );
            recipientUser.followers = recipientUser.followers.filter(follower => 
                follower && senderAccountNumber && follower.toString() !== senderAccountNumber.toString()
            );

            // console.log('Unfollowing:', { senderUser, recipientUser });

            // Save the updated documents
            await senderUser.save();
            await recipientUser.save();

            // console.log('After unfollow:', { senderUser, recipientUser });

            return res.json({ success: true, message: 'Unfollowed successfully' });
        } else {
            // Perform the follow action
            senderUser.following.push(recipientAccountNumber);
            recipientUser.followers.push(senderAccountNumber);

            // console.log('Following:', { senderUser, recipientUser });

            // Save the updated documents
            await senderUser.save();
            await recipientUser.save();

            // Generate a notification for the followee if the follower is not the same user
            if (senderAccountNumber !== recipientAccountNumber) {
                const notification = await createNotification({
                    from: senderAccountNumber,
                    to: recipientAccountNumber,
                    content: `${sender.username} started following you.`,
                });

                console.log('Notification created:', notification); // Print the notification data
            }

            // console.log('After follow:', { senderUser, recipientUser });

            return res.json({ success: true, message: 'Followed successfully' });
        }
    } catch (error) {
        console.error('Error processing follow/unfollow request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to update user settings
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

// Route to check if a user is followed by the current user
router.get('/isFollowed/:recipientAccountNumber', async (req, res) => {
    const { recipientAccountNumber } = req.params;
    const sessionId = req.cookies.TNWID; // Get session ID from cookies

    try {
        // Verify the sender's session
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const sender = sessionStore[sessionId]; // Get sender's user data from session
        const senderAccountNumber = sender.accountNumber;

        // Find the sender in the database
        const senderUser = await User.findOne({ accountNumber: senderAccountNumber });

        if (!senderUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the sender is following the recipient
        const isFollowing = senderUser.following.includes(recipientAccountNumber);

        res.json({ success: true, isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get the list of users the current user is following
router.get('/getFollowing/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by account number
        const user = await User.findOne({ accountNumber: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch the list of users the current user is following
        const followingUsers = await User.find({ accountNumber: { $in: user.following } }, 'username accountNumber pfp');

        res.json({ success: true, following: followingUsers });
    } catch (error) {
        console.error('Error fetching following users:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// Route to get the list of users who follow the current user
router.get('/getFollowers/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by account number
        const user = await User.findOne({ accountNumber: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch the list of users who follow the current user
        const followersUsers = await User.find({ accountNumber: { $in: user.followers } }, 'username accountNumber pfp');

        res.json({ success: true, followers: followersUsers });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get user data by account number
router.post('/getUser', async (req, res) => {
    const { accountNumber } = req.body;

    try {
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                username: user.username,
                pfp: user.pfp,
                accountNumber: user.accountNumber,
            },
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get notifications for the current user
router.get('/getNotifications', async (req, res) => {
    const sessionId = req.cookies.TNWID; // Get session ID from cookies

    try {
        // Verify the user's session
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId]; // Get user's data from session
        const accountNumber = user.accountNumber;

        // Fetch notifications for the user
        const notifications = await Notification.find({ to: accountNumber }).sort({ sentAt: -1 });

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get accountNumber using username from req.body
router.post('/getAccountNumber', async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, accountNumber: user.accountNumber });
    } catch (error) {
        console.error('Error fetching accountNumber by username:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;