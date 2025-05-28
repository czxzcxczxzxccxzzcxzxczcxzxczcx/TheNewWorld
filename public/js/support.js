import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    // Check for query params
    const params = new URLSearchParams(window.location.search);
    const donationPanel = document.querySelector('.donationPanel');
    if (params.get('success') === 'true') {
        if (donationPanel) {
            donationPanel.innerHTML = '<h1 class="donationTitle">Thank you for donating!</h1><p class="donationDescription">Your support helps us keep The New World running and growing.</p>';
        }
        return;
    } else if (params.get('canceled') === 'true') {
        if (donationPanel) {
            donationPanel.innerHTML = '<h1 class="donationTitle">Donation canceled</h1><p class="donationDescription">You canceled the donation process. If this was a mistake, please try again.</p>';
        }
        return;
    }

    let accountNumber;
    var gebid = document.getElementById.bind(document);
    const button = gebid("donate");
    const amountInput = gebid("amount");
    const donationForm = gebid("donationForm");
    apiRequest('/api/getUserInfo', 'GET')
        .then(data => {
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
                initializeGlobalButtons(accountNumber); // Initialize global buttons
                initializeCreatePost(user.accountNumber);
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });

    if (donationForm) {
        donationForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent form from refreshing the page
            try {
                // Ensure Stripe.js is loaded
                if (!window.Stripe) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://js.stripe.com/v3/';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
                let amount = 5;
                if (amountInput && amountInput.value) {
                    amount = parseFloat(amountInput.value);
                    if (isNaN(amount) || amount < 1) amount = 5;
                }
                const res = await fetch('/api/create-stripe-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount })
                });
                const { id } = await res.json();
                const stripe = window.Stripe('pk_test_51RTbXt2UpgRLI2h7IU7KCsIGfvkPHHvNXieT3FG9VXSejy6T50F73pwNbK0nFLhOPK9zV2TOyvxgVznJrEzYxscz00Y9fmxBcL'); // Replace with your Stripe publishable key
                await stripe.redirectToCheckout({ sessionId: id });
            } catch (err) {
                alert('Error starting donation: ' + err.message);
            }
        });
    }
});