const express = require('express');
const path = require('path');
const fs = require("fs");
const app = express();

const { hashPassword, comparePassword } = require('./utils/passwordHashing');
const { connectToDB, clearDatabase, updateUserPassword, User, updateData, Post } = require('./utils/database');

const PORT = 7272;

const staticPages = [ 
    '/', 
    '/home',
    '/createPost',
];

const initialize = async () => {
    try {
        await connectToDB();
        // await clearDatabase(); 
        await updateData(4329959812,'bio',"Welcome to my profile");

    } catch (err) {
        console.error('Initialization error:', err);
    }
};

const generateUniquePostId = async () => {
    let postId;
    let postExists = true;

    while (postExists) {
        // Generate a postId (e.g., combination of timestamp and a random string)
        postId = `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Check if the generated postId already exists in the database
        const existingPost = await Post.findOne({ postId });
        if (!existingPost) {
            postExists = false;  // Exit the loop if postId is unique
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
            userExists = false;  // If no user exists with this account number, break the loop
        }
    }
    return accountNumber
};

initialize();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

staticPages.forEach((route) => {
    app.get(route, (req, res) => {
        const pageName = route === '/' ? 'index' : route.substring(1);
        res.sendFile(path.join(__dirname, 'public', 'html', `${pageName}.html`));
    });
});

// Routes

app.get('/profile/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const user = await User.findOne({ accountNumber });

        if (!user) {
            return res.status(404).send('ERROR 404 | User Profile Not');
        }

        const templatePath = path.join(__dirname, 'public/html/profile.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        res.send(template); // Send the template with the injected data

    } catch (error) {
        console.error('Error serving profile page:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/api/profile/:accountNumber', async (req, res) => {
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



app.post('/getPost', async (req, res) => 
    {
        const { postId } = req.body;
        const existingPost = await Post.findOne({ postId });
    
        if (existingPost)
        {
            const accountNumber = existingPost.accountNumber;
            const user = await User.findOne({ accountNumber });
            const username = user.username;
            const pfp = user.pfp
            console.log(existingPost);
            res.status(201).json({ success: true, message: 'Post created successfully', post: existingPost, username: username, pfp: pfp});
    
        }
    })


app.post('/createPost', async (req, res) => {
    const { accountNumber, title, content } = req.body;
    console.log(req.body);
    try {
        const user = await User.findOne({ accountNumber });
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

        const accountNumber = await generateAccountNumber();
        console.log(accountNumber);
        const newUser = new User({
            accountNumber: accountNumber,
            password: hashed,
            username: fullName,
        });

        await newUser.save();
        const user = await User.findOne({ accountNumber: accountNumber });
        res.json({ success: true, user });
    } catch (err) {
        console.error("Error creating user:", err);
        res.json({ success: false, message: "Error creating user" });
    }
});

app.post('/viewAllUsers', async (req, res) => {
    try {
        if (User)
        {
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
        if (Post)
        {
            const posts = await Post.find();
           res.json({ success: true, posts: posts});
        }
        
    } catch (err) {
        console.error("Error fetching users:", err);
    }
});


app.post('/viewUserPosts', async (req, res) => {
    try {
        const { accountNumber } = req.body; // Assuming you are sending accountNumber in the request body

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
                res.json({ success: true, user });
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

app.listen(PORT, () => {
    console.log(`New World Bank successfully hosted on http://localhost:${PORT}`);
});
