const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, name } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Ungültiger Betrag' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Spende – KFZ Marburg',
              description: name ? `Spende von ${name}` : 'Anonyme Spende',
            },
            unit_amount: amount * 100, // Stripe erwartet Cent
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.BASE_URL}/danke.html?success=1&amount=${amount}&name=${encodeURIComponent(name || 'Anonym')}`,
      cancel_url: `${process.env.BASE_URL}/danke.html?cancelled=1`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe-Fehler' });
  }
};
