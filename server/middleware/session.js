const session = require('express-session');
const { RedisStore } = require('connect-redis'); // connect-redis v7+ requires named export
const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Validar que SESSION_SECRET esté configurado
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET is not set. Refusing to start in production without a secure secret.');
    process.exit(1);
  }
  console.warn('WARNING: SESSION_SECRET not set. Using insecure default — NEVER use this in production!');
  process.env.SESSION_SECRET = 'insecure-default-secret-change-in-production';
}

let store;

if (process.env.REDIS_URL) {
  try {
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Redis v4+ reconnect strategy (replaces v3 retry_strategy)
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 200, 3000);
        },
        connectTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      console.warn('Redis client error (sessions will fall back to memory):', err.message);
    });

    redisClient.on('connect', () => {
      console.info('Redis connected for session store');
    });

    redisClient.connect().catch((err) => {
      console.warn('Redis initial connection failed, using memory store:', err.message);
    });

    store = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: 86400 // 24 hours in seconds
    });
  } catch (error) {
    console.warn('Redis setup failed, using memory store:', error.message);
  }
}

const isDev = process.env.NODE_ENV !== 'production';

const sessionConfig = {
  store: store, // undefined falls back to MemoryStore
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'gpromts.sid',
  cookie: {
    secure: !isDev,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isDev ? 'lax' : 'none',
    path: '/'
  }
};

const sessionMiddleware = session(sessionConfig);

// JWT Cookie configuration
const cookieConfig = {
  httpOnly: true,
  secure: !isDev,
  sameSite: isDev ? 'lax' : 'none',
  maxAge: isDev ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000, // 7 days dev / 15 min prod
  path: '/'
};

// Refresh token cookie configuration
const refreshTokenCookieConfig = {
  httpOnly: true,
  secure: !isDev,
  sameSite: isDev ? 'lax' : 'none',
  maxAge: isDev ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days dev / 7 days prod
  path: '/'
};

const setTokenCookie = (res, token) => {
  res.cookie('accessToken', token, cookieConfig);
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, refreshTokenCookieConfig);
};

const clearTokenCookies = (res) => {
  const clearOpts = { path: '/', httpOnly: true };
  res.clearCookie('accessToken', clearOpts);
  res.clearCookie('refreshToken', clearOpts);
  res.clearCookie('gpromts.sid', { path: '/' });
};

const extractTokensFromCookies = (req) => {
  return {
    accessToken: req.cookies?.accessToken,
    refreshToken: req.cookies?.refreshToken
  };
};

const crypto = require('crypto');

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ message: 'Invalid CSRF token', code: 'INVALID_CSRF' });
  }

  next();
};

module.exports = {
  sessionMiddleware,
  setTokenCookie,
  setRefreshTokenCookie,
  clearTokenCookies,
  extractTokensFromCookies,
  generateCSRFToken,
  validateCSRFToken
};
