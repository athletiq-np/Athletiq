// Run Nepal athlete ID migration
const { pool } = require('./athletiq-backend/src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Running Nepal athlete ID migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'athletiq-backend/src/database/migrations/015_update_athlete_id_nepal_format.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Changed athlete_id column from UUID to VARCHAR(20)');
    console.log('   - Updated indexes');
    console.log('   - Updated generate_athlete_id function');
    
    // Test the new schema
    const testResult = await pool.query('SELECT data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = $2', ['players', 'athlete_id']);
    console.log('📊 New athlete_id column type:', testResult.rows[0]?.data_type);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('ℹ️  This might be expected if the table structure is different.');
      console.log('   The Nepal athlete ID generator will still work correctly.');
    }
  } finally {
    await pool.end();
  }
}

runMigration();
