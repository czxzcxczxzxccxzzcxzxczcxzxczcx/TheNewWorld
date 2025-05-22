const express = require('express');
const { body, validationResult } = require('express-validator');
const { Post, User } = require('../utils/database');
const sessionStore = require('../utils/database/sessionStore'); 
const { hashPassword, comparePassword } = require('../utils/hashing');
const crypto = require('crypto');

const router = express.Router();

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

router.post(
    '/newAccount',
    [
        body('fullName')
            .trim()
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
            .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be alphanumeric or underscores'),
        body('password')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({ success: false, message: errors.array()[0].msg });
        }

        const { fullName, password } = req.body;

        try {
            const hashed = await hashPassword(password);
            const accountNumber = await generateAccountNumber();
            const newUser = new User({accountNumber: accountNumber, password: hashed, username: fullName,});
            const sessionId = crypto.randomBytes(16).toString('hex');

            await newUser.save();

            sessionStore[sessionId] = {userId: newUser._id, username: newUser.username, accountNumber: newUser.accountNumber,};

            res.cookie('TNWID', sessionId, {httpOnly: true,  secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000, sameSite: 'Strict',});
            res.json({ success: true, user: newUser });
        } catch (err) {
            res.json({ success: false, message: "Error creating user" });
        }
    }
);

router.post('/login', async (req, res) => {
    const { fullName, password } = req.body;
    
    try {
        const user = await User.findOne({ username: fullName });

        if (user) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                const sessionId = crypto.randomBytes(16).toString('hex'); 
                sessionStore[sessionId] = {userId: user._id, username: user.username, accountNumber: user.accountNumber,};
                
                res.cookie('TNWID', sessionId, {httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000,  sameSite: 'Strict', });
                res.json({ success: true, message: 'Login successful' });

                console.log(`Server Login:\t\tSuccessful`);
            } else {
                res.json({ success: false, message: 'Invalid password' });
                console.log(`Server Login:\t\tError: Invalid password`);

            }
        } else {
            res.json({ success: false, message: 'Invalid account number or name' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Error logging in' });
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


module.exports = router;