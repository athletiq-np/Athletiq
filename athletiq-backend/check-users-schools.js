const pool = require('./src/config/db');

async function checkUsersAndSchools() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.role, u.school_id, s.name as school_name, s.admin_email
      FROM users u 
      LEFT JOIN schools s ON u.school_id = s.id 
      WHERE u.role = 'SchoolAdmin' 
      ORDER BY u.id;
    `);
    
    console.log('School Admin Users:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsersAndSchools();
