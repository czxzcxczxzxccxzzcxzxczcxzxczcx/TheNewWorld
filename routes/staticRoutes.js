const express = require('express');
const path = require('path');
const fs = require('fs');
const { User } = require('../utils/database'); // Import User model if needed

const router = express.Router();

// Define static pages
const staticPages = ['/', '/home', '/createPost', '/messages', '/following'];

// Set up routes for static pages
staticPages.forEach((route) => {
    router.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        res.sendFile(path.join(__dirname, '../public', 'html', `${pageName}.html`));
    });
});

// Route for profile page
router.get('/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Profile Not Found');
        }

        const templatePath = path.join(__dirname, '../public/html/profile.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;