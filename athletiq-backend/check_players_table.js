const pool = require('./src/config/db');

async function checkPlayersTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position
    `);
    
    console.log('Players table structure:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // Also check if there's an athlete_id column
    const athleteIdCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' AND column_name LIKE '%athlete%'
    `);
    
    console.log('\nAthlete ID related columns:');
    athleteIdCheck.rows.forEach(row => {
      console.log(row.column_name);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkPlayersTable();
