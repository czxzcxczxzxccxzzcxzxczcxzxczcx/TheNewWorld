const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    title: { type: String, required: true },
    content: { 
        type: String, 
        required: function() {
            // Content is required only if poll is not enabled or doesn't exist
            return !this.poll || !this.poll.isEnabled;
        },
        default: ''
    },
    accountNumber: { type: String, required: true, ref: 'User' },
    imageUrl: { type: String, required: false }, // Optional field for post images
    createdAt: { type: Date, default: Date.now },
    likes: { type: [Number], default: [] },
    views: { type: Number, default: 0 },
    reposts: { type: [Number], default: [] },
    // Poll functionality
    poll: {
        isEnabled: { type: Boolean, default: false },
        question: { type: String, default: '' },
        options: [{
            text: { type: String, required: true },
            votes: { type: [Number], default: [] } // Array of account numbers who voted for this option
        }],
        allowMultipleVotes: { type: Boolean, default: false },
        endsAt: { type: Date, required: false }, // Optional poll end time
        totalVotes: { type: Number, default: 0 }
    }
});

// Custom validation to ensure either content or poll exists
postSchema.pre('validate', function() {
    if ((!this.content || this.content.trim() === '') && (!this.poll || !this.poll.isEnabled)) {
        this.invalidate('content', 'Either content or a poll must be provided');
    }
});

module.exports = postSchema;
