const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/authEnhanced');
const router = express.Router();

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const { sort = 'recent', limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortOption = sort === 'trending' ? { saves: -1 } : { createdAt: -1 };

    const [projects, total] = await Promise.all([
      Project.find()
        .populate('creator', 'username avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Project.countDocuments()
    ]);

    res.json({ projects, total, page: parseInt(page) });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// GET /api/projects/my - Get current user's projects
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ creator: req.user._id })
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ projects });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ message: 'Failed to fetch your projects' });
  }
});

// POST /api/projects - Create a project
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, description, image, languages } = req.body;

    const project = await Project.create({
      title,
      description,
      image: image || null,
      languages: languages || [],
      creator: req.user._id
    });

    await project.populate('creator', 'username avatar');

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('languages').optional().isArray(),
  body('image').optional({ checkFalsy: true }).isURL()
], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, image, languages } = req.body;
    if (title) project.title = title;
    if (description) project.description = description;
    if (image !== undefined) project.image = image || null;
    if (languages) project.languages = languages;

    await project.save();
    await project.populate('creator', 'username avatar');

    res.json({ message: 'Project updated', project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.creator.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/save - Toggle save
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const userId = req.user._id.toString();
    const alreadySaved = project.savedBy.some(id => id.toString() === userId);

    if (alreadySaved) {
      project.savedBy = project.savedBy.filter(id => id.toString() !== userId);
      project.saves = Math.max(0, project.saves - 1);
    } else {
      project.savedBy.push(req.user._id);
      project.saves += 1;
    }

    await project.save();
    res.json({ saved: !alreadySaved, saves: project.saves });
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({ message: 'Failed to save project' });
  }
});

module.exports = router;
