import { apiRequest } from './utils/apiRequest.js';

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    document.getElementById("profilePanel").style.display = "flex";

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
    // Fetch user info
    async function fetchUserInfo() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    // Logout functionality
    document.getElementById("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) {window.location.href = '/';}
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Redirect to profile page
    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) {window.location.href = `/profile/${accountNumber}`;}
    });

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