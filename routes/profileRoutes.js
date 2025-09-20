const express = require('express');
const { User, Notification, Post, Comment, Message } = require('../utils/database/database');
const { createNotification } = require('../utils/database/genNotification');
const { updateUserPassword } = require('../utils/database/databaseFunctions');

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
    const { bio, pfp, username } = req.body;
    const sessionId = req.cookies.TNWID;
    try {
        if (sessionId && sessionStore[sessionId]) {
            // Username validation (same as /newAccount in authRoutes.js)
            if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 20) {
                return res.status(400).json({ success: false, message: 'Username must be 3-20 characters' });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return res.status(400).json({ success: false, message: 'Username must be alphanumeric or underscores' });
            }
            // Enhanced duplicate username logic
            const user = sessionStore[sessionId];
            const accountNumber = user.accountNumber;
            // Find all users with the same username (case-insensitive)
            const potentialUsers = await User.find({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
            if (potentialUsers.length > 1) {
                // If more than one user has this username (case-insensitive)
                // Only allow if the user is keeping their own exact username (case-sensitive)
                const isOwnExact = potentialUsers.some(u => u.accountNumber === accountNumber && u.username === username);
                if (!isOwnExact) {
                    return res.status(400).json({ success: false, message: 'Multiple accounts exist with this username (different cases). Please choose a unique username.' });
                }
            } else if (potentialUsers.length === 1) {
                // If one user exists, make sure it's either the current user or not taken
                if (potentialUsers[0].accountNumber !== accountNumber) {
                    return res.status(400).json({ success: false, message: 'Username is already taken' });
                }
            }

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
        console.error("Error updating settings:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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

// Route to remove a follower (secure endpoint)
router.post('/removeFollower', async (req, res) => {
    const { followerAccountNumber } = req.body;
    const currentUserAccountNumber = req.session.user.accountNumber;

    try {
        // Validate input
        if (!followerAccountNumber) {
            return res.status(400).json({ success: false, message: 'Follower account number is required' });
        }

        // Find the current user
        const currentUser = await User.findOne({ accountNumber: currentUserAccountNumber });
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'Current user not found' });
        }

        // Find the follower user
        const followerUser = await User.findOne({ accountNumber: followerAccountNumber });
        if (!followerUser) {
            return res.status(404).json({ success: false, message: 'Follower user not found' });
        }

        // Check if the follower is actually following the current user
        if (!currentUser.followers.includes(followerAccountNumber)) {
            return res.status(400).json({ success: false, message: 'This user is not following you' });
        }

        // Remove the follower from current user's followers list
        await User.updateOne(
            { accountNumber: currentUserAccountNumber },
            { $pull: { followers: followerAccountNumber } }
        );

        // Remove the current user from the follower's following list
        await User.updateOne(
            { accountNumber: followerAccountNumber },
            { $pull: { following: currentUserAccountNumber } }
        );

        console.log(`User ${currentUserAccountNumber} removed follower ${followerAccountNumber}`);
        res.json({ success: true, message: 'Follower removed successfully' });
    } catch (error) {
        console.error('Error removing follower:', error);
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

// Route to set a notification as not shown (hidden)
router.post('/setNotificationShown', async (req, res) => {
    const { notificationId } = req.body;
    const sessionId = req.cookies.TNWID;
    try {
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;
        // Find the notification and ensure it belongs to this user
        const notification = await Notification.findOne({ notificationId });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        if (notification.to !== accountNumber) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this notification' });
        }
        notification.shown = false;
        await notification.save();
        return res.json({ success: true, message: 'Notification set as not shown' });
    } catch (error) {
        console.error('Error setting notification as not shown:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to change user password (user must be authenticated)
router.post('/changePassword', async (req, res) => {
    const { newPassword } = req.body;
    const sessionId = req.cookies.TNWID;
    try {
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;
        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }
        await updateUserPassword(accountNumber, newPassword);
        return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to change username (user must be authenticated)
router.post('/changeUsername', async (req, res) => {
    const { newUsername } = req.body;
    const sessionId = req.cookies.TNWID;
    try {
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length < 3 || newUsername.trim().length > 20) {
            return res.status(400).json({ success: false, message: 'Username must be 3-20 characters' });
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
            return res.status(400).json({ success: false, message: 'Username must be alphanumeric or underscores' });
        }
        // Check if username is taken (case-insensitive)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${newUsername}$`, 'i') } 
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        }
        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;
        await User.findOneAndUpdate(
            { accountNumber },
            { $set: { username: newUsername } },
            { new: true }
        );
        // Update session as well
        user.username = newUsername;
        return res.json({ success: true, message: 'Username updated successfully.' });
    } catch (error) {
        console.error('Error changing username:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Secure password change route that requires current password verification
router.post('/changePasswordSecure', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const sessionId = req.cookies.TNWID;
    
    try {
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        // Get user from database to verify current password
        const dbUser = await User.findOne({ accountNumber });
        if (!dbUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const bcrypt = require('bcrypt');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update password
        await updateUserPassword(accountNumber, newPassword);
        return res.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error changing password securely:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Secure account deletion route
router.post('/deleteAccount', async (req, res) => {
    const { confirmUsername } = req.body;
    const sessionId = req.cookies.TNWID;
    
    try {
        if (!sessionId || !sessionStore[sessionId]) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = sessionStore[sessionId];
        const accountNumber = user.accountNumber;

        // Get user from database
        const dbUser = await User.findOne({ accountNumber });
        if (!dbUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify username confirmation
        if (confirmUsername !== dbUser.username) {
            return res.status(400).json({ success: false, message: 'Username confirmation does not match' });
        }

        // Delete all user's posts
        await Post.deleteMany({ accountNumber });

        // Delete all user's comments
        await Comment.deleteMany({ accountNumber });

        // Delete all user's messages
        await Message.deleteMany({ 
            $or: [
                { senderAccountNumber: accountNumber },
                { receiverAccountNumber: accountNumber }
            ]
        });

        // Delete all user's notifications
        await Notification.deleteMany({
            $or: [
                { fromAccountNumber: accountNumber },
                { accountNumber: accountNumber }
            ]
        });

        // Remove user from other users' following/followers lists
        await User.updateMany(
            { following: accountNumber },
            { $pull: { following: accountNumber } }
        );
        await User.updateMany(
            { followers: accountNumber },
            { $pull: { followers: accountNumber } }
        );

        // Delete the user account
        await User.deleteOne({ accountNumber });

        // Clear session
        delete sessionStore[sessionId];

        // Clear session cookie
        res.clearCookie('TNWID');

        return res.json({ success: true, message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;