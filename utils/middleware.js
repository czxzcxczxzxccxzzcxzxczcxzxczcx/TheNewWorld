const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./passport');
const setupRoutes = require('./setupRoutes');
const { initDatabase } = require('./database/initDatabase');
const setupSocket = require('./socket');
const { Server } = require('socket.io');

const server = require('http').createServer(app);
const io = new Server(server, {cors: {origin: '*',methods: ['GET', 'POST']}});

async function requireAuth(req, res, next) {
    const sessionId = req.cookies.TNWID;
    const sessionStore = require('./database/sessionStore');
    const { User } = require('./database/database');
    
    if (!sessionId || !sessionStore[sessionId]) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    try {
        // Get session data
        const sessionData = sessionStore[sessionId];
        
        // Verify session data against database
        const user = await User.findOne({ accountNumber: sessionData.accountNumber });
        
        if (!user) {
            // User doesn't exist in database, invalidate session
            delete sessionStore[sessionId];
            return res.status(401).json({ success: false, message: 'Invalid session - user not found' });
        }
        
        // Verify both account number and username match exactly
        if (user.accountNumber !== sessionData.accountNumber || user.username !== sessionData.username) {
            // Session data doesn't match database, invalidate session
            delete sessionStore[sessionId];
            return res.status(401).json({ success: false, message: 'Invalid session - user data mismatch' });
        }
        
        // Authentication successful
        next();
    } catch (error) {
        console.error('Authentication error:', error);
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

module.exports = { app, server, setupRoutes, express, requireAuth, io };