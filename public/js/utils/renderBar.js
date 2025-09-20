import { apiRequest } from './apiRequest.js';

export function renderBar() {
    console.log("DO NOT SEND ANYONE INFORMATION FROM THIS CONSOLE OR UI FOR IT MAY POSE A GREAT SECURITY RISK TOWARD YOU")

    const barHTML = `
        <div class="bar">
            <ul>
                <div class="logo-section">
                    <img class="logoImg" src="/src/TNW.png" alt="Logo" />
                    <h1 class="logo" id="checkPost">The New World</h1>
                </div>
                <div class="buttons">
                    <a href="/home">
                        <h1>Home</h1>
                    </a>
                    <a id="createPostButton">
                        <h1>Create Post</h1>
                    </a>
                    <a href="/messages">
                        <h1>Messages</h1>
                    </a>
                    <a href="" id="profileButton">
                        <h1>My Profile</h1>
                    </a>
                    <a href="/settings" id="settingsButton">
                        <h1>Settings</h1>
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

    // Add scroll event handling for the navbar
//     let lastScrollTop = 0;
    
//     document.getElementById('homePanel').addEventListener('scroll', function() {
//         const bar = document.querySelector('.bar');
//         if (!bar) return;
        
//         // Get the homePanel element to check if we're on a page with this panel
//         const homePanel = document.getElementById('homePanel');
//         if (!homePanel) return;

//         const scrollTop = homePanel.scrollTop || document.documentElement.scrollTop;

//         if (scrollTop > lastScrollTop) {
//             // Scrolling down
//             bar.style.transform = 'translateY(-100%)';
            
//         } else {
//             // Scrolling up
//             bar.style.transform = 'translateY(0)';
//         }
        
//         lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
//     }, { passive: true }); // Passive for better performance
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