const { connectToDB, User, Post } = require('../database');
const { updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts, getAllComments} = require('./databaseFunctions');

const initDatabase = async () => {
    try {
        await connectToDB();
        // await fixProfile();
        // await getAllComments();
        // await fixUserLikedAndReposts();
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };
