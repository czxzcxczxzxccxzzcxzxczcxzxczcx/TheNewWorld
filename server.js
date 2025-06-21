const {app, server, setupRoutes, express} = require('./utils/middleware');
const PORT = process.env.PORT || 2121;

// Servers the static files from the 'public' directory
app.use(express.static(require('path').join(__dirname, 'public')));

// Registers all routes
setupRoutes(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
});