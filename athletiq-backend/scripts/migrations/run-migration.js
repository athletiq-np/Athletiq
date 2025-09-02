const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const { logInfo, logError, logWarn } = require('../../src/utils/logger');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'athletiq',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'Ardnepu8',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432
  });

  try {
  logInfo('Starting comprehensive player fields migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/013_comprehensive_player_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
  logInfo('Migration completed successfully');
    
    // Verify the new table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position
    `);
    
    logInfo('New players table structure:');
    columns.rows.forEach(col => {
      logInfo(`column: ${col.column_name}`, { data_type: col.data_type, is_nullable: col.is_nullable });
    });
    
    // Check if sample data was inserted
    const count = await pool.query('SELECT COUNT(*) as count FROM players');
  logInfo('Total players in table', { total: count.rows[0].count });
    
  } catch (error) {
  logError('Migration failed', error, { stack: error.stack });
  } finally {
    await pool.end();
  }
}

runMigration();
