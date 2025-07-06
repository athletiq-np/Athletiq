const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// Create a cookie jar and wrap axios with cookie support
const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  baseURL: 'http://localhost:5000/api'
}));

async function testSchoolEndpoint() {
  try {
    console.log('🔍 Testing School Endpoint...\n');

    // Step 1: Login to get a fresh token
    console.log('1. Logging in...');
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const loginResponse = await client.post('/auth/login', loginData);
    console.log('✅ Login successful');

    // Step 2: Test the school profile endpoint
    console.log('\n2. Testing /api/schools/me...');
    const schoolResponse = await client.get('/schools/me');
    console.log('✅ School data retrieved:', schoolResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log('⚠️  Request timed out - possible database connection issue');
    }
  }
}

testSchoolEndpoint();
