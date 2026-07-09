const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const total = (await redis.get('total_amount')) || 0;
    const count = (await redis.get('donor_count')) || 0;

    res.status(200).json({
      total_amount: Number(total),
      donor_count: Number(count),
      goal_amount: 1600,
    });
  } catch (err) {
    console.error('Redis error:', err);
    res.status(200).json({
      total_amount: 0,
      donor_count: 0,
      goal_amount: 1600,
    });
  }
};
