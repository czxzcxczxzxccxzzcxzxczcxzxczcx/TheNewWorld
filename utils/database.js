require('dotenv').config();
const mongoose = require('mongoose');

const dbURI = process.env.DB_URI;

const userSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, unique: true },
    password: { type: String }, // Not required for Google users
    username: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true }, // Add googleId for Google OAuth
    followers: { type: [Number], default: [] },
    following: { type: [Number], default: [] },
    posts: {type: Number, default: 0 },
    bio: { type: String, default: "" },
    pfp: { type: String , default: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png"},
    liked: { type: [String], default: [] },
    reposts: { type: [String], default: [] },
    openDM: { type: [String], default: [] }, 
});

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    accountNumber: { type: String, required: true, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    views: { type: Number, default: 0 },
    reposts: { type: [Number], default: [] },
});

const commentSchema = new mongoose.Schema({
    commentId: { type: String, required: true },
    content: { type: String, required: true },
    accountNumber: { type: String, required: true, ref: 'User' },
    postId: { type: String, required: true, ref: 'Post' },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    replies: { type: [String], default: [] },
});

const messageSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    from: { type: String, required: true, ref: 'User' }, 
    to: { type: String, required: true, ref: 'User' },  
    content: { type: String, required: true },         
    sentAt: { type: Date, default: Date.now },        
});

const notificationSchema = new mongoose.Schema({
    notificationId: { type: String, required: true, unique: true },
    from: { type: String, required: true, ref: 'User' }, 
    to: { type: String, required: true, ref: 'User' },  
    content: { type: String, required: true },         
    sentAt: { type: Date, default: Date.now },        
});




const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);

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

module.exports = { connectToDB, User, Post, Comment, Message, Notification };