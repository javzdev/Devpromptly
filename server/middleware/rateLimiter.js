const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Redis client for rate limiting
let redisClient;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    redisClient.connect().catch(console.error);
  } catch (error) {
    console.warn('Redis rate limiter connection failed, using memory store:', error.message);
  }
}

// General rate limiting configuration
const createRateLimiter = (options = {}) => {
  const config = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too many requests',
      message: 'Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP + User ID for authenticated users
      return req.user ? `user:${req.user.id}` : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    },
    ...options
  };

  if (redisClient) {
    config.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:'
    });
  }

  return rateLimit(config);
};

// Strict rate limiting for authentication endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    message: 'Account temporarily locked. Please try again later.',
    retryAfter: 900 // 15 minutes
  },
  keyGenerator: (req) => {
    // Use email + IP for login attempts
    const email = req.body?.email || req.body?.username;
    return email ? `auth:${email}:${req.ip}` : `auth:${req.ip}`;
  },
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

// Rate limiting for password reset
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts',
    message: 'Please try again later.',
    retryAfter: 3600 // 1 hour
  },
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? `reset:${email}` : `reset:${req.ip}`;
  }
});

// Rate limiting for content creation
const creationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 creations per hour
  message: {
    error: 'Too many creations',
    message: 'You have reached your creation limit. Please try again later.',
    retryAfter: 3600 // 1 hour
  },
  keyGenerator: (req) => `create:${req.user?.id || req.ip}`
});

// Rate limiting for admin actions
const adminRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 admin actions per hour
  message: {
    error: 'Admin rate limit exceeded',
    message: 'Please try again later.',
    retryAfter: 3600 // 1 hour
  },
  keyGenerator: (req) => `admin:${req.user?.id || req.ip}`
});

// Rate limiting for API calls
const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: {
    error: 'API rate limit exceeded',
    message: 'Please try again later.',
    retryAfter: 900 // 15 minutes
  }
});

// Rate limiting for search requests
const searchRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Search rate limit exceeded',
    message: 'Please wait before searching again.',
    retryAfter: 60 // 1 minute
  },
  keyGenerator: (req) => `search:${req.user?.id || req.ip}`
});

// Rate limiting for favorites
const favoritesRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 favorite actions per minute
  message: {
    error: 'Favorites rate limit exceeded',
    message: 'Please wait before adding more favorites.',
    retryAfter: 60 // 1 minute
  },
  keyGenerator: (req) => `favorites:${req.user?.id || req.ip}`
});

// Rate limiting for ratings - 10 ratings per 5 minutes per user
const ratingsRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    error: 'Rating rate limit exceeded',
    message: 'Please wait before rating more prompts.',
    retryAfter: 300 // 5 minutes
  },
  keyGenerator: (req) => `ratings:${req.user?.id || req.ip}`
});

// Rate limiting for file uploads
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour
  message: {
    error: 'Upload rate limit exceeded',
    message: 'You have reached your upload limit. Please try again later.',
    retryAfter: 3600 // 1 hour
  },
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`
});

// Custom middleware for progressive rate limiting
const progressiveRateLimiter = (baseLimit, multiplier = 1.5, maxMultiplier = 10) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const currentAttempts = attempts.get(key) || 0;
    const multiplierValue = Math.min(multiplier ** currentAttempts, maxMultiplier);
    const currentLimit = Math.floor(baseLimit / multiplierValue);
    
    if (currentAttempts > 0) {
      const customLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: currentLimit,
        message: {
          error: 'Progressive rate limit',
          message: `Too many attempts. Current limit: ${currentLimit} requests per 15 minutes.`,
          retryAfter: 900
        }
      });
      
      return customLimiter(req, res, next);
    }
    
    next();
  };
};

// Reset rate limit for a specific key
const resetRateLimit = async (key) => {
  if (redisClient) {
    try {
      await redisClient.del(`rl:${key}`);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }
  return false;
};

// Get current rate limit status
const getRateLimitStatus = async (key) => {
  if (redisClient) {
    try {
      const count = await redisClient.get(`rl:${key}`);
      const ttl = await redisClient.ttl(`rl:${key}`);
      return {
        count: parseInt(count) || 0,
        resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
    }
  }
  return null;
};

module.exports = {
  createRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  creationRateLimiter,
  adminRateLimiter,
  apiRateLimiter,
  searchRateLimiter,
  favoritesRateLimiter,
  ratingsRateLimiter,
  uploadRateLimiter,
  progressiveRateLimiter,
  resetRateLimit,
  getRateLimitStatus
};
