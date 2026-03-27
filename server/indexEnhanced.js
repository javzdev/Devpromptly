const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const isDevelopment = process.env.NODE_ENV === 'development';
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

// Import middleware
const { sessionMiddleware, generateCSRFToken, validateCSRFToken } = require('./middleware/session');
const {
  apiRateLimiter,
  authRateLimiter,
  searchRateLimiter
} = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authEnhanced');
const promptRoutes = require('./routes/prompts');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const forumsRoutes = require('./routes/forums');
const aiToolsRoutes = require('./routes/aitools');
const blogRoutes = require('./routes/blog');

const app = express();

// Trust proxy for rate limiting and secure headers
app.set('trust proxy', 1);

// Security middleware
// 2. HELMET ENHANCED SECURITY (Production-Grade CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://ui-avatars.com"],
      connectSrc: ["'self'", process.env.REACT_APP_API_URL || "http://localhost:5000", "ws://localhost:3000"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Remove obsolete headers (Covered by CSP)
app.use((req, res, next) => {
  res.removeHeader('X-XSS-Protection');
  next();
});

// CORS configuration
// allowedOrigins moved to global scope

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow origins from environment or all in development
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
}));

// Rate limiting
app.use('/api', apiRateLimiter);
// Note: authRateLimiter is applied per-handler in routes/authEnhanced.js

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({
  limit: '100kb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '100kb'
}));

// Cookie parser
app.use(cookieParser(process.env.SESSION_SECRET));

// Data sanitization
app.use(mongoSanitize()); // Against NoSQL injection
app.use(xssClean()); // Against XSS attacks
app.use(hpp()); // Against HTTP parameter pollution

// Session middleware
app.use(sessionMiddleware);

// Logging middleware - more verbose in development
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Security headers middleware
app.use((req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Ensure CSRF token exists for all /api requests (including unauthenticated)
// This must come BEFORE the CSRF validation middleware
app.use('/api', (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  next();
});

// CSRF protection for state-changing requests
// This must come AFTER the token generation middleware
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Skip CSRF for public auth endpoints — no session/cookie yet
    if (req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/confirm-email') {
      return next();
    }
    // Skip CSRF for JWT-authenticated requests.
    // sameSite:lax already prevents cross-site POST requests from including cookies,
    // so a request carrying the accessToken cookie is inherently not a CSRF attack.
    if (req.cookies?.accessToken) {
      return next();
    }
    validateCSRFToken(req, res, next);
  } else {
    next();
  }
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/prompts', searchRateLimiter, promptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/tools', aiToolsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Unified search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ prompts: [], tools: [], communities: [] });
    }
    const query = q.trim();
    if (query.length > 100) return res.status(400).json({ message: 'Query too long' });

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };

    // Build per-word regexes for multi-word queries
    const words = query.split(/\s+/).filter(w => w.length >= 2);
    const wordRegexes = words.map(w => ({ $regex: w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }));

    // Spanish/English → DB category synonyms
    const categoryMap = {
      'video': 'video', 'videos': 'video', 'vídeo': 'video', 'vídeos': 'video',
      'imagen': 'image', 'imágenes': 'image', 'imagenes': 'image', 'foto': 'image', 'fotos': 'image',
      'código': 'code', 'codigo': 'code', 'programar': 'code', 'programación': 'code', 'programacion': 'code',
      'audio': 'audio', 'música': 'audio', 'musica': 'audio', 'podcast': 'audio', 'voz': 'audio',
      'chat': 'chatbot', 'chatbot': 'chatbot', 'conversación': 'chatbot', 'conversacion': 'chatbot',
      'productividad': 'productivity', 'reuniones': 'productivity', 'notas': 'productivity',
      'investigación': 'research', 'investigacion': 'research', 'seo': 'research', 'buscar': 'research',
      'datos': 'data', 'análisis': 'data', 'analisis': 'data', 'data': 'data',
      'escritura': 'writing', 'escribir': 'writing', 'redacción': 'writing', 'writing': 'writing',
      'diseño': 'other', 'marketing': 'other', 'automatización': 'other', 'automatizacion': 'other',
      'code': 'code', 'image': 'image', 'chatbot': 'chatbot', 'productivity': 'productivity',
      'research': 'research', 'other': 'other',
    };
    const matchedCategories = [...new Set(words.map(w => categoryMap[w.toLowerCase()]).filter(Boolean))];

    // Tool $or: full query match OR any individual word match in name/description/category
    const toolOrConditions = [
      { name: regex }, { description: regex },
      ...wordRegexes.flatMap(r => [{ name: r }, { description: r }]),
      ...matchedCategories.map(c => ({ category: c })),
    ];

    const Prompt = require('./models/Prompt');
    const AITool = require('./models/AITool');
    const Forum = require('./models/Forum');

    const [prompts, tools, communities] = await Promise.all([
      Prompt.find({ status: 'approved', $or: [
        { title: regex }, { description: regex }, { tags: regex },
        ...wordRegexes.flatMap(r => [{ title: r }, { description: r }, { tags: r }]),
      ]})
        .select('title description category aiTool')
        .limit(5).lean(),
      AITool.find({ isActive: true, $or: toolOrConditions })
        .select('name description category url')
        .limit(8).lean(),
      Forum.find({ isActive: true, $or: [{ name: regex }, { description: regex }] })
        .select('name description url')
        .limit(3).lean(),
    ]);

    res.json({ prompts, tools, communities });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Public stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const Prompt = require('./models/Prompt');
    const User = require('./models/User');
    const [totalPrompts, totalUsers, totalSaved] = await Promise.all([
      Prompt.countDocuments({ status: 'approved' }),
      User.countDocuments({ isActive: true }),
      Prompt.aggregate([{ $group: { _id: null, total: { $sum: '$favorites' } } }])
    ]);
    res.json({
      prompts: totalPrompts,
      creators: totalUsers,
      saved: totalSaved[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Health check endpoint

// One-time admin setup endpoint removed after initialization


app.get('/api/health', (req, res) => {

  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  // Check database connection
  if (process.env.NODE_ENV === 'development') {
    healthCheck.database = 'In-memory storage (development mode)';
  } else if (mongoose.connection.readyState === 1) {
    healthCheck.database = 'Connected';
  } else {
    healthCheck.database = 'Disconnected';
    healthCheck.status = 'ERROR';
  }
  
  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCSRFToken();
  req.session.csrfToken = csrfToken;
  res.json({ csrfToken });
});

// API documentation endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    const docs = {
      title: 'GPrompts API Documentation',
      version: '1.0.0',
      endpoints: {
        auth: {
          'POST /api/auth/register': 'Register new user',
          'POST /api/auth/login': 'Login user',
          'POST /api/auth/logout': 'Logout user',
          'POST /api/auth/refresh': 'Refresh access token',
          'GET /api/auth/me': 'Get current user',
          'PUT /api/auth/profile': 'Update profile',
          'PUT /api/auth/password': 'Change password',
          'POST /api/auth/forgot-password': 'Request password reset',
          'POST /api/auth/reset-password': 'Reset password',
          'POST /api/auth/verify-email': 'Request email verification',
          'POST /api/auth/confirm-email': 'Confirm email verification'
        },
        prompts: {
          'GET /api/prompts': 'Get all prompts (with filters)',
          'GET /api/prompts/:id': 'Get single prompt',
          'POST /api/prompts': 'Create new prompt',
          'POST /api/prompts/:id/rate': 'Rate a prompt',
          'POST /api/prompts/:id/favorite': 'Add/remove favorite',
          'GET /api/prompts/user/favorites': 'Get user favorites',
          'GET /api/prompts/user/my-prompts': 'Get user prompts'
        },
        users: {
          'GET /api/users/:username': 'Get user profile',
          'PUT /api/users/profile': 'Update user profile',
          'PUT /api/users/password': 'Change password',
          'DELETE /api/users/account': 'Delete account',
          'GET /api/users/stats/me': 'Get user statistics'
        },
        admin: {
          'GET /api/admin/dashboard': 'Get admin dashboard',
          'GET /api/admin/prompts/pending': 'Get pending prompts',
          'POST /api/admin/prompts/:id/approve': 'Approve prompt',
          'POST /api/admin/prompts/:id/reject': 'Reject prompt',
          'GET /api/admin/users': 'Get all users',
          'POST /api/admin/users/:id/toggle-status': 'Toggle user status',
          'DELETE /api/admin/prompts/:id': 'Delete prompt',
          'GET /api/admin/reports': 'Get reported content'
        }
      },
      rateLimits: {
        general: '100 requests per 15 minutes',
        auth: '5 requests per 15 minutes',
        search: '30 requests per minute',
        creation: '10 requests per hour',
        favorites: '20 requests per minute',
        ratings: '10 requests per 5 minutes'
      },
      security: {
        authentication: 'JWT tokens with httpOnly cookies',
        csrf: 'CSRF protection for state-changing requests',
        rateLimit: 'IP-based and user-based rate limiting',
        validation: 'Input validation and sanitization',
        https: 'HTTPS required in production'
      }
    };
    
    res.json(docs);
  });
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message),
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate entry',
      field: Object.keys(err.keyValue)[0],
      code: 'DUPLICATE_ENTRY'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      requiresRefresh: true
    });
  }
  
  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({ 
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter
    });
  }
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  // Session errors
  if (err.code === 'ENOENT' || err.code === 'EACCES') {
    return res.status(500).json({
      message: 'Session storage error',
      code: 'SESSION_ERROR'
    });
  }
  
  // Default error
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!', 
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 15000);
  forceExit.unref();

  const httpServer = global.server;
  const closeHttp = httpServer
    ? new Promise(resolve => httpServer.close(resolve))
    : Promise.resolve();

  closeHttp.then(() => {
    console.log('HTTP server closed');
    return mongoose.connection.close();
  }).then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  }).catch((err) => {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  });
};

const PORT = process.env.PORT || 5000;

const mongoOptions = {
  serverSelectionTimeoutMS: 15000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority',
  retryReads: true,
  family: 4 // Force IPv4
};

// Mongoose connection event listeners
mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

const MAX_DB_RETRIES = 5;

const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpromts';

  if (!uri || uri.includes('YOURUSER') || uri.includes('YOUR_') || uri.includes('demo:demo@')) {
    console.warn('MONGODB_URI not properly configured. Running without database (mock data only).');
    return false;
  }

  try {
    console.log(`Connecting to MongoDB (attempt ${attempt}/${MAX_DB_RETRIES})...`);
    await mongoose.connect(uri, mongoOptions);
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed (attempt ${attempt}): ${error.message}`);
    if (attempt < MAX_DB_RETRIES) {
      const delay = Math.min(attempt * 2000, 10000);
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(attempt + 1);
    }
    console.error('Max DB connection attempts reached. Starting in degraded mode (mock data).');
    return false;
  }
};

// Start server after attempting DB connection
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    const dbState = mongoose.connection.readyState === 1 ? 'MongoDB' : 'mock data (no DB)';
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${dbState}`);
    console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
    if (error.code === 'EACCES') {
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    } else if (error.code === 'EADDRINUSE') {
      console.error(`${bind} is already in use`);
      process.exit(1);
    } else {
      throw error;
    }
  });

  // Store for graceful shutdown
  global.server = server;
  return server;
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Signal handling
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

