const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    warningId: { type: String, required: true },
    reason: { type: String, default: '' },
    issuedBy: { type: String, required: true }, // accountNumber of moderator
    issuedByUsername: { type: String, required: true },
    issuedByRole: { type: String, enum: ['moderator', 'admin', 'headAdmin'], required: true },
    issuedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date, default: null }
}, { _id: false });

const banSchema = new mongoose.Schema({
    banId: { type: String, required: true },
    reason: { type: String, default: '' },
    issuedBy: { type: String, required: true }, // accountNumber of moderator
    issuedByUsername: { type: String, required: true },
    issuedByRole: { type: String, enum: ['moderator', 'admin', 'headAdmin'], required: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'expired', 'lifted'], default: 'active' },
    liftedAt: { type: Date, default: null },
    liftedBy: { type: String, default: null },
    liftedByUsername: { type: String, default: null }
}, { _id: false });

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
    adminRole: { type: String, enum: ['user', 'moderator', 'admin', 'headAdmin'], default: 'user' },
    verified: { type: Boolean, default: false },
    verificationVisible: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    warnings: { type: [warningSchema], default: [] },
    bans: { type: [banSchema], default: [] },
    moderationState: {
        activeWarningId: { type: String, default: null },
        activeBanId: { type: String, default: null }
    }
});

module.exports = userSchema;