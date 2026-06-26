const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      let rawBody = '';
      await new Promise((resolve, reject) => {
        req.on('data', chunk => { rawBody += chunk; });
        req.on('end', resolve);
        req.on('error', reject);
      });
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amountEur = session.amount_total / 100;

    try {
      await redis.incrbyfloat('total_amount', amountEur);
      await redis.incr('donor_count');
      console.log(`Spende erfasst: ${amountEur} EUR`);
    } catch (err) {
      console.error('Redis write error:', err);
    }
  }

  res.status(200).json({ received: true });
};
