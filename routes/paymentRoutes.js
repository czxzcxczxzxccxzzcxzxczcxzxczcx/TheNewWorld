require('dotenv').config()

const express = require('express');
const router = express.Router();

// Stripe setup
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Properly initialize Stripe

const DEPLOYED_URL = 'https://special-succotash-4rqg7qxj5qr3jprg-1111.app.github.dev';

// Create Stripe Checkout session
router.post('/create-stripe-session', async (req, res) => {
    try {
        // Accept amount from request body (in dollars), default to 5 if not provided or invalid
        let amount = Number(req.body.amount);
        if (isNaN(amount) || amount < 1) {
            amount = 5; // Minimum $1
            console.log('Invalid amount provided, defaulting to $5');
        }
        const amountInCents = Math.round(amount * 100);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Donation to The New World',
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${DEPLOYED_URL}/support?success=true`,
            cancel_url: `${DEPLOYED_URL}/support?canceled=true`,
        });
        res.json({ id: session.id });
    } catch (err) {
        console.error('Stripe session error:', err);
        res.status(500).json({ error: 'Unable to create Stripe session' });
    }
});

// PayPal is handled client-side with smart buttons, so no server route is needed for basic donations.

module.exports = router;
