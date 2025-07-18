const pool = require('./src/config/db');

async function checkPlayersTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      AND column_name IN ('sports_interests', 'medical_conditions', 'achievements', 'allergies')
      ORDER BY column_name
    `);
    console.log('Special columns in players table:', result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkPlayersTable();
