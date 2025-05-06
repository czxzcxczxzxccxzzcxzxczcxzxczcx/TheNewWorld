import { apiRequest } from './utils/apiRequest.js';
import { initializeGlobalButtons } from './utils/renderBar.js';

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    let accountNumber;

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

    async function fetchAndRenderFollowers() {
        try {
            // Get the user ID from the URL
            const userId = window.location.pathname.split('/')[2];

            // Fetch the list of users who follow the specified user
            const followersData = await apiRequest(`/api/getFollowers/${userId}`, 'GET');
            if (!followersData.success) {
                console.error('Error fetching followers data:', followersData.message);
                return;
            }

            // Clear the homePanel before rendering
            homePanel.innerHTML = '';

            // Render each follower user

            followersData.followers.forEach(user => {
                const followerPanel = document.createElement("div");
                followerPanel.className = "followingPanel";

                followerPanel.innerHTML = `
                    <img class="pfp homeHover" src="${user.pfp}" alt="Profile Picture"/>
                    <h1>@${user.username}</h1>
                `;
                homePanel.appendChild(followerPanel);
            });

        } catch (error) {
            console.error('Error fetching followers data:', error);
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

    fetchAndRenderFollowers();
    fetchUserInfo();
});