// Activate SuperAdmin and Admin users
const { pool } = require('./src/config/db');

async function activateUsers() {
  try {
    console.log('🔧 Activating SuperAdmin and Admin users...');
    
    // pool is already imported
    
    // Activate SuperAdmin
    await pool.query(
      'UPDATE users SET is_active = true WHERE email = $1',
      ['superadmin@athletiq.com']
    );
    
    // Activate Admin
    await pool.query(
      'UPDATE users SET is_active = true WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log('✅ Users activated successfully');
    
    // Verify users
    const superAdminResult = await pool.query(
      'SELECT email, role, is_active FROM users WHERE email = $1',
      ['superadmin@athletiq.com']
    );
    
    const adminResult = await pool.query(
      'SELECT email, role, is_active FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log('\n📊 User Status:');
    console.log('SuperAdmin:', superAdminResult.rows[0]);
    console.log('Admin:', adminResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error activating users:', error);
    throw error;
  }
}

// Run the activation
activateUsers()
  .then(() => {
    console.log('\n🎉 User activation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to activate users:', error);
    process.exit(1);
  });
