// Test the auth controller directly
const bcrypt = require('bcryptjs');
const { testPool } = require('./tests/testDb');
const { TestDatabase } = require('./tests/testDb');
const createTestApp = require('./tests/testApp');
const request = require('supertest');

async function debugAuthController() {
  try {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
    
    console.log('Setting up test environment...');
    await TestDatabase.createTestDatabase();
    await TestDatabase.setupTestTables();
    
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await testPool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ['Test User', 'test@example.com', hashedPassword, 'SuperAdmin']
    );
    console.log('Created user with ID:', userResult.rows[0].id);
    
    // Test via HTTP request
    const app = createTestApp();
    console.log('Testing login via HTTP...');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123'
      });
    
    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    // Check if user exists via main pool
    const { getPool } = require('./src/config/database');
    const mainPool = getPool();
    console.log('Checking if user exists in main pool database...');
    const mainCheck = await mainPool.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    console.log('Main pool result count:', mainCheck.rows.length);
    if (mainCheck.rows.length > 0) {
      console.log('Main pool found user:', mainCheck.rows[0].email);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    process.exit();
  }
}

debugAuthController();
