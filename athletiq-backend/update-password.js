// Update existing user password
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  try {
    const email = 'admin.pashupati@athletiq.com';
    const newPassword = 'test123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
    
    console.log(`✅ Password updated for ${email}`);
    console.log(`   New password: ${newPassword}`);
    
    // Also get the user info
    const user = await pool.query('SELECT id, full_name, email, role, school_id FROM users WHERE email = $1', [email]);
    console.log('👤 User info:', user.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePassword();
