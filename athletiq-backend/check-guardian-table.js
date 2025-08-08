const pool = require('./src/config/db');

async function checkTable() {
  try {
    const result = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['guardians']);
    console.log('Guardian table columns:', result.rows.map(r => r.column_name));
  } catch (error) {
    console.log('Error:', error.message);
  }
  process.exit();
}

checkTable();
