require('dotenv').config();
const pool = require('./src/config/db');

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Get all table names
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const result = await pool.query(tablesQuery);
    console.log('\n📋 Available tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check counts for main tables
    const mainTables = ['schools', 'players', 'tournaments', 'teams', 'matches', 'sports'];
    console.log('\n📊 Table counts:');
    
    for (const table of mainTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: ❌ Table not found or error`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();