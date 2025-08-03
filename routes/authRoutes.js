const express = require('express');
const { body, validationResult } = require('express-validator');
const { Post, User } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore'); 
const { hashPassword, comparePassword } = require('../utils/hashing');
const crypto = require('crypto');
const passport = require('../utils/passport');
const router = express.Router();

// Function to generate a unique account number
const generateAccountNumber = async () => {
    let accountNumber;
    let userExists = true;

    while (userExists) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const existingUser = await User.findOne({ accountNumber: accountNumber });
        if (!existingUser) {
            userExists = false; 
        }
    }
    return accountNumber
};

// Route to create a new account
router.post(
    '/newAccount',
    // Validate and sanitize input
    [
        body('fullName')
            .trim()
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3-20 characters long')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
        body('password')
            .isLength({ min: 6, max: 67 }).withMessage('Password must be between 6-67 characters long')
            .matches(/[0-9]/).withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
    ],
    
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);

        // If there are validation errors, provide detailed feedback
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }));
            
            return res.json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errorMessages,
                // For backward compatibility, include the first error message directly
                firstError: errors.array()[0].msg
            });
        }

        // Extract username and password from request body
        const { fullName, password } = req.body;

        try {
            // Check if username already exists
            const existingUser = await User.findOne({ username: fullName });
            if (existingUser) {
                return res.json({ 
                    success: false, 
                    message: 'This username is already taken. Please choose a different username.',
                    field: 'fullName'
                });
            }
            
            // Hash password and generate account number
            const hashed = await hashPassword(password);
            const accountNumber = await generateAccountNumber();
            
            // Create new user document
            const newUser = new User({
                accountNumber: accountNumber,
                password: hashed,
                username: fullName,
            });
            
            // Generate session ID
            const sessionId = crypto.randomBytes(16).toString('hex');

            // Save the new user to the database
            await newUser.save();

            // Store session information
            sessionStore[sessionId] = {
                userId: newUser._id,
                username: newUser.username,
                accountNumber: newUser.accountNumber,
            };

            // Set cookie and respond with success
            res.cookie('TNWID', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'Strict',
            });
            
            res.json({ 
                success: true, 
                message: 'Account created successfully',
                user: {
                    username: newUser.username,
                    accountNumber: newUser.accountNumber
                }
            });
            
            console.log(`New account created: ${newUser.username} (${newUser.accountNumber})`);
        } catch (err) {
            console.error('Account creation error:', err);
            res.json({ 
                success: false, 
                message: "An error occurred while creating your account. Please try again later."
            });
        }
    }
);

router.post('/login', async (req, res) => {
    const { fullName, password } = req.body;
    
    // Input validation
    if (!fullName || fullName.trim() === '') {
        return res.json({ 
            success: false, 
            message: 'Username is required',
            field: 'fullName'
        });
    }
    
    if (!password || password.trim() === '') {
        return res.json({ 
            success: false, 
            message: 'Password is required',
            field: 'password'
        });
    }
    
    try {
        const user = await User.findOne({ username: fullName });

        if (user) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                const sessionId = crypto.randomBytes(16).toString('hex'); 
                sessionStore[sessionId] = {userId: user._id, username: user.username, accountNumber: user.accountNumber,};
                
                res.cookie('TNWID', sessionId, {httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000,  sameSite: 'Strict', });
                res.json({ success: true, message: 'Login successful' });

                console.log(`Server Login:\t\tSuccessful by ${user.username} (${user.accountNumber})`);
            } else {
                res.json({ 
                    success: false, 
                    message: 'The password you entered is incorrect',
                    field: 'password'
                });
                console.log(`Server Login:\t\tError: Invalid password for user ${fullName}`);
            }
        } else {
            res.json({ 
                success: false, 
                message: 'No account found with this username',
                field: 'fullName'
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.json({ 
            success: false, 
            message: 'An error occurred while logging in. Please try again later.'
        });
    }
});

router.get('/getUserInfo', (req, res) => {
    const sessionId = req.cookies.TNWID;  

    if (sessionId && sessionStore[sessionId]) {
        const user = sessionStore[sessionId];  
        res.json({ success: true, user });
    } else {
        res.status(200).json({ success: false, message: 'Not authenticated' });
    }
});


// Logs the user out
router.post('/logout', (req, res) => {
    res.clearCookie('TNWID', {httpOnly: true, secure: process.env.NODE_ENV === 'production',  sameSite: 'Strict',});

    const sessionId = req.cookies.TNWID;

    if (sessionId && sessionStore[sessionId]) {
        delete sessionStore[sessionId];
    }

    res.json({ success: true, message: 'Logged out successfully' });
});

// Google OAuth login route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set up session and cookie as with local login
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessionStore[sessionId] = {
      userId: req.user._id,
      username: req.user.username,
      accountNumber: req.user.accountNumber,
    };
    res.cookie('TNWID', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'Strict',
    });
    res.redirect('/home');
  }
);

module.exports = router;