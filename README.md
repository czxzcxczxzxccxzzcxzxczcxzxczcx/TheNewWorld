The New World - A Full-Stack Social Media Platform

What is The New World? The New World is a social media platform based upon Twitter, which demonstrates a pragmatic front-end and back-end skillset. Built using Node.js, Express, MongoDB, and JavaScript, the project showcases real-time user communication features, user authentication, dynamic handling, API integration.

Key Skills Which Are Demonstrated:
  - Full Stack Development: Front-end and back-end integration.
  - Database Design: MongoDB for efficent data storage.
  - Auth & Security: Session Handling using cookies, Password Encryption using bcrypt.
  - Real-Time Functionality: Websockets used for real-time updates.
  - REST API Design: API endpoints to manage CRUD tasks and much more.
  - Responsive UI: The UI offers a nice user navigation and is responsive on different devices.

Features In The Project:
  - Real-Time Direct Messaging: Instantly send real-time updating messages to users.
  - Post Creation & Editting: Create posts, and update if need be.
  - Post Deletion: Remove any post you have created.
  - Searching: Search any user or post.
  - User Following: Stay connected by following others
  - Post Liking: Interact with posts by liking.
  - Reposting: Share posts on your profile.
  - Notifications: Recieve notifications from other users.
  - Commenting: Comment on others posts
  - Mentioning: Mention users inside of posts.
  - Embed Images: Embed images into your post.
  - Validation: Proper username and password validation.
  - Account Login & Creation: Create an account or login.
  - Google Auth: Login through google.
  - Admin System: Customized admin panel.

Technologies Used:
  - bcrypt - Used to encrypt passwords
  - cookie-parser - Used to parse server cookies
  - dotenv - Used to contain API keys
  - express - Used for backend framework
  - express-validator - Used for validating inputs
  - mongoose - Used for the database
  - react - Used for client UI framework
  - react-dom - Used for client DOM manipulation
  - passport - Used for Google auth 
  - passport-google-oauth20 - Used for Google auth

How to get started:
  - Begin by downloading the repository.
  - Next, open the terminal and type npm install, this should install all neccesary dependencies
  - Next, inside the project create a file named ".env". 
    - Inside of this file type "URI=". Following the equals sign paste your MongoDB key.
  - After that you should be set. Start the project by typing "node server.js".