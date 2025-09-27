const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true }, // accountNumber of user who created ticket
    username: { type: String, required: true },
    type: { type: String, enum: ['bug_report', 'user_report'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: String, default: null }, // accountNumber of moderator/admin assigned
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    
    // For user reports specifically
    reportedUser: { type: String }, // accountNumber of reported user
    reportedUsername: { type: String },
    
    // Messages in the ticket
    messages: [{
        messageId: { type: String, required: true },
        senderId: { type: String, required: true },
        senderUsername: { type: String, required: true },
        senderRole: { type: String, enum: ['user', 'moderator', 'admin', 'headAdmin'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        isInternal: { type: Boolean, default: false } // For moderator/admin only messages
    }]
});

module.exports = ticketSchema;