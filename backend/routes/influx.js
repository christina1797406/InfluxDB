const express = require('express');
const { bucketsAPI } = require('../utils/influx.config');

const router = express.Router();

console.log('influx.routes.js is running');

router.get('/buckets', async (req, res) => {
  console.log('GET /buckets route hit');

  try {
    const response = await bucketsAPI.getBuckets();

    const buckets = response.buckets
       .filter(bucket => !bucket.name.startsWith('_'))
       .map(bucket => ({
           id: bucket.id,
           name: bucket.name
    }));

    res.json(buckets);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({ message: 'Failed to fetch buckets' });
  }
});

module.exports = router;
