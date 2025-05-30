const express = require('express');
const path = require('path');
const fs = require('fs');
const { User } = require('../utils/database'); // Import User model if needed

const router = express.Router();

// Define static pages
const staticPages = [
    '/', 
    '/home', 
    '/createPost', 
    '/messages', 
    '/following', 
    '/admin',
    '/search',
    '/support',
    '/settings',
];

// Set up routes for static pages
staticPages.forEach((route) => {
    router.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        res.sendFile(path.join(__dirname, '../public', 'html', `${pageName}.html`));
    });
});

// Unified route for profile page by account number or username
router.get('/profile/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let user;

        if (isNaN(identifier)) {
            // If identifier is not a number, treat it as a username
            user = await User.findOne({ username: identifier });
        } else {
            // Otherwise, treat it as an account number
            user = await User.findOne({ accountNumber: identifier });
        }

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

// Route for following page
router.get('/following/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ accountNumber: userId });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Not Found');
        }

        const templatePath = path.join(__dirname, '../public/html/following.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template);
    } catch (error) {
        console.error('Error fetching following page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for followers page
router.get('/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ accountNumber: userId });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Not Found');
        }

        const templatePath = path.join(__dirname, '../public/html/followers.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template);
    } catch (error) {
        console.error('Error fetching followers page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for direct message page
router.get('/dm/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ accountNumber: userId });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Not Found');
        }

        const templatePath = path.join(__dirname, '../public/html/dm.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template);
    } catch (error) {
        console.error('Error fetching DM page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Inject a console message into every HTML page
router.use((req, res, next) => {
    const send = res.send;
    res.send = function (body) {
        if (typeof body === 'string' && body.includes('</body>')) {
            const script = `<script>console.log('FOR YOUR OWN SECURITY DO NOT SEND ANYTHING INSIDE THIS CONSOLE TO OTHERS');</script>`;
            body = body.replace('</body>', script + '</body>');
        }
        return send.call(this, body);
    };
    next();
});

// Catch-all route for undefined pages (404)
router.use((req, res) => {
    const notFoundPath = path.join(__dirname, '../public/html/notFound.html');
    res.status(404).sendFile(notFoundPath);
});

module.exports = router;