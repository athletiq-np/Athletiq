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
        checksum VARCHAR(64),
        execution_time INTEGER
      );
  -- Legacy support: ensure version column exists if older tooling created it
  ALTER TABLE ${this.migrationTableName} ADD COLUMN IF NOT EXISTS version VARCHAR(50);
      -- Widen version column to accommodate full filenames (legacy may have length 20)
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='schema_migrations' AND column_name='version'
        ) THEN
          BEGIN
            ALTER TABLE ${this.migrationTableName} ALTER COLUMN version TYPE VARCHAR(255);
          EXCEPTION WHEN others THEN
            -- ignore if already widened or incompatible
          END;
        END IF;
      END$$;
      -- Backward compatibility: if an older table used column 'name', rename it to 'filename'
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='schema_migrations' AND column_name='name'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='schema_migrations' AND column_name='filename'
        ) THEN
          EXECUTE 'ALTER TABLE ${this.migrationTableName} RENAME COLUMN name TO filename';
        END IF;
      END$$;
      -- Ensure filename column exists (if rename not possible for some reason)
      ALTER TABLE ${this.migrationTableName} ADD COLUMN IF NOT EXISTS filename VARCHAR(255);
      -- Ensure uniqueness on filename
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename='schema_migrations' AND indexname='schema_migrations_filename_key'
        ) THEN
          BEGIN
            ALTER TABLE ${this.migrationTableName} ADD CONSTRAINT schema_migrations_filename_key UNIQUE (filename);
          EXCEPTION WHEN others THEN
            -- ignore if constraint already exists under different name
          END;
        END IF;
      END$$;
      ALTER TABLE ${this.migrationTableName} ADD COLUMN IF NOT EXISTS execution_time INTEGER;
      -- Backfill version values to full filename (without extension) if truncated
      UPDATE ${this.migrationTableName}
        SET version = regexp_replace(filename, '\\.sql$', '')
      WHERE version IS NOT NULL
        AND version <> regexp_replace(filename, '\\.sql$', '')
        AND length(regexp_replace(filename, '\\.sql$', '')) <= 255;
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
      let result;
      try {
        // Preferred path (modern schema)
        result = await pool.query(
          `SELECT filename FROM ${this.migrationTableName} ORDER BY executed_at`
        );
        return result.rows.map(row => row.filename).filter(Boolean);
      } catch (primaryErr) {
        // Fallback legacy path using 'name' column
        logInfo('Falling back to legacy migration column "name"');
        result = await pool.query(
          `SELECT name FROM ${this.migrationTableName} ORDER BY executed_at`
        );
        return result.rows.map(row => row.name).filter(Boolean);
      }
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
        // Determine if version column exists and is required (NOT NULL)
        let hasVersionColumn = false;
        let versionNotNull = false;
        try {
          const colRes = await client.query(
            `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name=$1 AND column_name IN ('version')`,
            [this.migrationTableName]
          );
          if (colRes.rowCount > 0) {
            hasVersionColumn = true;
            versionNotNull = colRes.rows[0].is_nullable === 'NO';
          }
        } catch (e) {
          // ignore metadata check failure
        }

        // Derive version from filename prefix before first underscore, fallback to full filename
  // Use full filename (without extension) as version to avoid collisions on numeric prefixes (e.g., multiple 010_*)
  let versionPart = filename.replace(/\.sql$/, '');

        if (hasVersionColumn) {
          await client.query(
            `INSERT INTO ${this.migrationTableName} (version, filename, checksum, execution_time) VALUES ($1, $2, $3, $4)`,
            [versionPart, filename, checksum, executionTime]
          );
        } else {
          await client.query(
            `INSERT INTO ${this.migrationTableName} (filename, checksum, execution_time) VALUES ($1, $2, $3)`,
            [filename, checksum, executionTime]
          );
        }
        
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
