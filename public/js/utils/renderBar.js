import { apiRequest } from './apiRequest.js';

export function renderBar() {
    console.log("DO NOT SEND ANYONE INFORMATION FROM THIS CONSOLE OR UI FOR IT MAY POSE A GREAT SECURITY RISK TOWARD YOU")

    const barHTML = `
        <div class="bar">
            <ul>
                <img class="logoImg" src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fvisenya.xyz%2F_next%2Fimage%3Furl%3D%252Ficon.png%26w%3D384%26q%3D65&f=1&nofb=1&ipt=e4d071ccd8d0fa8f57ec7d34e3c76775538fd8ab94aa2a8d045c47f13ed0069c" alt="Logo" />
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