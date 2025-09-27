import { renderBar } from './utils/renderBar.js';

// Render the navigation bar
renderBar();

document.addEventListener('DOMContentLoaded', function() {
    // Back to home button functionality
    const backToHomeBtn = document.getElementById('backToHome');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function() {
            window.location.href = '/home';
        });
    }

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
});