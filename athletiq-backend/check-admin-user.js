const { pool } = require('./src/config/db');

async function checkAdminUser() {
  try {
    const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE email = $1', ['admin@test.com']);
    
    if (result.rows.length > 0) {
      console.log('✅ Found admin user:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Name:', result.rows[0].full_name);
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
    } else {
      console.log('❌ No user found with email admin@test.com');
    }
    
    // Also check all users and their roles
    const allUsers = await pool.query('SELECT id, full_name, email, role FROM users ORDER BY created_at DESC LIMIT 5');
    console.log('\n📋 Recent users:');
    allUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    process.exit(0);
  }
}

checkAdminUser();
