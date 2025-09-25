import { apiRequest } from './utils/apiRequest.js';
import { renderOpenDMUsers, renderUserSearchResults, setupUserSearchOnEnter } from './utils/renderMessage.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons, initializeTheme } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    var gebid = document.getElementById.bind(document);

    let accountNumber;

    const data = await apiRequest('/api/getUserInfo', 'GET');
    if (data.success) {
        const user = data.user;
        accountNumber = user.accountNumber;

        fetchAndRenderOpenDMs(accountNumber);
        initializeCreatePost(user.accountNumber);
        initializeGlobalButtons(accountNumber);
        initializeTheme(user); // Initialize theme from user data
    } else {
        window.location.href = '/';
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

    const searchInput = document.getElementById('userSearchInput');
    // Use the utility function for enter key search
    setupUserSearchOnEnter('searchInput', 'messagePanel');

});