const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: 'localhost',
    database: 'athletiq',
    user: 'postgres',
    password: 'Ardnepu8',
    port: 5432
  });

  try {
    console.log('🔄 Starting comprehensive player fields migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/013_comprehensive_player_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 New players table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Check if sample data was inserted
    const count = await pool.query('SELECT COUNT(*) as count FROM players');
    console.log(`📈 Total players in table: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📍 Error details:', error.stack);
  } finally {
    await pool.end();
  }
}

runMigration();
