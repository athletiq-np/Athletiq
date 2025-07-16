// check-gender.js
const { pool } = require('./src/config/db');

async function checkGender() {
  const client = await pool.connect();
  
  try {
    // Check gender constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname LIKE '%gender%';
    `);
    
    console.log('Gender constraints:');
    constraints.rows.forEach(row => {
      console.log(`${row.conname}: ${row.definition}`);
    });
    
    // Check sample gender values in backup
    const sample = await client.query('SELECT DISTINCT gender FROM players_backup_20250714 ORDER BY gender;');
    
    console.log('\nSample gender values in backup:');
    sample.rows.forEach(row => {
      console.log(`- "${row.gender}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkGender();
