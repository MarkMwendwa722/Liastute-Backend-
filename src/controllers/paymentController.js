const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
  }
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
};
const { Order } = require('../models');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required.' });

    const order = await Order.findOne({ where: { id: orderId, userId: req.session.userId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid.' });
    }

    const amountInCents = Math.round(parseFloat(order.total) * 100);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: process.env.STRIPE_CURRENCY || 'usd',
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId: req.session.userId },
    });

    await order.update({ stripePaymentIntentId: paymentIntent.id });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    return next(err);
  }
};

const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const order = await Order.findOne({ where: { stripePaymentIntentId: pi.id } });
        if (order) {
          await order.update({ paymentStatus: 'paid', status: 'confirmed', paymentMethod: 'card' });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const order = await Order.findOne({ where: { stripePaymentIntentId: pi.id } });
        if (order) await order.update({ paymentStatus: 'failed' });
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createPaymentIntent, stripeWebhook };
