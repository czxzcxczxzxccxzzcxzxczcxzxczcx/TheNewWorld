import { createElementWithClass } from './createElement.js';

export function renderUsers(users, container) {
    users.forEach(user => {
        const userElement = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');

        userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
        
        // Create username with verified badge if applicable
        const usernameText = user.username || 'Anonymous';
        const verifiedBadge = user.verified ? ' ✓' : '';
        userName.innerHTML = `${usernameText}${verifiedBadge ? `<span class="verified-badge">${verifiedBadge}</span>` : ''}`;
        
        userElement.appendChild(userImage);
        userElement.appendChild(userName);

        userElement.addEventListener('click', () => {
            window.location.href = `/profile/${user.accountNumber}`; 

}
        );

        container.appendChild(userElement);
    });
}