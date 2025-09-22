require('dotenv').config();

const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const postSchema = require('./schemas/postSchema');
const commentSchema = require('./schemas/commentSchema');
const messageSchema = require('./schemas/messageSchema');
const notificationSchema = require('./schemas/notificationSchema');
const sessionSchema = require('./schemas/sessionSchema');

const dbURI = process.env.DB_URI;

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Session = mongoose.model('Session', sessionSchema);

const connectToDB = async () => {
    try {
        await mongoose.connect(dbURI, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });
        console.log('Database connection:\tSuccessful');
    } catch (err) {
        console.error('Database connection: Error: ', err);
        throw err;
    }
};

module.exports = { connectToDB, User, Post, Comment, Message, Notification, Session };