const express = require('express');
const { Post, User } = require('../utils/database');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore
const { createNotification } = require('../utils/database/genNotification');
const router = express.Router();

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

router.post('/deletePost', async (req, res) => {
    const { postId } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (sessionId && sessionStore[sessionId]) {
            const user = sessionStore[sessionId];
            const accountNumber = user.accountNumber;

            // Find the post by postId in the Posts collection
            const existingPost = await Post.findOne({ postId });

            if (!existingPost) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }

            // Check if the accountNumber of the post matches the accountNumber from the session
            if (existingPost.accountNumber !== accountNumber) {
                return res.status(403).json({ success: false, message: 'You are not authorized to delete this post' });
            }

            // Remove the post from the reposts array of all users
            await User.updateMany(
                { reposts: postId },
                { $pull: { reposts: postId } }
            );

            // Remove the post from the liked array of all users
            await User.updateMany(
                { liked: postId },
                { $pull: { liked: postId } }
            );

            // Delete the post
            await Post.deleteOne({ postId });

            res.status(200).json({ success: true, message: 'Post deleted successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Not authenticated' });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get a post by postId
router.post('/getPost', async (req, res) => {
    const { postId } = req.body;

    try {
        const existingPost = await Post.findOne({ postId });

        if (existingPost) {
            const accountNumber = existingPost.accountNumber;
            const user = await User.findOne({ accountNumber });

            if (user) {
                const username = user.username;
                const pfp = user.pfp;
                return res.status(201).json({
                    success: true,
                    message: 'Post retrieved successfully',
                    post: existingPost,
                    username,
                    pfp,
                });
            }
        }

        res.status(404).json({ success: false, message: 'Post not found' });
    } catch (error) {
        console.error('Error retrieving post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/likePost', async (req, res) => {
    const { postId, accountNumber } = req.body;
    try {
        const existingPost = await Post.findOne({ postId });
        const user = await User.findOne({ accountNumber });

        
        if (!existingPost) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!Array.isArray(existingPost.likes)) {
            existingPost.likes = []; 
        }

        if (existingPost.likes.includes(accountNumber)) {
            existingPost.likes = existingPost.likes.filter(like => 
                like && accountNumber && like.toString() !== accountNumber.toString()
            );
            await existingPost.save();
            return res.status(200).json({ success: true, removed: true });
        }

        existingPost.likes.push(accountNumber);
        await existingPost.save();

        // Generate a notification for the post owner if the user likes their post
        if (existingPost.accountNumber !== accountNumber) {
            const notification = await createNotification({
                from: accountNumber,
                to: existingPost.accountNumber,
                content: `${user.username} liked your post.`,
            });

            console.log('Notification created:', notification); // Print the notification data
        }

        return res.status(200).json({ success: true, message: 'Post liked successfully', post: existingPost,  removed: false});
    } catch (error) {
        console.error('Error liking post:', error); // Log the error in the console
        return res.status(500).json({ success: false, message: 'Error liking post', error });
    }
});


router.post('/checkLike', async (req, res) => {
    const { postId, accountNumber } = req.body;

    try {
        const existingPost = await Post.findOne({ postId });

        if (!existingPost) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (existingPost.likes.includes(accountNumber)) {
            return res.status(200).json({ success: true, liked: true });
        }

        return res.status(200).json({ success: true, liked: false });
        
    } catch (error) {
        console.error('Error checking like status:', error); // Log the error in the console
        return res.status(500).json({ success: false, message: 'Error checking like status', error });
    }
});

// Route to check if a post is reposted by a user
router.post('/checkRepost', async (req, res) => {
    const { postId, accountNumber } = req.body;

    try {
        const post = await Post.findOne({ postId });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.reposts.includes(accountNumber)) {
            return res.status(200).json({ success: true, reposted: true });
        }

        return res.status(200).json({ success: true, reposted: false });
    } catch (error) {
        console.error('Error checking repost status:', error);
        return res.status(500).json({ success: false, message: 'Error checking repost status', error });
    }
});

// Route to repost or remove repost of a post
router.post('/repost', async (req, res) => {
    const { postId, accountNumber } = req.body;

    try {
        const user = await User.findOne({ accountNumber });
        const post = await Post.findOne({ postId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Ensure reposts array exists in both User and Post
        if (!Array.isArray(user.reposts)) {
            user.reposts = [];
        }
        if (!Array.isArray(post.reposts)) {
            post.reposts = [];
        }

        // Check if the user has already reposted the post
        if (user.reposts.includes(postId)) {
            // Remove repost from User and Post
            user.reposts = user.reposts.filter(repost => repost !== postId);
            post.reposts = post.reposts.filter(reposter => reposter.toString() !== accountNumber.toString());
            await user.save();
            await post.save();
            return res.status(200).json({ success: true, removed: true, message: 'Repost removed successfully' });
        }

        // Add repost to User and Post
        user.reposts.push(postId);
        post.reposts.push(accountNumber);
        await user.save();
        await post.save();

        // Generate a notification for the post owner if the user reposts their post
        if (post.accountNumber !== accountNumber) {
            const notification = await createNotification({
                from: accountNumber,
                to: post.accountNumber,
                content: `${user.username} reposted your post.`,
            });

            console.log('Notification created:', notification); // Print the notification data
        }

        return res.status(200).json({ success: true, message: 'Post reposted successfully', user, post, removed: false });
    } catch (error) {
        console.error('Error reposting post:', error);
        return res.status(500).json({ success: false, message: 'Error reposting post', error });
    }
});

// Creates a new post
router.post('/createPost', async (req, res) => {
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


router.post('/getAllPosts', async (req, res) => {
    try {
        if (Post) {
            const posts = await Post.find();
            res.json({ success: true, posts: posts });
        }

    } catch (err) {
        console.error("Error fetching users:", err);
    }
});

router.post('/getUserPosts', async (req, res) => {
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


router.post('/changePostData', async (req, res) => {
    const { postId, title, content } = req.body;

    const sessionId = req.cookies.TNWID;  
  
    if (sessionId && sessionStore[sessionId]) {
      const user = sessionStore[sessionId];  
      
      try {
        const post = await Post.findOne({ postId });
  
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
  
        if (post.accountNumber !== user.accountNumber) {
          return res.status(403).json({ success: false, message: 'You are not authorized to update this post' });
        }
  
        post.title = title || post.title;
        post.content = content || post.content;
        await post.save();
  
        res.json({ success: true, message: 'Post updated successfully', post });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating post' });
      }
    } else {
      res.status(401).json({ success: false, message: 'Not authenticated' });
    }
  });

router.post('/getUserReposts', async (req, res) => {
    const { accountNumber } = req.body;

    try {
        if (!accountNumber) {return res.status(400).json({ success: false, message: "Account number is required" });}

        const user = await User.findOne({ accountNumber });

        if (!user) {return res.status(404).json({ success: false, message: "User not found" });}
        if (!Array.isArray(user.reposts) || user.reposts.length === 0) {return res.status(404).json({ success: false, message: "No reposts found for this user" });}

        const repostedPosts = await Post.find({ postId: { $in: user.reposts } });

        const postsWithUserData = await Promise.all(
            repostedPosts.map(async (post) => {
                const postOwner = await User.findOne({ accountNumber: post.accountNumber });
                return {
                    success: true,
                    message: 'Post retrieved successfully',
                    post,
                    username: postOwner?.username || null,
                    pfp: postOwner?.pfp || null,
                };
            })
        );

        res.status(201).json(postsWithUserData);
    } catch (error) {
        console.error('Error fetching reposts:', error);
        res.status(500).json({ success: false, message: "Error fetching reposts" });
    }
});

module.exports = router;