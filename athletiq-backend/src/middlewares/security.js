// src/middlewares/security.js
const helmet = require('helmet');

/**
 * Security middleware configuration
 */
const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Cross-Origin Resource Sharing
  crossOriginEmbedderPolicy: false,
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  // X-Content-Type-Options
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: {
    policy: 'same-origin'
  }
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://athletiq.com',
      'https://www.athletiq.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log to console in development, use proper logger in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`${log.method} ${log.url} - ${log.status} - ${log.duration}`);
    }
  });
  
  next();
};

/**
 * Error response sanitizer
 */
const sanitizeError = (err, req, res, next) => {
  // Don't leak sensitive information in error messages
  if (process.env.NODE_ENV === 'production') {
    // Generic error message for production
    if (err.status >= 500) {
      err.message = 'Internal server error';
    }
    // Remove stack trace in production
    delete err.stack;
  }
  
  next(err);
};

module.exports = {
  securityMiddleware,
  corsOptions,
  requestLogger,
  sanitizeError
};
