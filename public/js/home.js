import { apiRequest } from './utils/apiRequest.js';
import { renderPost,  changeEdit } from './utils/renderPost.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    const updateNotificationBadges = (count) => {
        const badges = document.querySelectorAll('[data-notification-badge]');
        badges.forEach((badge) => {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : String(count);
                badge.hidden = false;
                badge.setAttribute('aria-hidden', 'false');
            } else {
                badge.textContent = '';
                badge.hidden = true;
                badge.setAttribute('aria-hidden', 'true');
            }
        });
    };

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
                if (!notificationsList) {
                    updateNotificationBadges(0);
                    return;
                }
                notificationsList.innerHTML = '';

                const appendEmptyState = () => {
                    if (notificationsList.querySelector('.notificationsList-empty')) {
                        return;
                    }
                    const emptyItem = document.createElement('li');
                    emptyItem.className = 'notificationsList-empty';
                    emptyItem.innerHTML = `
                        <div class="notifications-empty-state">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                <path d="M6 18h12"></path>
                            </svg>
                            <p>No notifications yet</p>
                        </div>
                    `;
                    notificationsList.appendChild(emptyItem);
                };

                let visibleCount = 0;
                data.notifications.forEach(notification => {
                    // Only show notifications that are currently shown (shown === true)
                    if (notification.shown === true) {
                        const listItem = document.createElement('li');
                        listItem.dataset.notificationItem = 'true';
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
                                const remaining = notificationsList.querySelectorAll('li[data-notification-item="true"]').length;
                                if (remaining === 0) {
                                    appendEmptyState();
                                }
                                updateNotificationBadges(remaining);
                            } catch (err) {
                                console.error('Error hiding notification:', err);
                            }
                        };
                        listItem.appendChild(closeButton);
                        notificationsList.appendChild(listItem);
                        visibleCount += 1;
                    }
                });

                if (visibleCount === 0) {
                    appendEmptyState();
                }

                updateNotificationBadges(visibleCount);
            } else {
                console.error('No notifications found or data structure is invalid');
                updateNotificationBadges(0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            updateNotificationBadges(0);
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