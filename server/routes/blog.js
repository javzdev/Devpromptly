const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { authenticateToken } = require('../middleware/authEnhanced');

// GET /api/blog — public listing with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 12, search } = req.query;
    const filter = { published: true };

    if (category && category !== 'all') filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const total = await BlogPost.countDocuments(filter);
    const posts = await BlogPost.find(filter)
      .populate('author', 'username avatar')
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-content');

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/blog/:id — single post (increments views)
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'username avatar bio');
    if (!post || !post.published) return res.status(404).json({ message: 'Post not found' });

    await BlogPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/blog/:id/comments — list comments
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .select('comments')
      .populate('comments.author', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blog/:id/comments — add comment (auth required)
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (content.trim().length > 1000) return res.status(400).json({ message: 'Comment too long (max 1000 chars)' });

    const post = await BlogPost.findById(req.params.id);
    if (!post || !post.published) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: req.user.id, content: content.trim() });
    await post.save();

    await post.populate('comments.author', 'username avatar');
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/blog/:id/comments/:commentId — author or admin
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blog — create post (admin/moderator only)
router.post('/', authenticateToken, async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins can publish blog posts' });
  }
  try {
    const { title, excerpt, content, category, coverImage, images, mentions, tags } = req.body;

    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({ message: 'Title, excerpt, content, and category are required' });
    }

    const post = new BlogPost({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      coverImage: coverImage ? coverImage.trim() : '',
      images: Array.isArray(images) ? images.map(u => u.trim()).filter(Boolean) : [],
      mentions: Array.isArray(mentions) ? mentions : [],
      tags: tags ? tags.map((t) => t.toLowerCase().trim()).filter(Boolean) : [],
      author: req.user.id,
    });

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/blog/:id — update post (author or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const editableFields = ['title', 'excerpt', 'content', 'category', 'coverImage', 'images', 'mentions', 'tags'];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });

    if (['admin', 'moderator'].includes(req.user.role)) {
      if (req.body.featured !== undefined) post.featured = req.body.featured;
      if (req.body.published !== undefined) post.published = req.body.published;
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/blog/:id — author or admin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blog/:id/like — toggle like
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(idx, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
