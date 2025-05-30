const bcrypt = require('bcrypt');
const { User, Post, Comment } = require('../database');

const fixProfile = async () => {
    try {
        const users = await User.find();

        for (let user of users) {
            let isModified = false;

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

            if (!user.hasOwnProperty('openDM') || !Array.isArray(user.openDM)) {
                user.openDM = []; // Initialize openDM as an empty array if missing or invalid
                isModified = true;
            }

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

            // Ensure postId is a valid string
            if (!post.postId || typeof post.postId !== 'string') {
                console.error(`Post with invalid or missing postId found: ${post._id}`);
                post.postId = `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                isModified = true;
            }

            // Ensure title is a valid string
            if (!post.title || typeof post.title !== 'string') {
                post.title = 'Untitled Post';
                isModified = true;
            }

            // Ensure content is a valid string
            if (!post.content || typeof post.content !== 'string') {
                post.content = 'No content';
                isModified = true;
            }

            // Ensure accountNumber is a valid string
            if (!post.accountNumber || typeof post.accountNumber !== 'string') {
                post.accountNumber = 'unknownAccount';
                isModified = true;
            }

            // Ensure createdAt is a valid Date
            if (!post.createdAt || !(post.createdAt instanceof Date)) {
                post.createdAt = new Date();
                isModified = true;
            }

            // Ensure likes is an array of unique numbers
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

            // Ensure views is a valid number
            if (typeof post.views !== 'number' || post.views < 0) {
                post.views = 0;
                isModified = true;
            }

            // Ensure reposts is an array of unique numbers
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

            // Save the post if any modifications were made
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

            if (!Array.isArray(user.liked)) {
                user.liked = [];
                isModified = true;
            }
            if (!Array.isArray(user.reposts)) {
                user.reposts = [];
                isModified = true;
            }

            user.liked = [];
            user.reposts = [];

            for (let post of posts) {
                if (post.likes.includes(Number(user.accountNumber))) {
                    user.liked.push(post.postId);
                    isModified = true;
                }
                if (post.reposts.includes(Number(user.accountNumber))) {
                    user.reposts.push(post.postId);
                    isModified = true;
                }
            }

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

        const updatedPost = await Post.findOneAndUpdate(
            { postId },
            { $set: updateObject },
            { new: true }
        );

        if (updatedPost) {
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

// Add missing functions

const getUserByAccountNumber = async (accountNumber) => {
    try {
        const user = await User.findOne({ accountNumber });
        if (user) {
            console.log(`User with accountNumber ${accountNumber} found.`);
            return user;
        } else {
            console.log(`User with accountNumber ${accountNumber} not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user by accountNumber:', error);
        throw error;
    }
};

const getPostByPostId = async (postId) => {
    try {
        const post = await Post.findOne({ postId });
        if (post) {
            console.log(`Post with postId ${postId} found.`);
            return post;
        } else {
            console.log(`Post with postId ${postId} not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching post by postId:', error);
        throw error;
    }
};

const getCommentsByPostId = async (postId) => {
    try {
        const comments = await Comment.find({ postId });
        if (comments.length > 0) {
            console.log(`Comments for postId ${postId} retrieved successfully:`);
            comments.forEach((comment, index) => {
                console.log(`Comment ${index + 1}:`, comment);
            });
            return comments;
        } else {
            console.log(`No comments found for postId ${postId}.`);
            return [];
        }
    } catch (error) {
        console.error('Error fetching comments by postId:', error);
        throw error;
    }
};

const getAllComments = async () => {
    try {
        const comments = await Comment.find();
        if (comments.length > 0) {
            console.log(`All comments retrieved successfully:`);
            comments.forEach((comment, index) => {
                console.log(`Comment ${index + 1}:`, comment);
            });
            return comments;
        } else {
            console.log(`No comments found in the database.`);
            return [];
        }
    } catch (error) {
        console.error('Error fetching all comments:', error);
        throw error;
    }
};

const deleteUserAndData = async (accountNumber) => {
    try {
        // Find user by accountNumber
        const user = await User.findOne({ accountNumber });
        if (!user) {
            console.log(`User with accountNumber ${accountNumber} not found.`);
            return false;
        }

        // Delete all posts by this user
        await Post.deleteMany({ accountNumber: user.accountNumber });

        // Delete all comments by this user
        await Comment.deleteMany({ accountNumber: user.accountNumber });

        // Optionally, remove this user from followers/following of other users
        await User.updateMany(
            { followers: user.accountNumber },
            { $pull: { followers: user.accountNumber } }
        );
        await User.updateMany(
            { following: user.accountNumber },
            { $pull: { following: user.accountNumber } }
        );

        // Delete the user
        await User.deleteOne({ accountNumber: user.accountNumber });

        console.log(`User with accountNumber ${accountNumber} and associated data deleted.`);
        return true;
    } catch (error) {
        console.error('Error deleting user and associated data:', error);
        throw error;
    }
};

module.exports = {
    fixProfile,
    fixPosts,
    fixUserLikedAndReposts,
    updatePost,
    updateData,
    updateUserPassword,
    clearDatabase,
    getUserByAccountNumber,
    getPostByPostId,
    getCommentsByPostId,
    getAllComments,
    deleteUserAndData,
};
