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

app.set('trust proxy', 1); // or true
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

initDatabase();
setupSocket(io);

module.exports = {app, server, setupRoutes, express};