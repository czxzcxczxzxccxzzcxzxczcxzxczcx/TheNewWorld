import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons, applyTheme, initializeTheme } from './utils/renderBar.js';

// Initialize navigation
renderBar();

class SettingsManager {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupEventListeners();
            this.updateUI();
            // Apply theme immediately after loading user data
            this.applyUserTheme();
        } catch (error) {
            console.error('Failed to initialize settings:', error);
            window.location.href = '/';
        }
    }

    async loadUserData() {
        const data = await apiRequest('/api/getUserInfo', 'GET');
        
        if (data.success) {
            this.user = data.user;
            initializeGlobalButtons(this.user.accountNumber);
        } else {
            throw new Error('Failed to load user data: ' + data.message);
        }
    }

    updateUI() {
        // Update current values in the UI
        document.getElementById('currentUsername').textContent = `@${this.user.username}`;
        document.getElementById('currentBio').textContent = this.user.bio || 'No bio set';
        document.getElementById('currentProfilePicture').src = this.user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    }

    applyUserTheme() {
        initializeTheme(this.user);
    }

    setupEventListeners() {
        // Profile picture change
        document.getElementById('changeProfilePicture').addEventListener('click', () => this.showProfilePictureModal());
        document.getElementById('profilePictureInput').addEventListener('change', (e) => this.handleProfilePictureUpload(e));
        document.querySelector('.profilePictureContainer').addEventListener('click', () => this.showProfilePictureModal());

        // Username change
        document.getElementById('changeUsername').addEventListener('click', () => this.showUsernameModal());

        // Bio change
        document.getElementById('changeBio').addEventListener('click', () => this.showBioModal());

        // Password change
        document.getElementById('changePassword').addEventListener('click', () => this.showPasswordModal());

        // Account deletion
        document.getElementById('deleteAccount').addEventListener('click', () => this.showDeleteAccountModal());

        // Theme management
        this.setupThemeSelector();
    }

    createModal(title, subtitle = '') {
        const modal = document.createElement('div');
        modal.className = 'modernModal';
        
        modal.innerHTML = `
            <div class="modalContent">
                <div class="modalHeader">
                    <h3>${title}</h3>
                    ${subtitle ? `<p>${subtitle}</p>` : ''}
                </div>
                <div class="modalBody"></div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        return modal;
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    showProfilePictureModal() {
        const modal = this.createModal('Change Profile Picture', 'Upload a new profile picture to personalize your account');
        const modalBody = modal.querySelector('.modalBody');

        modalBody.innerHTML = `
            <div class="modalForm">
                <div class="profilePicturePreview" style="text-align: center; margin-bottom: 1.5rem;">
                    <img id="previewImage" src="${this.user.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'}" 
                         style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                </div>
                <div class="modalActions">
                    <button class="modalButton secondary" id="cancelPfp">Cancel</button>
                    <button class="modalButton primary" id="uploadPfp">Choose Photo</button>
                </div>
            </div>
        `;

        modal.querySelector('#cancelPfp').addEventListener('click', () => this.closeModal(modal));
        modal.querySelector('#uploadPfp').addEventListener('click', () => {
            document.getElementById('profilePictureInput').click();
            this.closeModal(modal);
        });
    }

    async handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
            if (data.success) {
                await apiRequest('/api/updateSettings', 'POST', {
                    pfp: data.imageUrl,
                    username: this.user.username,
                    bio: this.user.bio
                });

                this.user.pfp = data.imageUrl;
                this.updateUI();
                this.showSuccessMessage('Profile picture updated successfully!');
            } else {
                this.showErrorMessage(data.message || 'Failed to upload image');
            }
        } catch (error) {
            this.showErrorMessage('Failed to upload profile picture');
        }
    }

    showUsernameModal() {
        const modal = this.createModal('Change Username', 'Choose a new username (3-20 characters, alphanumeric and underscores only)');
        const modalBody = modal.querySelector('.modalBody');

        modalBody.innerHTML = `
            <div class="modalForm">
                <div class="formGroup">
                    <label class="formLabel">New Username</label>
                    <input type="text" class="formInput" id="newUsername" placeholder="Enter new username" 
                           value="${this.user.username}" maxlength="20">
                    <div class="characterCount" id="usernameCount">3-20 characters</div>
                </div>
                <div class="formGroup">
                    <label class="formLabel">Confirm New Username</label>
                    <input type="text" class="formInput" id="confirmUsername" placeholder="Type the new username again" 
                           maxlength="20">
                    <div class="characterCount" id="confirmUsernameStatus">Usernames must match</div>
                </div>
                <div class="modalActions">
                    <button class="modalButton secondary" id="cancelUsername">Cancel</button>
                    <button class="modalButton primary" id="saveUsername" disabled>Save Changes</button>
                </div>
            </div>
        `;

        const newUsernameInput = modal.querySelector('#newUsername');
        const confirmUsernameInput = modal.querySelector('#confirmUsername');
        const counter = modal.querySelector('#usernameCount');
        const confirmStatus = modal.querySelector('#confirmUsernameStatus');
        const saveBtn = modal.querySelector('#saveUsername');

        const validateInputs = () => {
            const newUsername = newUsernameInput.value;
            const confirmUsername = confirmUsernameInput.value;
            const length = newUsername.length;

            // Validate new username format
            let isNewUsernameValid = true;
            if (length < 3 || length > 20) {
                counter.textContent = `${length}/20 characters`;
                counter.className = 'characterCount error';
                isNewUsernameValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
                counter.textContent = 'Only letters, numbers, and underscores allowed';
                counter.className = 'characterCount error';
                isNewUsernameValid = false;
            } else {
                counter.textContent = `${length}/20 characters`;
                counter.className = 'characterCount';
            }

            // Validate username confirmation
            let isConfirmationValid = false;
            if (confirmUsername.length === 0) {
                confirmStatus.textContent = 'Please confirm your new username';
                confirmStatus.className = 'characterCount';
            } else if (newUsername !== confirmUsername) {
                confirmStatus.textContent = 'Usernames do not match';
                confirmStatus.className = 'characterCount error';
            } else {
                confirmStatus.textContent = 'Usernames match ✓';
                confirmStatus.className = 'characterCount';
                confirmStatus.style.color = 'var(--success-green)';
                isConfirmationValid = true;
            }

            // Enable save button only if both are valid
            saveBtn.disabled = !(isNewUsernameValid && isConfirmationValid);
        };

        newUsernameInput.addEventListener('input', validateInputs);
        confirmUsernameInput.addEventListener('input', validateInputs);

        // Initial validation
        validateInputs();

        modal.querySelector('#cancelUsername').addEventListener('click', () => this.closeModal(modal));
        saveBtn.addEventListener('click', () => this.updateUsername(modal, newUsernameInput.value));
    }

    async updateUsername(modal, newUsername) {
        try {
            const response = await apiRequest('/api/changeUsername', 'POST', { newUsername });
            if (response.success) {
                this.user.username = newUsername;
                this.updateUI();
                this.closeModal(modal);
                this.showSuccessMessage('Username updated successfully!');
            } else {
                this.showErrorMessage(response.message || 'Failed to update username');
            }
        } catch (error) {
            this.showErrorMessage('Failed to update username');
        }
    }

    showBioModal() {
        const modal = this.createModal('Edit Bio', 'Tell others about yourself (max 160 characters)');
        const modalBody = modal.querySelector('.modalBody');

        modalBody.innerHTML = `
            <div class="modalForm">
                <div class="formGroup">
                    <label class="formLabel">Bio</label>
                    <textarea class="formTextarea" id="newBio" placeholder="Write something about yourself..." 
                              maxlength="160">${this.user.bio || ''}</textarea>
                    <div class="characterCount" id="bioCount">0/160 characters</div>
                </div>
                <div class="modalActions">
                    <button class="modalButton secondary" id="cancelBio">Cancel</button>
                    <button class="modalButton primary" id="saveBio">Save Changes</button>
                </div>
            </div>
        `;

        const textarea = modal.querySelector('#newBio');
        const counter = modal.querySelector('#bioCount');

        const updateCounter = () => {
            const length = textarea.value.length;
            counter.textContent = `${length}/160 characters`;
            
            if (length > 140) {
                counter.className = 'characterCount warning';
            } else if (length > 160) {
                counter.className = 'characterCount error';
            } else {
                counter.className = 'characterCount';
            }
        };

        textarea.addEventListener('input', updateCounter);
        updateCounter();

        modal.querySelector('#cancelBio').addEventListener('click', () => this.closeModal(modal));
        modal.querySelector('#saveBio').addEventListener('click', () => this.updateBio(modal, textarea.value));
    }

    async updateBio(modal, newBio) {
        try {
            const response = await apiRequest('/api/updateSettings', 'POST', {
                bio: newBio,
                username: this.user.username,
                pfp: this.user.pfp
            });

            if (response.success) {
                this.user.bio = newBio;
                this.updateUI();
                this.closeModal(modal);
                this.showSuccessMessage('Bio updated successfully!');
            } else {
                this.showErrorMessage('Failed to update bio');
            }
        } catch (error) {
            this.showErrorMessage('Failed to update bio');
        }
    }

    showPasswordModal() {
        const modal = this.createModal('Change Password', 'Enter your current password and choose a new one (min 6 characters)');
        const modalBody = modal.querySelector('.modalBody');

        modalBody.innerHTML = `
            <div class="modalForm">
                <div class="formGroup">
                    <label class="formLabel">Current Password</label>
                    <input type="password" class="formInput" id="currentPassword" placeholder="Enter current password">
                </div>
                <div class="formGroup">
                    <label class="formLabel">New Password</label>
                    <input type="password" class="formInput" id="newPassword" placeholder="Enter new password" minlength="6">
                </div>
                <div class="formGroup">
                    <label class="formLabel">Confirm New Password</label>
                    <input type="password" class="formInput" id="confirmPassword" placeholder="Confirm new password" minlength="6">
                </div>
                <div class="modalActions">
                    <button class="modalButton secondary" id="cancelPassword">Cancel</button>
                    <button class="modalButton primary" id="savePassword">Change Password</button>
                </div>
            </div>
        `;

        const currentPassword = modal.querySelector('#currentPassword');
        const newPassword = modal.querySelector('#newPassword');
        const confirmPassword = modal.querySelector('#confirmPassword');
        const saveBtn = modal.querySelector('#savePassword');

        const validatePasswords = () => {
            const isValid = currentPassword.value.length > 0 && 
                           newPassword.value.length >= 6 && 
                           newPassword.value === confirmPassword.value;
            saveBtn.disabled = !isValid;
        };

        [currentPassword, newPassword, confirmPassword].forEach(input => {
            input.addEventListener('input', validatePasswords);
        });

        modal.querySelector('#cancelPassword').addEventListener('click', () => this.closeModal(modal));
        saveBtn.addEventListener('click', () => this.updatePassword(modal, currentPassword.value, newPassword.value));
    }

    async updatePassword(modal, currentPassword, newPassword) {
        try {
            const response = await apiRequest('/api/changePasswordSecure', 'POST', {
                currentPassword,
                newPassword
            });

            if (response.success) {
                this.closeModal(modal);
                this.showSuccessMessage('Password updated successfully!');
            } else {
                this.showErrorMessage(response.message || 'Failed to update password');
            }
        } catch (error) {
            this.showErrorMessage('Failed to update password');
        }
    }

    showDeleteAccountModal() {
        const modal = this.createModal('Delete Account', 'This action cannot be undone. All your data will be permanently deleted.');
        modal.classList.add('confirmationModal');
        const modalBody = modal.querySelector('.modalBody');

        modalBody.innerHTML = `
            <div class="modalForm">
                <div class="formGroup">
                    <label class="formLabel">Type your username to confirm: <strong>${this.user.username}</strong></label>
                    <input type="text" class="formInput confirmationInput" id="confirmUsername" 
                           placeholder="Enter your username to confirm deletion">
                </div>
                <div class="modalActions">
                    <button class="modalButton secondary" id="cancelDelete">Cancel</button>
                    <button class="modalButton danger" id="confirmDelete" disabled>Delete Account</button>
                </div>
            </div>
        `;

        const confirmInput = modal.querySelector('#confirmUsername');
        const deleteBtn = modal.querySelector('#confirmDelete');

        confirmInput.addEventListener('input', () => {
            deleteBtn.disabled = confirmInput.value !== this.user.username;
        });

        modal.querySelector('#cancelDelete').addEventListener('click', () => this.closeModal(modal));
        deleteBtn.addEventListener('click', () => this.deleteAccount(modal));
    }

    async deleteAccount(modal) {
        try {
            const response = await apiRequest('/api/deleteAccount', 'POST', {
                confirmUsername: this.user.username
            });

            if (response.success) {
                this.closeModal(modal);
                this.showSuccessMessage('Account deleted successfully. Redirecting...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showErrorMessage(response.message || 'Failed to delete account');
            }
        } catch (error) {
            this.showErrorMessage('Failed to delete account');
        }
    }

    // Theme Management Methods
    setupThemeSelector() {
        const themeOptions = document.querySelectorAll('.themeOption');
        
        // Set initial active state based on user's theme
        const currentTheme = this.user.theme || 'auto';
        themeOptions.forEach(option => {
            const theme = option.dataset.theme;
            if (theme === currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Apply current theme
        applyTheme(currentTheme);

        // Add click handlers
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = option.dataset.theme;
                this.selectTheme(theme);
            });
        });
    }

    async selectTheme(theme) {
        try {
            // Update UI immediately
            this.updateActiveTheme(theme);
            applyTheme(theme);

            // Save to server
            const response = await apiRequest('/api/theme', 'POST', { theme });
            
            if (response.success) {
                this.user.theme = theme;
                localStorage.setItem('theme', theme);
                this.showToast(`Switched to ${theme === 'auto' ? 'Auto Mode (follows system preference)' : theme.charAt(0).toUpperCase() + theme.slice(1) + ' Mode'}`, 'success');
            } else {
                throw new Error('Failed to save theme');
            }
        } catch (error) {
            console.error('Failed to change theme:', error);
            // Fallback to localStorage
            localStorage.setItem('theme', theme);
            this.user.theme = theme;
            this.showToast(`Theme changed to ${theme} (saved locally)`, 'info');
        }
    }

    updateActiveTheme(selectedTheme) {
        const themeOptions = document.querySelectorAll('.themeOption');
        themeOptions.forEach(option => {
            const theme = option.dataset.theme;
            if (theme === selectedTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--error-red)' : 'var(--accent-blue)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            font-weight: 500;
            z-index: 3000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--shadow-lg);
        `;
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});