const pool = require('./src/config/simple-database');

async function checkMatchScoresTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'match_scores' 
      ORDER BY ordinal_position
    `);
    
    console.log('Match Scores Table Structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMatchScoresTable();
