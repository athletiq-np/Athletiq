// check-relationship.js
const { pool } = require('./src/config/db');

async function checkRelationship() {
  const client = await pool.connect();
  
  try {
    // Check relationship constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname LIKE '%relationship%';
    `);
    
    console.log('Relationship constraints:');
    constraints.rows.forEach(row => {
      console.log(`${row.conname}: ${row.definition}`);
    });
    
    // Check sample relationship values in backup
    const sample = await client.query('SELECT DISTINCT guardian_relation FROM players_backup_20250714 WHERE guardian_relation IS NOT NULL ORDER BY guardian_relation;');
    
    console.log('\nSample guardian_relation values in backup:');
    sample.rows.forEach(row => {
      console.log(`- "${row.guardian_relation}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkRelationship();
