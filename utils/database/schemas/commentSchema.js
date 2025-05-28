const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    commentId: { type: String, required: true },
    content: { type: String, required: true },
    accountNumber: { type: String, required: true, ref: 'User' },
    postId: { type: String, required: true, ref: 'Post' },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    replies: { type: [String], default: [] },
});

module.exports = commentSchema;
