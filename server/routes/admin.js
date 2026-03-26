const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Prompt = require('../models/Prompt');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Forum = require('../models/Forum');
const AITool = require('../models/AITool');
const Report = require('../models/Report');
const notificationService = require('../utils/notificationService');
const router = express.Router();

const { authenticateAdmin, authenticateSuperAdmin } = require('../middleware/authEnhanced');

// Helper function to create audit log
const createAuditLog = async (req, action, targetType, targetId, details = {}, reason = null) => {
  try {
    await AuditLog.create({
      action,
      targetType,
      targetId,
      performedBy: req.admin?._id || req.user?._id,
      performedByUsername: req.admin?.username || req.user?.username,
      performedByRole: req.admin?.role || req.user?.role,
      details,
      reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Get dashboard stats
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      Prompt.countDocuments({ status: 'pending' }),
      Prompt.countDocuments({ status: 'approved' }),
      Prompt.countDocuments({ status: 'rejected' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Prompt.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$ratings.average' } } }
      ])
    ]);

    const [
      pendingPrompts,
      approvedPrompts,
      rejectedPrompts,
      activeUsers,
      inactiveUsers,
      avgRatingResult
    ] = stats;

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    // Recent activity
    const recentPrompts = await Prompt.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      pendingPrompts,
      approvedPrompts,
      rejectedPrompts,
      activeUsers,
      inactiveUsers,
      avgRating: Math.round(avgRating * 10) / 10,
      recentActivity: {
        prompts: recentPrompts,
        users: recentUsers
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Get pending prompts for moderation - returns complete prompt data
router.get('/prompts/pending', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const prompts = await Prompt.find({ status: 'pending' })
      .populate('author', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean() for better performance and complete data

    const total = await Prompt.countDocuments({ status: 'pending' });

    res.json({
      prompts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get pending prompts error:', error);
    res.status(500).json({ message: 'Failed to fetch pending prompts' });
  }
});

// Approve prompt with improved logging
router.post('/prompts/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id).populate('author', 'username');

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    if (prompt.status !== 'pending') {
      return res.status(400).json({ message: 'Prompt is not pending' });
    }

    prompt.status = 'approved';
    prompt.moderatedBy = req.user._id;
    prompt.moderatedAt = new Date();
    prompt.rejectionReason = undefined;

    await prompt.save();

    await createAuditLog(req, 'approve', 'prompt', prompt._id, {
      title: prompt.title,
      author: prompt.author?._id,
      authorUsername: prompt.author?.username || 'Unknown',
      previousStatus: 'pending',
      newStatus: 'approved'
    });

    notificationService.promptApproved(prompt).catch(console.error);

    res.json({
      message: 'Prompt approved successfully',
      prompt
    });
  } catch (error) {
    console.error('Approve prompt error:', error);
    res.status(500).json({ message: 'Failed to approve prompt' });
  }
});

// Reject prompt - reason now optional
router.post('/prompts/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { reason = '' } = req.body;

    const prompt = await Prompt.findById(req.params.id);

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    if (prompt.status !== 'pending') {
      return res.status(400).json({ message: 'Prompt is not pending' });
    }

    prompt.status = 'rejected';
    prompt.moderatedBy = req.user._id;
    prompt.moderatedAt = new Date();
    prompt.rejectionReason = reason || undefined;

    await prompt.save();

    notificationService.promptRejected(prompt, reason).catch(console.error);

    await createAuditLog(req, 'reject', 'prompt', prompt._id, {
      title: prompt.title,
      author: prompt.author,
      authorUsername: prompt.authorUsername || 'Unknown',
      previousStatus: 'pending',
      newStatus: 'rejected',
      reason: reason || 'No reason provided'
    }, reason);

    res.json({
      message: 'Prompt rejected successfully',
      prompt
    });
  } catch (error) {
    console.error('Reject prompt error:', error);
    res.status(500).json({ message: 'Failed to reject prompt' });
  }
});

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      if (typeof search !== 'string' || search.length > 100) {
        return res.status(400).json({ message: 'Invalid search parameter' });
      }
      // Sanitize search to prevent Regex injection/ReDoS
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { username: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Toggle user status (activate/deactivate)
router.post('/users/:id/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate admin user' });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Create audit log
    await createAuditLog(req, 'toggle_status', 'user', user._id, {
      username: user.username,
      previousStatus: !user.isActive,
      newStatus: user.isActive
    });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete prompt (soft delete) with improved logging
router.delete('/prompts/:id', authenticateAdmin, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id).populate('author', 'username');

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    // Soft delete using the method from Prompt model
    prompt.deletedAt = new Date();
    prompt.status = 'rejected';
    prompt.rejectionReason = 'Eliminado por un administrador'; // Required when status is 'rejected'
    prompt.moderatedBy = req.user._id;
    prompt.moderatedAt = new Date();
    await prompt.save();

    // Create audit log with admin and author info
    await createAuditLog(req, 'delete', 'prompt', prompt._id, {
      title: prompt.title,
      author: prompt.author?._id,
      authorUsername: prompt.author?.username || 'Unknown',
      deletedAt: new Date()
    });

    res.json({
      message: 'Prompt deleted successfully'
    });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ message: 'Failed to delete prompt' });
  }
});

// Get reports
router.get('/reports', authenticateAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const validStatuses = ['pending', 'resolved', 'dismissed', 'all'];
    const filter = validStatuses.includes(status) && status !== 'all' ? { status } : {};

    const reports = await Report.find(filter)
      .populate('reporter', 'username avatar')
      .populate('resolvedBy', 'username')
      .populate({ path: 'targetId', model: 'Prompt', select: 'title author status', populate: { path: 'author', select: 'username' } })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);
    const pendingCount = await Report.countDocuments({ status: 'pending' });

    res.json({ reports, total, pendingCount, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Resolve report (take action on the prompt)
router.post('/reports/:id/resolve', authenticateAdmin, async (req, res) => {
  try {
    const { action, resolutionNote } = req.body;
    const VALID_ACTIONS = ['delete_prompt', 'warn_author', 'no_action'];

    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ message: 'Valid action required: delete_prompt, warn_author, no_action' });
    }

    const report = await Report.findById(req.params.id).populate('targetId');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ message: 'Report already processed' });

    if (action === 'delete_prompt' && report.targetId) {
      await Prompt.findByIdAndDelete(report.targetId._id);
      await Report.updateMany(
        { targetId: report.targetId._id, status: 'pending' },
        { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date(), resolutionNote: resolutionNote || '' }
      );
      await createAuditLog(req, 'delete', 'prompt', report.targetId._id, { reason: 'Resolved via report', reportId: report._id });
    } else {
      report.status = 'resolved';
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
      report.resolutionNote = resolutionNote?.trim() || '';
      await report.save();

      if (action === 'warn_author' && report.targetId) {
        notificationService.warnAuthor(report.targetId, resolutionNote?.trim()).catch(console.error);
      }
    }

    res.json({ message: 'Report resolved successfully' });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ message: 'Failed to resolve report' });
  }
});

// Dismiss report (no issue found)
router.post('/reports/:id/dismiss', authenticateAdmin, async (req, res) => {
  try {
    const { resolutionNote } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ message: 'Report already processed' });

    report.status = 'dismissed';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    report.resolutionNote = resolutionNote?.trim() || '';
    await report.save();

    res.json({ message: 'Report dismissed' });
  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(500).json({ message: 'Failed to dismiss report' });
  }
});

// Get all moderators
router.get('/moderators', authenticateSuperAdmin, async (req, res) => {
  try {
    const moderators = await User.find({ role: 'moderator', isActive: true })
      .select('-password -refreshToken');
    res.json({ moderators });
  } catch (error) {
    console.error('Get moderators error:', error);
    res.status(500).json({ message: 'Failed to fetch moderators' });
  }
});

// Add moderator
router.post('/moderators', authenticateSuperAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'moderator';
    await user.save();

    await createAuditLog(req, 'add_moderator', 'user', user._id, {
      username: user.username,
      email: user.email
    });

    res.json({ message: 'Moderator added successfully', user });
  } catch (error) {
    console.error('Add moderator error:', error);
    res.status(500).json({ message: 'Failed to add moderator' });
  }
});

// Remove moderator role
router.delete('/moderators/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Moderator not found' });
    }

    if (user.role !== 'moderator') {
      return res.status(400).json({ message: 'User is not a moderator' });
    }

    user.role = 'user';
    await user.save();

    await createAuditLog(req, 'remove_moderator', 'user', user._id, {
      username: user.username,
      email: user.email
    });

    res.json({ message: 'Moderator role removed successfully' });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({ message: 'Failed to remove moderator' });
  }
});

// Get moderation log
router.get('/moderation-log', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const actions = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('performedBy', 'username avatar');
    
    const total = await AuditLog.countDocuments();

    res.json({
      actions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get moderation log error:', error);
    res.status(500).json({ message: 'Failed to fetch moderation log' });
  }
});

// =====================
// FORUMS MANAGEMENT
// =====================

// GET /api/admin/forums — list all forums
router.get('/forums', authenticateAdmin, async (req, res) => {
  try {
    const forums = await Forum.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json({ forums });
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({ message: 'Failed to fetch forums' });
  }
});

// POST /api/admin/forums — create a new forum
router.post('/forums', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, url, image, favicon } = req.body;
    if (!name || !description || !url) {
      return res.status(400).json({ message: 'Name, description and URL are required' });
    }

    const forum = await Forum.create({
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      image: image || null,
      favicon: favicon || null,
      isActive: true,
      createdBy: req.user._id
    });

    await createAuditLog(req, 'create_forum', 'forum', forum._id, { name: forum.name });

    res.status(201).json({ message: 'Forum created successfully', forum });
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({ message: 'Failed to create forum' });
  }
});

// PUT /api/admin/forums/:id — update a forum
router.put('/forums/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, url, isActive, image, favicon } = req.body;
    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    if (name !== undefined) forum.name = name.trim();
    if (description !== undefined) forum.description = description.trim();
    if (url !== undefined) forum.url = url.trim();
    if (isActive !== undefined) forum.isActive = isActive;
    if (image !== undefined) forum.image = image;
    if (favicon !== undefined) forum.favicon = favicon;

    await forum.save();

    await createAuditLog(req, 'update_forum', 'forum', forum._id, { name: forum.name });

    res.json({ message: 'Forum updated successfully', forum });
  } catch (error) {
    console.error('Update forum error:', error);
    res.status(500).json({ message: 'Failed to update forum' });
  }
});

// DELETE /api/admin/forums/:id — delete a forum
router.delete('/forums/:id', authenticateAdmin, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }

    await Forum.deleteOne({ _id: forum._id });

    await createAuditLog(req, 'delete_forum', 'forum', forum._id, { name: forum.name });

    res.json({ message: 'Forum deleted successfully' });
  } catch (error) {
    console.error('Delete forum error:', error);
    res.status(500).json({ message: 'Failed to delete forum' });
  }
});

// =====================
// AI TOOLS MANAGEMENT
// =====================

// GET /api/admin/tools — list all tools
router.get('/tools', authenticateAdmin, async (req, res) => {
  try {
    const tools = await AITool.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ message: 'Failed to fetch tools' });
  }
});

// POST /api/admin/tools — create a new tool
router.post('/tools', authenticateAdmin, async (req, res) => {
  try {
    const { name, url, description, category, featured } = req.body;
    if (!name || !url || !description) {
      return res.status(400).json({ message: 'Name, URL and description are required' });
    }

    const tool = await AITool.create({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      category: category || 'other',
      featured: !!featured,
      isActive: true,
      createdBy: req.user._id
    });

    await createAuditLog(req, 'create_tool', 'tool', tool._id, { name: tool.name });

    res.status(201).json({ message: 'Tool created successfully', tool });
  } catch (error) {
    console.error('Create tool error:', error);
    res.status(500).json({ message: 'Failed to create tool' });
  }
});

// PUT /api/admin/tools/:id — update a tool
router.put('/tools/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, url, description, category, isActive, featured } = req.body;
    const tool = await AITool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    if (name !== undefined) tool.name = name.trim();
    if (url !== undefined) tool.url = url.trim();
    if (description !== undefined) tool.description = description.trim();
    if (category !== undefined) tool.category = category;
    if (isActive !== undefined) tool.isActive = isActive;
    if (featured !== undefined) tool.featured = featured;

    await tool.save();

    await createAuditLog(req, 'update_tool', 'tool', tool._id, { name: tool.name });

    res.json({ message: 'Tool updated successfully', tool });
  } catch (error) {
    console.error('Update tool error:', error);
    res.status(500).json({ message: 'Failed to update tool' });
  }
});

// DELETE /api/admin/tools/:id — delete a tool
router.delete('/tools/:id', authenticateAdmin, async (req, res) => {
  try {
    const tool = await AITool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    await AITool.deleteOne({ _id: tool._id });

    await createAuditLog(req, 'delete_tool', 'tool', tool._id, { name: tool.name });

    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Delete tool error:', error);
    res.status(500).json({ message: 'Failed to delete tool' });
  }
});

module.exports = router;
