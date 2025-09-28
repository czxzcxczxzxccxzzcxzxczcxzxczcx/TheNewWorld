const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./passport');
const setupRoutes = require('./setupRoutes');
const { initDatabase } = require('./database/initDatabase');
const setupSocket = require('./socket');
const { Server } = require('socket.io');
const sessionStore = require('./database/sessionStore');
const { User } = require('./database/database');

const server = require('http').createServer(app);
const io = new Server(server, {cors: {origin: '*',methods: ['GET', 'POST']}});

async function requireAuth(req, res, next) {
    const sessionId = req.cookies.TNWID;
    
    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    try {
        // Get session data from database
        const sessionData = await sessionStore.get(sessionId);
        
        if (!sessionData) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
        
        // Verify session data against database
        const user = await User.findOne({ accountNumber: sessionData.accountNumber });
        
        if (!user) {
            // User doesn't exist in database, invalidate session
            await sessionStore.delete(sessionId);
            return res.status(401).json({ success: false, message: 'Invalid session - user not found' });
        }
        
        // Convert both account numbers to numbers for comparison to handle type mismatches
        const dbAccountNumber = Number(user.accountNumber);
        const sessionAccountNumber = Number(sessionData.accountNumber);
        
        // Verify both account number and username match exactly (with type conversion for account numbers)
        if (dbAccountNumber !== sessionAccountNumber || user.username !== sessionData.username) {
            // Session data doesn't match database, invalidate session
            await sessionStore.delete(sessionId);
            return res.status(401).json({ success: false, message: 'Invalid session - user data mismatch' });
        }
        
        // Track moderation state
        let docUpdated = false;
        if (!user.moderationState) {
            user.moderationState = { activeBanId: null, activeWarningId: null };
            user.markModified('moderationState');
            docUpdated = true;
        }

        const now = new Date();
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
            activeBan = user.bans.find(ban => ban.status === 'active');
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
            docUpdated = true;
            activeBan = null;
            user.markModified('bans');
        }

        if (docUpdated) {
            try {
                await user.save();
            } catch (saveError) {
                console.error('[AUTH] Failed to update user moderation state:', saveError);
            }
        }

        if (activeBan) {
            return res.status(403).json({
                success: false,
                message: 'Account is currently banned.',
                code: 'BANNED',
                ban: {
                    banId: activeBan.banId,
                    reason: activeBan.reason,
                    issuedAt: activeBan.issuedAt,
                    expiresAt: activeBan.expiresAt,
                    issuedBy: activeBan.issuedBy,
                    issuedByUsername: activeBan.issuedByUsername,
                    issuedByRole: activeBan.issuedByRole,
                    status: activeBan.status
                }
            });
        }

        // Authentication successful
        req.currentUser = user;
        req.sessionData = sessionData;
        next();
    } catch (error) {
        console.error('[AUTH] Authentication error:', error);
        return res.status(500).json({ success: false, message: 'Authentication error' });
    }
}

app.set('trust proxy', 1); // or true
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

initDatabase();
setupSocket(io);

// Set up periodic session cleanup (run every hour)
setInterval(async () => {
    await sessionStore.cleanupExpired();
}, 60 * 60 * 1000); // 1 hour

module.exports = { app, server, setupRoutes, express, requireAuth, io };