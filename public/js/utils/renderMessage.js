import { createElementWithClass } from './createElement.js';

export function renderOpenDMUsers(opendmData, containerElementId) {
    const container = document.getElementById(containerElementId);
    if (!container) {
        console.error(`Container with ID "${containerElementId}" not found.`);
        return;
    }

    container.innerHTML = ''; // Clear the container before rendering

    opendmData.forEach(user => {
        const userElement = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');

        userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Default placeholder image
        userName.textContent = user.username || 'Anonymous';

        userElement.appendChild(userImage);
        userElement.appendChild(userName);

        // Add click event to open the DM with the user
        userElement.addEventListener('click', () => {window.location.href = `/dm/${user.accountNumber}`;});

        container.appendChild(userElement);
    });

    if (opendmData.length === 0) {
        const noDMElement = createElementWithClass('p', 'noDMMessage');
        noDMElement.textContent = 'No open DMs available.';
        container.appendChild(noDMElement);
    }
}