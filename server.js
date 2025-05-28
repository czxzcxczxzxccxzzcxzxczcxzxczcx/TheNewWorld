const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./utils/passport');
const { initDatabase } = require('./utils/database/initDatabase');
const setupRoutes = require('./utils/setupRoutes');

const app = express();
const PORT = 1111;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
// Initialize DB and routes
initDatabase();
setupRoutes(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
});
