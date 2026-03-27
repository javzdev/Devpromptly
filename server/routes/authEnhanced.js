const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const {
  authenticateToken,
  refreshTokenMiddleware
} = require('../middleware/authEnhanced');
const { 
  setTokenCookie, 
  setRefreshTokenCookie, 
  clearTokenCookies,
  generateCSRFToken 
} = require('../middleware/session');
const { authRateLimiter, passwordResetRateLimiter } = require('../middleware/rateLimiter');
const { passwordValidator } = require('../utils/passwordValidator');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/emailService');
const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Generate email verification token
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .custom((value) => {
      const validation = passwordValidator.validate(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    })
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const newPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .custom((value) => {
      const validation = passwordValidator.validate(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    })
];

// Register
router.post('/register', authRateLimiter, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        requirements: passwordValidator.getRequirementsMessage()
      });
    }

    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email or username already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password
    });

    // Generate email verification token
    const emailVerificationToken = generateEmailVerificationToken();
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    setTokenCookie(res, token);
    setRefreshTokenCookie(res, refreshToken);

    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    // Remove sensitive data from output
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationExpires;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      emailVerificationRequired: !user.emailVerified,
      csrfToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'User with this email or username already exists',
        code: 'DUPLICATE_USER'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login
router.post('/login', authRateLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with password and lock info
    const user = await User.findOne({ email })
      .select('+password +refreshToken +loginAttempts +lockUntil +emailVerified');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(429).json({
        message: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      }
      
      await user.save();
      
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        attemptsRemaining: Math.max(0, 5 - user.loginAttempts)
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    setTokenCookie(res, token);
    setRefreshTokenCookie(res, refreshToken);

    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    // Remove sensitive data from output
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.loginAttempts;
    delete userResponse.lockUntil;

    // Set session userId for cleanup/persistence monitoring
    req.session.userId = user._id;

    res.json({
      message: 'Login successful',
      user: userResponse,
      emailVerificationRequired: !user.emailVerified,
      csrfToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', refreshTokenMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new cookies
    setTokenCookie(res, newToken);
    setRefreshTokenCookie(res, newRefreshToken);

    // Generate new CSRF token
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    res.json({
      message: 'Token refreshed successfully',
      csrfToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    
    // Clear all cookies
    clearTokenCookies(res);
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if DB update fails
    clearTokenCookies(res);
    res.json({
      message: 'Logout successful'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires')
      .lean();
    
    res.json({
      user
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      message: 'Failed to get user data',
      code: 'USER_DATA_ERROR'
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('avatar')
    .optional()
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Avatar must be a valid HTTPS URL'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, avatar, bio } = req.body;
    const user = req.user;

    // Check if username is already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          message: 'Username is already taken',
          code: 'USERNAME_TAKEN'
        });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;
    delete updatedUser.refreshToken;

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .custom((value) => {
      const validation = passwordValidator.validate(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        requirements: passwordValidator.getRequirementsMessage()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Request password reset
router.post('/forgot-password', passwordResetRateLimiter, resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const { token, hash } = generatePasswordResetToken();
    
    user.passwordResetToken = hash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, token);

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }
});

// Reset password
router.post('/reset-password', newPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        requirements: passwordValidator.getRequirementsMessage()
      });
    }

    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired',
        code: 'INVALID_TOKEN'
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Failed to reset password',
      code: 'PASSWORD_RESET_ERROR'
    });
  }
});

// Verify email
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return res.status(400).json({
        message: 'No verification token found',
        code: 'NO_TOKEN'
      });
    }

    if (user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        message: 'Verification token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Generate new token and persist it
    const emailToken = generateEmailVerificationToken();
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    await sendVerificationEmail(user.email, emailToken);

    res.json({
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      message: 'Failed to send verification email',
      code: 'EMAIL_SEND_ERROR'
    });
  }
});

// Confirm email verification
router.post('/confirm-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    res.status(500).json({
      message: 'Failed to verify email',
      code: 'EMAIL_VERIFICATION_ERROR'
    });
  }
});

module.exports = router;
