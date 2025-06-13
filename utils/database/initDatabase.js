const { connectToDB, User, Post } = require('./database');
const { deleteUserAndData,updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts, getAllComments} = require('./databaseFunctions');

const initDatabase = async () => {
    try {
        await connectToDB();
        await updateUserPassword('4833354984','Gabriel098')
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };
