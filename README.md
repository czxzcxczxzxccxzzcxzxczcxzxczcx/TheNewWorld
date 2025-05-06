Social media platform project.

The New World is a social media platform which allows users to create an account and create posts.

Features:
  - Real Time Direct Messaging 
  - Post Creation
  - Post Editing
  - Post Deletion
  - Profile & Post searching
  - Following Users
  - Liking Posts 
  - Reposting
  - Notifications
  - Commenting

How to use:
  - To begin, install all neccessary depencies that the server utilizes.
    - Type the following commands into the server console:
      - "npm install express"
      - "npm install mongoose"
      - "npm install dotenv"
      - "npm install cookie-parser"
      - "npm install bcrypt"
      - "npm install --save-dev nodemon" (OPTIONAL BUT IS RECOMMENDED FOR REALTIME SERVER UPDATES)
    You may speed up the process simply typing "npm install"

  - Next, directly inside the projects directory create a file called '.env'
  this will be utilized to securely store our MongoDB API key.
    - Once you have created the file, type inside of it: "DB_URI= " following the database key.

  - After that, you should be set. Start the website by typing into the console "node server.js"