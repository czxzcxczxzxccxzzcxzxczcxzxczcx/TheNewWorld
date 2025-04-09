const express = require('express');
const { Post, User } = require('../utils/database');
const sessionStore = require('../utils/sessionStore'); // Import sessionStore
const router = express.Router();



router.post('/deleteUser', async (req, res) => {
    const { postId } = req.body;
    const sessionId = req.cookies.TNWID;  

    try {
    

       
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});