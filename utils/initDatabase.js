const { connectToDB, updateUserPassword, updateData, fixProfile, fixPosts, fixUserLikedAndReposts } = require('./database');

const initDatabase = async () => {
    try {
        await connectToDB();
        await fixPosts();
        // await fixUserLikedAndReposts();
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initDatabase };