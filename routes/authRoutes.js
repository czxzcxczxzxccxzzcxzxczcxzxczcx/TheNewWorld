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
            // Check if username already exists (case-insensitive)
            const existingUser = await User.findOne({ 
                username: { $regex: new RegExp(`^${fullName}$`, 'i') } 
            });
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

            // Store session information in database
            await sessionStore.create(sessionId, {
                userId: newUser._id,
                username: newUser.username,
                accountNumber: newUser.accountNumber,
                theme: newUser.theme || 'auto',
            });

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
        // First try exact case-sensitive match to handle duplicate usernames
        let user = await User.findOne({ username: fullName });
        
        // If no exact match, try case-insensitive but check for duplicates
        if (!user) {
            const potentialUsers = await User.find({ 
                username: { $regex: new RegExp(`^${fullName}$`, 'i') } 
            });
            
            if (potentialUsers.length === 1) {
                // Only one case-insensitive match, safe to use
                user = potentialUsers[0];
            } else if (potentialUsers.length > 1) {
                // Multiple matches - ambiguous login attempt
                return res.json({ 
                    success: false, 
                    message: 'Multiple accounts found with similar usernames. Please use exact case.',
                    field: 'fullName'
                });
            }
        }

        if (user) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                // Verify user data before creating session
                const verifiedUser = await User.findOne({ 
                    accountNumber: user.accountNumber,
                    username: user.username  // Use exact username, not regex
                });
                
                if (!verifiedUser) {
                    return res.json({ 
                        success: false, 
                        message: 'User verification failed',
                        field: 'general'
                    });
                }
                
                const sessionId = crypto.randomBytes(16).toString('hex'); 
                await sessionStore.create(sessionId, {
                    userId: verifiedUser._id, 
                    username: verifiedUser.username, 
                    accountNumber: verifiedUser.accountNumber,
                    theme: verifiedUser.theme || 'auto'
                });
                
                res.cookie('TNWID', sessionId, {httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000,  sameSite: 'Strict', });
                res.json({ success: true, message: 'Login successful' });

                console.log(`Server Login:\t\tSuccessful by ${verifiedUser.username} (${verifiedUser.accountNumber})`);
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

router.get('/getUserInfo', async (req, res) => {
    const sessionId = req.cookies.TNWID;  

    if (!sessionId) {
        return res.status(200).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const sessionData = await sessionStore.get(sessionId);
        if (!sessionData) {
            return res.status(200).json({ success: false, message: 'Not authenticated' });
        }

        // Get full user data from database
        const user = await User.findOne({ accountNumber: sessionData.accountNumber });
        if (!user) {
            return res.status(200).json({ success: false, message: 'User not found' });
        }

        // Validate session data matches user data (same as requireAuth middleware)
        const dbAccountNumber = Number(user.accountNumber);
        const sessionAccountNumber = Number(sessionData.accountNumber);
        
        if (dbAccountNumber !== sessionAccountNumber || user.username !== sessionData.username) {
            // Session data doesn't match database, invalidate session
            await sessionStore.delete(sessionId);
            return res.status(200).json({ success: false, message: 'Invalid session' });
        }

        let docUpdated = false;

        if (!user.moderationState) {
            user.moderationState = { activeWarningId: null, activeBanId: null };
            user.markModified('moderationState');
            docUpdated = true;
        }

        const now = new Date();

        const resolveWarning = () => {
            let activeWarning = null;
            if (user.moderationState?.activeWarningId) {
                activeWarning = (user.warnings || []).find(warning => warning.warningId === user.moderationState.activeWarningId && !warning.acknowledged);
                if (!activeWarning) {
                    user.moderationState.activeWarningId = null;
                    user.markModified('moderationState');
                    docUpdated = true;
                }
            }

            if (!activeWarning && Array.isArray(user.warnings)) {
                activeWarning = [...user.warnings]
                    .filter(warning => !warning.acknowledged)
                    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0] || null;

                if (activeWarning) {
                    user.moderationState.activeWarningId = activeWarning.warningId;
                    user.markModified('moderationState');
                    docUpdated = true;
                }
            }

            return activeWarning;
        };

        const resolveBan = () => {
            let activeBan = null;
            if (user.moderationState?.activeBanId) {
                activeBan = (user.bans || []).find(ban => ban.banId === user.moderationState.activeBanId && ban.status === 'active');
                if (!activeBan) {
                    user.moderationState.activeBanId = null;
                    user.markModified('moderationState');
                    docUpdated = true;
                }
            }

            if (!activeBan && Array.isArray(user.bans)) {
                activeBan = [...user.bans]
                    .filter(ban => ban.status === 'active')
                    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0] || null;
                if (activeBan) {
                    user.moderationState.activeBanId = activeBan.banId;
                    user.markModified('moderationState');
                    docUpdated = true;
                }
            }

            if (activeBan && activeBan.expiresAt && activeBan.expiresAt <= now) {
                activeBan.status = 'expired';
                activeBan.liftedAt = now;
                user.moderationState.activeBanId = null;
                user.markModified('moderationState');
                user.markModified('bans');
                docUpdated = true;
                return null;
            }

            return activeBan;
        };

        const activeWarning = resolveWarning();
        const activeBan = resolveBan();

        if (docUpdated) {
            try {
                await user.save();
            } catch (saveError) {
                console.error('Error updating moderation state in getUserInfo:', saveError);
            }
        }

        const sanitizeWarning = (warning) => warning ? {
            warningId: warning.warningId,
            reason: warning.reason,
            issuedBy: warning.issuedBy,
            issuedByUsername: warning.issuedByUsername,
            issuedByRole: warning.issuedByRole,
            issuedAt: warning.issuedAt,
            acknowledged: warning.acknowledged,
            acknowledgedAt: warning.acknowledgedAt
        } : null;

        const sanitizeBan = (ban) => ban ? {
            banId: ban.banId,
            reason: ban.reason,
            issuedBy: ban.issuedBy,
            issuedByUsername: ban.issuedByUsername,
            issuedByRole: ban.issuedByRole,
            issuedAt: ban.issuedAt,
            expiresAt: ban.expiresAt,
            status: ban.status,
            liftedAt: ban.liftedAt,
            liftedBy: ban.liftedBy,
            liftedByUsername: ban.liftedByUsername
        } : null;

        // Return full user data (excluding sensitive information like password)
        const userInfo = {
            _id: user._id,
            username: user.username,
            accountNumber: user.accountNumber,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts,
            pfp: user.pfp,
            theme: user.theme,
            verified: !!user.verified,
            adminRole: user.adminRole || 'user',
            moderation: {
                activeWarning: sanitizeWarning(activeWarning),
                activeBan: sanitizeBan(activeBan),
                warnings: (user.warnings || []).map(sanitizeWarning),
                bans: (user.bans || []).map(sanitizeBan)
            }
        };

        res.json({ success: true, user: userInfo });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


// Logs the user out
router.post('/logout', async (req, res) => {
    const sessionId = req.cookies.TNWID;

    res.clearCookie('TNWID', {httpOnly: true, secure: process.env.NODE_ENV === 'production',  sameSite: 'Strict',});

    if (sessionId) {
        await sessionStore.delete(sessionId);
    }

    res.json({ success: true, message: 'Logged out successfully' });
});

// Google OAuth login route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    // Set up session and cookie as with local login
    const sessionId = crypto.randomBytes(16).toString('hex');
    await sessionStore.create(sessionId, {
      userId: req.user._id,
      username: req.user.username,
      accountNumber: req.user.accountNumber,
      theme: req.user.theme || 'auto',
    });
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