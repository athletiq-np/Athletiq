// src/config/validateEnv.js
const { createLogger } = require('../utils/logger');

const logger = createLogger('environment');

/**
 * Validates required environment variables
 * @param {Array<string>} requiredVars - Array of required environment variable names
 * @returns {boolean} - Returns true if all variables are present
 */
function validateEnvironmentVariables(requiredVars = []) {
  const missingVars = [];
  const warnings = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check for development defaults that shouldn't be in production
  if (process.env.NODE_ENV === 'production') {
    const productionChecks = [
      { var: 'JWT_SECRET', minLength: 32 },
      { var: 'DB_PASSWORD', minLength: 8 },
    ];

    productionChecks.forEach(({ var: varName, minLength }) => {
      const value = process.env[varName];
      if (value && value.length < minLength) {
        warnings.push(`${varName} should be at least ${minLength} characters in production`);
      }
    });

    // Check for common development values
    const devValues = {
      JWT_SECRET: ['secret', 'dev-secret', 'development'],
      DB_PASSWORD: ['password', 'admin', 'root', '123456']
    };

    Object.entries(devValues).forEach(([varName, badValues]) => {
      const value = process.env[varName];
      if (value && badValues.some(bad => value.toLowerCase().includes(bad))) {
        warnings.push(`${varName} appears to contain development/default values`);
      }
    });
  }

  // Log results
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', { missingVars });
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    return false;
  }

  if (warnings.length > 0) {
    logger.warn('Environment variable warnings:', { warnings });
    console.warn('⚠️  Environment warnings:', warnings.join(', '));
  }

  logger.info('Environment validation passed', {
    environment: process.env.NODE_ENV,
    requiredVarsCount: requiredVars.length
  });

  return true;
}

/**
 * Default required environment variables for the application
 */
const DEFAULT_REQUIRED_VARS = [
  'NODE_ENV',
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

/**
 * Development fallback values
 */
const DEVELOPMENT_FALLBACKS = {
  NODE_ENV: 'development',
  JWT_SECRET: 'dev-jwt-secret-change-in-production-min-32-chars',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'athletiq',
  DB_USER: 'postgres',
  DB_PASSWORD: 'Ardnepu8'
};

/**
 * Validates the application environment
 */
function validateAppEnvironment() {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log('🔧 Development mode: Using fallback values for missing environment variables');
    
    // Set fallback values for development
    DEFAULT_REQUIRED_VARS.forEach(varName => {
      if (!process.env[varName] && DEVELOPMENT_FALLBACKS[varName]) {
        process.env[varName] = DEVELOPMENT_FALLBACKS[varName];
        console.log(`  ⚠️  Using fallback for ${varName}`);
      }
    });
  }
  
  return validateEnvironmentVariables(DEFAULT_REQUIRED_VARS);
}

module.exports = {
  validateEnvironmentVariables,
  validateAppEnvironment,
  DEFAULT_REQUIRED_VARS
};
