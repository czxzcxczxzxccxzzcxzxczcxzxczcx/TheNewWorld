import { apiRequest } from './utils/apiRequest.js';
import { renderOpenDMUsers } from './utils/renderMessage.js';

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

                // Fetch and render open DMs
                fetchAndRenderOpenDMs(accountNumber);
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
                renderOpenDMUsersWithNavigation(data.openDMs, 'homePanel'); // Render open DMs with navigation
            } else {
                console.error('Failed to fetch open DMs:', data.message);
            }
        } catch (error) {
            console.error('Error fetching open DMs:', error);
        }
    }

    function renderOpenDMUsersWithNavigation(opendmData, containerElementId) {
        const container = document.getElementById(containerElementId);
        if (!container) {
            console.error(`Container with ID "${containerElementId}" not found.`);
            return;
        }

        container.innerHTML = ''; // Clear the container before rendering

        opendmData.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'dmUser';
            userElement.style.cursor = 'pointer'; // Add pointer cursor for clickable effect

            const userImage = document.createElement('img');
            userImage.className = 'dmUserImage';
            userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Default placeholder image

            const userName = document.createElement('p');
            userName.className = 'dmUserName';
            userName.textContent = user.username || 'Anonymous';

            userElement.appendChild(userImage);
            userElement.appendChild(userName);

            // Add click event to navigate to the DM page
            userElement.addEventListener('click', () => {
                window.location.href = `/dm/${user.accountNumber}`;
            });

            container.appendChild(userElement);
        });

        if (opendmData.length === 0) {
            const noDMElement = document.createElement('p');
            noDMElement.className = 'noDMMessage';
            noDMElement.textContent = 'No open DMs available.';
            container.appendChild(noDMElement);
        }
    }

    // async function fetchAndRenderIncomingDMs() {
    //     try {
    //         const data = await apiRequest('/api/getIncomingDMs', 'POST');
    //         if (data.success) {
    //             renderIncomingDMUsers(data.users || [], 'homePanel'); // Render incoming DM users
    //         } else {
    //             console.error('Failed to fetch incoming DMs:', data.message);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching incoming DMs:', error);
    //     }
    // }

    function renderIncomingDMUsers(users, containerElementId) {
        const container = document.getElementById(containerElementId);
        if (!container) {
            console.error(`Container with ID "${containerElementId}" not found.`);
            return;
        }

        container.innerHTML = ''; // Clear the container before rendering

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'dmUser';
            userElement.style.cursor = 'pointer'; // Add pointer cursor for clickable effect

            const userImage = document.createElement('img');
            userImage.className = 'dmUserImage';
            userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Default placeholder image

            const userName = document.createElement('p');
            userName.className = 'dmUserName';
            userName.textContent = user.username || 'Anonymous';

            userElement.appendChild(userImage);
            userElement.appendChild(userName);

            // Add click event to navigate to the DM page
            userElement.addEventListener('click', () => {
                window.location.href = `/dm/${user.accountNumber}`;
            });

            container.appendChild(userElement);
        });

        if (users.length === 0) {
            const noUserElement = document.createElement('p');
            noUserElement.className = 'noDMMessage';
            noUserElement.textContent = 'No users with open DMs.';
            container.appendChild(noUserElement);
        }
    }

    // Fetch and render incoming DMs
    // fetchAndRenderIncomingDMs();

    document.getElementById("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) { window.location.href = '/'; }
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Redirect to profile page
    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) { window.location.href = `/profile/${accountNumber}`; }
    });

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