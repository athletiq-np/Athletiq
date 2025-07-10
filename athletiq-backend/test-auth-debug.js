// Test authentication debugging
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('🧪 Testing login endpoint...');
    
    // Test with SuperAdmin credentials
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'superadmin@athletiq.com',
      password: 'admin123'
    }, {
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500; // Accept any status under 500
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers['set-cookie']);
    console.log('Response:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
      
      // Extract cookie and test protected route
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
        if (tokenCookie) {
          console.log('🍪 Cookie found:', tokenCookie.split(';')[0]);
          
          // Test protected route
          const protectedResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: {
              'Cookie': tokenCookie
            },
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          console.log('Protected route status:', protectedResponse.status);
          console.log('Protected route response:', protectedResponse.data);
        }
      }
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Test database connection first
async function testDatabaseConnection() {
  try {
    console.log('🗄️ Testing database connection...');
    const { pool } = require('./src/config/db');
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    console.log('✅ Database connected:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

async function runTests() {
  await testDatabaseConnection();
  await testLogin();
  process.exit(0);
}

runTests();
