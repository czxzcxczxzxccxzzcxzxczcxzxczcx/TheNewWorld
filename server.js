const {app, server, setupRoutes, express, requireAuth} = require('./utils/middleware');
const path = require('path');
const PORT = process.env.PORT || 1111;

// Set proper MIME types for static files
express.static.mime.define({'text/css': ['css']});

// Serve the static files from the 'public' directory with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }

        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
            return;
        }

        if (/\.(?:css|js|mjs|json|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));

// Registers all routes
setupRoutes(app,requireAuth);

// Start the server
server.listen(PORT, () => {
  console.log(`Host connection:\tSuccessful`);
});