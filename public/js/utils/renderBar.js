import { apiRequest } from './apiRequest.js';
import { getVerifiedUsernameHTML } from './verifiedBadge.js';

const THEME_SEQUENCE = ['dark', 'light', 'auto'];
const THEME_LABELS = {
    dark: 'Dark theme',
    light: 'Light theme',
    auto: 'Auto theme',
};
const THEME_ICON_MARKUP = {
    dark: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"></path>
        </svg>
    `,
    light: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M4.93 19.07l1.41-1.41"></path>
            <path d="M17.66 6.34l1.41-1.41"></path>
        </svg>
    `,
    auto: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"></path>
            <path d="M12 3v18"></path>
        </svg>
    `,
};

const themeChangeListeners = new Set();
let currentTheme = null;

const isValidTheme = (theme) => THEME_SEQUENCE.includes(theme);

const getNextTheme = (theme) => {
    const currentIndex = THEME_SEQUENCE.indexOf(theme);
    return THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
};

const notifyThemeChange = (theme) => {
    themeChangeListeners.forEach((listener) => {
        try {
            listener(theme);
        } catch (error) {
            console.error('Theme listener error:', error);
        }
    });
};

const getThemeToggleElements = () => ({
    button: document.getElementById('themeToggle'),
    icon: document.getElementById('themeToggleIcon'),
    status: document.getElementById('themeToggleStatus'),
});

const updateThemeToggleUI = (theme) => {
    const normalizedTheme = isValidTheme(theme) ? theme : 'dark';
    const { button, icon, status } = getThemeToggleElements();
    const nextTheme = getNextTheme(normalizedTheme);

    if (button) {
        const nextLabel = THEME_LABELS[nextTheme];
        button.dataset.theme = normalizedTheme;
        button.setAttribute('aria-label', `Switch to ${nextLabel}`);
        button.setAttribute('title', `Switch to ${nextLabel}`);
    }

    if (icon) {
        icon.innerHTML = THEME_ICON_MARKUP[normalizedTheme];
    }

    if (status) {
        status.textContent = `${THEME_LABELS[normalizedTheme]}`;
    }
};

export const onThemeChange = (listener) => {
    if (typeof listener === 'function') {
        themeChangeListeners.add(listener);
        return () => themeChangeListeners.delete(listener);
    }
    return () => {};
};

export const getCurrentTheme = () => {
    if (isValidTheme(currentTheme)) {
        return currentTheme;
    }
    const storedTheme = localStorage.getItem('theme');
    return isValidTheme(storedTheme) ? storedTheme : 'dark';
};
import { initializeNotificationCenter } from './notificationCenter.js';
import { initializeOnboarding } from './onboarding.js';
import { registerServiceWorker } from './serviceWorker.js';

const ANALYTICS_SELECTOR = 'script[data-plausible]';

function ensureAnalyticsScript() {
    if (document.querySelector(ANALYTICS_SELECTOR)) {
        return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://plausible.io/js/script.js';
    script.dataset.domain = 'thenewworld.app';
    script.setAttribute('data-plausible', 'true');
    document.head.appendChild(script);
}

registerServiceWorker();

export function renderBar() {
    console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING\nWARNING WARNING WARNING WARNING WARNING WARNING WARNING\n\nThis is your browser's developer console. If someone told you to paste something here, it could be a scam.\n\nNever share anything from this console unless you understand exactly what it does");

    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    const effectiveTheme = isValidTheme(savedTheme) ? savedTheme : 'dark';

    if (!savedTheme || !isValidTheme(savedTheme)) {
        localStorage.setItem('theme', effectiveTheme);
    }
    applyTheme(effectiveTheme);

    // Prevent duplicate nav mounting if the bar already exists
    if (document.body.classList.contains('has-side-nav') || document.querySelector('.bar')) {
        return;
    }

    ensureAnalyticsScript();

    const barHTML = `
        <div class="bar">
            <div class="bar-inner">
                <div class="logo-section">
                    <img class="logoImg" src="/src/TNW.png" alt="Logo" loading="lazy" />
                    <h1 class="logo" id="checkPost">The New World</h1>
                </div>
                <div class="nav-controls">
                    <!-- Search Button -->
                    <div class="nav-search-container" id="navSearchContainer">
                        <button class="nav-icon-btn" id="searchToggle" aria-label="Toggle search panel" aria-haspopup="true" aria-expanded="false">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                        
                        <!-- Expandable Search Bar -->
                        <div class="nav-search-panel" id="navSearchPanel">
                            <div class="search-options">
                                <button class="search-type-btn active" data-type="posts">Posts</button>
                                <button class="search-type-btn" data-type="users">Users</button>
                            </div>
                            <input type="text" id="navSearchInput" placeholder="Search..." />
                            <div class="nav-search-results" id="navSearchResults"></div>
                        </div>
                    </div>

                    <button
                        class="nav-icon-btn"
                        id="notificationsToggle"
                        data-action="toggle-notifications"
                        aria-label="Toggle notifications panel"
                        aria-haspopup="true"
                        aria-expanded="false"
                        type="button"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span class="nav-icon-badge" data-notification-badge hidden aria-hidden="true"></span>
                    </button>

                    <!-- Admin Button -->
                    <div class="nav-menu-container nav-admin-container" id="navAdminContainer" style="display: none;">
                        <button class="nav-icon-btn" id="adminToggle" aria-haspopup="true" aria-expanded="false" aria-label="Toggle admin menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"></path>
                                <path d="M12 22s6-3 6-9V6l-6-2-6 2v7c0 6 6 9 6 9z" opacity="0.2"></path>
                            </svg>
                        </button>

                        <div class="nav-menu-panel" id="navAdminPanel">
                            <a id="adminPanelButton" href="/admin" class="nav-menu-item" style="display: none;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>Admin Panel</span>
                            </a>
                            <a id="moderationHubButton" href="/moderation" class="nav-menu-item" style="display: none;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m9 7 4-4 4 4"></path>
                                    <path d="M4 21v-7a2 2 0 0 1 2-2h2"></path>
                                    <path d="M20 21v-7a2 2 0 0 0-2-2h-2"></path>
                                    <path d="M9 21h6"></path>
                                </svg>
                                <span>Moderation Hub</span>
                            </a>
                            <a id="supportPanelButton" href="/support-panel" class="nav-menu-item" style="display: none;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
                                    <rect x="2" y="9" width="20" height="11" rx="2" ry="2"></rect>
                                </svg>
                                <span>Support Panel</span>
                            </a>
                        </div>
                    </div>
                    
                    <!-- Menu Button -->
                    <div class="nav-menu-container legacy-nav-menu" id="navMenuContainer">
                        <button class="nav-icon-btn" id="menuToggle" aria-label="Toggle navigation menu" aria-haspopup="true" aria-expanded="false">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        
                        <!-- Expandable Menu Panel (Legacy) -->
                        <div class="nav-menu-panel" id="navMenuPanel">
                            <a href="/home" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                                </svg>
                                <span>Home</span>
                            </a>
                            <a id="legacyCreatePostButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                    <circle cx="12" cy="13" r="3"></circle>
                                </svg>
                                <span>Create Post</span>
                            </a>
                            <a href="/messages" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <span>Messages</span>
                            </a>
                            <a href="" id="legacyProfileButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>My Profile</span>
                            </a>
                            <a href="/settings" id="legacySettingsButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                <span>Settings</span>
                            </a>
                            <a href="/support" id="legacySupportPageButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="9"></circle>
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <line x1="12" y1="3" x2="12" y2="5"></line>
                                    <line x1="12" y1="19" x2="12" y2="21"></line>
                                    <line x1="21" y1="12" x2="19" y2="12"></line>
                                    <line x1="5" y1="12" x2="3" y2="12"></line>
                                </svg>
                                <span>Support</span>
                            </a>
                            <a id="legacyLogoutButton" href="" class="nav-menu-item logout">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16,17 21,12 16,7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <span>Logout</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <nav class="side-nav" aria-label="Primary">
            <div class="side-nav-inner">
                <a href="/home" class="side-nav-link" data-route="/home">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9,22 9,12 15,12 15,22"></polyline>
                        </svg>
                    </span>
                    <span class="side-nav-label">Home</span>
                </a>
                <a href="/search" class="side-nav-link" data-route="/search">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </span>
                    <span class="side-nav-label">Search</span>
                </a>
                <a href="/messages" class="side-nav-link" data-route="/messages">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </span>
                    <span class="side-nav-label">Messages</span>
                </a>
                <a href="#" id="createPostButton" class="side-nav-link side-nav-primary">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14"></path>
                            <path d="M5 12h14"></path>
                        </svg>
                    </span>
                    <span class="side-nav-label">Create</span>
                </a>
                <a href="#" id="profileButton" class="side-nav-link" data-route-prefix="/profile">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </span>
                    <span class="side-nav-label">Profile</span>
                </a>
                <a href="/settings" id="settingsButton" class="side-nav-link" data-route="/settings">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </span>
                    <span class="side-nav-label">Settings</span>
                </a>
                <a href="/support" id="supportPageButton" class="side-nav-link" data-route="/support">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="12" y1="3" x2="12" y2="5"></line>
                            <line x1="12" y1="19" x2="12" y2="21"></line>
                            <line x1="21" y1="12" x2="19" y2="12"></line>
                            <line x1="5" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </span>
                    <span class="side-nav-label">Support</span>
                </a>
                <a href="#" id="logoutButton" class="side-nav-link side-nav-danger">
                    <span class="side-nav-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16,17 21,12 16,7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </span>
                    <span class="side-nav-label">Logout</span>
                </a>
            </div>
        </nav>
        <nav class="bottom-nav" aria-label="Mobile primary navigation">
            <a href="/home" class="bottom-nav-link" data-route="/home" aria-label="Home">
                <span class="bottom-nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                </span>
                <span class="bottom-nav-label">Home</span>
            </a>
            <a href="/search" class="bottom-nav-link" data-route="/search" aria-label="Search">
                <span class="bottom-nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </span>
                <span class="bottom-nav-label">Search</span>
            </a>
            <button type="button" id="bottomCreatePostButton" class="bottom-nav-link bottom-nav-primary" aria-label="Create post">
                <span class="bottom-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                    </svg>
                </span>
                <span class="bottom-nav-label">Create</span>
            </button>
            <a href="/messages" class="bottom-nav-link" data-route="/messages" aria-label="Direct messages">
                <span class="bottom-nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </span>
                <span class="bottom-nav-label">DMs</span>
            </a>
            <a href="#" id="bottomProfileButton" class="bottom-nav-link" data-route-prefix="/profile" aria-label="Profile">
                <span class="bottom-nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </span>
                <span class="bottom-nav-label">Profile</span>
            </a>
        </nav>
        <div class="nav-menu-overlay" id="navMenuOverlay" aria-hidden="true"></div>
    `;

    const body = document.body;
    const barContainer = document.createElement('div');
    barContainer.innerHTML = barHTML;
    body.insertBefore(barContainer, body.firstChild);
    body.classList.add('has-side-nav', 'has-bottom-nav');

    if (!document.getElementById('notificationsPanel')) {
        const notificationsPanel = document.createElement('div');
        notificationsPanel.id = 'notificationsPanel';
        notificationsPanel.className = 'notificationsPanel';
        notificationsPanel.setAttribute('aria-hidden', 'true');
        notificationsPanel.innerHTML = `
            <div class="notificationsPanel-sheet" role="dialog" aria-modal="true" aria-labelledby="notificationsPanelTitle">
                <div class="notificationsPanelHeader">
                    <h3 id="notificationsPanelTitle">Notifications</h3>
                    <button id="closeNotifications" class="closeNotificationsBtn" aria-label="Close notifications">&times;</button>
                </div>
                <ul id="notificationsList" class="notificationsList" role="list"></ul>
            </div>
        `;
        body.appendChild(notificationsPanel);
    }
    
    // Initialize dynamic navigation functionality
    initializeNavControls();
    initializeSideNav();
    initializeBottomNav();
    setupResponsiveNavBehavior();
    initializeNotificationCenter();
    initializeOnboarding();

    // Add scroll event handling for the navbar
//     let lastScrollTop = 0;
    
//     document.getElementById('homePanel').addEventListener('scroll', function() {
//         const bar = document.querySelector('.bar');
//         if (!bar) return;
        
//         // Get the homePanel element to check if we're on a page with this panel
//         const homePanel = document.getElementById('homePanel');
//         if (!homePanel) return;

//         const scrollTop = homePanel.scrollTop || document.documentElement.scrollTop;

//         if (scrollTop > lastScrollTop) {
//             // Scrolling down
//             bar.style.transform = 'translateY(-100%)';
            
//         } else {
//             // Scrolling up
//             bar.style.transform = 'translateY(0)';
//         }
        
//         lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
//     }, { passive: true }); // Passive for better performance
}

function initializeNavControls() {
    // Logo click handlers - redirect to home page
    const logoImg = document.querySelector('.logoImg');
    const logoText = document.getElementById('checkPost');
    
    if (logoImg) {
        logoImg.addEventListener('click', () => {
            window.location.href = '/home';
        });
        logoImg.style.cursor = 'pointer';
    }
    
    if (logoText) {
        logoText.addEventListener('click', () => {
            window.location.href = '/home';
        });
        logoText.style.cursor = 'pointer';
    }
    
    const body = document.body;
    const searchContainer = document.getElementById('navSearchContainer');
    const searchPanel = document.getElementById('navSearchPanel');
    const searchToggle = document.getElementById('searchToggle');
    const searchInput = document.getElementById('navSearchInput');
    const searchResults = document.getElementById('navSearchResults');
    const searchTypeBtns = document.querySelectorAll('.search-type-btn');
    
    const menuContainer = document.getElementById('navMenuContainer');
    const menuPanel = document.getElementById('navMenuPanel');
    const menuToggle = document.getElementById('menuToggle');
    const bottomMenuButton = document.getElementById('bottomMenuButton');
    const navMenuOverlay = document.getElementById('navMenuOverlay');
    let lastMenuTrigger = null;

    const adminContainer = document.getElementById('navAdminContainer');
    const adminPanel = document.getElementById('navAdminPanel');
    const adminToggle = document.getElementById('adminToggle');

    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationToggleButtons = Array.from(document.querySelectorAll('[data-action="toggle-notifications"]'));
    let notificationsObserver;
    
    let searchTimeout;
    let currentSearchType = 'posts';

    const updateNotificationToggleState = () => {
        if (!notificationsPanel || !notificationToggleButtons.length) {
            return;
        }
        const isOpen = notificationsPanel.classList.contains('open');
        notificationToggleButtons.forEach((btn) => {
            btn.classList.toggle('active', isOpen);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    };

    if (notificationsPanel && notificationToggleButtons.length) {
        notificationToggleButtons.forEach((btn) => {
            btn.setAttribute('aria-controls', 'notificationsPanel');
            btn.setAttribute('aria-expanded', notificationsPanel.classList.contains('open') ? 'true' : 'false');
        });

        updateNotificationToggleState();

        notificationsObserver = new MutationObserver(updateNotificationToggleState);
        notificationsObserver.observe(notificationsPanel, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('beforeunload', () => {
            notificationsObserver?.disconnect();
        }, { once: true });
    }
    
    // Search functionality
    if (searchContainer && searchPanel && searchToggle && searchInput) {
        const openSearch = () => {
            if (searchPanel.classList.contains('active')) {
                return;
            }
            searchPanel.classList.add('active');
            searchContainer.classList.add('active');
            searchToggle.setAttribute('aria-expanded', 'true');
            searchInput.focus();
        };

        const closeSearch = () => {
            if (!searchPanel.classList.contains('active')) {
                return;
            }
            searchPanel.classList.remove('active');
            searchContainer.classList.remove('active');
            searchToggle.setAttribute('aria-expanded', 'false');
            searchResults.innerHTML = '';
            searchInput.value = '';
        };

        searchToggle.setAttribute('aria-haspopup', 'true');
        searchToggle.setAttribute('aria-expanded', 'false');

        searchToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const willOpen = !searchPanel.classList.contains('active');
            if (willOpen) {
                openSearch();
            } else {
                closeSearch();
            }
        });

        searchContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        searchPanel.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!searchContainer.contains(event.target)) {
                closeSearch();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && searchPanel.classList.contains('active')) {
                closeSearch();
                searchToggle.focus();
            }
        });

        // Search type button handling
        searchTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                searchTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSearchType = btn.dataset.type;
                searchInput.placeholder = `Search ${currentSearchType}...`;
                if (searchInput.value.trim()) {
                    performSearch(searchInput.value.trim(), currentSearchType);
                }
            });
        });
        
        // Search input handling
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query, currentSearchType);
                }, 300);
            } else {
                searchResults.innerHTML = '';
            }
        });
    }
    
    // Menu functionality
    if (menuContainer && menuPanel && menuToggle) {
        const setMenuState = (isOpen) => {
            const usingOverlay = body.classList.contains('show-bottom-nav') && Boolean(navMenuOverlay);

            if (isOpen) {
                menuPanel.classList.add('active');
                menuToggle.setAttribute('aria-expanded', 'true');
                bottomMenuButton?.classList.add('active');
                bottomMenuButton?.setAttribute('aria-expanded', 'true');
                if (usingOverlay) {
                    navMenuOverlay.classList.add('active');
                    navMenuOverlay.setAttribute('aria-hidden', 'false');
                    body.classList.add('nav-menu-open');
                }
            } else {
                menuPanel.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                bottomMenuButton?.classList.remove('active');
                bottomMenuButton?.setAttribute('aria-expanded', 'false');
                if (navMenuOverlay) {
                    navMenuOverlay.classList.remove('active');
                    navMenuOverlay.setAttribute('aria-hidden', 'true');
                }
                body.classList.remove('nav-menu-open');
            }
        };

        const openMenu = () => {
            if (menuPanel.classList.contains('active')) {
                return;
            }
            setMenuState(true);
        };

        const closeMenu = (restoreFocus = true) => {
            if (!menuPanel.classList.contains('active')) {
                return;
            }
            setMenuState(false);
            if (restoreFocus && lastMenuTrigger) {
                lastMenuTrigger.focus();
            }
            if (!menuPanel.classList.contains('active')) {
                lastMenuTrigger = null;
            }
        };

        menuToggle.setAttribute('aria-haspopup', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.addEventListener('click', (event) => {
            event.preventDefault();
            lastMenuTrigger = menuToggle;
            const willOpen = !menuPanel.classList.contains('active');
            if (willOpen) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        bottomMenuButton?.setAttribute('aria-haspopup', 'true');
        bottomMenuButton?.setAttribute('aria-expanded', 'false');
        bottomMenuButton?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            lastMenuTrigger = bottomMenuButton;
            const willOpen = !menuPanel.classList.contains('active');
            if (willOpen) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        menuContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        menuPanel.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!menuContainer.contains(event.target)) {
                closeMenu(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menuPanel.classList.contains('active')) {
                closeMenu();
            }
        });

        navMenuOverlay?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeMenu(false);
        });
    }

    if (adminContainer && adminPanel && adminToggle) {
        const openAdminMenu = () => {
            if (adminPanel.classList.contains('active')) {
                return;
            }
            adminPanel.classList.add('active');
            adminToggle.setAttribute('aria-expanded', 'true');
        };

        const closeAdminMenu = () => {
            if (!adminPanel.classList.contains('active')) {
                return;
            }
            adminPanel.classList.remove('active');
            adminToggle.setAttribute('aria-expanded', 'false');
        };

        adminToggle.setAttribute('aria-haspopup', 'true');
        adminToggle.setAttribute('aria-expanded', 'false');
        adminToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const willOpen = !adminPanel.classList.contains('active');
            if (willOpen) {
                openAdminMenu();
            } else {
                closeAdminMenu();
            }
        });

        adminContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        adminPanel.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.addEventListener('click', (event) => {
            if (!adminContainer.contains(event.target)) {
                closeAdminMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && adminPanel.classList.contains('active')) {
                closeAdminMenu();
                adminToggle.focus();
            }
        });
    }
}

function initializeSideNav() {
    const sideNav = document.querySelector('.side-nav');
    if (!sideNav) return;

    const navLinks = sideNav.querySelectorAll('.side-nav-link');
    if (!navLinks.length) return;

    const rawPath = window.location.pathname || '/';
    const normalizedPath = rawPath.length > 1 && rawPath.endsWith('/')
        ? rawPath.slice(0, -1)
        : rawPath;

    navLinks.forEach((link) => {
        const route = link.dataset.route;
        const routePrefix = link.dataset.routePrefix;

        const matchesRoute = route && (
            normalizedPath === route ||
            (route === '/home' && normalizedPath === '/')
        );

        const matchesPrefix = routePrefix && normalizedPath.startsWith(routePrefix);

        if (matchesRoute || matchesPrefix) {
            link.classList.add('active');
        }
    });
}

function initializeBottomNav() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;

    const navLinks = bottomNav.querySelectorAll('.bottom-nav-link[data-route], .bottom-nav-link[data-route-prefix]');
    if (!navLinks.length) return;

    const rawPath = window.location.pathname || '/';
    const normalizedPath = rawPath.length > 1 && rawPath.endsWith('/')
        ? rawPath.slice(0, -1)
        : rawPath;

    navLinks.forEach((link) => {
        const route = link.dataset.route;
        const routePrefix = link.dataset.routePrefix;

        const matchesRoute = route && (
            normalizedPath === route ||
            (route === '/home' && normalizedPath === '/')
        );

        const matchesPrefix = routePrefix && normalizedPath.startsWith(routePrefix);

        if (matchesRoute || matchesPrefix) {
            link.classList.add('active');
        }
    });
}

function setupResponsiveNavBehavior() {
    const body = document.body;
    if (!body.classList.contains('has-bottom-nav')) {
        return;
    }

    const query = window.matchMedia('(max-width: 1100px)');

    const updateLayout = () => {
        const shouldUseMobileNav = query.matches;
        const wasUsingMobileNav = body.classList.contains('show-bottom-nav');

        if (!shouldUseMobileNav && wasUsingMobileNav) {
            const navMenuOverlay = document.getElementById('navMenuOverlay');
            const menuPanel = document.getElementById('navMenuPanel');
            const menuToggle = document.getElementById('menuToggle');
            const bottomMenuButton = document.getElementById('bottomMenuButton');
            navMenuOverlay?.classList.remove('active');
            navMenuOverlay?.setAttribute('aria-hidden', 'true');
            body.classList.remove('nav-menu-open');
            menuPanel?.classList.remove('active');
            menuToggle?.setAttribute('aria-expanded', 'false');
            bottomMenuButton?.classList.remove('active');
            bottomMenuButton?.setAttribute('aria-expanded', 'false');
        }

        body.classList.toggle('show-bottom-nav', shouldUseMobileNav);
    };

    updateLayout();

    if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', updateLayout);
    } else if (typeof query.addListener === 'function') {
        query.addListener(updateLayout);
    }

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateLayout, 150);
    });
}

async function performSearch(query, type) {
    const searchResults = document.getElementById('navSearchResults');
    if (!searchResults) return;
    
    try {
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        
        const endpoint = type === 'posts' ? '/api/searchPosts' : '/api/searchUsers';
        const data = await apiRequest(endpoint, 'POST', { data: query });
        
        if (data.success) {
            const results = type === 'posts' ? data.posts : data.users;
            
            if (results && results.length > 0) {
                const resultsHTML = results.slice(0, 5).map(item => {
                    if (type === 'posts') {
                        const authorHTML = getVerifiedUsernameHTML(item.username || 'Unknown', item.userVerified);
                        return `
                            <div class="search-result-item" onclick="window.location.href='/post/${item.postId}'">
                                <div class="search-result-title">${item.title || 'Untitled'}</div>
                                <div class="search-result-meta">by ${authorHTML} • ${new Date(item.date || item.createdAt).toLocaleDateString()}</div>
                                <div class="search-result-content">${(item.content || '').substring(0, 100)}${(item.content || '').length > 100 ? '...' : ''}</div>
                            </div>
                        `;
                    } else {
                        const usernameHTML = getVerifiedUsernameHTML(item.username, item.verified);
                        return `
                            <div class="search-result-item" onclick="window.location.href='/profile/${item.accountNumber}'">
                                <div class="search-result-title">${usernameHTML}</div>
                                <div class="search-result-meta">Account #${item.accountNumber}</div>
                                <div class="search-result-content">${item.bio || 'No bio available'}</div>
                            </div>
                        `;
                    }
                }).join('');
                
                searchResults.innerHTML = resultsHTML;
            } else {
                searchResults.innerHTML = `<div class="search-no-results">No ${type} found</div>`;
            }
        } else {
            searchResults.innerHTML = `<div class="search-no-results">No ${type} found</div>`;
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-error">Search failed</div>';
    }
}

export function initializeGlobalButtons(accountNumber) {

    const logoutButtons = [
        document.getElementById("logoutButton"),
        document.getElementById("legacyLogoutButton")
    ].filter(Boolean);

    logoutButtons.forEach((logoutButton) => {
        logoutButton.addEventListener("click", async function (event) {
            event.preventDefault();
            try {
                const data = await apiRequest('/api/logout', 'POST');
                if (data.success) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    });

    const profileButtons = [
        document.getElementById("profileButton"),
        document.getElementById("legacyProfileButton"),
        document.getElementById("bottomProfileButton")
    ].filter(Boolean);

    profileButtons.forEach((profileButton) => {
        profileButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (accountNumber) {
                window.location.href = `/profile/${accountNumber}`;
            }
        });
    });

    // Check admin and support access and show/hide buttons
    apiRequest('/api/verify', 'GET')
        .then(data => {
            if (data.success) {
                const adminMenuContainer = document.getElementById('navAdminContainer');
                const adminMenuPanel = document.getElementById('navAdminPanel');
                const adminToggle = document.getElementById('adminToggle');
                // Handle admin button (only for admins)
                const adminButton = document.getElementById('adminPanelButton');
                const supportButton = document.getElementById('supportPanelButton');
                const moderationButton = document.getElementById('moderationHubButton');

                let showAdminMenu = false;

                if (adminButton) {
                    if (data.adminAccess) {
                        adminButton.style.display = 'flex';
                        showAdminMenu = true;
                    } else {
                        adminButton.style.display = 'none';
                    }
                }

                // Handle support panel button (for moderators and admins)
                if (supportButton) {
                    if (data.supportAccess) {
                        supportButton.style.display = 'flex';
                        showAdminMenu = true;
                    } else {
                        supportButton.style.display = 'none';
                    }
                }

                if (moderationButton) {
                    if (data.supportAccess) {
                        moderationButton.style.display = 'flex';
                        showAdminMenu = true;
                    } else {
                        moderationButton.style.display = 'none';
                    }
                }

                if (adminMenuContainer) {
                    adminMenuContainer.style.display = showAdminMenu ? 'block' : 'none';
                    if (showAdminMenu && adminToggle) {
                        adminToggle.setAttribute('aria-expanded', 'false');
                    }
                    if (!showAdminMenu) {
                        adminMenuContainer.classList.remove('active');
                        if (adminMenuPanel) {
                            adminMenuPanel.classList.remove('active');
                        }
                        if (adminToggle) {
                            adminToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                }
            } else {
                // Hide both buttons if verification fails
                const adminButton = document.getElementById('adminPanelButton');
                const supportButton = document.getElementById('supportPanelButton');
                const moderationButton = document.getElementById('moderationHubButton');
                const adminMenuContainer = document.getElementById('navAdminContainer');
                if (adminButton) adminButton.style.display = 'none';
                if (supportButton) supportButton.style.display = 'none';
                if (moderationButton) moderationButton.style.display = 'none';
                if (adminMenuContainer) adminMenuContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error verifying access:', error);
            // Keep buttons hidden if verification fails
            const adminButton = document.getElementById('adminPanelButton');
            const supportButton = document.getElementById('supportPanelButton');
            const moderationButton = document.getElementById('moderationHubButton');
            const adminMenuContainer = document.getElementById('navAdminContainer');
            if (adminButton) adminButton.style.display = 'none';
            if (supportButton) supportButton.style.display = 'none';
            if (moderationButton) moderationButton.style.display = 'none';
            if (adminMenuContainer) adminMenuContainer.style.display = 'none';
        });
}

// Global Theme Manager
export function applyTheme(theme) {
    const html = document.documentElement;
    const resolvedTheme = theme || 'dark';

    if (!theme) {
        localStorage.setItem('theme', resolvedTheme);
    }

    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark', 'theme-auto', 'auto-light', 'auto-dark');
    
    // Apply new theme
    html.classList.add(`theme-${resolvedTheme}`);
    
    // Handle auto theme
    if (resolvedTheme === 'auto') {
        handleAutoTheme();
    }
    

}

function handleAutoTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
        const html = document.documentElement;
        if (e.matches) {
            html.classList.add('auto-dark');
            html.classList.remove('auto-light');
        } else {
            html.classList.add('auto-light');
            html.classList.remove('auto-dark');
        }
    };

    // Initial check
    handleChange(mediaQuery);
    
    // Listen for changes if not already listening
    if (!window.themeMediaListener) {
        mediaQuery.addEventListener('change', handleChange);
        window.themeMediaListener = true;
    }
}

// Initialize theme from user data
export async function initializeTheme(userData) {
    const storedTheme = localStorage.getItem('theme');
    const userTheme = userData?.theme || storedTheme || 'dark';

    localStorage.setItem('theme', userTheme);
    applyTheme(userTheme);
}