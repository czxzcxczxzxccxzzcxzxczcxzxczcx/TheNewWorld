import { createElementWithClass } from './createElement.js';
import { setVerifiedUsername } from './verifiedBadge.js';

export function renderOpenDMUsers(opendmData, containerElementId) {
    const container = document.getElementById(containerElementId);
    if (!container) {
        console.error(`Container with ID "${containerElementId}" not found.`);
        return;
    }

    container.innerHTML = ''; // Clear the container before rendering

    // Sort by latestMessageTime descending
    opendmData.sort((a, b) => {
        const aTime = a.latestMessageTime ? new Date(a.latestMessageTime).getTime() : 0;
        const bTime = b.latestMessageTime ? new Date(b.latestMessageTime).getTime() : 0;
        return bTime - aTime;
    });

    opendmData.forEach(user => {


        const userElement = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');
        // Create the X (close) button
        const closeButton = createElementWithClass('button', 'closeDMButton');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = 'auto';

    userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    setVerifiedUsername(userName, user.username || 'Anonymous', !!user.verified, { includeAt: false });

        userElement.appendChild(userImage);
        userElement.appendChild(userName);
        userElement.appendChild(closeButton);

        // Add click event to open the DM with the user
        userElement.addEventListener('click', (e) => {
            // Prevent DM open if X was clicked
            if (e.target === closeButton) return;
            window.location.href = `/dm/${user.accountNumber}`;
        });

        // Add click event to close the DM
        closeButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const response = await import('./apiRequest.js').then(mod => mod.apiRequest(
                    '/api/removeOpenDM',
                    'POST',
                    { recipientAccountNumber: user.accountNumber }
                ));
                if (response.success) {
                    userElement.remove();
                } else {
                    alert('Failed to remove open DM.');
                }
            } catch (err) {
                alert('Error removing open DM.');
            }
        });

        container.appendChild(userElement);
    });

    if (opendmData.length === 0) {
        const noDMElement = createElementWithClass('p', 'noDMMessage');
        noDMElement.textContent = 'No open DMs available.';
        container.appendChild(noDMElement);
    }
}

export function renderUserSearchResults(users, containerElementId) {
    const container = document.getElementById('homePanel');
    if (!container) return;

    container.innerHTML = '';
    if (!users || users.length === 0) {
        const noUser = createElementWithClass('p', 'noDMMessage');
        noUser.textContent = 'No users found.';
        container.appendChild(noUser);
        return;
    }
    users.forEach(user => {
        const userDiv = createElementWithClass('div', 'dmUser');
        const userImage = createElementWithClass('img', 'dmUserImage');
        const userName = createElementWithClass('h2', 'dmUserName');
        const openButton = createElementWithClass('button', 'openDMButton');
    userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    setVerifiedUsername(userName, user.username || 'Anonymous', !!user.verified, { includeAt: false });
        openButton.textContent = 'Open DM';
        openButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const response = await import('./apiRequest.js').then(mod => mod.apiRequest(
                    '/api/addOpenDM',
                    'POST',
                    { recipientAccountNumber: user.accountNumber }
                ));
                if (response.success) {
                    window.location.href = `/dm/${user.accountNumber}`;
                } else {
                    alert('Failed to open DM.');
                }
            } catch (err) {
                alert('Error opening DM.');
            }
        });
        userDiv.appendChild(userImage);
        userDiv.appendChild(userName);
        userDiv.appendChild(openButton);
        container.appendChild(userDiv);
    });
}

// Utility to attach enter key search to an input for user search
export function setupUserSearchOnEnter(inputId, containerElementId) {
    const input = document.getElementById(inputId);

    if (!input) return;
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            const container = document.getElementById(containerElementId);
            if (container) container.innerHTML = '';
            if (!query) {
                // If search is empty, show open DMs
                try {
                    const res = await import('./apiRequest.js').then(mod => mod.apiRequest(
                        '/api/getOpenDMs',
                        'POST',
                        {}
                    ));
                    if (res.success && Array.isArray(res.openDMs)) {
                        renderOpenDMUsers(res.openDMs, 'homePanel');
                    } else {
                        renderOpenDMUsers([], containerElementId);
                    }
                } catch (err) {
                    renderOpenDMUsers([], containerElementId);
                }
                return;
            }
            try {
                const res = await import('./apiRequest.js').then(mod => mod.apiRequest(
                    '/api/searchUsers',
                    'POST',
                    { data: query }
                ));
                if (res.success && Array.isArray(res.users)) {
                    renderUserSearchResults(res.users, containerElementId);

                } else {
                    renderUserSearchResults([], containerElementId);
                }
            } catch (err) {
                renderUserSearchResults([], containerElementId);
            }
        }
    });
}