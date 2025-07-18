// db.js - Enhanced Production-Ready Database Configuration
require('dotenv').config();
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
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database configuration
const getDbConfig = () => {
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    password: process.env.DB_PASSWORD || 'Ardnepu8',
    database: isTest ? (process.env.DB_NAME || 'athletiq_test') : (process.env.DB_NAME || 'athletiq'),
    max: isTest ? 5 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

// Create a single pool instance
const config = getDbConfig();
const pool = new Pool(config);

// Pool event handlers
pool.on('connect', () => {
  dbLogger.info('New client connected');
});

pool.on('error', (err) => {
  dbLogger.error('Database pool error:', err);
});

// Prevent pool from being ended in development
if (process.env.NODE_ENV === 'development') {
  const originalEnd = pool.end.bind(pool);
  pool.end = () => {
    dbLogger.warn('pool.end() called in development - ignoring');
    return Promise.resolve();
  };
}

// Health Check Function
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    dbLogger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Connection Test and Initialization
const initializeDatabase = async () => {
  try {
    dbLogger.info('Initializing database connection...', {
      database: config.database,
      user: config.user,
      host: config.host,
      environment: process.env.NODE_ENV || 'development'
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as connected_at, version() as version');
    client.release();
    
    dbLogger.info('✅ Database connection established successfully', {
      connectedAt: result.rows[0].connected_at,
      version: result.rows[0].version.split(' ')[0],
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
    
    return true;
  } catch (error) {
    dbLogger.error('❌ Database connection failed', {
      error: error.message,
      stack: error.stack,
      config: {
        host: config.host,
        database: config.database,
        user: config.user,
        port: config.port
      }
    });
    throw error;
  }
};

// Transaction Helper
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    dbLogger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

// Query Helper with Logging
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    dbLogger.debug('Query executed', {
      duration,
      rows: result.rowCount,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    dbLogger.error('Query failed', {
      duration,
      error: error.message,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params.length > 0 ? 'provided' : 'none'
    });
    throw error;
  }
};

// Initialize the database connection
initializeDatabase().catch((error) => {
  dbLogger.error('Failed to initialize database', { error: error.message });
  process.exit(1);
});

// Export the pool and utility functions
module.exports = {
  pool,
  query,
  withTransaction,
  healthCheck,
  logger: dbLogger
};
