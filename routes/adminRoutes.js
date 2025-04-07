const express = require('express');
const { Post, User } = require('../utils/database');
const sessionStore = require('../utils/sessionStore'); // Import sessionStore
const router = express.Router();


