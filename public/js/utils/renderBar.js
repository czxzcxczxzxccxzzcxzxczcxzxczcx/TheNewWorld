import { apiRequest } from './apiRequest.js';
import { getVerifiedUsernameHTML } from './verifiedBadge.js';

export function renderBar() {
    console.log("WARNING WARNING WARNING WARNING WARNING WARNING WARNING\nWARNING WARNING WARNING WARNING WARNING WARNING WARNING\n\nThis is your browser's developer console. If someone told you to paste something here, it could be a scam.\n\nNever share anything from this console unless you understand exactly what it does");

    // Initialize theme from localStorage or default to auto
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme);

    const barHTML = `
        <div class="bar">
            <ul>
                <div class="logo-section">
                    <img class="logoImg" src="/src/TNW.png" alt="Logo" />
                    <h1 class="logo" id="checkPost">The New World</h1>
                </div>
                <div class="nav-controls">
                    <!-- Search Button -->
                    <div class="nav-search-container" id="navSearchContainer">
                        <button class="nav-icon-btn" id="searchToggle">
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

                    <!-- Admin Button -->
                    <div class="nav-menu-container nav-admin-container" id="navAdminContainer" style="display: none;">
                        <button class="nav-icon-btn" id="adminToggle" aria-haspopup="true" aria-expanded="false">
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
                    <div class="nav-menu-container" id="navMenuContainer">
                        <button class="nav-icon-btn" id="menuToggle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        
                        <!-- Expandable Menu Panel -->
                        <div class="nav-menu-panel" id="navMenuPanel">
                            <a href="/home" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                                </svg>
                                <span>Home</span>
                            </a>
                            <a id="createPostButton" class="nav-menu-item">
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
                            <a href="" id="profileButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>My Profile</span>
                            </a>
                            <a href="/settings" id="settingsButton" class="nav-menu-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                                <span>Settings</span>
                            </a>
                            <a href="/support" id="supportPageButton" class="nav-menu-item">
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
                            <a id="logoutButton" href="" class="nav-menu-item logout">
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
            </ul>
        </div>
    `;

    const body = document.body;
    const barContainer = document.createElement('div');
    barContainer.innerHTML = barHTML;
    body.insertBefore(barContainer, body.firstChild);
    
    // Initialize dynamic navigation functionality
    initializeNavControls();

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
    
    const searchContainer = document.getElementById('navSearchContainer');
    const searchPanel = document.getElementById('navSearchPanel');
    const searchInput = document.getElementById('navSearchInput');
    const searchResults = document.getElementById('navSearchResults');
    const searchTypeBtns = document.querySelectorAll('.search-type-btn');
    
    const menuContainer = document.getElementById('navMenuContainer');
    const menuPanel = document.getElementById('navMenuPanel');
    const menuToggle = document.getElementById('menuToggle');

    const adminContainer = document.getElementById('navAdminContainer');
    const adminPanel = document.getElementById('navAdminPanel');
    const adminToggle = document.getElementById('adminToggle');
    
    let searchTimeout;
    let currentSearchType = 'posts';
    
    // Search functionality
    if (searchContainer && searchPanel) {
        // Mouse enter search container
        searchContainer.addEventListener('mouseenter', () => {
            searchPanel.classList.add('active');
            searchInput.focus();
        });
        
        // Mouse leave search container
        searchContainer.addEventListener('mouseleave', () => {
            searchPanel.classList.remove('active');
            searchResults.innerHTML = '';
            searchInput.value = '';
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
        
        // Prevent search panel from closing when clicking inside it
        searchPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Menu functionality
    if (menuContainer && menuPanel) {
        const openMenu = () => {
            menuPanel.classList.add('active');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'true');
            }
        };

        const closeMenu = () => {
            menuPanel.classList.remove('active');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        };

        // Mouse enter menu container
        menuContainer.addEventListener('mouseenter', openMenu);
        
        // Mouse leave menu container
        menuContainer.addEventListener('mouseleave', closeMenu);

        if (menuToggle) {
            menuToggle.setAttribute('aria-haspopup', 'true');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.addEventListener('click', (event) => {
                event.preventDefault();
                const willOpen = !menuPanel.classList.contains('active');
                menuPanel.classList.toggle('active', willOpen);
                menuToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });
        }
        
        // Prevent menu panel from closing when clicking inside it
        menuPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (adminContainer && adminPanel) {
        const openAdminMenu = () => {
            adminPanel.classList.add('active');
            if (adminToggle) {
                adminToggle.setAttribute('aria-expanded', 'true');
            }
        };

        const closeAdminMenu = () => {
            adminPanel.classList.remove('active');
            if (adminToggle) {
                adminToggle.setAttribute('aria-expanded', 'false');
            }
        };

        adminContainer.addEventListener('mouseenter', openAdminMenu);
        adminContainer.addEventListener('mouseleave', closeAdminMenu);

        if (adminToggle) {
            adminToggle.addEventListener('click', (event) => {
                event.preventDefault();
                const willOpen = !adminPanel.classList.contains('active');
                adminPanel.classList.toggle('active', willOpen);
                adminToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });
        }

        adminPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
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

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
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
    }

    const profileButton = document.getElementById("profileButton");
    if (profileButton) {
        profileButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (accountNumber) {
                window.location.href = `/profile/${accountNumber}`;
            }
        });
    }

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
    
    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark', 'theme-auto', 'auto-light', 'auto-dark');
    
    // Apply new theme
    html.classList.add(`theme-${theme}`);
    
    // Handle auto theme
    if (theme === 'auto') {
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
    const userTheme = userData?.theme || 'auto';
    applyTheme(userTheme);
}