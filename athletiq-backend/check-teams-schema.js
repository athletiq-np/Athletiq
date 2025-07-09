// Check teams table schema
const { pool } = require('./src/config/db');

async function checkTeamsSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `);
    
    console.log('⚽ Teams table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTeamsSchema();
