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
        userElement.addEventListener('click', () => {
            openDirectMessage(user.accountNumber); // Function to handle opening a DM
        });

        container.appendChild(userElement);
    });

    if (opendmData.length === 0) {
        const noDMElement = createElementWithClass('p', 'noDMMessage');
        noDMElement.textContent = 'No open DMs available.';
        container.appendChild(noDMElement);
    }
}

function createElementWithClass(tag, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

function openDirectMessage(accountNumber) {


    const user = getUserData(accountNumber); 

    let dmBar = document.getElementById('dmBar');
    if (!dmBar) {
        dmBar = createElementWithClass('div', 'dmBar');
        dmBar.id = 'dmBar';
        document.body.insertBefore(dmBar, document.body.firstChild); // Insert at the top of the body
    }

    dmBar.innerHTML = ''; // Clear existing content

    const userImage = createElementWithClass('img', 'dmBarImage');
    const userName = createElementWithClass('h2', 'dmBarName');

    userImage.src = user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Default placeholder image
    userName.textContent = user.username || 'Anonymous';

    dmBar.appendChild(userImage);
    dmBar.appendChild(userName);

    // Style the DM bar
    dmBar.style.position = 'fixed';
    dmBar.style.top = '50px'; // Adjust based on the height of your nav bar
    dmBar.style.left = '0';
    dmBar.style.width = '100%';
    dmBar.style.backgroundColor = '#f1f1f1';
    dmBar.style.display = 'flex';
    dmBar.style.alignItems = 'center';
    dmBar.style.padding = '10px';
    dmBar.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    dmBar.style.zIndex = '1000';
}

function getUserData(accountNumber) {
    // Mock function to simulate fetching user data
    // Replace this with actual API call or logic to fetch user details
    return {
        username: 'Test User',
        pfp: 'https://cdn.pfps.gg/pfps/9463-little-cat.png',
    };
}
