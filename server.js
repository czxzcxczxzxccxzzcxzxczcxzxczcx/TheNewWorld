const express = require('express');
const path = require('path');
const crypto = require('crypto');
const validationResult  = require('express-validator');
const cookieParser = require('cookie-parser');
const fs = require("fs");
const app = express();

const { validateUsername, validatePassword, validateBio, validatePostTitle, validatePostContent, validateAccountNumber } = require('./utils/validator');
const { hashPassword, comparePassword } = require('./utils/passwordHashing');
const { connectToDB, clearDatabase, updateUserPassword, User, updateData, updatePost, Post } = require('./utils/database');

const staticPages = ['/', '/home', '/createPost',];
const sessionStore = {}; 

const PORT = 7272;

// Sets up database can too be utilized for updating data manually
const initialize = async () => {
    try {
        await connectToDB();
        await updateData("5614882946","following",-1);
        await updateUserPassword("5614882946","password");
    } catch (err) {
        console.error('DATABASE INITIALIZATION ERROR', err);
    }
}; initialize();

// Generates a unique post ID
const generateUniquePostId = async () => {
    let postId;
    let postExists = true;

    while (postExists) {
        postId = `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const existingPost = await Post.findOne({ postId });
        if (!existingPost) {    postExists = false;     }
    }
    return postId;
};

// Generates a unique account Number
const generateAccountNumber = async () => {
    let accountNumber;
    let userExists = true;

    while (userExists) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        const existingUser = await User.findOne({ accountNumber: accountNumber });
        if (!existingUser) {
            userExists = false; 
        }
    }
    return accountNumber
};

// Imports files for app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());  

// Sets up route for webpages
staticPages.forEach((route) => {
    app.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        res.sendFile(path.join(__dirname, 'public', 'html', `${pageName}.html`));
    });
});

// Routes profile webpage
app.get('/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Profile Not');
        }

        const templatePath = path.join(__dirname, 'public/html/profile.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template); 
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Returns profile information
app.get('/api/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({username: user.username, accountNumber: user.accountNumber, bio: user.bio, followers: user.followers, following: user.following, posts: user.posts, pfp: user.pfp,});
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Returns post information
app.post('/getPost', async (req, res) => {
    const { postId } = req.body;
    const existingPost = await Post.findOne({ postId });

    if (existingPost) {
        const accountNumber = existingPost.accountNumber;
        const user = await User.findOne({ accountNumber });
        const username = user.username;
        const pfp = user.pfp
        res.status(201).json({ success: true, message: 'Post created successfully', post: existingPost, username: username, pfp: pfp });
    }
})

// Creates a new post
app.post('/createPost', async (req, res) => {
    const { accountNumber, title, content } = req.body;

    try {
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const postId = await generateUniquePostId();
        const newPost = new Post({postId: postId, title: title, content: content, accountNumber: user.accountNumber,});

        await newPost.save();

        res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating post' });
    }
});

// creates a new account
app.post('/newAccount', async (req, res) => {
    const { fullName, password } = req.body;

    try {
        const hashed = await hashPassword(password);
        const accountNumber = await generateAccountNumber();
        const newUser = new User({accountNumber: accountNumber, password: hashed, username: fullName,});
        const sessionId = crypto.randomBytes(16).toString('hex');

        await newUser.save();

        sessionStore[sessionId] = {userId: newUser._id, username: newUser.username, accountNumber: newUser.accountNumber,};

        res.cookie('sessionId', sessionId, {httpOnly: true,  secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000, sameSite: 'Strict',});
        res.json({ success: true, user: newUser });
    } catch (err) {
        res.json({ success: false, message: "Error creating user" });
    }
});


// app.post('/newAccount', [
//     validateUsername,
//     validatePassword
//   ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
  
//     const { fullName, password } = req.body;
  
//     try {
//       const hashed = await hashPassword(password);
//       const accountNumber = await generateAccountNumber();
//       const newUser = new User({ accountNumber: accountNumber, password: hashed, username: fullName });
  
//       await newUser.save();
//       res.json({ success: true, user: newUser });
//     } catch (err) {
//       res.json({ success: false, message: "Error creating user" });
//     }
//   });

// Prints users to server
app.post('/viewAllUsers', async (req, res) => {
    try {
        if (User) {
            const users = await User.find();
            console.log(users);
            res.json({success: true,message: 'Successfully retrieved all users',});
        }

    } catch (err) {
        console.error("Error fetching users:", err);
        res.json({
            success: false,
            message: 'Error fetching users from the database'
        });
    }
});

// returns posts
app.post('/viewAllPosts', async (req, res) => {
    try {
        if (Post) {
            const posts = await Post.find();
            console.log(posts);
            res.json({ success: true, posts: posts });
        }

    } catch (err) {
        console.error("Error fetching users:", err);
    }
});

// returns posts of a user 
app.post('/viewUserPosts', async (req, res) => {
    try {
        const { accountNumber } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ success: false, message: "Account number is required" });
        }

        const posts = await Post.find({ accountNumber });

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: "No posts found for this user" });
        }

        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching posts" });
    }
});

// Logs the user in
app.post('/login', async (req, res) => {
    const { fullName, password } = req.body;

    try {
        const user = await User.findOne({ username: fullName });

        if (user) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                const sessionId = crypto.randomBytes(16).toString('hex'); 

                sessionStore[sessionId] = {userId: user._id, username: user.username, accountNumber: user.accountNumber,};
                
                res.cookie('sessionId', sessionId, {httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000,  sameSite: 'Strict', });

                res.json({ success: true, message: 'Login successful' });
            } else {
                res.json({ success: false, message: 'Invalid password' });
            }
        } else {
            res.json({ success: false, message: 'Invalid account number or name' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Error logging in' });
    }
});

// Logs the user out
app.post('/logout', (req, res) => {
    res.clearCookie('sessionId', {httpOnly: true, secure: process.env.NODE_ENV === 'production',  sameSite: 'Strict',});

    const sessionId = req.cookies.sessionId;

    if (sessionId && sessionStore[sessionId]) {
        delete sessionStore[sessionId];
    }

    res.json({ success: true, message: 'Logged out successfully' });
});

// Updates profile data
app.post('/updateSettings', async (req, res) => {
    const { bio,pfp,username } = req.body;
    const sessionId = req.cookies.sessionId;  
    try {
        if (sessionId && sessionStore[sessionId]) {
            const user = sessionStore[sessionId];  
            const accountNumber = user.accountNumber;

            await User.findOneAndUpdate(
                { accountNumber },
                { $set: { bio: bio, pfp: pfp, username: username } },
                { new: true }
            );
            
            return res.json({ success: true, message: 'done' });
        } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        } 

    } catch (error) {
        console.error("Error updating password:", error);
    }
});

// Updates post data
app.post('/changePostData', async (req, res) => {
    const { postId, title, content } = req.body;

    const sessionId = req.cookies.sessionId;  
  
    if (sessionId && sessionStore[sessionId]) {
      const user = sessionStore[sessionId];  
      
      try {
        // Find the post by postId
        const post = await Post.findOne({ postId });
  
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
  
        // Ensure the user account number matches the one on the post
        if (post.accountNumber !== user.accountNumber) {
          return res.status(403).json({ success: false, message: 'You are not authorized to update this post' });
        }
  
        // Update the post fields
        post.title = title || post.title;
        post.content = content || post.content;
  
        // Save the updated post
        await post.save();
  
        // Respond with success
        res.json({ success: true, message: 'Post updated successfully', post });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating post' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Not authenticated' });
    }
  });

// Gets user info
app.get('/get-user-info', (req, res) => {
    const sessionId = req.cookies.sessionId;  

    if (sessionId && sessionStore[sessionId]) {
        const user = sessionStore[sessionId];  
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

// test
app.listen(PORT, () => {
    console.log(`Host connection:\tSuccessful`);// - http://localhost:${PORT}`);
});
// git add .
// git push TNW main --force
// git commit -m "update"