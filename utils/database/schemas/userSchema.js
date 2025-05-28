const mongoose = require('mongoose');

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

module.exports = userSchema;
