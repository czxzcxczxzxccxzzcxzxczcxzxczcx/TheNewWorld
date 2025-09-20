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

    // Fetch and render the list of users who follow the specified user
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

                // Check if this is the current user's followers page to show remove button
                const isOwnFollowersPage = userId == accountNumber;
                
                followerPanel.innerHTML = `
                    <img class="pfp homeHover clickable-profile" src="${user.pfp}" alt="Profile Picture" data-account-number="${user.accountNumber}"/>
                    <h1 class="clickable-profile" data-account-number="${user.accountNumber}">@${user.username}</h1>
                    ${isOwnFollowersPage ? `<button class="removeFollowerButton" data-account-number="${user.accountNumber}">Remove Follower</button>` : ''}
                `;
                homePanel.appendChild(followerPanel);
            });

            // Add event listeners for clickable profiles
            document.querySelectorAll(".clickable-profile").forEach(element => {
                element.addEventListener("click", function() {
                    const targetAccountNumber = this.getAttribute("data-account-number");
                    window.location.href = `/profile/${targetAccountNumber}`;
                });
            });

            // Add event listeners for remove follower buttons
            document.querySelectorAll(".removeFollowerButton").forEach(button => {
                button.addEventListener("click", async function() {
                    const followerAccountNumber = this.getAttribute("data-account-number");
                    
                    if (confirm("Are you sure you want to remove this follower? They will no longer see your posts in their feed.")) {
                        try {
                            const response = await apiRequest('/api/removeFollower', 'POST', { 
                                followerAccountNumber: followerAccountNumber 
                            });
                            
                            if (response.success) {
                                this.parentElement.remove(); // Remove the panel from the DOM
                                console.log('Follower removed successfully');
                            } else {
                                alert(response.message || 'Failed to remove follower. Please try again.');
                            }
                        } catch (error) {
                            console.error('Error removing follower:', error);
                            alert('Something went wrong. Please try again later.');
                        }
                    }
                });
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

    // Fetch followers and user info when the page loads
    fetchAndRenderFollowers();
    fetchUserInfo();
});