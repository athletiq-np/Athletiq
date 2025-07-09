// Check user passwords
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function checkPasswords() {
  try {
    const result = await pool.query('SELECT email, password_hash FROM users WHERE email LIKE \'%admin%\' LIMIT 3');
    
    console.log('👥 Users with passwords:');
    for (const user of result.rows) {
      console.log(`\n📧 Email: ${user.email}`);
      
      // Test common passwords
      const testPasswords = ['password123', 'admin123', 'password', 'admin', '123456'];
      
      for (const password of testPasswords) {
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
          console.log(`✅ Password found: ${password}`);
          break;
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPasswords();
