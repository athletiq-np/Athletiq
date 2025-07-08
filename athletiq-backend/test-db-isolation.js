// Minimal database test to isolate the pool issue
require('dotenv').config();

console.log('🔍 Minimal database pool test...');

try {
  // Test the database config directly
  const dbConfig = require('./src/config/db');
  console.log('Database config loaded. Type:', typeof dbConfig);
  console.log('Available properties:', Object.keys(dbConfig));
  
  // Test destructured import
  const { pool } = require('./src/config/db');
  console.log('Pool destructured. Type:', typeof pool);
  console.log('Pool has query method:', typeof pool.query === 'function');
  console.log('Pool ended?', pool.ended);
  
  // Test a simple query
  console.log('Attempting database query...');
  pool.query('SELECT NOW() as test_time')
    .then(result => {
      console.log('✅ Database query successful!');
      console.log('Result:', result.rows[0]);
      
      // Check pool state after query
      console.log('Pool state after query - ended?', pool.ended);
      console.log('Pool stats:', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      });
      
      process.exit(0);
    })
    .catch(error => {
      console.log('❌ Database query failed:', error.message);
      console.log('Pool ended?', pool.ended);
      process.exit(1);
    });
    
} catch (error) {
  console.log('❌ Error loading database config:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
}
