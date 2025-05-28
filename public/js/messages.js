import { apiRequest } from './utils/apiRequest.js';
import { renderOpenDMUsers } from './utils/renderMessage.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    var gebid = document.getElementById.bind(document);

    let accountNumber;

    async function fetchUserInfo() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;

                fetchAndRenderOpenDMs(accountNumber);
                initializeCreatePost(user.accountNumber);
                initializeGlobalButtons(accountNumber);
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    async function fetchAndRenderOpenDMs(accountNumber) {
        try {
            const data = await apiRequest('/api/getOpenDMs', 'POST', { accountNumber });
            if (data.success) {
                renderOpenDMUsers(data.openDMs, 'homePanel'); // Render open DMs in the DM bar
            } else {
                console.error('Failed to fetch open DMs:', data.message);
            }
        } catch (error) {
            console.error('Error fetching open DMs:', error);
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

    fetchUserInfo();
});