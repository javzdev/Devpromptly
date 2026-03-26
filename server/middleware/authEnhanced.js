const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { extractTokensFromCookies, clearTokenCookies } = require('./session');

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Get user from token - checks DB in production
const getUserFromToken = async (token) => {
  const decoded = verifyToken(token); // throws on invalid/expired

  const user = await User.findById(decoded.id)
    .select('-password -refreshToken -loginAttempts -lockUntil');

  if (!user) throw Object.assign(new Error('User not found'), { code: 'USER_NOT_FOUND' });
  if (!user.isActive) throw Object.assign(new Error('Account deactivated'), { code: 'USER_INACTIVE' });

  return user;
};

// Core authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const { accessToken } = extractTokensFromCookies(req);
    const tokenFromHeader = req.header('Authorization')?.replace('Bearer ', '');
    const token = accessToken || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ message: 'No token provided', code: 'NO_TOKEN' });
    }

    const user = await getUserFromToken(token);
    req.user = user;
    req.token = token;
    req.authMethod = accessToken ? 'cookie' : 'header';

    next();
  } catch (error) {
    if (res.headersSent) return;

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED', requiresRefresh: true });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    if (error.code === 'USER_INACTIVE') {
      return res.status(401).json({ message: 'Account deactivated', code: 'USER_INACTIVE' });
    }
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    return res.status(401).json({ message: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};

// Admin authentication middleware - fixed (no more setInterval polling)
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin or moderator access required', code: 'INSUFFICIENT_PERMISSIONS' });
    }
    req.isAdmin = req.user.role === 'admin';
    req.isModerator = req.user.role === 'moderator';
    next();
  });
};

// Super admin (only 'admin' role)
const authenticateSuperAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Super admin access required', code: 'INSUFFICIENT_PERMISSIONS' });
    }
    req.isSuperAdmin = true;
    next();
  });
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const { accessToken } = extractTokensFromCookies(req);
    const tokenFromHeader = req.header('Authorization')?.replace('Bearer ', '');
    const token = accessToken || tokenFromHeader;

    if (token) {
      try {
        req.user = await getUserFromToken(token);
        req.token = token;
        req.authMethod = accessToken ? 'cookie' : 'header';
      } catch {
        if (accessToken) clearTokenCookies(res);
      }
    }
    next();
  } catch {
    next();
  }
};

// Requires email verified
const requireEmailVerification = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user.emailVerified) {
      return res.status(403).json({
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
    }
    next();
  });
};

// Resource ownership check
const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'author') => {
  return (req, res, next) => {
    authenticateToken(req, res, async () => {
      try {
        const resourceId = req.params[resourceIdParam];
        if (!resourceId) {
          return res.status(400).json({ message: 'Resource ID required', code: 'MISSING_RESOURCE_ID' });
        }

        const Resource = require(`../models/${resourceModel}`);
        const resource = await Resource.findById(resourceId);

        if (!resource) {
          return res.status(404).json({ message: 'Resource not found', code: 'RESOURCE_NOT_FOUND' });
        }

        const isOwner = resource[ownerField].toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
          return res.status(403).json({ message: 'Access denied', code: 'ACCESS_DENIED' });
        }

        req.resource = resource;
        req.isOwner = isOwner;
        req.isAdmin = isAdmin;
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

// In-memory rate limiting for authenticated users
const authenticatedRateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  let lastCleanup = Date.now();
  const cleanupInterval = 10 * 60 * 1000;

  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    if (now - lastCleanup > cleanupInterval) {
      for (const [id, timestamps] of requests.entries()) {
        const valid = timestamps.filter(t => t > windowStart);
        if (valid.length === 0) requests.delete(id);
        else requests.set(id, valid);
      }
      lastCleanup = now;
    }

    const userRequests = (requests.get(userId) || []).filter(t => t > windowStart);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((windowStart + windowMs - now) / 1000)
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);
    next();
  };
};

// Refresh token validation middleware
const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const { refreshToken } = extractTokensFromCookies(req);

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    if (!user.isActive) {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    clearTokenCookies(res);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
    return res.status(401).json({ message: 'Token refresh failed', code: 'REFRESH_FAILED' });
  }
};

module.exports = {
  verifyToken,
  getUserFromToken,
  authenticateToken,
  authenticateAdmin,
  authenticateSuperAdmin,
  optionalAuth,
  requireEmailVerification,
  requireOwnership,
  authenticatedRateLimit,
  refreshTokenMiddleware
};
