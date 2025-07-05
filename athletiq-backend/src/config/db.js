// db.js - Enhanced Production-Ready Database Configuration
require('dotenv').config();
const { Pool } = require('pg');
const winston = require('winston');

// Configure Winston Logger for Database Operations
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

// Database Configuration with Advanced Settings
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  
  // SSL Configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    ca: process.env.DB_CA_CERT,
    key: process.env.DB_CLIENT_KEY,
    cert: process.env.DB_CLIENT_CERT
  } : false,
  
  // Connection Pool Settings
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 10000,
  
  // Statement timeout (30 seconds)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  
  // Query timeout (25 seconds)
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 25000,
  
  // Application name for connection tracking
  application_name: process.env.APP_NAME || 'athletiq-backend'
};

// Create the connection pool
const pool = new Pool(dbConfig);

// Connection Pool Event Handlers
pool.on('connect', (client) => {
  dbLogger.info('New client connected to database', {
    processId: client.processID,
    database: dbConfig.database,
    user: dbConfig.user
  });
});

pool.on('acquire', (client) => {
  dbLogger.debug('Client acquired from pool', {
    processId: client.processID,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('remove', (client) => {
  dbLogger.info('Client removed from pool', {
    processId: client.processID,
    totalCount: pool.totalCount
  });
});

pool.on('error', (err, client) => {
  dbLogger.error('Database pool error', {
    error: err.message,
    stack: err.stack,
    processId: client ? client.processID : 'unknown'
  });
});

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
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      maxConnections: dbConfig.max
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
        host: dbConfig.host,
        database: dbConfig.database,
        user: dbConfig.user,
        port: dbConfig.port
      }
    });
    throw error;
  }
};

// Graceful Shutdown Handler
const shutdown = async () => {
  dbLogger.info('Shutting down database connections...');
  try {
    await pool.end();
    dbLogger.info('Database connections closed successfully');
  } catch (error) {
    dbLogger.error('Error during database shutdown', { error: error.message });
  }
};

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

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
  shutdown,
  logger: dbLogger
};
