const express = require('express');
const path = require('path');
const { initDatabase } = require('./utils/initDatabase'); 
const cookieParser = require('cookie-parser');
const setupRoutes = require('./utils/setupRoutes'); 

const app = express();
const PORT = 9999;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setting up server
initDatabase();
setupRoutes(app);

// Start the server
app.listen(PORT, () => {console.log(`Host connection:\tSuccessful`);});