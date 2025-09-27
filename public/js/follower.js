import { apiRequest } from './utils/apiRequest.js';
import { initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';
import { getVerifiedUsernameHTML } from './utils/verifiedBadge.js';

function showDeleteConfirmation(title, message, onConfirm) {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--card-bg-solid, #1a1a1a);
        border: 1px solid var(--border-color, #333);
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: var(--text-primary, white);
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 1.25rem;
        font-weight: 600;
    `;

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        margin: 0 0 24px 0;
        color: var(--text-secondary, #b3b3b3);
        line-height: 1.5;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        padding: 12px 24px;
        background: var(--secondary-bg, #2a2a2a);
        color: var(--text-primary, white);
        border: 1px solid var(--border-color, #333);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    `;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.cssText = `
        padding: 12px 24px;
        background: var(--error-red, #f4212e);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    `;

    // Add hover effects
    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.background = 'var(--hover-bg, #3a3a3a)';
    });
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.background = 'var(--secondary-bg, #2a2a2a)';
    });

    removeButton.addEventListener('mouseenter', () => {
        removeButton.style.background = '#d31e2a';
    });
    removeButton.addEventListener('mouseleave', () => {
        removeButton.style.background = 'var(--error-red, #f4212e)';
    });

    // Event listeners
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    removeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
        onConfirm();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Assemble modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(removeButton);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(messageElement);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    // Add to page
    document.body.appendChild(modal);

    // Add fade-in animation
    modal.animate([
        { opacity: 0 },
        { opacity: 1 }
    ], {
        duration: 200,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("homePanel");
    let accountNumber;

    async function fetchUserInfo() {
        try {
            const user = await initializeAuth();
            accountNumber = user.accountNumber;
            initializeGlobalButtons(accountNumber); // Initialize global buttons
        } catch (error) {
            console.error("Error fetching user info:", error);
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
                const usernameHTML = getVerifiedUsernameHTML(user.username, user.verified);
                
                followerPanel.innerHTML = `
                    <img class="pfp homeHover clickable-profile" src="${user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'}" alt="Profile Picture" data-account-number="${user.accountNumber}"/>
                    <h1 class="clickable-profile" data-account-number="${user.accountNumber}">${usernameHTML}</h1>
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
                    const buttonElement = this;
                    
                    showDeleteConfirmation(
                        'Remove Follower',
                        'Are you sure you want to remove this follower? They will no longer see your posts in their feed and will be unfollowed.',
                        async () => {
                            try {
                                const response = await apiRequest('/api/removeFollower', 'POST', { 
                                    followerAccountNumber: followerAccountNumber 
                                });
                                
                                if (response.success) {
                                    // Add smooth removal animation
                                    buttonElement.parentElement.style.transform = 'scale(0.95)';
                                    buttonElement.parentElement.style.opacity = '0';
                                    buttonElement.parentElement.style.transition = 'all 0.3s ease';
                                    setTimeout(() => buttonElement.parentElement.remove(), 300);
                                    console.log('Follower removed successfully');
                                } else {
                                    alert(response.message || 'Failed to remove follower. Please try again.');
                                }
                            } catch (error) {
                                console.error('Error removing follower:', error);
                                alert('Something went wrong. Please try again later.');
                            }
                        }
                    );
                });
            });
           
        } catch (error) {
            console.error('Error fetching followers data:', error);
        }
    }

    // Admin verification is now handled globally in renderBar.js

    // Fetch followers and user info when the page loads
    fetchAndRenderFollowers();
    fetchUserInfo();
});