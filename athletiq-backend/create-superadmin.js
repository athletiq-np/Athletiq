// Create SuperAdmin user with correct schema
const bcrypt = require('bcryptjs');
const { getPool } = require('./src/config/database');

async function createSuperAdmin() {
  try {
    console.log('🔍 Creating SuperAdmin user...');
    
    const pool = getPool();
    
    // Check if SuperAdmin exists
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['superadmin@athletiq.com']
    );
    
    if (existing.rows.length > 0) {
      console.log('✅ SuperAdmin user already exists');
      console.log('   Email:', existing.rows[0].email);
      console.log('   Role:', existing.rows[0].role);
      return existing.rows[0];
    }
    
    // Create SuperAdmin user
    console.log('📝 Creating SuperAdmin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const createResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      ['Super Admin', 'superadmin@athletiq.com', hashedPassword, 'SuperAdmin']
    );
    
    console.log('✅ SuperAdmin user created successfully');
    console.log('   Email: superadmin@athletiq.com');
    console.log('   Password: admin123');
    console.log('   Role: SuperAdmin');
    console.log('   ID:', createResult.rows[0].id);
    
    return createResult.rows[0];
    
  } catch (error) {
    console.error('❌ Error creating SuperAdmin user:', error);
    throw error;
  }
}

// Run the creation
createSuperAdmin()
  .then(() => {
    console.log('\n🎉 SuperAdmin setup complete!');
    console.log('👤 Login: superadmin@athletiq.com / admin123');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create SuperAdmin:', error);
    process.exit(1);
  });
