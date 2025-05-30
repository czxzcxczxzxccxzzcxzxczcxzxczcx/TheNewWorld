const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./utils/passport');
const { initDatabase } = require('./utils/database/initDatabase');
const setupRoutes = require('./utils/setupRoutes');
const http = require('http');
const { Server } = require('socket.io');
const setupSocket = require('./utils/socket');

const app = express();
// const PORT = 1111;
const PORT = process.env.PORT

const server = http.createServer(app);
const io = new Server(server, {cors: {origin: '*',methods: ['GET', 'POST']}});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Initialize DB, routes, and websockets
initDatabase();
setupRoutes(app);
setupSocket(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
  console.log(process.env.DB_URI);
});