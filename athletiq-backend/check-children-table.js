const pool = require('./src/config/db');

async function checkChildrenTable() {
  try {
    const result = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['guardian_children']);
    console.log('Guardian children table columns:', result.rows.map(r => r.column_name));
  } catch (error) {
    console.log('Error:', error.message);
  }
  process.exit();
}

checkChildrenTable();
