import { apiRequest } from './apiRequest.js';
import { initializeGlobalButtons, initializeTheme } from './renderBar.js';

/**
 * Centralized authentication and user info management
 */
export class AuthManager {
    constructor() {
        this.user = null;
        this.accountNumber = null;
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
                this.user = data.user;
                this.accountNumber = data.user.accountNumber;

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