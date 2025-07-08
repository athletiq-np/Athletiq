/**
 * Test login endpoint directly
 */

const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testLogin();
