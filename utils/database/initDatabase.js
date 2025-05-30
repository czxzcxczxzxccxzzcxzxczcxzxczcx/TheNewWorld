const { connectToDB, User, Post } = require('../database');
const { deleteUserAndData,updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts, getAllComments} = require('./databaseFunctions');

const initDatabase = async () => {
    try {
        await connectToDB();
        // await fixProfile();
        // await getAllComments();
        // await fixUserLikedAndReposts();
        await deleteUserAndData(4871303341); // Example account number to delete
            await deleteUserAndData(2783768935); // Example account number to delete

                        await deleteUserAndData(8520902367); // Example account number to delete

    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };
