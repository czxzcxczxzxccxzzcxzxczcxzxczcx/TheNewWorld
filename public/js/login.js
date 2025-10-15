import { apiRequest } from './utils/apiRequest.js';

function showAlreadyLoggedInPopup() {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
    `;

    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: var(--bg-primary, #1a1a1a);
        border: 1px solid var(--border-color, #333);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: popupSlideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    let style = document.getElementById('alreadyLoggedInAnimationStyle');
    if (!style) {
        style = document.createElement('style');
        style.id = 'alreadyLoggedInAnimationStyle';
        style.textContent = `
            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Create content
    popup.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="width: 60px; height: 60px; background: var(--accent-blue, #3b82f6); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
        </div>
        <h2 style="color: var(--text-primary, white); margin: 0 0 0.5rem 0; font-size: 1.5rem;">Already Logged In</h2>
        <p style="color: var(--text-secondary, rgba(255,255,255,0.7)); margin: 0 0 1rem 0;">Redirecting to your home page...</p>
        <div style="width: 100%; height: 4px; background: var(--bg-secondary, #2a2a2a); border-radius: 2px; overflow: hidden;">
            <div id="progressBar" style="width: 0%; height: 100%; background: var(--accent-blue, #3b82f6); border-radius: 2px; transition: width 0.1s linear;"></div>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Animate progress bar and redirect
    const progressBar = popup.querySelector('#progressBar');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 20;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            window.location.href = '/home';
        }
    }, 50); // 50ms * 50 iterations = 2.5 seconds total
}

document.addEventListener("DOMContentLoaded", function () {
    const loginPanel = document.getElementById('loginPanel');
    const newAccPanel = document.getElementById('newAccPanel');
    const newAccButton = document.getElementById('newAccount');
    const loginButton = document.getElementById('login');
    const logo = document.getElementById('viewtest');

    if (logo) {
        logo.style.display = 'block';
    }

    if (loginPanel) {
        loginPanel.style.display = 'flex';
    }

    if (newAccPanel) {
        newAccPanel.style.display = 'none';
    }

    apiRequest('/api/getUserInfo', 'GET').then(data => {
        if (data.success) {
            if (loginPanel) {
                loginPanel.style.display = 'none';
            }
            if (newAccPanel) {
                newAccPanel.style.display = 'none';
            }
            showAlreadyLoggedInPopup();
        } else {
            if (loginPanel) {
                loginPanel.style.display = 'flex';
            }
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
        if (loginPanel) {
            loginPanel.style.display = 'flex';
        }
    });

    document.addEventListener("click", function (event) {
        if (event.target === loginButton) {
            loginPanel.style.display = 'flex';
            newAccPanel.style.display = 'none';
        } else if (event.target === newAccButton) {
            loginPanel.style.display = 'none';
            newAccPanel.style.display = 'flex';
        }
    });

    document.getElementById('newAccForm').onsubmit = async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("newAccUsername").value;
        const password = document.getElementById("newAccPassword").value;

        if (fullName && password) {
            console.log("Form submitted, creating account...");

            try {
                const data = await apiRequest('/api/newAccount', 'POST', { fullName, password });
                console.log("Response from server:", data);

                if (data.success) {
                    console.log("Account created successfully");
                    window.location.href = '/home';
                } else {
                    alert("Error creating account: " + (data.firstError || "Unknown error"));
                }
            } catch (error) {
                console.error("Error during account creation:", error);
                alert("There was an error processing your request. Please try again later.");
            }
        } else {
            alert("Please fill in all fields.");
        }
    };


    document.getElementById('loginForm').onsubmit = async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const status =  document.getElementById("loginStatus")

        if (fullName && password) {
            try {
                const data = await apiRequest('/api/login', 'POST', { fullName, password });
                if (data.success) {
                    window.location.href = '/home';
                } else {
                    alert("Invalid username or password");
                }
            } catch (error) {
               alert("There was an error processing your request. Please try again later.");
            }
        } else {
            alert("Please fill in all fields.");
        }
    };
});