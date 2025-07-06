const { Pool } = require('pg');
const winston = require('winston');

// Test-specific logger
const testLogger = winston.createLogger({
  level: 'error', // Only log errors during tests
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ silent: true }) // Silent during tests
  ]
});

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
  database: process.env.DB_NAME || 'athletiq_test',
  max: 5, // Smaller pool for tests
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create test database pool
const testPool = new Pool(testDbConfig);

// Test database utilities
class TestDatabase {
  static async createTestDatabase() {
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres' // Connect to postgres db to create test db
    });

    try {
      // Check if test database exists
      const dbCheckResult = await adminPool.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [testDbConfig.database]
      );

      if (dbCheckResult.rows.length === 0) {
        // Create test database
        await adminPool.query(`CREATE DATABASE ${testDbConfig.database}`);
        testLogger.info(`Created test database: ${testDbConfig.database}`);
      }
    } catch (error) {
      testLogger.error('Error creating test database:', error);
      throw error;
    } finally {
      await adminPool.end();
    }
  }

  static async setupTestTables() {
    try {
      // Create test tables that match the actual database schema
      
      // Users table
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          user_id UUID DEFAULT gen_random_uuid() UNIQUE,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'SchoolAdmin', 'Coach', 'Referee')),
          school_id INTEGER,
          is_active BOOLEAN DEFAULT TRUE,
          email_verified BOOLEAN DEFAULT FALSE,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Schools table
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS schools (
          id SERIAL PRIMARY KEY,
          school_id UUID DEFAULT gen_random_uuid() UNIQUE,
          school_code VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100),
          phone VARCHAR(20),
          email VARCHAR(255),
          website VARCHAR(255),
          logo_url VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          subscription_type VARCHAR(50) DEFAULT 'basic',
          subscription_expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tournaments table
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS tournaments (
          id SERIAL PRIMARY KEY,
          tournament_id UUID DEFAULT gen_random_uuid() UNIQUE,
          tournament_code VARCHAR(20) UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          sport VARCHAR(100) NOT NULL,
          tournament_type VARCHAR(50) NOT NULL,
          format VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          registration_start DATE,
          registration_end DATE,
          location VARCHAR(255),
          venue VARCHAR(255),
          max_participants INTEGER,
          entry_fee DECIMAL(10,2),
          prize_pool DECIMAL(10,2),
          status VARCHAR(50) DEFAULT 'draft',
          is_public BOOLEAN DEFAULT TRUE,
          created_by INTEGER REFERENCES users(id),
          school_id INTEGER REFERENCES schools(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Players table
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          player_id UUID DEFAULT gen_random_uuid() UNIQUE,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          date_of_birth DATE,
          gender VARCHAR(10),
          school_id INTEGER REFERENCES schools(id),
          grade_level VARCHAR(20),
          student_id VARCHAR(50),
          emergency_contact_name VARCHAR(100),
          emergency_contact_phone VARCHAR(20),
          medical_conditions TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Teams table
      await testPool.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          team_id UUID DEFAULT gen_random_uuid() UNIQUE,
          name VARCHAR(255) NOT NULL,
          sport VARCHAR(100) NOT NULL,
          school_id INTEGER REFERENCES schools(id),
          coach_id INTEGER REFERENCES users(id),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      testLogger.info('Test tables created successfully');
    } catch (error) {
      testLogger.error('Error setting up test tables:', error);
      throw error;
    }
  }

  static async clearTestData() {
    try {
      // Clear test data in reverse order of dependencies
      await testPool.query('DELETE FROM tournaments');
      await testPool.query('DELETE FROM teams');
      await testPool.query('DELETE FROM players');
      await testPool.query('DELETE FROM users');
      await testPool.query('DELETE FROM schools');
      
      // Reset sequences - with better error handling
      try {
        await testPool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await testPool.query('ALTER SEQUENCE tournaments_id_seq RESTART WITH 1');
        await testPool.query('ALTER SEQUENCE teams_id_seq RESTART WITH 1');
        await testPool.query('ALTER SEQUENCE players_id_seq RESTART WITH 1');
        await testPool.query('ALTER SEQUENCE schools_id_seq RESTART WITH 1');
      } catch (seqError) {
        // Sequences might not exist yet, which is okay
        testLogger.warn('Warning resetting sequences (this is okay for first run):', seqError.message);
      }
      
      testLogger.info('Test data cleared successfully');
    } catch (error) {
      testLogger.error('Error clearing test data:', error);
      // Make sure we throw a proper Error object
      if (typeof error === 'string') {
        throw new Error(error);
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error clearing test data: ${JSON.stringify(error)}`);
      }
    }
  }

  static async dropTestDatabase() {
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres'
    });

    try {
      // Terminate all connections to test database
      await adminPool.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
      `, [testDbConfig.database]);

      // Drop test database
      await adminPool.query(`DROP DATABASE IF EXISTS ${testDbConfig.database}`);
      testLogger.info(`Dropped test database: ${testDbConfig.database}`);
    } catch (error) {
      testLogger.error('Error dropping test database:', error);
      throw error;
    } finally {
      await adminPool.end();
    }
  }
}

module.exports = {
  testPool,
  testDbConfig,
  TestDatabase,
  testLogger
};
