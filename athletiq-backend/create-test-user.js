// Create test user with known password
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    const email = 'test.login@athletiq.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('🔄 User already exists, updating password...');
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
    } else {
      console.log('👤 Creating new test user...');
      await pool.query(`
        INSERT INTO users (full_name, email, password_hash, role, school_id, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Test User', email, hashedPassword, 'SchoolAdmin', 2, '1234567890']);
    }
    
    console.log(`✅ Test user created/updated:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   School ID: 2`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
