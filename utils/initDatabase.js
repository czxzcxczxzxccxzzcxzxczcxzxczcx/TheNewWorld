const { connectToDB } = require('./database');

const initializeDatabase = async () => {
    try {
        await connectToDB();
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
};

module.exports = { initializeDatabase };