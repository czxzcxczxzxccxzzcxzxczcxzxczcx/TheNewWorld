import { apiRequest } from './utils/apiRequest.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

// Render navigation bar
renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    // Initialize authentication
    initializeAuth()
        .then(user => {
            accountNumber = user.accountNumber;
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
        });

    // Set up button event listeners
    setupEventListeners();
    
    // Add some fun animations
    initializeAnimations();
});

function setupEventListeners() {
    // Go Home button
    const goHomeBtn = document.getElementById('goHome');
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', function() {
            window.location.href = '/home';
        });
    }

    // Go Back button
    const goBackBtn = document.getElementById('goBack');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/home';
            }
        });
    }

    // Report Issue button
    const reportIssueBtn = document.getElementById('reportIssue');
    if (reportIssueBtn) {
        reportIssueBtn.addEventListener('click', function() {
            // const subject = encodeURIComponent('404 Error Report');
            // const body = encodeURIComponent(`I encountered a 404 error on:\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}`);
            // window.location.href = `mailto:thenewworld.help@gmail.com?subject=${subject}&body=${body}`;
            window.location.href = '/support';
        });
    }
}

function initializeAnimations() {
    // Add wobble animation to 404 numbers
    const errorCode = document.querySelector('.error-code');
    if (errorCode) {
        setTimeout(() => {
            errorCode.classList.add('animate');
        }, 500);
    }

    // Add stagger animation to action buttons
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach((btn, index) => {
        setTimeout(() => {
            btn.classList.add('animate-in');
        }, 1000 + (index * 200));
    });
}