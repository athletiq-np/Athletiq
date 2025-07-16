require('dotenv').config();
const { Pool } = require('pg');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
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
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'athletiq',
      user: process.env.DB_USER || 'postgres',
      environment: process.env.NODE_ENV || 'development'
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
