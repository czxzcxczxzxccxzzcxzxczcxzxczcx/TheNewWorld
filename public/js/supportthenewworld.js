import { apiRequest } from './utils/apiRequest.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    // Check for query params from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        showSuccessMessage();
        return;
    } else if (params.get('canceled') === 'true') {
        showCanceledMessage();
        return;
    }

    initializeAuth()
        .then(user => {
            initializeDonationPage();
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
        });
});

function initializeDonationPage() {
    setupDonationForm();
    setupBackButton();
}

function setupDonationForm() {
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processDonation();
        });
    }
}

function setupBackButton() {
    const backBtn = document.getElementById('backToSupport');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/support';
        });
    }
}

async function processDonation() {
    const amount = document.getElementById('donationAmount').value;
    const donorName = document.getElementById('donorName').value;
    const message = document.getElementById('donorMessage').value;
    
    if (!amount || amount < 1) {
        showNotification('Please enter a valid donation amount', 'error');
        return;
    }
    
    try {
        // Ensure Stripe.js is loaded
        if (!window.Stripe) {
            await loadStripe();
        }
        
        // Create payment session
        const data = await apiRequest('/api/payment/create-payment', 'POST', {
            amount: parseFloat(amount),
            donorName: donorName || null,
            message: message || null
        });
        
        if (data.success) {
            const stripe = Stripe(data.publishableKey);
            const { error } = await stripe.redirectToCheckout({
                sessionId: data.sessionId
            });
            
            if (error) {
                showNotification('Payment failed: ' + error.message, 'error');
            }
        } else {
            showNotification(data.message || 'Failed to create payment session', 'error');
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        showNotification('Failed to process payment', 'error');
    }
}

function loadStripe() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function showSuccessMessage() {
    const wrapper = document.querySelector('.donation-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="donation-success">
                <div class="success-icon">✅</div>
                <h1>Thank You for Your Support!</h1>
                <p>Your donation helps us keep The New World running and growing. We truly appreciate your generosity!</p>
                <button onclick="window.location.href='/home'" class="btn primary">
                    Return to Home
                </button>
            </div>
        `;
    }
}

function showCanceledMessage() {
    const wrapper = document.querySelector('.donation-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="donation-canceled">
                <div class="canceled-icon">❌</div>
                <h1>Donation Canceled</h1>
                <p>You canceled the donation process. If this was a mistake, you can try again.</p>
                <div class="canceled-actions">
                    <button onclick="window.location.reload()" class="btn primary">
                        Try Again
                    </button>
                    <button onclick="window.location.href='/home'" class="btn secondary">
                        Return to Home
                    </button>
                </div>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}