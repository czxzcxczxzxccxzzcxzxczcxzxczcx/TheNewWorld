const { connectToDB, User, Post } = require('./database');
const { deleteUserAndData,updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts, getAllComments} = require('./databaseFunctions');

const initDatabase = async () => {
    try {
        await connectToDB();
        await updateData('1175952300','username','kInGkOnG');
            } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };
