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
    pfp: { type: String , default: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png"},
    liked: { type: [String], default: [] },
    reposts: { type: [String], default: [] },
});

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true },
    title: { type: String, required: true }, 
    content: { type: String, required: true }, 
    accountNumber: { type: String, required: true, ref: 'User' }, 
    createdAt: { type: Date, default: Date.now }, 
    likes: { type: [Number], default: [] },
    views: { type: Number, default: 0 },
    reposts: { type: [Number], default: [] }, 
});

const Post = mongoose.model('Post', postSchema);
const User =  mongoose.model('User', userSchema);

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
            } else {
                const uniqueFollowers = [...new Set(user.followers)];
                if (uniqueFollowers.length !== user.followers.length) {
                    user.followers = uniqueFollowers;
                    isModified = true;
                }
            }
            if (!user.hasOwnProperty('following') || !Array.isArray(user.following)) {
                user.following = user.following || [];
                isModified = true;
            } else {
                const uniqueFollowing = [...new Set(user.following)];
                if (uniqueFollowing.length !== user.following.length) {
                    user.following = uniqueFollowing;
                    isModified = true;
                }
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
            if (!user.hasOwnProperty('liked') || !Array.isArray(user.liked)) {
                user.liked = user.liked || [];
                isModified = true;
            } else {
                const uniqueLiked = [...new Set(user.liked)];
                if (uniqueLiked.length !== user.liked.length) {
                    user.liked = uniqueLiked;
                    isModified = true;
                }
            }
            if (!user.hasOwnProperty('reposts') || !Array.isArray(user.reposts)) {
                user.reposts = user.reposts || [];
                isModified = true;
            } else {
                const uniqueReposts = [...new Set(user.reposts)];
                if (uniqueReposts.length !== user.reposts.length) {
                    user.reposts = uniqueReposts;
                    isModified = true;
                }
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

const fixPosts = async () => {
    try {
        const posts = await Post.find();

        for (let post of posts) {
            let isModified = false;

            // Check and fix each field in the schema
            if (!post.postId || typeof post.postId !== 'string') {
                console.error(`Post with invalid or missing postId found: ${post._id}`);
                continue; // Skip fixing if postId is invalid
            }
            if (!post.title || typeof post.title !== 'string') {
                post.title = 'Untitled Post';
                isModified = true;
            }
            if (!post.content || typeof post.content !== 'string') {
                post.content = 'No content';
                isModified = true;
            }
            if (!post.accountNumber || typeof post.accountNumber !== 'string') {
                post.accountNumber = 'unknownAccount';
                isModified = true;
            }
            if (!post.createdAt || !(post.createdAt instanceof Date)) {
                post.createdAt = new Date();
                isModified = true;
            }
            if (!Array.isArray(post.likes)) {
                post.likes = [];
                isModified = true;
            } else {
                const uniqueLikes = [...new Set(post.likes)];
                if (uniqueLikes.length !== post.likes.length) {
                    post.likes = uniqueLikes;
                    isModified = true;
                }
            }
            if (typeof post.views !== 'number') {
                post.views = 0;
                isModified = true;
            }
            if (!Array.isArray(post.reposts)) {
                post.reposts = [];
                isModified = true;
            } else {
                const uniqueReposts = [...new Set(post.reposts)].filter(reposter => reposter !== 0);
                if (uniqueReposts.length !== post.reposts.length) {
                    post.reposts = uniqueReposts;
                    isModified = true;
                }
            }

            // Save the post document if any modifications were made
            if (isModified) {
                await post.save();
                console.log(`Post with postId ${post.postId} fixed.`);
            }
        }
    } catch (error) {
        console.error('Error fixing posts:', error);
    }
};

const fixUserLikedAndReposts = async () => {
    try {
        const users = await User.find();
        const posts = await Post.find();

        for (let user of users) {
            let isModified = false;

            // Initialize liked and reposts arrays if not present
            if (!Array.isArray(user.liked)) {
                user.liked = [];
                isModified = true;
            }
            if (!Array.isArray(user.reposts)) {
                user.reposts = [];
                isModified = true;
            }

            // Clear existing liked and reposts arrays to rebuild them
            user.liked = [];
            user.reposts = [];

            // Iterate through posts to find matches for the user
            for (let post of posts) {
                if (post.likes.includes(Number(user.accountNumber))) {
                    user.liked.push(post.postId); // Add postId as a string
                    isModified = true;
                }
                if (post.reposts.includes(Number(user.accountNumber))) {
                    user.reposts.push(post.postId); // Add postId as a string
                    isModified = true;
                }
            }

            // Save the user document if any modifications were made
            if (isModified) {
                await user.save();
                console.log(`User with accountNumber ${user.accountNumber} updated with liked and reposted posts.`);
            }
        }
    } catch (error) {
        console.error('Error fixing user liked and reposts data:', error);
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

module.exports = { connectToDB, clearDatabase, updateUserPassword, updateData, updatePost, fixProfile, fixPosts, fixUserLikedAndReposts, User, Post };