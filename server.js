const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const fs = require("fs");
const app = express();

const { hashPassword, comparePassword } = require('./utils/passwordHashing');
const { connectToDB, clearDatabase, updateUserPassword, User, updateData, Post } = require('./utils/database');
const sessionStore = {}; 

const PORT = 7272;

const staticPages = [
    '/',
    '/home',
    '/createPost',
];

const initialize = async () => {
    try {
        await connectToDB();
        // await updateData(7705304932, 'pfp', "https://cdn.pfps.gg/pfps/9463-little-cat.png");
        await updateData(7705304932, 'pf3p', "https://cdn.pfps.gg/pfps/9463-little-cat.png");


    } catch (err) {
        console.error('Initialization error:', err);
    }
}; initialize();

const generateUniquePostId = async () => {
    let postId;
    let postExists = true;

    while (postExists) {
        postId = `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const existingPost = await Post.findOne({ postId });
        if (!existingPost) {
            postExists = false;
        }
    }

    return postId;
};

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

staticPages.forEach((route) => {
    app.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        res.sendFile(path.join(__dirname, 'public', 'html', `${pageName}.html`));
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());  // Make sure this is added before any routes that need to access cookies

app.get('/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Profile Not');
        }

        const templatePath = path.join(__dirname, 'public/html/profile.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        console.log("attempt");

        res.send(template); // Send the template with the injected data

    } catch (error) {
        console.error('Error serving profile page:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/profile/:accountNumber', async (req, res) => {
    console.log(1);
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.username,
            accountNumber: user.accountNumber,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts,
            pfp: user.pfp,
        });
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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


app.post('/createPost', async (req, res) => {
    const { accountNumber, title, content } = req.body;
    console.log(req.body);
    try {
        const user = await User.findOne({ accountNumber });
        console.log(user);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const postId = await generateUniquePostId();

        const newPost = new Post({
            postId: postId,
            title: title,
            content: content,
            accountNumber: user.accountNumber,
        });

        await newPost.save();
        res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Error creating post' });
    }
});

app.post('/newAccount', async (req, res) => {
    const { fullName, password } = req.body;

    try {
        console.log(req.body);

        const hashed = await hashPassword(password);

        // Generate a unique account number
        const accountNumber = await generateAccountNumber();
        console.log(accountNumber);

        const newUser = new User({
            accountNumber: accountNumber,
            password: hashed,
            username: fullName,
        });

        await newUser.save();

        // Generate a session ID for the new user (just like in /login route)
        const sessionId = crypto.randomBytes(16).toString('hex');

        // Store session info in sessionStore (this can be Redis or any other persistent storage in production)
        sessionStore[sessionId] = {
            userId: newUser._id,
            username: newUser.username,
            accountNumber: newUser.accountNumber,
        };

        // Set the sessionId cookie for the newly created user
        res.cookie('sessionId', sessionId, {
            httpOnly: true,  // Cookie can't be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production',  // Set to true if using HTTPS
            maxAge: 24 * 60 * 60 * 1000, // Cookie expiration (1 day)
            sameSite: 'Strict',  // Prevent CSRF attacks
        });

        // Respond with success and the new user details
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error("Error creating user:", err);
        res.json({ success: false, message: "Error creating user" });
    }
});

app.post('/viewAllUsers', async (req, res) => {
    try {
        if (User) {
            const users = await User.find();
            console.log(users);
            res.json({
                success: true,
                message: 'Successfully retrieved all users',
            });
        }

    } catch (err) {
        console.error("Error fetching users:", err);
        res.json({
            success: false,
            message: 'Error fetching users from the database'
        });
    }
});

app.post('/viewAllPosts', async (req, res) => {
    try {
        if (Post) {
            const posts = await Post.find();
            res.json({ success: true, posts: posts });
        }

    } catch (err) {
        console.error("Error fetching users:", err);
    }
});


app.post('/viewUserPosts', async (req, res) => {
    try {
        const { accountNumber } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ success: false, message: "Account number is required" });
        }

        // Fetch posts from the database that match the accountNumber
        const posts = await Post.find({ accountNumber });

        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: "No posts found for this user" });
        }

        // Return the posts to the client
        res.json({ success: true, posts });
    } catch (err) {
        console.error("Error fetching posts for user:", err);
        res.status(500).json({ success: false, message: "Error fetching posts" });
    }
});


app.post('/login', async (req, res) => {
    const { fullName, password } = req.body;
    try {
        const user = await User.findOne({ username: fullName });

        if (user) {
            const isMatch = await comparePassword(password, user.password);
            if (isMatch) {
                // Generate a unique session ID
                const sessionId = crypto.randomBytes(16).toString('hex'); // You can use UUID here as well

                // Store session information in sessionStore (you could use a more permanent store like Redis or a DB)
                sessionStore[sessionId] = {
                    userId: user._id,
                    username: user.username,
                    accountNumber: user.accountNumber,

                };
                res.cookie('sessionId', sessionId, {
                    httpOnly: true,  // Can't be accessed by JavaScript
                    secure: process.env.NODE_ENV === 'production',  // Set to true if using HTTPS
                    maxAge: 24 * 60 * 60 * 1000, // Cookie expiration (1 day)
                    sameSite: 'Strict', // Prevents CSRF attacks
                });

                // Respond with success
                res.json({ success: true, message: 'Login successful' });
            } else {
                res.json({ success: false, message: 'Invalid password' });
            }
        } else {
            res.json({ success: false, message: 'Invalid account number or name' });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.json({ success: false, message: 'Error logging in' });
    }
});


app.post('/logout', (req, res) => {
    res.clearCookie('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // If using HTTPS
        sameSite: 'Strict',
    });

    const sessionId = req.cookies.sessionId;
    if (sessionId && sessionStore[sessionId]) {
        delete sessionStore[sessionId];
    }

    res.json({ success: true, message: 'Logged out successfully' });
});
app.post('/changePostData', async (req, res) => {
    const { postId, title, content } = req.body;

    const sessionId = req.cookies.sessionId;  // Get sessionId from cookie
  
    if (sessionId && sessionStore[sessionId]) {
        console.log()
      const user = sessionStore[sessionId];  // Retrieve user data from session store
      console.log(user);  // You can remove this line in production
      
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating post' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Not authenticated' });
    }
  });

app.get('/get-user-info', (req, res) => {
    const sessionId = req.cookies.sessionId;  // Get the session ID from the cookie

    if (sessionId && sessionStore[sessionId]) {
        const user = sessionStore[sessionId];  // Retrieve user data from session store
        console.log(user);
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

app.listen(PORT, () => {
    console.log(`Host connection:\tSuccessful`);// - http://localhost:${PORT}`);
});
