// Check and create SuperAdmin user
const bcrypt = require('bcryptjs');

// Database connection (using your existing database setup)
const { getPool } = require('./src/config/database');

async function checkAndCreateSuperAdmin() {
  try {
    console.log('🔍 Checking for SuperAdmin user...');
    
    const pool = getPool();
    
    // Check if SuperAdmin exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['superadmin@athletiq.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ SuperAdmin user already exists');
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
      console.log('   Status:', result.rows[0].is_active ? 'Active' : 'Inactive');
      return result.rows[0];
    }
    
    // Create SuperAdmin user
    console.log('📝 Creating SuperAdmin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const createResult = await pool.query(
      `INSERT INTO users (email, password, role, first_name, last_name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      ['superadmin@athletiq.com', hashedPassword, 'SuperAdmin', 'Super', 'Admin', true]
    );
    
    console.log('✅ SuperAdmin user created successfully');
    console.log('   Email: superadmin@athletiq.com');
    console.log('   Password: admin123');
    console.log('   Role: SuperAdmin');
    
    return createResult.rows[0];
    
  } catch (error) {
    console.error('❌ Error managing SuperAdmin user:', error);
    throw error;
  }
}

// Also check regular admin user
async function checkAdminUser() {
  try {
    console.log('\n🔍 Checking admin@test.com user...');
    
    const pool = getPool();
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Regular admin user found');
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
      console.log('   Status:', result.rows[0].is_active ? 'Active' : 'Inactive');
      
      // Update role to admin if needed
      if (result.rows[0].role !== 'admin') {
        await pool.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['admin', 'admin@test.com']
        );
        console.log('✅ Updated admin@test.com role to admin');
      }
    } else {
      console.log('❌ admin@test.com user not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  Promise.all([
    checkAndCreateSuperAdmin(),
    checkAdminUser()
  ])
  .then(() => {
    console.log('\n🎉 User setup complete!');
    console.log('👤 SuperAdmin: superadmin@athletiq.com / admin123');
    console.log('👤 Admin: admin@test.com / password123');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to setup users:', error);
    process.exit(1);
  });
}

module.exports = { checkAndCreateSuperAdmin, checkAdminUser };
