const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
  try {
    // Check if SuperAdmin exists
    const superAdminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['superadmin@athletiq.com']);
    
    if (superAdminResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (full_name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4)
      `, ['Super Admin', 'superadmin@athletiq.com', hashedPassword, 'SuperAdmin']);
      console.log('✅ SuperAdmin created: superadmin@athletiq.com / admin123');
    } else {
      console.log('ℹ️  SuperAdmin already exists');
    }

    // Check if SchoolAdmin exists
    const schoolAdminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@test.com']);
    
    if (schoolAdminResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await pool.query(`
        INSERT INTO users (full_name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4)
      `, ['School Admin', 'admin@test.com', hashedPassword, 'SchoolAdmin']);
      console.log('✅ SchoolAdmin created: admin@test.com / password123');
    } else {
      console.log('ℹ️  SchoolAdmin already exists');
    }

    console.log('✅ Test users setup complete!');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await pool.end();
  }
}

createTestUsers();
