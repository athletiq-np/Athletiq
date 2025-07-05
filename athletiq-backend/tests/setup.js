// tests/setup.js
const pool = require('../src/config/db');

// Global test setup
beforeAll(async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
  
  // Disable logging during tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await pool.end();
});

// Setup for each test
beforeEach(async () => {
  // Clean up or reset state if needed
});

// Teardown for each test
afterEach(async () => {
  // Clean up after each test
});
