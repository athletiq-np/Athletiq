// check-required-columns.js
const { pool } = require('./src/config/db');

async function checkRequiredColumns() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT column_name, is_nullable, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      AND is_nullable = 'NO' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Required (NOT NULL) columns in players table:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) - Default: ${row.column_default || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkRequiredColumns();
