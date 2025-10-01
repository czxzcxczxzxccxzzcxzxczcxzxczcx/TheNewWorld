const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    from: { type: String, required: true, ref: 'User' }, 
    to: { type: String, required: true, ref: 'User' },  
    content: { type: String, trim: true, default: '' },
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
    sentAt: { type: Date, default: Date.now },        
});

module.exports = messageSchema;
