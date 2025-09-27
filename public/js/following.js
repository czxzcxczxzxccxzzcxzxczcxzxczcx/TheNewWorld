import { apiRequest } from './utils/apiRequest.js';
import { initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';
import { gebid } from './utils/gebid.js';

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    const profileAccountNumber = window.location.pathname.split('/')[2];
    // gebid is now imported from utils/gebid.js

    let accountNumber;


    async function fetchUserInfo() {
        try {
            const user = await initializeAuth();
            accountNumber = user.accountNumber;
            initializeGlobalButtons(accountNumber); // Initialize global buttons
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    async function fetchAndRenderFollowing() {
        try {
            // Get the user ID from the URL
            const userId = window.location.pathname.split('/')[2];

            // Fetch the list of users the specified user is following
            const followingData = await apiRequest(`/api/getFollowing/${userId}`, 'GET');
            if (!followingData.success) {
                console.error('Error fetching following data:', followingData.message);
                return;
            }

            // Clear the homePanel before rendering
            homePanel.innerHTML = '';

            // Render each following user
            followingData.following.forEach(user => {
                const followingPanel = document.createElement("div");
                followingPanel.className = "followingPanel";

                if (accountNumber == profileAccountNumber) { 
                    followingPanel.innerHTML = `
                    <img class="pfp homeHover clickable-profile" src="${user.pfp}" alt="Profile Picture" data-account-number="${user.accountNumber}"/>
                    <h1 class="clickable-profile" data-account-number="${user.accountNumber}">@${user.username}</h1>
                    <button class="followingButton" data-account-number="${user.accountNumber}">Unfollow</button>
                `;
                } else {
                    followingPanel.innerHTML = `
                    <img class="pfp homeHover clickable-profile" src="${user.pfp}" alt="Profile Picture" data-account-number="${user.accountNumber}"/>
                    <h1 class="clickable-profile" data-account-number="${user.accountNumber}">@${user.username}</h1>
                `;
                }
                // document.getElementById("2369255378").addEventListener("click", async function (event) {
                //     window.location.href = `/profile/${user.accountNumber}`;  
                // });
                homePanel.appendChild(followingPanel);
            });

            // Add event listeners for clickable profiles
            document.querySelectorAll(".clickable-profile").forEach(element => {
                element.addEventListener("click", function() {
                    const targetAccountNumber = this.getAttribute("data-account-number");
                    window.location.href = `/profile/${targetAccountNumber}`;
                });
            });

            // Add event listeners to the unfollow buttons
            document.querySelectorAll(".followingButton").forEach(button => {
                button.addEventListener("click", async function () {
                    const accountNumber = this.getAttribute("data-account-number");
                    try {
                        const response = await apiRequest('/api/follow', 'POST', { recipientAccountNumber: accountNumber });
                        if (response.success) {
                            this.parentElement.remove(); // Remove the panel from the DOM
                        } else {
                            alert(response.message || 'Failed to unfollow. Please try again.');
                        }
                    } catch (error) {
                        console.error('Error unfollowing user:', error);
                        alert('Something went wrong. Please try again later.');
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching following data:', error);
        }
    }

    // Admin verification is now handled globally in renderBar.js

    fetchAndRenderFollowing();
    fetchUserInfo()
});