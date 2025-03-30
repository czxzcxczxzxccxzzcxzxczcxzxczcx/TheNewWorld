const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initializeDatabase } = require('./utils/initDatabase'); // Import database initialization
const setupRoutes = require('./utils/setupRoutes'); // Import route setup

const app = express();
const PORT = 7272;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
initializeDatabase();

// Setup routes
setupRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Host connection:\tSuccessful`);
});