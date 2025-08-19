const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Guardian Portal v2 Database Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_guardians_portal_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Guardian Portal v2 Database Migration completed successfully!');
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('guardians', 'athletes', 'schools', 'documents', 'notifications', 'otp_verifications', 'guardian_sessions', 'athlete_registration_timeline')
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check if sample schools were inserted
    const schoolCount = await client.query('SELECT COUNT(*) FROM schools WHERE is_verified = true');
    console.log(`📚 Sample verified schools inserted: ${schoolCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
