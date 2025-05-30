The New World — Full-Stack Social Media Platform

Overview:
  - The New World is a Twitter-inspired social media platform demonstrating practical front-end and back-end skills.
  - Built with Node.js, Express, MongoDB, and JavaScript, it features real-time communication, user authentication, dynamic data handling, and API integration.

About This Project:
  - This project was initially developed as a personal learning project during my high school years. It helped me build foundational full-stack development skills and explore - real-time web technologies. Since then, I have continued to improve and maintain it to reflect my growth as a developer.

Key Skills Demonstrated:
  - Full Stack Development: Seamless front-end and back-end integration
  - Database Design: Efficient data modeling using MongoDB
  - Authentication & Security: Session management with cookies, password hashing with bcrypt
  - Real-Time Functionality: WebSockets for instant user updates
  - REST API Design: Well-structured endpoints to manage CRUD operations
  - Responsive UI: Intuitive user interface optimized for various devices

Features
  - Real-Time Direct Messaging with WebSockets
  - Post Creation, Editing & Deletion
  - User & Post Search
  - Follow System: Connect and follow users
  - Post Interactions: Likes, reposts, comments, and mentions
  - Notifications: Alerts for user activity
  - Image Embedding in posts
  - Form Validation for usernames and passwords
  - Account Management: Signup, login, and Google OAuth
  - Admin Panel: Customized dashboard for site admins
  - Donation System: Payments via Stripe

Technologies Used:
  - bcrypt – Password encryption
  - cookie-parser – Cookie handling
  - dotenv – Environment variable management
  - express – Backend web framework
  - express-validator – Input validation
  - mongoose – MongoDB object modeling
  - passport – Authentication middleware (Google OAuth)
  - socket.io – Real-time bidirectional communication
  - stripe – Payment processing

Getting Started:
  - Clone or download this repository.
  - Open your terminal and run: 
    - "npm install"
    to install dependencies.
  - Create a .env file in the root directory with the following content:

    DB_URI=<your mongoDB database key>
    GOOGLE_CLIENT_ID=<your google client id>
    GOOGLE_CLIENT_SECRET=<your google secret key>
    STRIPE_SECRET_KEY=<your stripe secret key>"
    
  - Lastly in the console run the command "node server.js"
    - Open your browser and navigate to http://localhost:1111 (or the configured port).