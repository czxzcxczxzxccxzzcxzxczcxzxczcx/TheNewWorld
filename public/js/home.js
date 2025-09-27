import { apiRequest } from './utils/apiRequest.js';
import { renderPost,  changeEdit } from './utils/renderPost.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    // Function to fetch a single post by ID and render it
    async function fetchPost(postId) {
        try {
            const data = await apiRequest('/api/getPost', 'POST', { postId });
            if (data.success) {
                const pfp = data.pfp;
                
                renderPost(data.post, data.username, pfp, data.verified, 'home', accountNumber);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }

    // Function to render all posts
    async function renderPosts() {
        try {
            // Fetch all posts from the server
            const data = await apiRequest('/api/getAllPosts', 'POST');
            if (data.success && Array.isArray(data.posts)) {
                // Sort posts by 'createdAt' in descending order
                data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
                // Render each post
                data.posts.forEach((post) => {
                    fetchPost(post.postId);
                });
            } else {
                console.error('No posts found or data structure is invalid');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }

    // Function to render notifications
    async function renderNotifications() {
        try {
            const data = await apiRequest('/api/getNotifications', 'GET');
            if (data.success && Array.isArray(data.notifications)) {
                const notificationsList = document.getElementById('notificationsList');
                notificationsList.innerHTML = '';
                data.notifications.forEach(notification => {
                    // Only show notifications that are currently shown (shown === true)
                    if (notification.shown === true) {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${notification.content} (From: ${notification.from})`;
                        // Add X button
                        const closeButton = document.createElement('button');
                        closeButton.textContent = '✕';
                        closeButton.style.marginLeft = '10px';
                        closeButton.style.cursor = 'pointer';
                        closeButton.onclick = async () => {
                            try {
                                await apiRequest('/api/setNotificationShown', 'POST', { notificationId: notification.notificationId });
                                listItem.remove();
                            } catch (err) {
                                console.error('Error hiding notification:', err);
                            }
                        };
                        listItem.appendChild(closeButton);
                        notificationsList.appendChild(listItem);
                    }
                });
            } else {
                console.error('No notifications found or data structure is invalid');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    // Initialize authentication and setup
    initializeAuth()
        .then(user => {
            accountNumber = user.accountNumber;
            initializeCreatePost(user.accountNumber);
            // Fetch and render posts and notifications
            renderPosts();
            renderNotifications();
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
        });
});