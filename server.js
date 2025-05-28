const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./utils/passport');
const { initDatabase } = require('./utils/database/initDatabase');
const setupRoutes = require('./utils/setupRoutes');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 1111;
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

// Initialize DB and routes
initDatabase();
setupRoutes(app);

// Socket.io logic for DMs
io.on('connection', (socket) => {
  // Join a room for a DM between two users
  socket.on('joinDM', ({ user1, user2 }) => {
    const room = [user1, user2].sort().join('-');
    socket.join(room);
  });

  // Relay a new message to the DM room
  socket.on('dmMessage', ({ from, to, message }) => {
    const room = [from, to].sort().join('-');
    io.to(room).emit('dmMessage', { from, to, message });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
});
