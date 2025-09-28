import { apiRequest } from './apiRequest.js';
import { initializeGlobalButtons, initializeTheme } from './renderBar.js';
import { applyModerationState } from './moderationOverlay.js';

/**
 * Centralized authentication and user info management
 */
export class AuthManager {
    constructor() {
        this.user = null;
        this.accountNumber = null;

        if (typeof window !== 'undefined') {
            window.addEventListener('tnw:moderation-update', (event) => {
                if (event.detail) {
                    this.setUser(event.detail);
                }
            });
        }
    }

    /**
     * Initialize user authentication and setup global components
     * @param {Object} options - Configuration options
     * @param {boolean} options.requireAuth - Redirect to login if not authenticated (default: true)
     * @param {boolean} options.initializeGlobalButtons - Initialize global buttons (default: true)
     * @param {boolean} options.initializeTheme - Initialize user theme (default: true)
     * @returns {Promise<Object>} User data
     */
    async initialize(options = {}) {
        const {
            requireAuth = true,
            initializeGlobalButtons: initGlobalButtons = true,
            initializeTheme: initTheme = true
        } = options;

        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            
            if (data.success) {
                this.setUser(data.user);
                applyModerationState(this.user);

                // Initialize global components if requested
                if (initGlobalButtons) {
                    initializeGlobalButtons(this.accountNumber);
                }
                
                if (initTheme) {
                    initializeTheme(this.user);
                }

                return this.user;
            } else {
                if (requireAuth) {
                    window.location.href = '/';
                }
                return null;
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            if (requireAuth) {
                window.location.href = '/';
            }
            throw error;
        }
    }

    /**
     * Get current user data
     * @returns {Object|null} Current user data
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get current account number
     * @returns {string|null} Current account number
     */
    getAccountNumber() {
        return this.accountNumber;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Update the cached user data
     * @param {Object} user - Updated user payload
     */
    setUser(user) {
        if (!user) return;
        this.user = user;
        this.accountNumber = user.accountNumber;
    }
}

/**
 * Global auth manager instance
 */
export const authManager = new AuthManager();

/**
 * Quick initialization helper for common use cases
 * @param {Object} options - Same as AuthManager.initialize options
 * @returns {Promise<Object>} User data
 */
export async function initializeAuth(options = {}) {
    return await authManager.initialize(options);
}