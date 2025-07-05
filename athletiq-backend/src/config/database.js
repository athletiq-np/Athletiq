// src/config/database.js - Database pool abstraction
const { Pool } = require('pg');
const winston = require('winston');

// Configure logger
const dbLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({ filename: 'logs/db-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/db-combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database configurations
const getDbConfig = () => {
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    password: process.env.DB_PASSWORD || 'Ardnepu8',
    database: isTest ? (process.env.DB_NAME || 'athletiq_test') : (process.env.DB_NAME || 'athletiq'),
    max: isTest ? 5 : 20, // Smaller pool for tests
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

// Singleton database pool
let pool = null;

// Function to get or create database pool
const getPool = () => {
  if (!pool) {
    const config = getDbConfig();
    pool = new Pool(config);
    
    // Pool event handlers
    pool.on('connect', (client) => {
      dbLogger.info('New client connected', { 
        database: config.database,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });

    pool.on('error', (err) => {
      dbLogger.error('Database pool error:', err);
    });

    pool.on('remove', () => {
      dbLogger.info('Client removed from pool', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
    });
  }
  
  return pool;
};

// Function to reset pool (useful for tests)
const resetPool = () => {
  if (pool) {
    pool.end();
    pool = null;
  }
};

// Export the pool getter
module.exports = {
  getPool,
  resetPool,
  dbLogger
};
