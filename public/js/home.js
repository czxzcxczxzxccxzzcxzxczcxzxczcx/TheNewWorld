import { apiRequest } from './utils/apiRequest.js';
import { renderPost,  changeEdit } from './utils/renderPost.js';

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
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });

    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) {window.location.href = `/profile/${accountNumber}`;}
    });

    document.getElementById("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) {window.location.href = '/';}
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });

    document.getElementById('viewtest').addEventListener("click", async function () {
        try {
            await apiRequest('/api/viewAllPosts', 'POST');
        } catch (error) {
            console.error('Error fetching all posts:', error);
        }
    });

    renderPosts();
});