const postRoutes = require('../routes/postRoutes');
const profileRoutes = require('../routes/profileRoutes');
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const commentRoutes = require('../routes/commentRoutes');
const searchRoutes = require('../routes/searchRoutes');
const messageRoutes = require('../routes/messageRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const staticRoutes = require('../routes/staticRoutes');


const protectedRoutes = [
    postRoutes,
    profileRoutes,
    adminRoutes,
    commentRoutes,
    searchRoutes,
    messageRoutes,
    paymentRoutes,
];


const setupRoutes = (app,required) => {
    // Auth routes do NOT require authentication
    app.use('/api', authRoutes);
    // All other API routes require authentication
    protectedRoutes.forEach(route => app.use('/api', required, route));
    app.use('/', staticRoutes);
};

module.exports = setupRoutes;