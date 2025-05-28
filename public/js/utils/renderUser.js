import { createElementWithClass } from './createElement.js';

export function renderUsers(users, container) {
    users.forEach(user => {
        const userElement = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');

        userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
        userName.textContent = user.username || 'Anonymous';
        userElement.appendChild(userImage);
        userElement.appendChild(userName);

        userElement.addEventListener('click', () => {window.location.href = `/profile/${user.accountNumber}`; });

        container.appendChild(userElement);
    });
}