const express = require('express');
const AITool = require('../models/AITool');
const router = express.Router();

// GET /api/tools — Public: list all active tools
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const tools = await AITool.find(filter)
      .select('name url description category featured createdAt')
      .sort({ featured: -1, createdAt: -1 });

    res.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ message: 'Failed to fetch tools' });
  }
});

module.exports = router;
