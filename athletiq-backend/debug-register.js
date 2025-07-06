const request = require('supertest');
const app = require('./tests/testApp');
const { TestDatabase } = require('./tests/testDb');

async function debugRegister() {
  console.log('Starting register debug test...');
  
  // Set up test DB
  await TestDatabase.createTestDatabase();
  await TestDatabase.setupTestTables();
  await TestDatabase.clearTestData();
  
  const schoolData = {
    adminFullName: 'Test Admin',
    adminEmail: 'admin@testschool.com',
    password: 'SecurePassword123!',
    schoolName: 'Test School',
    schoolCode: 'TEST001',
    schoolAddress: '123 Test Street, Test City'
  };

  console.log('Sending registration request with:', schoolData);
  
  const response = await request(app)
    .post('/api/auth/register')
    .send(schoolData);
  
  console.log('Response status:', response.status);
  console.log('Response body:', response.body);
  console.log('Response headers:', response.headers);
  
  console.log('Debug complete');
}

debugRegister().catch(console.error);
