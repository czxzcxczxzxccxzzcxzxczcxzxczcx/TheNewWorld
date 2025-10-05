const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    commentId: { type: String, required: true },
    content: { type: String, required: true },
    accountNumber: { type: String, required: true, ref: 'User' },
    postId: { type: String, required: true, ref: 'Post' },
    gifUrl: { type: String, trim: true, default: '' },
    attachments: {
        type: [
            {
                url: { type: String, trim: true, required: true },
                type: { type: String, trim: true, default: 'image' }
            }
        ],
        default: []
    },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    reposts: { type: [Number], default: [] },
    replies: { type: [String], default: [] },
});

module.exports = commentSchema;
