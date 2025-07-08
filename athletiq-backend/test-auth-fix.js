// Quick test of the corrected auth controller
require('dotenv').config();

console.log('🧪 Testing corrected auth controller...');

// Test the imports directly
try {
  const { pool } = require('./src/config/db');
  console.log('✅ Database pool import: OK');
  console.log('Pool type:', typeof pool);
  console.log('Pool has query method:', typeof pool.query === 'function');
  
  const { ApiResponse } = require('./src/utils/apiResponse');
  console.log('✅ ApiResponse import: OK');
  console.log('ApiResponse type:', typeof ApiResponse);
  console.log('ApiResponse has success method:', typeof ApiResponse.success === 'function');
  
  // Test database connection
  console.log('\n🗄️  Testing database connection...');
  pool.query('SELECT NOW() as current_time')
    .then(result => {
      console.log('✅ Database query successful');
      console.log('Current time:', result.rows[0].current_time);
      
      // Test a simple user query (like in login)
      return pool.query('SELECT COUNT(*) as user_count FROM users');
    })
    .then(result => {
      console.log('✅ Users table accessible');
      console.log('User count:', result.rows[0].user_count);
      
      console.log('\n🎯 All tests passed! Backend should work now.');
      console.log('💡 Please restart your backend server to apply the import fixes.');
      
      process.exit(0);
    })
    .catch(error => {
      console.log('❌ Database test failed:', error.message);
      console.log('🔍 This might be why login is failing');
      process.exit(1);
    });
  
} catch (error) {
  console.log('❌ Import test failed:', error.message);
  console.log('📍 Error details:', error.stack);
  process.exit(1);
}
