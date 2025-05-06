Social media platform project.

The New World is a social media platform designed to mimic the features of Twitter, allowing for users to create a account and engage with others.

The project presents both front-end and back-end functionality, utilizing MongoDB for its database.

Features in the website:
  - Real-Time Direct Messaging:  Instantly send and receive direct messages with other users.
  - Post Creation:  Easily create and share posts with your followers.
  - Post Editing:  Edit your posts after publishing to update content or correct mistakes.
  - Post Deletion:  Remove any of your posts at any time.
  - Profile & Post Search:  Search for users and posts by name or keyword.
  - User Following:  Follow other users to stay updated on their activity and posts.
  - Post Liking: Like posts to show appreciation and support for content you enjoy.
  - Reposting:  Share posts from other users with your own followers.
  - Real-Time Notifications:  Receive notifications about activity on your posts and interactions.
  - Commenting:  Engage with posts by leaving comments and starting discussions.

How to set up the website:
  1) To begin, install all neccessary depencies that the server utilizes.  
    - To auto install, type the 'npm install' command into the console.  
    - To manually install, type the following commands into the console.  
      - "npm install express"
      - "npm install mongoose"
      - "npm install dotenv"
      - "npm install cookie-parser"
      - "npm install bcrypt"
      - "npm install --save-dev nodemon" (OPTIONAL BUT IS RECOMMENDED FOR REALTIME SERVER UPDATES)

  2) Next, directly inside the projects directory create a file called '.env'  
    - This will be utilized to securely store our MongoDB API key.  
    - Once you have created the file, type inside of it: "DB_URI= " following the database key.  

  3) After that, you should be set. Start the website by typing into the console "node server.js"