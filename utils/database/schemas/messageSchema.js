const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    from: { type: String, required: true, ref: 'User' }, 
    to: { type: String, required: true, ref: 'User' },  
    content: { type: String, required: true },         
    sentAt: { type: Date, default: Date.now },        
});

module.exports = messageSchema;
