const express = require('express');
const router = express.Router();
const { Post, User } = require('../utils/database/database');
const { resolveVerificationFlags } = require('../utils/verification');

// Ensure the app uses JSON middleware in the main server file (not shown here)

// Search posts by title or content
router.post('/searchPosts', async (req, res) => {
    const { data } = req.body; // Get the input data from the request body
    if (!data) {
        return res.status(400).json({ success: false, message: 'Data parameter is required.' });
    }

    try {

        
        // First check total posts count
        const totalPosts = await Post.countDocuments();

        
        const posts = await Post.find({
            $or: [
                { title: { $regex: data, $options: 'i' } }, // Case-insensitive search in title
                { content: { $regex: data, $options: 'i' } }   // Case-insensitive search in content
            ]
        }).limit(10);



        // Get usernames for the posts
        const postsWithUsernames = await Promise.all(posts.map(async (post) => {
            try {
                const user = await User.findOne({ accountNumber: post.accountNumber });
                const flags = resolveVerificationFlags(user || {});
                return {
                    ...post.toObject(),
                    username: user ? user.username : 'Unknown',
                    pfp: user ? user.pfp : null,
                    userVerified: flags.displayVerified,
                    userDisplayVerified: flags.displayVerified,
                    userActualVerified: flags.actualVerified,
                    userVerificationVisible: flags.verificationVisible,
                    date: post.createdAt || new Date()
                };
            } catch (err) {
                console.error('Error fetching user for post:', err);
                return {
                    ...post.toObject(),
                    username: 'Unknown',
                    pfp: null,
                    userVerified: false,
                    userDisplayVerified: false,
                    userActualVerified: false,
                    userVerificationVisible: false,
                    date: post.createdAt || new Date()
                };
            }
        }));

        res.json({ success: true, posts: postsWithUsernames }); // Return the matching posts
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Pass over the input for search users
router.post('/searchUsers', async (req, res) => {
    const { data } = req.body; // Get the input data from the request body
    if (!data) {
        return res.status(400).json({ success: false, message: 'Data parameter is required.' });
    }

    try {
        // Find users whose username starts with the search data, case-insensitive
        const users = await User.find({
            username: { $regex: '^' + data, $options: 'i' }
        }, 'username pfp accountNumber verified verificationVisible bio').lean();

        const usersWithFlags = users.map(user => {
            const flags = resolveVerificationFlags(user);
            return {
                username: user.username,
                pfp: user.pfp,
                accountNumber: user.accountNumber,
                bio: user.bio,
                verified: flags.displayVerified,
                displayVerified: flags.displayVerified,
                actualVerified: flags.actualVerified,
                verificationVisible: flags.verificationVisible
            };
        });

        res.json({ success: true, users: usersWithFlags });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Test endpoint to check database contents
router.get('/testPosts', async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments();
        const samplePosts = await Post.find().limit(3);
        
        res.json({ 
            success: true, 
            totalPosts,
            samplePosts: samplePosts.map(post => ({
                postId: post.postId,
                title: post.title,
                content: post.content?.substring(0, 100) + '...',
                accountNumber: post.accountNumber
            }))
        });
    } catch (error) {
        console.error('Error checking posts:', error);
        res.status(500).json({ success: false, message: 'Error checking posts' });
    }
});

module.exports = router;
