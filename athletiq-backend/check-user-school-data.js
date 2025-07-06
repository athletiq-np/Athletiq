const pool = require('./src/config/db');

async function checkUserSchoolData() {
  try {
    console.log('Checking user and school data for user ID 15...\n');
    
    // Check user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [15]);
    console.log('User data:');
    console.table(userResult.rows);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      if (user.school_id) {
        // Check school data
        const schoolResult = await pool.query('SELECT * FROM schools WHERE id = $1', [user.school_id]);
        console.log('\nSchool data:');
        console.table(schoolResult.rows);
      } else {
        console.log('\n⚠️  User has no school_id');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserSchoolData();
