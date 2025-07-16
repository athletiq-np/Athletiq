// Enterprise Configuration Management
// This file centralizes all configuration for enterprise deployment

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'athletiq',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 20,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 days
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // CORS Configuration
  cors: {
    origins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  },

  // Rate Limiting Configuration
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_GENERAL || (process.env.NODE_ENV === 'production' ? 1000 : 10000)
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes  
      max: process.env.RATE_LIMIT_AUTH || (process.env.NODE_ENV === 'production' ? 10 : 100)
    }
  },

  // File Upload Configuration
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf'
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    version: process.env.API_VERSION || 'v1',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    logLevel: process.env.LOG_LEVEL || 'info',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000 // 1 minute
  },

  // Feature Flags
  features: {
    aiServices: process.env.ENABLE_AI_SERVICES === 'true',
    ocrProcessing: process.env.ENABLE_OCR === 'true',
    documentProcessing: process.env.ENABLE_DOCUMENT_PROCESSING === 'true',
    advancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
    realTimeUpdates: process.env.ENABLE_REAL_TIME === 'true'
  }
};

// Validation function
const validateConfig = () => {
  const required = [
    'JWT_SECRET',
    'DB_HOST', 
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Configuration validation passed');
};

// Initialize configuration
const initializeConfig = () => {
  try {
    validateConfig();
    console.log('✅ Enterprise configuration initialized');
    console.log(`📊 Environment: ${config.server.nodeEnv}`);
    console.log(`🌐 Server: ${config.server.host}:${config.server.port}`);
    console.log(`💾 Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`🔧 Features: AI=${config.features.aiServices}, OCR=${config.features.ocrProcessing}`);
    return config;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  config,
  validateConfig,
  initializeConfig
};
