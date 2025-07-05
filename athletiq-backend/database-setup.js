// database-setup.js - Database Setup and Test Script
const { Pool } = require('pg');
const winston = require('winston');

// Simple logger for setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database configuration for setup
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD || '', // Empty for now
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

async function testConnection() {
  logger.info('Testing database connection...');
  logger.info('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password ? '***' : 'empty'
  });

  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    logger.info('✅ Database connection successful!');
    logger.info('Current time:', result.rows[0].current_time);
    logger.info('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:');
    logger.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('  - PostgreSQL server is not running');
      logger.error('  - Check if PostgreSQL is installed and running');
    } else if (error.message.includes('password')) {
      logger.error('  - Database password is required');
      logger.error('  - Set DB_PASSWORD environment variable');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      logger.error('  - Database does not exist');
      logger.error('  - Create the database first');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

async function createDatabase() {
  logger.info('Creating database if it does not exist...');
  
  // Connect to postgres database to create our database
  const adminConfig = {
    ...dbConfig,
    database: 'postgres' // Connect to default postgres database
  };
  
  const adminPool = new Pool(adminConfig);
  
  try {
    const client = await adminPool.connect();
    
    // Check if database exists
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbConfig.database}`);
      logger.info(`✅ Database '${dbConfig.database}' created successfully`);
    } else {
      logger.info(`Database '${dbConfig.database}' already exists`);
    }
    
    client.release();
    return true;
  } catch (error) {
    logger.error('❌ Failed to create database:', error.message);
    return false;
  } finally {
    await adminPool.end();
  }
}

async function setupDatabase() {
  logger.info('🚀 Starting database setup...');
  
  // First try to create database
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    logger.error('Failed to create database, exiting...');
    process.exit(1);
  }
  
  // Then test connection to the created database
  const connected = await testConnection();
  if (!connected) {
    logger.error('Failed to connect to database, exiting...');
    process.exit(1);
  }
  
  logger.info('✅ Database setup completed successfully!');
  logger.info('You can now run migrations with: node src/database/migrate.js run');
}

// Handle environment variables
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Setup Script

Usage: node database-setup.js [options]

Options:
  --help, -h         Show this help message
  --test-only        Only test the connection, don't create database
  --create-only      Only create database, don't test connection

Environment Variables:
  DB_HOST           Database host (default: localhost)
  DB_PORT           Database port (default: 5432)
  DB_NAME           Database name (default: athletiq)
  DB_USER           Database user (default: postgres)
  DB_PASSWORD       Database password (required for most setups)

Examples:
  node database-setup.js
  DB_PASSWORD=mypassword node database-setup.js
  DB_HOST=localhost DB_PASSWORD=mypassword node database-setup.js
  `);
  process.exit(0);
}

if (process.argv.includes('--test-only')) {
  testConnection().then(() => process.exit(0));
} else if (process.argv.includes('--create-only')) {
  createDatabase().then(() => process.exit(0));
} else {
  setupDatabase();
}
