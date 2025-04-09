require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dbURI = process.env.DB_URI;

const userSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    followers: { type: [Number], default: [] },
    following: { type: [Number], default: [] },
    posts: {type: Number, default: 0 },
    bio: { type: String, default: "" },
    pfp: { type: String , default: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png"}
});

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    title: { type: String, required: true }, 
    content: { type: String, required: true }, 
    accountNumber: { type: String, required: true, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now }, 
    likes: { type: [Number], default: [] },
    views: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 }
});


const Post = mongoose.model('Post', postSchema);
const User =  mongoose.model('User', userSchema);

// Function to update password securely (hashes the new password)

const connectToDB = async () => {
    try {
        await mongoose.connect(dbURI, {
            serverSelectionTimeoutMS: 30000,  
            connectTimeoutMS: 30000,        
        });
        console.log('Database connection:\tSuccessful');
    } catch (err) {
        console.error('Database connection: Error: ', err);
        throw err;
    }
};

const fixProfile = async () => {
    try {
        const users = await User.find();

        for (let user of users) {
            let isModified = false;

            // Check and fix each field in the schema
            if (!user.hasOwnProperty('accountNumber') || typeof user.accountNumber !== 'string') {
                user.accountNumber = user.accountNumber || 'defaultAccountNumber';
                isModified = true;
            }
            if (!user.hasOwnProperty('password') || typeof user.password !== 'string') {
                user.password = user.password || 'defaultPassword';
                isModified = true;
            }
            if (!user.hasOwnProperty('username') || typeof user.username !== 'string') {
                user.username = user.username || 'defaultUsername';
                isModified = true;
            }
            if (!user.hasOwnProperty('followers') || !Array.isArray(user.followers)) {
                user.followers = user.followers || [];
                isModified = true;
            }
            if (!user.hasOwnProperty('following') || !Array.isArray(user.following)) {
                user.following = user.following || [];
                isModified = true;
            }
            if (!user.hasOwnProperty('posts') || typeof user.posts !== 'number') {
                user.posts = user.posts || 0;
                isModified = true;
            }
            if (!user.hasOwnProperty('bio') || typeof user.bio !== 'string') {
                user.bio = user.bio || '';
                isModified = true;
            }
            if (!user.hasOwnProperty('pfp') || typeof user.pfp !== 'string') {
                user.pfp = user.pfp || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png';
                isModified = true;
            }

            // Save the user document if any modifications were made
            if (isModified) {
                await user.save();
                console.log(`User with accountNumber ${user.accountNumber} fixed.`);
            }
        }
    } catch (error) {
        console.error('Error fixing user profiles:', error);
    }
};



const updatePost = async (postId, field, value) => {
    try {
        const updateObject = {};
        updateObject[field] = value;

        const updatedUser = await Post.findOneAndUpdate(
            { postId },
            { $set: updateObject },
            { new: true }
        );

        if (updatedUser) {
             console.log(`${field} Data Update:\tSuccessful`);
        } else {
            console.log(`${field} Data Update:\tError Post Not Found`);

        }
    } catch (error) {
         console.log(`${field} Data Update:\tError`);
    }
};


const updateData = async (accountNumber, field, value) => {
    try {
        const updateObject = {};
        updateObject[field] = value;

        const updatedUser = await User.findOneAndUpdate(
            { accountNumber },
            { $set: updateObject },
            { new: true }
        );

        if (updatedUser) {
             console.log(`${field} Data Update:\tSuccessful`);
        } else {
            console.log(`${field} Data Update:\tError User Not Found`);

        }
    } catch (error) {
         console.log(`${field} Data Update:\tError`);
    }
};


const updateUserPassword = async (accountNumber, newPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await User.findOneAndUpdate(
            { accountNumber },
            { $set: { password: hashedPassword,  } },
            { new: true }
        );

        if (updatedUser) {
            console.log("User password updated securely");
        } else {
            console.log("User not found");
        }
    } catch (error) {
        console.error("Error updating password:", error);
    }
};

// Function to clear the entire database
const clearDatabase = async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.collection(collection.name).deleteMany({});
            console.log(`Cleared collection: ${collection.name}`);
        }
        console.log('All collections cleared.');
    } catch (err) {
        console.error('Error clearing the database: ', err);
    }
};

module.exports = { connectToDB, clearDatabase, updateUserPassword, updateData, updatePost, fixProfile, User, Post };