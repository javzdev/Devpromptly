const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/authEnhanced');
const router = express.Router();

// GET /api/notifications — user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { recipient: req.user._id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, read: false })
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count — lightweight poll
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch count' });
  }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.updateOne(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// DELETE /api/notifications/:id — delete one
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;
