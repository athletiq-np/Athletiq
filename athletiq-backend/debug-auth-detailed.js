const bcrypt = require('bcryptjs');
const { testPool } = require('./tests/testDb');
const { TestDatabase } = require('./tests/testDb');

async function debugAuth() {
  try {
    console.log('Setting up test database...');
    await TestDatabase.createTestDatabase();
    await TestDatabase.setupTestTables();
    
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    console.log('Hashed password:', hashedPassword);
    
    const userResult = await testPool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ['Test User', 'test@example.com', hashedPassword, 'SuperAdmin']
    );
    
    console.log('Created user:', userResult.rows[0]);
    
    console.log('Finding user by email...');
    const findResult = await testPool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    console.log('Found user:', findResult.rows[0]);
    
    if (findResult.rows.length > 0) {
      const user = findResult.rows[0];
      console.log('Testing password comparison...');
      const isMatch = await bcrypt.compare('testpassword123', user.password_hash);
      console.log('Password match:', isMatch);
      
      const isWrongMatch = await bcrypt.compare('wrongpassword', user.password_hash);
      console.log('Wrong password match:', isWrongMatch);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    process.exit();
  }
}

debugAuth();
