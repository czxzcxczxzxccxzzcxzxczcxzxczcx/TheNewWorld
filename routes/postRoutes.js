const express = require('express');
const rateLimit = require('express-rate-limit'); // Import rate limiter for specific route
const { Post, User } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore
const { createNotification } = require('../utils/database/genNotification');
const router = express.Router();
const multer = require('multer');
const { s3Client, PutObjectCommand } = require('../utils/awsS3Client');
const upload = multer({ storage: multer.memoryStorage() });

const createPostLimiter = rateLimit({
    windowMs: 0.5 * 60 * 1000, // 10 minutes
    max: 3, // limit each IP to 15 createPost requests per windowMs
    message: { success: false, message: 'Too many posts created, please try again later.' }
});

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

router.post('/uploadPostImage', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const key = `post-images/${Date.now()}_${req.file.originalname}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const imageUrl = `${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Error uploading image to S3:', err);
    res.status(500).json({ success: false, message: 'Upload failed', error: err });
  }
});

router.post('/deletePost', async (req, res) => {
    const { postId } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (sessionId) {
            const user = await sessionStore.get(sessionId);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid or expired session' });
            }
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
    const sessionId = req.cookies.TNWID;
    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const user = await sessionStore.get(sessionId);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
    const accountNumber = user.accountNumber;
    const { postId } = req.body;
    try {
        const existingPost = await Post.findOne({ postId });
        const dbUser = await User.findOne({ accountNumber });

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
            await createNotification({
                from: accountNumber,
                to: existingPost.accountNumber,
                content: `${dbUser.username} liked your post.`,
            });
        }

        return res.status(200).json({ success: true, message: 'Post liked successfully', post: existingPost, removed: false });
    } catch (error) {
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
    const sessionId = req.cookies.TNWID;
    if (!(sessionId && await sessionStore.get(sessionId))) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userSession = await sessionStore.get(sessionId);
    const accountNumber = userSession.accountNumber;
    const { postId } = req.body;
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
            await createNotification({
                from: accountNumber,
                to: post.accountNumber,
                content: `${user.username} reposted your post.`,
            });
        }

        return res.status(200).json({ success: true, message: 'Post reposted successfully', user, post, removed: false });
    } catch (error) {
        console.error('Error reposting post:', error);
        return res.status(500).json({ success: false, message: 'Error reposting post', error });
    }
});

// Creates a new post
router.post('/createPost', createPostLimiter, async (req, res) => {
    const sessionId = req.cookies.TNWID;
    if (!(sessionId && await sessionStore.get(sessionId))) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const user = await sessionStore.get(sessionId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session' });
        }
    const accountNumber = user.accountNumber;
    const { title, content, imageUrl, poll } = req.body;
    try {
        const dbUser = await User.findOne({ accountNumber });

        if (!dbUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const postId = await generateUniquePostId();
        
        // Validate that we have either content or a poll
        const hasContent = content && content.trim();
        const hasPoll = poll && poll.isEnabled && poll.options && poll.options.length >= 2;
        
        if (!hasContent && !hasPoll) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post must have either content or a poll' 
            });
        }

        // Create post data object with optional imageUrl
        const postData = { 
            postId: postId, 
            title: title, 
            content: content || '', // Allow empty content if poll exists
            accountNumber: dbUser.accountNumber 
        };
        
        // Add imageUrl to post if it exists
        if (imageUrl) {
            postData.imageUrl = imageUrl;
        }
        
        // Add poll data if it exists
        if (poll && poll.isEnabled && poll.options && poll.options.length >= 2) {
            // Validate poll options
            const validOptions = poll.options.filter(option => option.text && option.text.trim());
            if (validOptions.length >= 2 && validOptions.length <= 10) {
                postData.poll = {
                    isEnabled: true,
                    question: poll.question || '',
                    options: validOptions.map(option => ({
                        text: option.text.trim(),
                        votes: []
                    })),
                    allowMultipleVotes: poll.allowMultipleVotes || false,
                    endsAt: poll.duration ? new Date(Date.now() + poll.duration * 24 * 60 * 60 * 1000) : null,
                    totalVotes: 0
                };
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Poll must have between 2 and 10 valid options' 
                });
            }
        }
        
        const newPost = new Post(postData);

        await newPost.save();

        res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
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

// Get a single post by postId
router.get('/getPost/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!postId) {
            return res.status(400).json({ success: false, message: "Post ID is required" });
        }

        const post = await Post.findOne({ postId });

        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        res.json({ success: true, post });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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
  
    if (sessionId) {
      const user = await sessionStore.get(sessionId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session' });
      }  
      
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

// Route to vote on a poll
router.post('/votePoll', async (req, res) => {
    const sessionId = req.cookies.TNWID;
    if (!sessionId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const user = await sessionStore.get(sessionId);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
    
    const accountNumber = user.accountNumber;
    const { postId, optionIndex } = req.body;

    try {
        const post = await Post.findOne({ postId });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!post.poll || !post.poll.isEnabled) {
            return res.status(400).json({ success: false, message: 'This post does not have an active poll' });
        }

        // Check if poll has ended
        if (post.poll.endsAt && new Date() > post.poll.endsAt) {
            return res.status(400).json({ success: false, message: 'This poll has ended' });
        }

        // Validate option index
        if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
            return res.status(400).json({ success: false, message: 'Invalid poll option' });
        }

        // Check if user has already voted
        const hasVotedOnOption = post.poll.options[optionIndex].votes.includes(accountNumber);
        const hasVotedAnywhere = post.poll.options.some(option => option.votes.includes(accountNumber));

        if (!post.poll.allowMultipleVotes && hasVotedAnywhere && !hasVotedOnOption) {
            return res.status(400).json({ success: false, message: 'You can only vote once on this poll' });
        }

        if (hasVotedOnOption) {
            // Remove vote (toggle)
            post.poll.options[optionIndex].votes = post.poll.options[optionIndex].votes.filter(
                vote => vote.toString() !== accountNumber.toString()
            );
            post.poll.totalVotes -= 1;
        } else {
            // If not allowing multiple votes, remove any existing vote first
            if (!post.poll.allowMultipleVotes && hasVotedAnywhere) {
                post.poll.options.forEach(option => {
                    const voteIndex = option.votes.findIndex(vote => vote.toString() === accountNumber.toString());
                    if (voteIndex !== -1) {
                        option.votes.splice(voteIndex, 1);
                        post.poll.totalVotes -= 1;
                    }
                });
            }
            
            // Add new vote
            post.poll.options[optionIndex].votes.push(accountNumber);
            post.poll.totalVotes += 1;
        }

        await post.save();

        // Generate notification for post owner (if different user)
        if (post.accountNumber !== accountNumber && !hasVotedOnOption) {
            const voterUser = await User.findOne({ accountNumber });
            if (voterUser) {
                await createNotification({
                    from: accountNumber,
                    to: post.accountNumber,
                    content: `${voterUser.username} voted on your poll.`,
                });
            }
        }

        res.status(200).json({ 
            success: true, 
            message: hasVotedOnOption ? 'Vote removed' : 'Vote recorded',
            poll: post.poll
        });

    } catch (error) {
        console.error('Error voting on poll:', error);
        res.status(500).json({ success: false, message: 'Error processing vote' });
    }
});

// Route to get poll results
router.get('/pollResults/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findOne({ postId });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!post.poll || !post.poll.isEnabled) {
            return res.status(400).json({ success: false, message: 'This post does not have a poll' });
        }

        res.status(200).json({ 
            success: true, 
            poll: post.poll 
        });

    } catch (error) {
        console.error('Error getting poll results:', error);
        res.status(500).json({ success: false, message: 'Error getting poll results' });
    }
});

module.exports = router;