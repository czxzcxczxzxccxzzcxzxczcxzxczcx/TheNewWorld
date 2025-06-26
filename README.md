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
  - Post Management: Create, edit, delete, and preview posts
  - Image Embedding: Auto-embed images via URL or AWS CDN uploads
  - Comments: Leave, edit, and delete comments on posts
  - Reposts & Likes: Engage with content via social interactions
  - Search: Find users or posts with advanced search bars
  - Mentions: Mention users using @username in posts
  - Notifications: Get notified for relevant user activity
  - Direct Messaging: Real-time private chat with WebSocket updates
  - Profiles: Public user pages accessible via ID or @username
  - Account Settings: Change username or password
  - 404 Page: Custom not-found error page for invalid URLs
  - Admin Panel: Manage user data, passwords, and more
  - Donations: Integrated Stripe payment system
  - Authentication: Google OAuth + cookie-based login system
  - Form Validation: Express-validator for secure sign-ups
  - Responsive Design: Decent mobile & polished PC UI support

Technologies Used
  - Node.js, Express – Server-side logic and routing
  - MongoDB, Mongoose – NoSQL database and ORM
  - bcrypt – Password hashing
  - cookie-parser – Cookie handling
  - express-validator – Form & input validation
  - passport – Google OAuth authentication
  - socket.io – Real-time bi-directional communication
  - stripe – Payment gateway integration
  - dotenv – Secure environment configuration
  - AWS – CDN-based image upload and hosting

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

    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    AWS_REGION=your_aws_region
    AWS_S3_BUCKET_NAME=your_bucket_name
    AWS_CLOUDFRONT_DOMAIN=your_distribution_domain

  4) Start the application
    run the command "node server.js"

  You may choose to deploy with Azure to do this you may fork the repository, and then deploy it into an Azure Web App, after this create the environment variables within azure. After you have done this you should be able to start the application