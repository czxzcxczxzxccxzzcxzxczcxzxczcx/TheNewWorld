const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notificationId: { type: String, required: true, unique: true },
    from: { type: String, required: true, ref: 'User' }, 
    to: { type: String, required: true, ref: 'User' },  
    content: { type: String, required: true },         
    sentAt: { type: Date, default: Date.now },        
    shown: { type: Boolean, default: true }, // Whether the notification has been shown/hidden
});

module.exports = notificationSchema;
