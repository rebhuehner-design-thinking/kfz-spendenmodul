const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, token } = req.body;

  if (token !== process.env.HARDWARE_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await redis.incrbyfloat('total_amount', amount);
    await redis.incr('donor_count');
    console.log(`Muenzspende erfasst: ${amount} EUR`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Redis error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};
