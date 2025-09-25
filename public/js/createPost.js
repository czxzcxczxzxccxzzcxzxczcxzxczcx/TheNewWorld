import { apiRequest } from './utils/apiRequest.js';
import { initializeGlobalButtons } from './utils/renderBar.js';

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    document.getElementById("profilePanel").style.display = "flex";

    // Admin verification is now handled globally in renderBar.js
    // Fetch user info
    async function fetchUserInfo() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
                initializeGlobalButtons(accountNumber); // Initialize global buttons
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    // Create a new post
    document.getElementById('createPost').addEventListener("click", async function () {
        event.preventDefault();

        const title = document.getElementById("titleText").value;
        const content = document.getElementById("bodyText").value;

        if (title && content) {
            try {
                const data = await apiRequest('/api/createPost', 'POST', { accountNumber, title, content });
                if (data.success) {window.location.href = `/profile/${accountNumber}`; }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        }
    });

    // Check all posts
    document.getElementById('checkPost').addEventListener("click", async function () {
        try {
            const data = await apiRequest('/api/getAllPosts', 'POST');
        } catch (error) {
            console.error('Error checking posts:', error);
        }
    });

    fetchUserInfo();
});