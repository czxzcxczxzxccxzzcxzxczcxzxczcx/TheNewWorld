const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    accountNumber: { type: String, required: true, ref: 'User' },
    imageUrl: { type: String, required: false }, // Optional field for post images
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    views: { type: Number, default: 0 },
    reposts: { type: [Number], default: [] },
});

module.exports = postSchema;
