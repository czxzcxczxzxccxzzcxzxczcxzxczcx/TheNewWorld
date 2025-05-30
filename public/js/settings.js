import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    apiRequest('/api/getUserInfo', 'GET')
        .then(data => {
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });

    // Modal creation
    function showSettingsModal(settingType, labelText) {
        // Remove existing modal if present
        const existing = document.getElementById('settingsModal');
        if (existing) existing.remove();

        const modalBg = document.createElement('div');
        modalBg.id = 'settingsModal';
        modalBg.style.position = 'fixed';
        modalBg.style.top = 0;
        modalBg.style.left = 0;
        modalBg.style.width = '100vw';
        modalBg.style.height = '100vh';
        modalBg.style.background = 'rgba(0,0,0,0.5)';
        modalBg.style.display = 'flex';
        modalBg.style.alignItems = 'center';
        modalBg.style.justifyContent = 'center';
        modalBg.style.zIndex = 2000;

        const modal = document.createElement('div');
        modal.style.background = '#181821';
        modal.style.padding = '32px 24px';
        modal.style.borderRadius = '10px';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.minWidth = '320px';
        modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';

        const label = document.createElement('label');
        label.textContent = `Change ${labelText}`;
        label.style.color = 'white';
        label.style.fontSize = '20px';
        label.style.marginBottom = '16px';
        modal.appendChild(label);

        const input = document.createElement('input');
        input.type = (settingType === 'password') ? 'password' : 'text';
        input.style.marginBottom = '16px';
        input.style.width = '90%';
        input.style.fontSize = '18px';
        input.style.padding = '8px';
        input.style.borderRadius = '5px';
        input.style.border = '1px solid #ccc';
        modal.appendChild(input);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.background = '#007bff';
        saveBtn.style.color = 'white';
        saveBtn.style.fontSize = '18px';
        saveBtn.style.padding = '8px 24px';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '5px';
        saveBtn.style.cursor = 'pointer';
        modal.appendChild(saveBtn);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cancel';
        closeBtn.style.marginTop = '10px';
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#aaa';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        modal.appendChild(closeBtn);

        closeBtn.onclick = () => modalBg.remove();
        modalBg.onclick = (e) => { if (e.target === modalBg) modalBg.remove(); };

        saveBtn.onclick = async () => {
            // TODO: Add API call to update the setting
            // Example: await apiRequest(`/api/change${settingType}`, 'POST', { value: input.value });
            alert(`Changed ${labelText} to: ` + input.value);
            modalBg.remove();
        };

        modalBg.appendChild(modal);
        document.body.appendChild(modalBg);
    }

    document.getElementById('changeUsername').onclick = () => showSettingsModal('username', 'Username');
    document.getElementById('changePFP').onclick = () => showSettingsModal('pfp', 'Profile Picture');
    document.getElementById('changePassword').onclick = () => showSettingsModal('password', 'Password');
});