import { apiRequest } from './utils/apiRequest.js';
import { renderOpenDMUsers, renderUserSearchResults, setupUserSearchOnEnter } from './utils/renderMessage.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons, initializeTheme } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';
import { gebid } from './utils/gebid.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");

    let accountNumber;

    try {
        const user = await initializeAuth();
        accountNumber = user.accountNumber;

        fetchAndRenderOpenDMs(accountNumber);
        initializeCreatePost(user.accountNumber);
        initializeGlobalButtons(accountNumber);
        initializeTheme(user); // Initialize theme from user data
    } catch (error) {
        console.error("Error initializing auth:", error);
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

    // Admin verification is now handled globally in renderBar.js

    const searchInput = document.getElementById('userSearchInput');
    // Use the utility function for enter key search
    setupUserSearchOnEnter('searchInput', 'messagePanel');

});