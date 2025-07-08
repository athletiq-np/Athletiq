// Test just the login function logic in isolation
require('dotenv').config();

async function testLoginLogic() {
  console.log('🧪 Testing login logic in isolation...');
  
  try {
    // Import the same way the auth controller does
    const { pool } = require('./src/config/db');
    const bcrypt = require('bcryptjs');
    
    console.log('✅ Imports successful');
    console.log('Pool type:', typeof pool);
    console.log('Pool ended?', pool.ended);
    
    // Test the exact query from login function
    const email = 'superadmin@athletiq.com';
    console.log('📧 Testing user query for:', email);
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('✅ User query successful');
    console.log('Users found:', userResult.rowCount);
    
    if (userResult.rowCount > 0) {
      const user = userResult.rows[0];
      console.log('👤 User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password_hash
      });
      
      // Test password comparison
      const password = 'admin123';
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password check:', isValidPassword ? '✅ Valid' : '❌ Invalid');
      
      if (isValidPassword) {
        console.log('🎉 Login logic would succeed!');
        return true;
      } else {
        console.log('❌ Invalid password');
        return false;
      }
    } else {
      console.log('❌ No user found with that email');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Login logic test failed:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

testLoginLogic()
  .then(success => {
    console.log('\n' + (success ? '🎉 Login logic works correctly!' : '🚨 Login logic has issues'));
    process.exit(success ? 0 : 1);
  });
