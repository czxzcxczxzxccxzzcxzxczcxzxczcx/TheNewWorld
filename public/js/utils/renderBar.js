import { apiRequest } from './apiRequest.js';

export function renderBar() {
    const barHTML = `
        <div class="bar">
            <ul>
                <h1 class="logo" id="checkPost">The New World</h1>
                <div class="buttons">
                    <a href="/home">
                        <h1>Home</h1>
                    </a>
                    <a href="/createPost">
                        <h1>Create Post</h1>
                    </a>
                    <a href="/messages">
                        <h1>Messages</h1>
                    </a>
                    <a href="" id="profileButton">
                        <h1>My Profile</h1>
                    </a>
                    <a id="logoutButton" href="">
                        <h1>Logout</h1>
                    </a>
                    <a id="adminPanelButton" href="/admin">
                        <h1>Admin</h1>
                    </a>
                </div>
            </ul>
        </div>
    `;

    const body = document.body;
    const barContainer = document.createElement('div');
    barContainer.innerHTML = barHTML;
    body.insertBefore(barContainer, body.firstChild);
}

export function initializeGlobalButtons(accountNumber) {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function (event) {
            event.preventDefault();
            try {
                const data = await apiRequest('/api/logout', 'POST');
                if (data.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    const profileButton = document.getElementById("profileButton");
    if (profileButton) {
        profileButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (accountNumber) {
                window.location.href = `/profile/${accountNumber}`;
            }
        });
    }
}