const express = require('express');
const Forum = require('../models/Forum');
const router = express.Router();

// GET /api/forums — Public route: list active forums
router.get('/', async (req, res) => {
  try {
    const forums = await Forum.find({ isActive: true })
      .select('name description url language createdAt')
      .sort({ createdAt: -1 });
    res.json({ forums });
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({ message: 'Failed to fetch forums' });
  }
});

module.exports = router;
