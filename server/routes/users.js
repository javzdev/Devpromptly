const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Prompt = require('../models/Prompt');
const { authenticateToken } = require('../middleware/authEnhanced');
const PasswordValidator = require('../utils/passwordValidator');
const router = express.Router();


// Get user profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email')
      .populate('favorites', 'title description category aiTool ratings.average favorites createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's approved prompts
    const userPrompts = await Prompt.find({ 
      author: user._id, 
      status: 'approved' 
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 });

    res.json({
      user: {
        ...user.toJSON(),
        prompts: userPrompts
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update user profile (protected)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, avatar, bio } = req.body;
    const user = req.user;

    // Check if username is already taken (if changing)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    if (avatar) {
      // Only allow HTTPS URLs to prevent javascript: and data: schemes
      try {
        const url = new URL(avatar);
        if (url.protocol !== 'https:') {
          return res.status(400).json({ message: 'Avatar must be a valid HTTPS URL' });
        }
      } catch {
        return res.status(400).json({ message: 'Avatar must be a valid HTTPS URL' });
      }
      user.avatar = avatar;
    }
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password (protected)
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    // Unified password validation
    const passwordValidation = PasswordValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'New password is too weak',
        errors: passwordValidation.errors 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Delete account (protected)
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'Password is required to delete account' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Use transaction for consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete user's prompts
      await Prompt.deleteMany({ author: user._id }).session(session);

      // Delete user
      await User.findByIdAndDelete(user._id).session(session);

      await session.commitTransaction();
      
      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Get user statistics (protected)
router.get('/stats/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    const stats = await Promise.all([
      Prompt.countDocuments({ author: user._id, status: 'approved' }),
      Prompt.countDocuments({ author: user._id, status: 'pending' }),
      Prompt.countDocuments({ author: user._id, status: 'rejected' }),
      Prompt.aggregate([
        { $match: { author: user._id, status: 'approved' } },
        { $group: { _id: null, totalFavorites: { $sum: '$favorites' } } }
      ]),
      Prompt.aggregate([
        { $match: { author: user._id, status: 'approved' } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ])
    ]);

    const [
      approvedPrompts,
      pendingPrompts,
      rejectedPrompts,
      favoritesResult,
      viewsResult
    ] = stats;

    const totalFavorites = favoritesResult.length > 0 ? favoritesResult[0].totalFavorites : 0;
    const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

    res.json({
      stats: {
        approvedPrompts,
        pendingPrompts,
        rejectedPrompts,
        totalFavorites,
        totalViews,
        favoriteCount: user.favorites.length
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Update user preferences (protected)
router.patch('/preferences', authenticateToken, async (req, res) => {
  try {
    const { showNSFW } = req.body;
    if (typeof showNSFW !== 'boolean') {
      return res.status(400).json({ message: 'showNSFW must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'preferences.showNSFW': showNSFW } },
      { new: true }
    ).select('preferences');
    res.json({ preferences: user.preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

module.exports = router;
