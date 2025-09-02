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
    // Define allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://athletiq.com',
          'https://www.athletiq.com',
          'https://app.athletiq.com',
          'https://admin.athletiq.com',
          // Add your production domains here
        ]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
        ];
    
    // Allow requests with no origin (like mobile apps or curl requests) only in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, require origin to be in allowedOrigins
    if (process.env.NODE_ENV === 'production' && !origin) {
      return callback(new Error('Origin required for production requests'));
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Let CORS reflect requested headers (Access-Control-Request-Headers)
  exposedHeaders: [
    'X-Total-Count', 
    'X-Page-Count', 
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours - cache preflight responses
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
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
