const {app, server, setupRoutes, express, requireAuth} = require('./utils/middleware');
const PORT = process.env.PORT || 1111;

// Set proper MIME types for static files
express.static.mime.define({'text/css': ['css']});

// Servers the static files from the 'public' directory
app.use(express.static(require('path').join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Registers all routes
setupRoutes(app,requireAuth);

// Start the server
server.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
});