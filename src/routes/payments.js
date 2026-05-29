const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');

// Webhook must receive raw body — registered before json middleware in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected payment routes
router.post('/create-payment-intent', isAuthenticated, createPaymentIntent);

module.exports = router;
