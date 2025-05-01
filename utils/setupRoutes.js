const postRoutes = require('../routes/postRoutes');
const profileRoutes = require('../routes/profileRoutes');
const authRoutes = require('../routes/authRoutes');
const staticRoutes = require('../routes/staticRoutes');
const adminRoutes = require('../routes/adminRoutes');
const commentRoutes = require('../routes/commentRoutes');
const messageRoutes = require('../routes/messageRoutes');
const searchRoutes = require('../routes/searchRoutes');

const setupRoutes = (app) => {
    app.use('/api', postRoutes);
    app.use('/api', profileRoutes);
    app.use('/api', authRoutes);
    app.use('/api', adminRoutes);
    app.use('/api', commentRoutes);
    app.use('/api', searchRoutes);
    app.use('/api', messageRoutes);
    app.use('/', staticRoutes);
};

module.exports = setupRoutes;