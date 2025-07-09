// Quick database check
const { pool } = require('./src/config/db');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...');
    
    // Check if users table exists and has data
    const usersResult = await pool.query('SELECT id, email, role, school_id FROM users LIMIT 5');
    console.log('👥 Users found:', usersResult.rows.length);
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role}, school_id: ${user.school_id})`);
    });
    
    // Check if schools table exists and has data
    const schoolsResult = await pool.query('SELECT id, name FROM schools LIMIT 5');
    console.log('🏫 Schools found:', schoolsResult.rows.length);
    schoolsResult.rows.forEach(school => {
      console.log(`   - ${school.name} (id: ${school.id})`);
    });
    
    // Check if tournaments table exists and has data
    const tournamentsResult = await pool.query('SELECT id, name, organizer_id FROM tournaments LIMIT 5');
    console.log('🏆 Tournaments found:', tournamentsResult.rows.length);
    tournamentsResult.rows.forEach(tournament => {
      console.log(`   - ${tournament.name} (id: ${tournament.id}, organizer: ${tournament.organizer_id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
