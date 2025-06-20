const express = require('express');
const rateLimit = require('express-rate-limit'); // Added for global rate limiting
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Global rate limiter (example: 200 requests per 15 minutes per IP)
// ...existing code...

// const globalLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 700,
//     handler: (req, res) => {
//         res.status(429);
//         res.set('Content-Type', 'application/json');
//         res.send(JSON.stringify({ success: false, message: 'Too many requests, please try again later.' }));
//     }
// });
// app.use(globalLimiter);
// app.use(globalLimiter);

// ...existing code...

initDatabase();
setupSocket(io);

module.exports = {app, server, setupRoutes, express};