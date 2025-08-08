require('dotenv').config();
const { Pool } = require('pg');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

// Validate required environment variables (skip in development if using fallbacks)
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  logger.error('Missing required environment variables:', { missingVars });
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
} else if (missingVars.length > 0) {
  logger.warn('Missing environment variables (development mode):', { missingVars });
}

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Additional pool configuration
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message });
  process.exit(-1);
});

// Handle pool connect
pool.on('connect', () => {
  logger.info('New client connected');
});

// Initialize database connection and log status
async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      environment: process.env.NODE_ENV
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();

    const stats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    logger.info('✅ Database connection established successfully', {
      version: 'PostgreSQL',
      connectedAt: new Date().toISOString(),
      poolStats: stats
    });

    return pool;
  } catch (error) {
    logger.error('❌ Database connection failed', { 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
}

// Initialize on module load
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = pool;
