// Check tournament table schema
const { pool } = require('./src/config/db');

async function checkSchema() {
  try {
    // Get column information for tournaments table
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' 
      ORDER BY ordinal_position
    `);
    
    console.log('🏆 Tournaments table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
