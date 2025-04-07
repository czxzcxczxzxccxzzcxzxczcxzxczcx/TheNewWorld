const { connectToDB, updateUserPassword, updateData, fixProfile } = require('./database');

const initializeDatabase = async () => {
    try {
        await connectToDB();
        await updateUserPassword('8325887884', '123'); // Example usage
        await updateData('8325887884', 'username','bob'); // Example usage
        // await fixProfile();
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initializeDatabase };