import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';

// Don't render the navigation bar on admin panel
// renderBar();

class AdminPanel {
    constructor() {
        this.currentTab = 'users';
        this.currentData = [];
        this.editingItem = null;
        this.userRole = 'admin';
        this.init();
    }

    async init() {
        await this.loadUserInfo();
        this.setupEventListeners();
        this.showTab('users');
    }

    async loadUserInfo() {
        try {
            const user = await initializeAuth();
            initializeGlobalButtons(user.accountNumber);
            
            // Get user profile to check admin role
            const profile = await apiRequest(`/api/get/profile/${user.accountNumber}`, 'GET');
                this.userRole = profile.adminRole || 'admin';
                
                document.getElementById('adminUserDisplay').textContent = `${user.username} (#${user.accountNumber})`;
                const roleBadge = document.getElementById('adminRoleBadge');
                roleBadge.textContent = this.userRole === 'headAdmin' ? 'Head Admin' : 'Admin';
                roleBadge.className = `roleBadge ${this.userRole}`;
                
                // Show permissions tab only for head admin
                if (this.userRole === 'headAdmin') {
                    document.getElementById('permissionsTab').style.display = 'block';
                }
        } catch (error) {
            console.error("Error loading user info:", error);
            window.location.href = '/';
        }
    }

    setupEventListeners() {
        // Back to home button
        document.getElementById('backToHome')?.addEventListener('click', () => {
            window.location.href = '/home';
        });

        // Tab switching
        document.querySelectorAll('.adminTab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Search functionality
        this.setupSearchListeners();
        
        // Action buttons
        this.setupActionListeners();
        
        // Modal functionality
        this.setupModalListeners();
    }

    setupSearchListeners() {
        const searchConfigs = [
            { input: 'userSearch', button: 'userSearchBtn', type: 'users' },
            { input: 'postSearch', button: 'postSearchBtn', type: 'posts' },
            { input: 'commentSearch', button: 'commentSearchBtn', type: 'comments' },
            { input: 'messageSearch', button: 'messageSearchBtn', type: 'messages' }
        ];

        searchConfigs.forEach(config => {
            const input = document.getElementById(config.input);
            const button = document.getElementById(config.button);
            
            if (input && button) {
                button.addEventListener('click', () => this.search(config.type, input.value));
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.search(config.type, input.value);
                });
            }
        });
    }

    setupActionListeners() {
        // Load all data buttons
        document.getElementById('loadAllUsers')?.addEventListener('click', () => this.loadAllData('users'));
        document.getElementById('loadAllPosts')?.addEventListener('click', () => this.loadAllData('posts'));
        document.getElementById('loadAllComments')?.addEventListener('click', () => this.loadAllData('comments'));
        document.getElementById('loadAllMessages')?.addEventListener('click', () => this.loadAllData('messages'));
        
        // Permission management (head admin only)
        document.getElementById('grantAdminBtn')?.addEventListener('click', () => this.grantAdmin());
        document.getElementById('revokeAdminBtn')?.addEventListener('click', () => this.revokeAdmin());
        document.getElementById('loadUsersWithRoles')?.addEventListener('click', () => this.loadUsersWithRoles());
    }

    setupModalListeners() {
        // Edit modal
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit')?.addEventListener('click', () => this.closeModal());
        document.getElementById('saveChanges')?.addEventListener('click', () => this.saveChanges());
        
        // Delete modal
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDelete')?.addEventListener('click', () => this.confirmDelete());
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeDeleteModal();
            }
        });
    }

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.adminTab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.adminTabContent').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;
        this.clearResults();
    }

    async search(type, query) {
        if (!query.trim()) {
            this.showNotification('Please enter a search term', 'error');
            return;
        }

        try {
            const endpoint = this.getSearchEndpoint(type);
            const data = await apiRequest(endpoint, 'POST', { query: query.trim() });
            
            if (data.success) {
                this.currentData = data[type] || data.results || [];
                this.renderResults(type, this.currentData);
            } else {
                this.showNotification(data.message || 'Search failed', 'error');
            }
        } catch (error) {
            console.error(`Error searching ${type}:`, error);
            this.showNotification('Search failed', 'error');
        }
    }

    async loadAllData(type) {
        try {
            const endpoint = this.getLoadAllEndpoint(type);
            const data = await apiRequest(endpoint, 'GET');
            
            if (data.success) {
                this.currentData = data[type] || data.results || [];
                this.renderResults(type, this.currentData);
                this.showNotification(`Loaded ${this.currentData.length} ${type}`, 'success');
            } else {
                this.showNotification(data.message || 'Load failed', 'error');
            }
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            this.showNotification('Load failed', 'error');
        }
    }

    getSearchEndpoint(type) {
        const endpoints = {
            users: '/api/admin/searchUsers',
            posts: '/api/admin/searchPosts', 
            comments: '/api/admin/searchComments',
            messages: '/api/admin/searchMessages'
        };
        return endpoints[type];
    }

    getLoadAllEndpoint(type) {
        const endpoints = {
            users: '/api/getAllUsers',
            posts: '/api/getAllPosts',
            comments: '/api/getAllComments', 
            messages: '/api/getAllMessages'
        };
        return endpoints[type];
    }

    renderResults(type, data) {
        const container = document.getElementById(`${type.slice(0, -1)}Results`);
        if (!container) return;

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<div class="resultItem"><p>No results found</p></div>';
            return;
        }

        data.forEach(item => {
            const resultItem = this.createResultItem(type, item);
            container.appendChild(resultItem);
        });
    }

    createResultItem(type, item) {
        const div = document.createElement('div');
        div.className = 'resultItem';
        
        const header = document.createElement('div');
        header.className = 'resultHeader';
        
        const title = document.createElement('div');
        title.className = 'resultTitle';
        title.textContent = this.getItemTitle(type, item);
        
        const actions = document.createElement('div');
        actions.className = 'resultActions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'editBtn';
        editBtn.textContent = '✏️ Edit';
        editBtn.onclick = () => this.editItem(type, item);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'deleteBtn';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.onclick = () => this.deleteItem(type, item);
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        header.appendChild(title);
        header.appendChild(actions);
        
        const details = document.createElement('div');
        details.className = 'resultDetails';
        details.innerHTML = this.getItemDetails(type, item);
        
        div.appendChild(header);
        div.appendChild(details);
        
        return div;
    }

    getItemTitle(type, item) {
        const titles = {
            users: `${item.username} (#${item.accountNumber})`,
            posts: `Post by ${item.username || 'Unknown'} - ${item.title || 'Untitled'}`,
            comments: `Comment by ${item.username || 'Unknown'}`,
            messages: `Message from ${item.senderUsername || 'Unknown'} to ${item.recipientUsername || 'Unknown'}`
        };
        return titles[type] || 'Unknown Item';
    }

    getItemDetails(type, item) {
        const formatters = {
            users: (item) => `
                <div class="resultField">
                    <div class="fieldLabel">Account Number</div>
                    <div class="fieldValue">${item.accountNumber}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Username</div>
                    <div class="fieldValue">${item.username}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Bio</div>
                    <div class="fieldValue">${item.bio || 'No bio'}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Admin Role</div>
                    <div class="fieldValue">${item.adminRole || 'user'}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Verified</div>
                    <div class="fieldValue">${item.verified ? '✅ Yes' : '❌ No'}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Followers</div>
                    <div class="fieldValue">${item.followers?.length || 0}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Following</div>
                    <div class="fieldValue">${item.following?.length || 0}</div>
                </div>
            `,
            posts: (item) => `
                <div class="resultField">
                    <div class="fieldLabel">Post ID</div>
                    <div class="fieldValue">${item.postId}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Title</div>
                    <div class="fieldValue">${item.title || 'Untitled'}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Content</div>
                    <div class="fieldValue">${item.content?.substring(0, 100)}${item.content?.length > 100 ? '...' : ''}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Author</div>
                    <div class="fieldValue">${item.accountNumber}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Likes</div>
                    <div class="fieldValue">${item.likes?.length || 0}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Date</div>
                    <div class="fieldValue">${new Date(item.date).toLocaleDateString()}</div>
                </div>
            `,
            comments: (item) => `
                <div class="resultField">
                    <div class="fieldLabel">Comment ID</div>
                    <div class="fieldValue">${item.commentId}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Content</div>
                    <div class="fieldValue">${item.content?.substring(0, 150)}${item.content?.length > 150 ? '...' : ''}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Author</div>
                    <div class="fieldValue">${item.accountNumber}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Post ID</div>
                    <div class="fieldValue">${item.postId}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Likes</div>
                    <div class="fieldValue">${item.likes?.length || 0}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Date</div>
                    <div class="fieldValue">${new Date(item.date).toLocaleDateString()}</div>
                </div>
            `,
            messages: (item) => `
                <div class="resultField">
                    <div class="fieldLabel">Message ID</div>
                    <div class="fieldValue">${item.messageId}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Content</div>
                    <div class="fieldValue">${item.content?.substring(0, 100)}${item.content?.length > 100 ? '...' : ''}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Sender</div>
                    <div class="fieldValue">${item.senderAccountNumber}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Recipient</div>
                    <div class="fieldValue">${item.recipientAccountNumber}</div>
                </div>
                <div class="resultField">
                    <div class="fieldLabel">Date</div>
                    <div class="fieldValue">${new Date(item.timestamp).toLocaleDateString()}</div>
                </div>
            `
        };
        
        return formatters[type] ? formatters[type](item) : '<p>No details available</p>';
    }

    editItem(type, item) {
        this.editingItem = { type, item };
        
        document.getElementById('modalTitle').textContent = `Edit ${type.slice(0, -1)}`;
        
        const form = document.getElementById('editForm');
        form.innerHTML = this.generateEditForm(type, item);
        
        const modal = document.getElementById('editModal');
        modal.style.display = 'flex'; // Use flex for better centering
        
        // Add a slight delay to ensure smooth animation
        setTimeout(() => {
            modal.classList.add('modal-show');
        }, 10);
    }

    generateEditForm(type, item) {
        const forms = {
            users: (item) => `
                <div class="formGroup">
                    <label>Username</label>
                    <input type="text" id="edit_username" value="${item.username}" required>
                </div>
                <div class="formGroup">
                    <label>Bio</label>
                    <textarea id="edit_bio">${item.bio || ''}</textarea>
                </div>
                <div class="formGroup">
                    <label>Admin Role</label>
                    <select id="edit_adminRole">
                        <option value="user" ${item.adminRole === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${item.adminRole === 'admin' ? 'selected' : ''}>Admin</option>
                        ${this.userRole === 'headAdmin' ? `<option value="headAdmin" ${item.adminRole === 'headAdmin' ? 'selected' : ''}>Head Admin</option>` : ''}
                    </select>
                </div>
                <div class="formGroup">
                    <label>
                        <input type="checkbox" id="edit_verified" ${item.verified ? 'checked' : ''}>
                        Verified Badge
                    </label>
                </div>
            `,
            posts: (item) => `
                <div class="formGroup">
                    <label>Title</label>
                    <input type="text" id="edit_title" value="${item.title || ''}" required>
                </div>
                <div class="formGroup">
                    <label>Content</label>
                    <textarea id="edit_content" required>${item.content || ''}</textarea>
                </div>
            `,
            comments: (item) => `
                <div class="formGroup">
                    <label>Content</label>
                    <textarea id="edit_content" required>${item.content || ''}</textarea>
                </div>
            `,
            messages: (item) => `
                <div class="formGroup">
                    <label>Content</label>
                    <textarea id="edit_content" required>${item.content || ''}</textarea>
                </div>
                <p><em>Note: Editing messages should be done carefully as it affects user privacy.</em></p>
            `
        };
        
        return forms[type] ? forms[type](item) : '<p>Edit form not available</p>';
    }

    async saveChanges() {
        if (!this.editingItem) return;
        
        const { type, item } = this.editingItem;
        const formData = this.getFormData(type);
        
        try {
            const endpoint = this.getUpdateEndpoint(type);
            
            // Special handling for users - use legacy updateData format if needed
            let requestData;
            if (type === 'users') {
                // For the legacy updateData endpoint, we need to handle each field separately
                // But since we now have admin/updateUser, we can send all at once
                requestData = {
                    id: this.getItemId(type, item),
                    ...formData
                };
            } else {
                requestData = {
                    id: this.getItemId(type, item),
                    ...formData
                };
            }
            
            const data = await apiRequest(endpoint, 'POST', requestData);
            
            if (data.success) {
                this.showNotification('Item updated successfully', 'success');
                this.closeModal();
                // Refresh current view
                if (this.currentData.length > 0) {
                    this.loadAllData(type);
                }
            } else {
                this.showNotification(data.message || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Error updating item:', error);
            this.showNotification('Update failed', 'error');
        }
    }

    getFormData(type) {
        const extractors = {
            users: () => ({
                username: document.getElementById('edit_username').value,
                bio: document.getElementById('edit_bio').value,
                adminRole: document.getElementById('edit_adminRole').value,
                verified: document.getElementById('edit_verified').checked
            }),
            posts: () => ({
                title: document.getElementById('edit_title').value,
                content: document.getElementById('edit_content').value
            }),
            comments: () => ({
                content: document.getElementById('edit_content').value
            }),
            messages: () => ({
                content: document.getElementById('edit_content').value
            })
        };
        
        return extractors[type] ? extractors[type]() : {};
    }

    getItemId(type, item) {
        const idFields = {
            users: 'accountNumber',
            posts: 'postId',
            comments: 'commentId',
            messages: 'messageId'
        };
        return item[idFields[type]];
    }

    getUpdateEndpoint(type) {
        const endpoints = {
            users: '/api/admin/updateUser',
            posts: '/api/admin/updatePost',
            comments: '/api/admin/updateComment',
            messages: '/api/admin/updateMessage'
        };
        return endpoints[type];
    }

    deleteItem(type, item) {
        this.editingItem = { type, item };
        
        document.getElementById('deleteMessage').textContent = 
            `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`;
        
        const modal = document.getElementById('deleteModal');
        modal.style.display = 'flex'; // Use flex for better centering
        
        // Add a slight delay to ensure smooth animation
        setTimeout(() => {
            modal.classList.add('modal-show');
        }, 10);
    }

    async confirmDelete() {
        if (!this.editingItem) return;
        
        const { type, item } = this.editingItem;
        
        try {
            const endpoint = this.getDeleteEndpoint(type);
            const data = await apiRequest(endpoint, 'POST', {
                id: this.getItemId(type, item)
            });
            
            if (data.success) {
                this.showNotification('Item deleted successfully', 'success');
                this.closeDeleteModal();
                // Refresh current view
                if (this.currentData.length > 0) {
                    this.loadAllData(type);
                }
            } else {
                this.showNotification(data.message || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Delete failed', 'error');
        }
    }

    getDeleteEndpoint(type) {
        const endpoints = {
            users: '/api/admin/deleteUser',
            posts: '/api/admin/deletePost',
            comments: '/api/admin/deleteComment',
            messages: '/api/admin/deleteMessage'
        };
        return endpoints[type];
    }

    async grantAdmin() {
        const input = document.getElementById('grantAdminInput');
        const identifier = input.value.trim();
        
        if (!identifier) {
            this.showNotification('Please enter account number or username', 'error');
            return;
        }
        
        try {
            const data = await apiRequest('/api/grantAdmin', 'POST', {
                targetAccountNumber: identifier
            });
            
            if (data.success) {
                this.showNotification(`Admin granted to ${data.user.username}`, 'success');
                input.value = '';
            } else {
                this.showNotification(data.message || 'Failed to grant admin', 'error');
            }
        } catch (error) {
            console.error('Error granting admin:', error);
            this.showNotification('Failed to grant admin', 'error');
        }
    }

    async revokeAdmin() {
        const input = document.getElementById('revokeAdminInput');
        const identifier = input.value.trim();
        
        if (!identifier) {
            this.showNotification('Please enter account number or username', 'error');
            return;
        }
        
        try {
            const data = await apiRequest('/api/revokeAdmin', 'POST', {
                targetAccountNumber: identifier
            });
            
            if (data.success) {
                this.showNotification(`Admin revoked from ${data.user.username}`, 'success');
                input.value = '';
            } else {
                this.showNotification(data.message || 'Failed to revoke admin', 'error');
            }
        } catch (error) {
            console.error('Error revoking admin:', error);
            this.showNotification('Failed to revoke admin', 'error');
        }
    }

    async loadUsersWithRoles() {
        try {
            const data = await apiRequest('/api/getUsersWithRoles', 'GET');
            
            if (data.success) {
                this.currentData = data.users;
                this.renderResults('users', this.currentData);
                this.showNotification(`Loaded ${this.currentData.length} users with roles`, 'success');
            } else {
                this.showNotification(data.message || 'Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Error loading users with roles:', error);
            this.showNotification('Failed to load users', 'error');
        }
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('modal-show');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        this.editingItem = null;
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('modal-show');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        this.editingItem = null;
    }

    clearResults() {
        ['userResults', 'postResults', 'commentResults', 'messageResults'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });
        this.currentData = [];
    }

    showNotification(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #238636;' : 
              type === 'error' ? 'background: #da3633;' : 
              'background: #1f6feb;'}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});