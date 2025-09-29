The New World — Full-Stack Social Media Platform

Overview:
  - The New World is a full-stack, twitter-inspired social media platform that was made to demonstrate real-time user interactivity, with secured user authentication, a responsive UI design, and end-to-end CRUD operations. Built using Node.js, Express, MongoDB and JavaScript, The New World features real-time communication, user authentication, dynamic data handling, third-party API integration, and easy deployment to platforms like Microsoft Azure

About the Project:
  - Originally created as a high school passion project to learn web development, The New World helped me build foundational skills in full-stack development. Over time, I've continuously enhanced the platform to reflect my evolving knowledge and technical depth. The project now serves as a comprehensive showcase of both core web technologies, and advanced features like real-time messaging and third-party integrations

Key Skills Demonstrated
  - Full Stack Development: Seamless front-end/back-end interaction
  - Database Design: Scalable and efficient MongoDB schema modeling
  - Authentication & Security: Session-based auth, cookie handling, bcrypt password hashing
  - Real-Time Functionality: Live chat and notifications via WebSockets
  - REST API Design: Organized, modular endpoints for clean CRUD operations
  - Responsive UI: Smooth UX across both mobile and desktop platforms

Features
  - Post Management: Create, edit, delete, and preview posts with live content preview
  - Interactive Polls: Create polls with 2-10 options, multiple vote support, time limits, and real-time voting
  - Enhanced Post Editing: Edit posts with poll management, image uploads, and live preview functionality
  - Image Embedding: Auto-embed images via URL syntax or AWS S3 CDN uploads with CloudFront delivery
  - GIF Library: Search trending or tagged GIFs via the built-in Giphy picker without leaving the composer
  - Comments: Leave, edit, and delete comments on posts with nested interaction
  - Reposts & Likes: Engage with content via social interactions with real-time updates
  - Search: Find users or posts with advanced search functionality and filtering
  - Mentions: Mention users using @username in posts with automatic linking
  - Notifications: Get real-time notifications for poll votes, likes, comments, and user interactions
  - Direct Messaging: Real-time private chat with WebSocket updates and message deletion
  - User Profiles: Public user pages accessible via account number or @username with follower systems
  - Following System: Follow/unfollow users with dedicated followers and following pages
  - Account Settings: Change username, password, and profile information
  - Admin Panel: Comprehensive admin dashboard to manage users, posts, comments, messages, and grant/revoke admin permissions
  - Payment Integration: Stripe-powered donation system with secure checkout sessions
  - Authentication: Multi-provider system with Google OAuth and traditional cookie-based login
  - Form Validation: Express-validator for secure sign-ups and input sanitization
  - Real-time Features: Socket.io integration for live messaging, notifications, and poll updates
  - Responsive Design: Mobile-optimized and polished desktop UI with modern CSS styling
  - 404 Error Handling: Custom not-found pages for invalid URLs and routes
  - Content Processing: Smart URL detection, image auto-embedding, and mention processing

Technologies Used
  - Node.js, Express – Server-side runtime and web framework for API routing and middleware
  - MongoDB, Mongoose – NoSQL database with ODM for data modeling and validation
  - bcrypt – Cryptographic password hashing and salt generation
  - cookie-parser – HTTP cookie parsing and session management
  - express-validator – Server-side input validation and sanitization
  - express-rate-limit – API rate limiting and DDoS protection
  - passport, passport-google-oauth20 – Authentication middleware with Google OAuth 2.0 integration
  - socket.io – Real-time bidirectional WebSocket communication for messaging and live updates
  - stripe – Secure payment processing and checkout session management
  - dotenv – Environment variable configuration and secret management
  - AWS S3 – Cloud storage for image uploads with programmatic access
  - AWS CloudFront – Global CDN for fast image delivery and caching
  - Giphy API – Rich GIF search and trending content for post creation
  - connect-mongo – MongoDB session store for persistent login sessions
  - cors – Cross-Origin Resource Sharing configuration
  - multer – Multipart form data handling for file uploads
  - JavaScript ES6+ – Modern JavaScript with modules, async/await, and destructuring
  - HTML5, CSS3 – Semantic markup and responsive styling with CSS custom properties
  - CSS Grid & Flexbox – Modern layout systems for responsive design

Getting Started Locally
  1) Clone the repository
    
    git clone https://github.com/czxzcxczxzxccxzzcxzxczcxzxczcx/TheNewWorld.git

  2) Install all neccessary dependencies
   
    npm install


  3) Create a .env file in the root directory with the follow:

    DB_URI=your_mongoDB_connection_string

    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_secret

    STRIPE_SECRET_KEY=your_stripe_secret_key

  GIPHY_API_KEY=your_giphy_api_key

    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    AWS_REGION=your_aws_region
    AWS_S3_BUCKET_NAME=your_bucket_name
    AWS_CLOUDFRONT_DOMAIN=your_distribution_domain

  4) Start the application
    run the command "node server.js"

  You may choose to deploy with Azure to do this you may fork the repository, and then deploy it into an Azure Web App, after this create the environment variables within azure. After you have done this you should be able to start the application

  The application has also been tested using render for deployment
  you can view the public demo here https://thenewworld.onrender.com/