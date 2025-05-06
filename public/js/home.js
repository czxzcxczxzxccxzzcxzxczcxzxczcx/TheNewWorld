import { apiRequest } from './utils/apiRequest.js';
import { renderPost,  changeEdit } from './utils/renderPost.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    async function fetchPost(postId) {
        try {
            const data = await apiRequest('/api/getPost', 'POST', { postId });
            if (data.success) {
                const pfp = data.pfp;
                
                renderPost(data.post, data.username, pfp,data.accountNumber,'home',accountNumber);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }

    async function renderPosts() {
        try {
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

    async function renderNotifications() {
        try {
            const data = await apiRequest('/api/getNotifications', 'GET');
            console.log(data)
            if (data.success && Array.isArray(data.notifications)) {
                const notificationsList = document.getElementById('notificationsList');
                notificationsList.innerHTML = ''; // Clear existing notifications
                console.log(data)
                data.notifications.forEach(notification => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${notification.content} (From: ${notification.from})`;
                    notificationsList.appendChild(listItem);
                });
            } else {
                console.error('No notifications found or data structure is invalid');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    apiRequest('/api/verify', 'GET')
        .then(data => {
            if (data.success) {
                const adminButton = document.getElementById('adminPanelButton');
                if (adminButton) {
                    adminButton.style.display = 'block'; // Set display to block if authorized
                }
            }
        })
        .catch(error => {
            console.error('Error verifying admin access:', error);
        });

    apiRequest('/api/getUserInfo', 'GET')
        .then(data => {
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
                initializeGlobalButtons(accountNumber); // Initialize global buttons
                initializeCreatePost(user.accountNumber);
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });

    renderPosts();
    renderNotifications();
});