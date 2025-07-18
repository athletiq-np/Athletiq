const pool = require('./src/config/db');

async function checkGradeConstraint() {
  try {
    // Check the constraint definition
    const constraintResult = await pool.query(`
      SELECT 
        conname, 
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'valid_grade' AND conrelid = 'players'::regclass
    `);
    
    console.log('Grade constraint definition:');
    console.log(constraintResult.rows);
    
    // Check what grades are allowed
    const columnResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'players' AND column_name = 'grade'
    `);
    
    console.log('Grade column info:');
    console.log(columnResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkGradeConstraint();
