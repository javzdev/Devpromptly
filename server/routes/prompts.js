const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const Prompt = require('../models/Prompt');
const User = require('../models/User');
const Report = require('../models/Report');
const notificationService = require('../utils/notificationService');
const { authenticateToken } = require('../middleware/authEnhanced');
const { ratingsRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer — memoria (el buffer se sube directamente a Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
  }
});

// Sube un buffer a Cloudinary y devuelve { url, publicId }
const uploadToCloudinary = (buffer, folder = 'gpromts/prompts') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// Elimina una imagen de Cloudinary dado su public_id (extraído de la URL)
const deleteFromCloudinary = (url) => {
  try {
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/gpromts/prompts/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    if (match) cloudinary.uploader.destroy(match[1]).catch(() => {});
  } catch (_) {}
};

// Solo corre multer si el request es multipart (tiene imágenes)
// Si es JSON normal, multer puede corromper el body
const uploadIfMultipart = (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return upload.array('images', 2)(req, res, next);
  }
  next();
};

// Parsea tags de forma segura — soporta array, JSON string, o string simple
const parseTags = (tags) => {
  if (!tags && tags !== 0) return [];
  if (Array.isArray(tags)) return tags.flat(Infinity).map(String).filter(Boolean);
  if (typeof tags === 'string') {
    try {
      const p = JSON.parse(tags);
      return Array.isArray(p) ? p.flat(Infinity).map(String).filter(Boolean) : [tags];
    } catch { return [tags]; }
  }
  return [];
};


// Get user's favorite prompts (protected) - MUST be before /:id to avoid route conflict
router.get('/user/favorites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const prompts = await Prompt.find({
      _id: { $in: user.favorites },
      status: 'approved'
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ prompts });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// Get user's prompts (protected) - MUST be before /:id to avoid route conflict
router.get('/user/my-prompts', authenticateToken, async (req, res) => {
  try {
    const prompts = await Prompt.find({ author: req.user._id })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({ prompts });
  } catch (error) {
    console.error('Get user prompts error:', error);
    res.status(500).json({ message: 'Failed to fetch your prompts' });
  }
});

// Get all prompts (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      aiTool,
      search,
      sort = 'newest',
      featured
    } = req.query;

    // Build filter
    const filter = { status: 'approved' };

    if (category) filter.category = category;
    if (aiTool) filter.aiTool = aiTool;
    if (featured === 'true') filter.featured = true;

    // NSFW filtering: hide NSFW by default unless user has opted in
    let showNSFW = false;
    try {
      const token = req.cookies?.accessToken;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const u = await User.findById(decoded.id).select('preferences');
        if (u?.preferences?.showNSFW) showNSFW = true;
      }
    } catch (_) { /* anonymous or invalid token — hide NSFW */ }
    if (!showNSFW) filter.isNSFW = { $ne: true };

    // Search functionality
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { 'ratings.average': -1 };
        break;
      case 'favorites':
        sortOption = { favorites: -1 };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const prompts = await Prompt.find(filter)
      .populate('author', 'username avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Prompt.countDocuments(filter);

    res.json({
      prompts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ message: 'Failed to fetch prompts' });
  }
});

// Get single prompt
router.get('/:id', async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id)
      .populate('author', 'username avatar stats')
      .lean();

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    // Only show approved prompts to public
    if (prompt.status !== 'approved') {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    // Increment views
    await Prompt.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ prompt });
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({ message: 'Failed to fetch prompt' });
  }
});

// Create new prompt (protected)
router.post('/', authenticateToken, uploadIfMultipart, async (req, res) => {
  try {
    const {
      title,
      description,
      prompt,
      category,
      aiTool,
      tags,
      isNSFW
    } = req.body;

    // Debug: ver qué llega
    console.log('[CREATE] content-type:', req.headers['content-type']);
    console.log('[CREATE] files recibidos:', req.files?.length ?? 0);

    // Subir imágenes a Cloudinary
    const imageUrls = await Promise.all(
      (req.files || []).map(file => uploadToCloudinary(file.buffer).then(r => r.url))
    );
    console.log('[CREATE] imageUrls guardadas:', imageUrls);

    const parsedTags = parseTags(tags);

    const promptIsNSFW = isNSFW === 'true' || isNSFW === true;
    const newPrompt = await Prompt.create({
      title,
      description,
      prompt,
      category,
      aiTool,
      tags: parsedTags,
      isNSFW: promptIsNSFW,
      images: imageUrls,
      status: promptIsNSFW ? 'pending' : 'approved',
      // Non-NSFW prompts auto-approved — no moderator needed
      moderatedBy: promptIsNSFW ? undefined : req.user._id,
      moderatedAt: promptIsNSFW ? undefined : new Date(),
      author: req.user._id
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.promptsCreated': 1 }
    });

    const populatedPrompt = await Prompt.findById(newPrompt._id)
      .populate('author', 'username avatar');

    if (promptIsNSFW) {
      notificationService.newPendingPrompt(newPrompt._id, title, req.user.username).catch(console.error);
    }

    res.status(201).json({
      message: 'Prompt created successfully',
      prompt: populatedPrompt
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({ 
      message: 'Failed to create prompt',
      error: error.message 
    });
  }
});

// Rate a prompt (protected) - with strict rate limiting to prevent spam
router.post('/:id/rate', authenticateToken, ratingsRateLimiter, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const promptId = req.params.id;
    const userId = req.user._id;

    // Check if user already rated this prompt - atomic check
    const existingRating = await Prompt.findOne({
      _id: promptId,
      'ratings.userRatings.user': userId
    });

    if (existingRating) {
      return res.status(400).json({ 
        message: 'You have already rated this prompt',
        code: 'ALREADY_RATED'
      });
    }

    const prompt = await Prompt.findById(promptId);

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    if (prompt.status !== 'approved') {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    // Add rating using atomic operation
    await prompt.addRating(userId, rating);

    // Get updated prompt
    const updatedPrompt = await Prompt.findById(promptId);

    res.json({
      message: 'Rating added successfully',
      averageRating: updatedPrompt.ratings.average,
      totalRatings: updatedPrompt.ratings.count
    });
  } catch (error) {
    console.error('Rate prompt error:', error);
    res.status(500).json({ message: 'Failed to rate prompt' });
  }
});

// Add to favorites (protected) - usando operaciones atómicas para prevenir race conditions
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const promptId = req.params.id;
    const userId = req.user._id;
    
    // Verificar que el prompt existe y está aprobado
    const prompt = await Prompt.findOne({ 
      _id: promptId, 
      status: 'approved',
      deletedAt: null 
    });

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    const user = await User.findById(userId).select('favorites');
    const isFavorited = user.favorites.some(id => id.toString() === promptId.toString());

    if (isFavorited) {
      await User.findByIdAndUpdate(userId, { $pull: { favorites: promptId } });
      await Prompt.findByIdAndUpdate(promptId, { $inc: { favorites: -1 } });
      res.json({
        message: 'Removed from favorites',
        favorited: false,
        favoritesCount: Math.max(0, prompt.favorites - 1)
      });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { favorites: promptId } });
      await Prompt.findByIdAndUpdate(promptId, { $inc: { favorites: 1 } });
      res.json({
        message: 'Added to favorites',
        favorited: true,
        favoritesCount: prompt.favorites + 1
      });
    }
  } catch (error) {
    console.error('Favorite prompt error:', error);
    res.status(500).json({ message: 'Failed to update favorites' });
  }
});


// Report a prompt (protected)
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const VALID_REASONS = ['spam', 'inappropriate', 'misleading', 'copyright', 'other'];

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({ message: 'A valid reason is required', code: 'INVALID_REASON' });
    }

    if (details && details.length > 500) {
      return res.status(400).json({ message: 'Details cannot exceed 500 characters' });
    }

    const prompt = await Prompt.findOne({ _id: req.params.id, status: 'approved' });
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

    // Prevent self-reporting
    if (prompt.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report your own prompt', code: 'SELF_REPORT' });
    }

    await Report.create({
      reporter: req.user._id,
      targetType: 'prompt',
      targetId: prompt._id,
      reason,
      details: details?.trim() || ''
    });

    notificationService.newReport(prompt._id, prompt.title, req.user.username).catch(console.error);

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reported this prompt', code: 'ALREADY_REPORTED' });
    }
    console.error('Report prompt error:', error);
    res.status(500).json({ message: 'Failed to submit report' });
  }
});

// Update user's own prompt (protected)
router.put('/:id', authenticateToken, uploadIfMultipart, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    if (prompt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this prompt' });
    }

    const { title, description, prompt: promptContent, category, aiTool, tags, existingImages } = req.body;
    if (title !== undefined) prompt.title = title.trim();
    if (description !== undefined) prompt.description = description.trim();
    if (promptContent !== undefined) prompt.prompt = promptContent.trim();
    if (category !== undefined) prompt.category = category;
    if (aiTool !== undefined) prompt.aiTool = aiTool;
    if (tags !== undefined) prompt.tags = parseTags(tags);

    // Handle images: keep existing ones the user kept + add new uploads
    let keptImages = [];
    if (existingImages !== undefined) {
      keptImages = Array.isArray(existingImages) ? existingImages
        : (existingImages ? [existingImages] : []);
    } else {
      keptImages = prompt.images || [];
    }

    // Eliminar de Cloudinary las imágenes que el usuario quitó
    const removedImages = (prompt.images || []).filter(url => !keptImages.includes(url));
    removedImages.forEach(url => deleteFromCloudinary(url));

    // Subir nuevas imágenes a Cloudinary
    const newImageUrls = await Promise.all(
      (req.files || []).map(file => uploadToCloudinary(file.buffer).then(r => r.url))
    );

    const totalImages = [...keptImages, ...newImageUrls];
    if (totalImages.length > 2) {
      return res.status(400).json({ message: 'Maximum 2 reference images allowed' });
    }
    prompt.images = totalImages;

    // Reset to pending after edit so it gets re-moderated
    prompt.status = 'pending';

    await prompt.save();
    res.json({ message: 'Prompt updated successfully', prompt });
  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({ message: 'Failed to update prompt' });
  }
});

// Delete user's own prompt (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    if (prompt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this prompt' });
    }

    // Eliminar imágenes de Cloudinary antes de borrar el documento
    (prompt.images || []).forEach(url => deleteFromCloudinary(url));
    await Prompt.deleteOne({ _id: prompt._id });
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ message: 'Failed to delete prompt' });
  }
});

module.exports = router;
