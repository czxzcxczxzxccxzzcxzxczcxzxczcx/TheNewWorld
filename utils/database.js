require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dbURI = process.env.DB_URI;

const userSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    followers: {type: Number, default: 0},
    following: {type: Number, default: 0},
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
    likes: { type: Number, default: 0 }, 
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
            { $set: { password: hashedPassword } },
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

module.exports = { connectToDB, clearDatabase, updateUserPassword, updateData, User, Post };
