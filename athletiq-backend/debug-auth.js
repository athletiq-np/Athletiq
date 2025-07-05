const bcrypt = require('bcryptjs');
const { testPool } = require('./tests/testDb');

async function debugAuth() {
  try {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    console.log('Created hash:', hashedPassword);
    
    const userResult = await testPool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Test User', 'test@example.com', hashedPassword, 'SuperAdmin']
    );
    
    console.log('User created:', userResult.rows[0]);
    
    // Now check if we can query it back
    const selectResult = await testPool.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    console.log('User found:', selectResult.rows[0]);
    
    if (selectResult.rows[0]) {
      // Test password comparison
      const isMatch = await bcrypt.compare('testpassword123', selectResult.rows[0].password_hash);
      console.log('Password match:', isMatch);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    testPool.end();
  }
}

debugAuth();
