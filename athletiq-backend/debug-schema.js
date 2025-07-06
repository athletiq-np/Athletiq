const { testPool } = require('./tests/testDb');

async function checkSchema() {
  try {
    const result = await testPool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'tournaments' ORDER BY ordinal_position;`
    );
    
    console.log('Tournament table columns:');
    result.rows.forEach(row => 
      console.log(`${row.column_name}: ${row.data_type}`)
    );
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkSchema();
