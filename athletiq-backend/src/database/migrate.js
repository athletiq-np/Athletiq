// src/database/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { logInfo, logError } = require('../utils/logger');

/**
 * Migration runner for database schema changes
 */
class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationTableName = 'schema_migrations';
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `;
    
    try {
      await pool.query(createTableQuery);
      logInfo('Migration table initialized');
    } catch (error) {
      logError('Failed to initialize migration table', error);
      throw error;
    }
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      return files;
    } catch (error) {
      logError('Failed to read migration files', error);
      return [];
    }
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations() {
    try {
      const result = await pool.query(
        `SELECT name FROM ${this.migrationTableName} ORDER BY executed_at`
      );
      return result.rows.map(row => row.name);
    } catch (error) {
      logError('Failed to get executed migrations', error);
      return [];
    }
  }

  /**
   * Generate checksum for migration file
   */
  generateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Execute a single migration
   */
  async executeMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    const startTime = Date.now();
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const checksum = this.generateChecksum(content);
      
      logInfo(`Executing migration: ${filename}`);
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Execute the migration SQL
        await client.query(content);
        
        // Record the migration
        const executionTime = Date.now() - startTime;
        await client.query(
          `INSERT INTO ${this.migrationTableName} (version, name, checksum, execution_time) VALUES ($1, $2, $3, $4)`,
          [Date.now(), filename, checksum, executionTime]
        );
        
        await client.query('COMMIT');
        logInfo(`Migration completed: ${filename} (${executionTime}ms)`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      logError(`Migration failed: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    try {
      await this.initializeMigrationTable();
      
      const allMigrations = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration)
      );
      
      if (pendingMigrations.length === 0) {
        logInfo('No pending migrations');
        return;
      }
      
      logInfo(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logInfo('All migrations completed successfully');
      
    } catch (error) {
      logError('Migration process failed', error);
      throw error;
    }
  }

  /**
   * Verify migration integrity
   */
  async verifyMigrations() {
    try {
      const executedMigrations = await pool.query(
        `SELECT filename, checksum FROM ${this.migrationTableName}`
      );
      
      for (const migration of executedMigrations.rows) {
        const filePath = path.join(this.migrationsPath, migration.filename);
        
        if (!fs.existsSync(filePath)) {
          logError(`Migration file missing: ${migration.filename}`);
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const currentChecksum = this.generateChecksum(content);
        
        if (currentChecksum !== migration.checksum) {
          logError(`Migration checksum mismatch: ${migration.filename}`);
          logError(`Expected: ${migration.checksum}, Got: ${currentChecksum}`);
        }
      }
      
      logInfo('Migration verification completed');
      
    } catch (error) {
      logError('Migration verification failed', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    try {
      await this.initializeMigrationTable();
      
      const allMigrations = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const status = allMigrations.map(migration => ({
        filename: migration,
        executed: executedMigrations.includes(migration)
      }));
      
      return status;
      
    } catch (error) {
      logError('Failed to get migration status', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      runner.runMigrations()
        .then(() => {
          console.log('Migrations completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('Migration failed:', error);
          process.exit(1);
        });
      break;
      
    case 'status':
      runner.getStatus()
        .then(status => {
          console.log('Migration Status:');
          status.forEach(migration => {
            const status = migration.executed ? '✅' : '❌';
            console.log(`${status} ${migration.filename}`);
          });
          process.exit(0);
        })
        .catch(error => {
          console.error('Failed to get status:', error);
          process.exit(1);
        });
      break;
      
    case 'verify':
      runner.verifyMigrations()
        .then(() => {
          console.log('Migration verification completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('Verification failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
Usage: node migrate.js <command>

Commands:
  run     - Run pending migrations
  status  - Show migration status
  verify  - Verify migration integrity
      `);
      process.exit(1);
  }
}

module.exports = MigrationRunner;
