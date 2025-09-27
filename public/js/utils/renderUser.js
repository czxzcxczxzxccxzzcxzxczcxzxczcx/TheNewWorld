import { createElementWithClass } from './createElement.js';
import { setVerifiedUsername } from './verifiedBadge.js';

export function renderUsers(users, container) {
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
        const emptyState = createElementWithClass('p', 'no-users-message');
        emptyState.textContent = 'No users found.';
        container.appendChild(emptyState);
        return;
    }

    users.forEach(user => {
        const userElement = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');

        userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
        
        // Create username with verified badge if applicable
    const usernameText = user.username || 'Anonymous';
    setVerifiedUsername(userName, usernameText, !!user.verified, { includeAt: false });
        
        userElement.appendChild(userImage);
        userElement.appendChild(userName);

        userElement.addEventListener('click', () => {
            window.location.href = `/profile/${user.accountNumber}`; 

}
        );

        container.appendChild(userElement);
    });
}