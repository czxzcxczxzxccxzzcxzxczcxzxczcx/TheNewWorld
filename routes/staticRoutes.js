const express = require('express');
const path = require('path');
const fs = require('fs');
const { User } = require('../utils/database/database'); // Import User model if needed

const router = express.Router();

// Define static pages
const staticPages = [
    '/', 
    '/home', 
    '/createPost', 
    '/messages', 
    '/following', 
    '/admin',
    '/moderation',
    '/search',
    '/support',
    '/settings',
    '/whatisthenewworld',
    '/supportthenewworld',
    '/support-panel',
];

// Set up routes for static pages
staticPages.forEach((route) => {
    router.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        const filePath = path.join(__dirname, '../public', 'html', `${pageName}.html`);
        try {
            const template = fs.readFileSync(filePath, 'utf8');
            res.send(template);
        } catch (error) {
            console.error(`Error loading static page ${pageName}:`, error);
            res.status(500).send('Internal Server Error');
        }
    });
});

// Unified route for profile page by account number or username
router.get('/profile/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        let user;

        if (isNaN(identifier)) {
            // If identifier is not a number, treat it as a username (case-insensitive)
            user = await User.findOne({ 
                username: { $regex: new RegExp(`^${identifier}$`, 'i') } 
            });
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

// Route for individual post page
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
        // Validate that the post exists
        const { Post } = require('../utils/database/database');
        const post = await Post.findOne({ postId });

        if (!post) {
            return res.status(404).send('ERROR 404 | Post Not Found');
        }

        const templatePath = path.join(__dirname, '../public/html/post.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template);
    } catch (error) {
        console.error('Error fetching post page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Inject a console message into every HTML page
router.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (typeof body === 'string') {
            if (body.includes('<head>') && !body.includes('id="theme-bootstrap"')) {
                const themeBootstrapScript = `<script id="theme-bootstrap">(function(){try{var storedTheme=localStorage.getItem('theme');var validThemes=['light','dark','auto'];var theme=validThemes.includes(storedTheme)?storedTheme:'auto';if(!storedTheme){localStorage.setItem('theme', theme);}var html=document.documentElement;html.classList.remove('theme-light','theme-dark','theme-auto','auto-light','auto-dark');html.classList.add('theme-'+theme);if(theme==='auto'){var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;html.classList.add(prefersDark?'auto-dark':'auto-light');}}catch(e){document.documentElement.classList.add('theme-auto');}})();</script>`;
                body = body.replace('<head>', `<head>${themeBootstrapScript}`);
            }

            if (body.includes('</body>')) {
                const consoleScript = `<script>console.log('FOR YOUR OWN SECURITY DO NOT SEND ANYTHING INSIDE THIS CONSOLE TO OTHERS');</script>`;
                body = body.replace('</body>', consoleScript + '</body>');
            }
        }
        return originalSend.call(this, body);
    };
    next();
});

// Catch-all route for undefined pages (404)
router.use((req, res) => {
    const notFoundPath = path.join(__dirname, '../public/html/notFound.html');
    res.status(404).sendFile(notFoundPath);
});

module.exports = router;