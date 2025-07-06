// Simple register endpoint debug
const request = require('supertest');
const app = require('./tests/testApp');

async function debugRegister() {
  console.log('Testing register endpoint...');
  
  const schoolData = {
    adminFullName: 'Test Admin',
    adminEmail: 'admin@testschool.com',
    password: 'SecurePassword123!',
    schoolName: 'Test School',
    schoolCode: 'TEST001',
    schoolAddress: '123 Test Street, Test City'
  };

  console.log('Request data:', schoolData);
  
  try {
    const response = await request(app)
      .post('/api/auth/register')
      .send(schoolData);
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    console.log('Response headers:', response.headers);
  } catch (error) {
    console.error('Error making request:', error);
  }
}

debugRegister();
