const path = require('path');
const dotenv = require('dotenv');
const { TestDatabase, testPool } = require('./testDb');
const { resetPool } = require('../src/config/database');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  try {
    console.log('Setting up test environment...');
    
    // Create test database if it doesn't exist
    await TestDatabase.createTestDatabase();
    
    // Setup test tables
    await TestDatabase.setupTestTables();
    
    console.log('Test environment setup complete');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

// Global test teardown
afterAll(async () => {
  try {
    console.log('Tearing down test environment...');
    
    // Clear test data
    await TestDatabase.clearTestData();
    
    // Close test pool
    await testPool.end();
    
    // Reset the main pool to ensure clean state
    resetPool();
    
    console.log('Test environment teardown complete');
  } catch (error) {
    console.error('Failed to teardown test environment:', error);
    throw error;
  }
}, 15000); // 15 second timeout for teardown

// Clean up between tests
beforeEach(async () => {
  try {
    // Clear test data before each test
    await TestDatabase.clearTestData();
  } catch (error) {
    console.error('Failed to clear test data:', error);
    throw error;
  }
});

// Export test utilities
module.exports = {
  testPool,
  TestDatabase
};
