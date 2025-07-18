// check-grade.js
const { pool } = require('./src/config/db');

async function checkGrade() {
  const client = await pool.connect();
  
  try {
    // Check grade constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname LIKE '%grade%';
    `);
    
    console.log('Grade constraints:');
    constraints.rows.forEach(row => {
      console.log(`${row.conname}: ${row.definition}`);
    });
    
    // Check sample grade/class values in backup
    const sample = await client.query('SELECT DISTINCT class FROM players_backup_20250714 WHERE class IS NOT NULL ORDER BY class;');
    
    console.log('\nSample class values in backup:');
    sample.rows.forEach(row => {
      console.log(`- "${row.class}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkGrade();
