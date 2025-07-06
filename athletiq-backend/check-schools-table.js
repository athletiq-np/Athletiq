const pool = require('./src/config/db');

async function checkSchoolsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'schools' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Schools table structure:');
    console.table(result.rows);
    
    // Also check if there are any existing schools
    const schoolsResult = await pool.query('SELECT * FROM schools LIMIT 5;');
    console.log('\nExisting schools:');
    console.table(schoolsResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchoolsTable();
