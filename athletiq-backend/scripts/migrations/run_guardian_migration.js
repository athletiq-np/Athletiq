const pool = require('./src/config/db');
const fs = require('fs');

async function runMigration() {
  try {
    const sql = fs.readFileSync('./src/migrations/016_create_guardians_table.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Guardian tables created successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit(0);
  }
}

runMigration();
