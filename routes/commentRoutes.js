const express = require('express');
const { Comment, Post, User } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore'); // Import sessionStore
const { createNotification } = require('../utils/database/genNotification');
const router = express.Router();

const generateUniqueCommentId = async () => {
    let commentId;
    let commentExists = true;

    while (commentExists) {
        commentId = `comment-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const existingComment = await Comment.findOne({ commentId });
        if (!existingComment) {
            commentExists = false;
        }
    }
    return commentId;
};

// Route to create a new comment
router.post('/createComment', async (req, res) => {
    const { accountNumber, postId, content } = req.body;

    try {
        const user = await User.findOne({ accountNumber });
        const post = await Post.findOne({ postId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const commentId = await generateUniqueCommentId();
        const newComment = new Comment({
            commentId,
            content,
            accountNumber: user.accountNumber,
            postId, // Link the comment to the post
        });

        await newComment.save();

        // Add the comment ID to the post's replies array
        if (!Array.isArray(post.replies)) {
            post.replies = [];
        }
        post.replies.push(commentId);
        await post.save();

        // Generate a notification for the post owner if the commenter is not the post owner
        if (post.accountNumber !== accountNumber) {
            const notification = await createNotification({
                from: accountNumber,
                to: post.accountNumber,
                content: `${user.username} commented on your post.`,
            });

            console.log('Notification created:', notification); // Print the notification data
        }

        res.status(201).json({
            success: true,
            message: 'Comment created successfully',
            comment: {
                ...newComment.toObject(),
                username: user.username,
                pfp: user.pfp,
            },
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ success: false, message: 'Error creating comment' });
    }
});

// Route to delete a comment
router.post('/deleteComment', async (req, res) => {
    const { commentId } = req.body;
    const sessionId = req.cookies.TNWID;

    try {
        if (sessionId && sessionStore[sessionId]) {
            const user = sessionStore[sessionId];
            const accountNumber = user.accountNumber;

            const existingComment = await Comment.findOne({ commentId });

            if (!existingComment) {
                return res.status(404).json({ success: false, message: 'Comment not found' });
            }

            if (existingComment.accountNumber !== accountNumber) {
                return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
            }

            // Remove comment from the post's replies array
            const post = await Post.findOne({ postId: existingComment.postId });
            if (post && Array.isArray(post.replies)) {
                post.replies = post.replies.filter(replyId => replyId !== commentId);
                await post.save();
            }

            await Comment.deleteOne({ commentId });

            res.status(200).json({ success: true, message: 'Comment deleted successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Not authenticated' });
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to get comments for a post
router.post('/getComments', async (req, res) => {
    const { postId } = req.body;

    try {
        const comments = await Comment.find({ postId });

        if (comments.length === 0) {
            return res.status(200).json({ success: true, comments: [] }); // Return an empty array with a 200 status
        }

        const commentsWithUserData = await Promise.all(
            comments.map(async (comment) => {
                const user = await User.findOne({ accountNumber: comment.accountNumber });
                return {
                    comment,
                    username: user?.username || null,
                    pfp: user?.pfp || null,
                };
            })
        );

        res.status(200).json({ success: true, comments: commentsWithUserData });
    } catch (error) {
        console.error('Error retrieving comments:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to like or unlike a comment
router.post('/likeComment', async (req, res) => {
    const { commentId, accountNumber } = req.body;

    try {
        const existingComment = await Comment.findOne({ commentId });

        if (!existingComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (!Array.isArray(existingComment.likes)) {
            existingComment.likes = [];
        }

        if (existingComment.likes.includes(accountNumber)) {
            existingComment.likes = existingComment.likes.filter(
                (like) => like.toString() !== accountNumber.toString()
            );
            await existingComment.save();
            return res.status(200).json({ success: true, removed: true });
        }

        existingComment.likes.push(accountNumber);
        await existingComment.save();

        // Generate a notification for the comment owner if the liker is not the comment owner
        if (existingComment.accountNumber !== accountNumber) {
            const user = await User.findOne({ accountNumber });
            if (user) {
                const notification = await createNotification({
                    from: accountNumber,
                    to: existingComment.accountNumber,
                    content: `${user.username} liked your comment.`,
                });
            }
        }

        return res.status(200).json({ success: true, message: 'Comment liked successfully', removed: false });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ success: false, message: 'Error liking comment' });
    }
});

// Route to check if a comment is liked by a user
router.post('/checkCommentLike', async (req, res) => {
    const { commentId, accountNumber } = req.body;

    try {
        const existingComment = await Comment.findOne({ commentId });

        if (!existingComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (existingComment.likes.includes(accountNumber)) {
            return res.status(200).json({ success: true, liked: true });
        }

        return res.status(200).json({ success: true, liked: false });
    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({ success: false, message: 'Error checking like status' });
    }
});

// Route to repost or unrepost a comment
router.post('/repostComment', async (req, res) => {
    const { commentId, accountNumber } = req.body;

    try {
        const existingComment = await Comment.findOne({ commentId });

        if (!existingComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (!Array.isArray(existingComment.reposts)) {
            existingComment.reposts = [];
        }

        if (existingComment.reposts.includes(accountNumber)) {
            existingComment.reposts = existingComment.reposts.filter(
                (repost) => repost.toString() !== accountNumber.toString()
            );
            await existingComment.save();
            return res.status(200).json({ success: true, removed: true });
        }

        existingComment.reposts.push(accountNumber);
        await existingComment.save();

        // Generate a notification for the comment owner if the reposter is not the comment owner
        if (existingComment.accountNumber !== accountNumber) {
            const user = await User.findOne({ accountNumber });
            if (user) {
                const notification = await createNotification({
                    from: accountNumber,
                    to: existingComment.accountNumber,
                    content: `${user.username} reposted your comment.`,
                });
            }
        }

        return res.status(200).json({ success: true, message: 'Comment reposted successfully', removed: false });
    } catch (error) {
        console.error('Error reposting comment:', error);
        res.status(500).json({ success: false, message: 'Error reposting comment' });
    }
});

// Route to check if a comment is reposted by a user
router.post('/checkCommentRepost', async (req, res) => {
    const { commentId, accountNumber } = req.body;

    try {
        const existingComment = await Comment.findOne({ commentId });

        if (!existingComment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (existingComment.reposts && existingComment.reposts.includes(accountNumber)) {
            return res.status(200).json({ success: true, reposted: true });
        }

        return res.status(200).json({ success: true, reposted: false });
    } catch (error) {
        console.error('Error checking repost status:', error);
        res.status(500).json({ success: false, message: 'Error checking repost status' });
    }
});

module.exports = router;