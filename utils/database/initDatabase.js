const { connectToDB, User, Post } = require('../database');
const { deleteUserAndData,updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts, getAllComments} = require('./databaseFunctions');

const initDatabase = async () => {
    try {
        await connectToDB();
        // await fixProfile();
        // await getAllComments();
        // await fixUserLikedAndReposts();
        await deleteUserAndData(9648396294); // Example account number to delete
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };
