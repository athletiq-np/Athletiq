const axios = require('axios');

// Test the school authentication flow with better error handling
async function testSchoolAuth() {
  try {
    console.log('🔍 Testing School Authentication Flow with detailed logging...\n');

    // Create axios instance with better configuration
    const client = axios.create({
      baseURL: 'http://localhost:5000',
      withCredentials: true,
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
      }
    });

    // Step 1: Test unauthorized access
    console.log('1. Testing unauthorized access...');
    const unauthorizedResponse = await client.get('/api/schools/me');
    console.log('Status:', unauthorizedResponse.status);
    console.log('Response:', unauthorizedResponse.data);

    // Step 2: Login
    console.log('\n2. Attempting login...');
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const loginResponse = await client.post('/api/auth/login', loginData);
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginResponse.data);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Login failed');
      return;
    }

    // Step 3: Test authenticated access
    console.log('\n3. Testing authenticated access...');
    const schoolResponse = await client.get('/api/schools/me');
    console.log('School Status:', schoolResponse.status);
    console.log('School Response:', schoolResponse.data);

    if (schoolResponse.status === 200) {
      console.log('✅ School data retrieved successfully');
      console.log('School details:', {
        name: schoolResponse.data.data?.name,
        email: schoolResponse.data.data?.email,
        school_id: schoolResponse.data.data?.school_id || schoolResponse.data.data?.id
      });
    } else {
      console.error('❌ Failed to retrieve school data');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
  }
}

testSchoolAuth();
