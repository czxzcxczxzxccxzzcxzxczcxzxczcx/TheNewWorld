import { apiRequest } from './utils/apiRequest.js';

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    const profileAccountNumber = window.location.pathname.split('/')[2];
    let accountNumber;


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
                    <img class="pfp homeHover"  src="${user.pfp}" alt="Profile Picture"/>
                    <h1>@${user.username} </h1>
                    <button class="followingButton" data-account-number="${user.accountNumber}">Unfollow</button>
                `;
                } else {
                    followingPanel.innerHTML = `
                    <img class="pfp homeHover"  src="${user.pfp}" alt="Profile Picture"/>
                    <h1>@${user.username} (${user.accountNumber})</h1>
                `;
                }
                homePanel.appendChild(followingPanel);
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

    fetchAndRenderFollowing();
    fetchUserInfo()
});