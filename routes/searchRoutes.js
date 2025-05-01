const express = require('express');
const router = express.Router();
const { Post, User } = require('../utils/database');

// Ensure the app uses JSON middleware in the main server file (not shown here)

// Search posts by title or body
router.post('/searchPosts', async (req, res) => {
    const { data } = req.body; // Get the input data from the request body
    if (!data) {
        return res.status(400).json({ success: false, message: 'Data parameter is required.' });
    }

    try {
        const posts = await Post.find({
            $or: [
                { title: { $regex: data, $options: 'i' } }, // Case-insensitive search in title
                { body: { $regex: data, $options: 'i' } }   // Case-insensitive search in body
            ]
        });

        res.json({ success: true, posts }); // Return the matching posts
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Pass over the input for search users
router.post('/searchUsers', (req, res) => {
    const { data } = req.body; // Get the input data from the request body
    if (!data) {
        return res.status(400).json({ success: false, message: 'Data parameter is required.' });
    }

    res.json({ success: true, data }); // Return the input data
});

module.exports = router;
