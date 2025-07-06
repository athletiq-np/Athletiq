// src/config/environment.js
const joi = require('joi');
const path = require('path');

/**
 * Environment Configuration Schema
 * This validates all environment variables and provides defaults
 */
const envSchema = joi.object({
  // Node Environment
  NODE_ENV: joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  
  // Server Configuration
  PORT: joi.number()
    .positive()
    .default(5000),
  
  // Database Configuration
  DB_HOST: joi.string()
    .hostname()
    .default('localhost'),
  DB_PORT: joi.number()
    .positive()
    .default(5432),
  DB_USER: joi.string()
    .required(),
  DB_PASSWORD: joi.string()
    .required(),
  DB_NAME: joi.string()
    .required(),
  DB_SSL: joi.boolean()
    .default(false),
  DB_MAX_CONNECTIONS: joi.number()
    .positive()
    .default(20),
  
  // JWT Configuration
  JWT_SECRET: joi.string()
    .min(32)
    .required(),
  JWT_EXPIRE: joi.string()
    .default('24h'),
  JWT_REFRESH_EXPIRE: joi.string()
    .default('7d'),
  
  // CORS Configuration
  CORS_ORIGIN: joi.string()
    .default('http://localhost:3000'),
  
  // File Upload Configuration
  MAX_FILE_SIZE: joi.number()
    .positive()
    .default(5242880), // 5MB
  ALLOWED_FILE_TYPES: joi.string()
    .default('image/jpeg,image/png,application/pdf'),
  UPLOAD_DIR: joi.string()
    .default('./uploads'),
  
  // Security Configuration
  BCRYPT_ROUNDS: joi.number()
    .min(8)
    .max(15)
    .default(12),
  
  // External API Configuration
  OPENAI_API_KEY: joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional()
    }),
  GOOGLE_APPLICATION_CREDENTIALS: joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional()
    }),
  GOOGLE_CLOUD_PROJECT_ID: joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: joi.required(),
      otherwise: joi.optional()
    }),
  
  // Email Configuration (for future use)
  SMTP_HOST: joi.string()
    .hostname()
    .optional(),
  SMTP_PORT: joi.number()
    .positive()
    .default(587),
  SMTP_USER: joi.string()
    .email()
    .optional(),
  SMTP_PASS: joi.string()
    .optional(),
  
  // Redis Configuration (for future use)
  REDIS_URL: joi.string()
    .uri()
    .optional(),
  REDIS_HOST: joi.string()
    .hostname()
    .default('localhost'),
  REDIS_PORT: joi.number()
    .positive()
    .default(6379),
  REDIS_PASSWORD: joi.string()
    .optional(),
  
  // Logging Configuration
  LOG_LEVEL: joi.string()
    .valid('error', 'warn', 'info', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FILE: joi.boolean()
    .default(true),
  
  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: joi.number()
    .positive()
    .default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: joi.number()
    .positive()
    .default(1000),
  
  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: joi.number()
    .positive()
    .default(30000), // 30 seconds
}).unknown(); // Allow unknown environment variables

/**
 * Validate and load environment configuration
 */
function loadEnvironmentConfig() {
  const { error, value: envVars } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Environment configuration validation error: ${error.message}`);
  }
  
  return {
    // Environment
    NODE_ENV: envVars.NODE_ENV,
    PORT: envVars.PORT,
    
    // Database
    database: {
      host: envVars.DB_HOST,
      port: envVars.DB_PORT,
      user: envVars.DB_USER,
      password: envVars.DB_PASSWORD,
      database: envVars.DB_NAME,
      ssl: envVars.DB_SSL,
      max: envVars.DB_MAX_CONNECTIONS,
    },
    
    // JWT
    jwt: {
      secret: envVars.JWT_SECRET,
      expiresIn: envVars.JWT_EXPIRE,
      refreshExpiresIn: envVars.JWT_REFRESH_EXPIRE,
    },
    
    // CORS
    cors: {
      origin: envVars.CORS_ORIGIN,
    },
    
    // File Upload
    upload: {
      maxFileSize: envVars.MAX_FILE_SIZE,
      allowedTypes: envVars.ALLOWED_FILE_TYPES.split(','),
      uploadDir: path.resolve(envVars.UPLOAD_DIR),
    },
    
    // Security
    security: {
      bcryptRounds: envVars.BCRYPT_ROUNDS,
    },
    
    // External APIs
    apis: {
      openai: {
        apiKey: envVars.OPENAI_API_KEY,
      },
      google: {
        credentialsPath: envVars.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: envVars.GOOGLE_CLOUD_PROJECT_ID,
      },
    },
    
    // Email
    email: {
      smtp: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
    },
    
    // Redis
    redis: {
      url: envVars.REDIS_URL,
      host: envVars.REDIS_HOST,
      port: envVars.REDIS_PORT,
      password: envVars.REDIS_PASSWORD,
    },
    
    // Logging
    logging: {
      level: envVars.LOG_LEVEL,
      file: envVars.LOG_FILE,
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
    
    // Health Check
    healthCheck: {
      interval: envVars.HEALTH_CHECK_INTERVAL,
    },
    
    // Helper methods
    isDevelopment: () => envVars.NODE_ENV === 'development',
    isProduction: () => envVars.NODE_ENV === 'production',
    isTest: () => envVars.NODE_ENV === 'test',
    isStaging: () => envVars.NODE_ENV === 'staging',
  };
}

/**
 * Print configuration summary (excluding sensitive data)
 */
function printConfigSummary(config) {
  const safeConfig = {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    database: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      ssl: config.database.ssl,
      max: config.database.max,
    },
    cors: config.cors,
    upload: {
      maxFileSize: config.upload.maxFileSize,
      allowedTypes: config.upload.allowedTypes,
    },
    logging: config.logging,
    rateLimit: config.rateLimit,
  };
  
  console.log('🔧 Configuration loaded:');
  console.log(JSON.stringify(safeConfig, null, 2));
}

module.exports = {
  loadEnvironmentConfig,
  printConfigSummary,
};
