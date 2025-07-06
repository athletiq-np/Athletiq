const axios = require('axios');

// Test the school authentication flow with explicit cookie handling
async function testSchoolAuthWithCookies() {
  try {
    console.log('🔍 Testing School Authentication with explicit cookie handling...\n');

    // Create axios instance
    const client = axios.create({
      baseURL: 'http://localhost:5000',
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    // Keep track of cookies manually
    let cookieStore = '';

    // Step 1: Login and capture cookie
    console.log('1. Attempting login...');
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const loginResponse = await client.post('/api/auth/login', loginData);
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', loginResponse.data);
    
    // Extract cookies from response headers
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (setCookieHeader) {
      console.log('Set-Cookie headers:', setCookieHeader);
      // Extract the token cookie
      const tokenCookie = setCookieHeader.find(cookie => cookie.startsWith('token='));
      if (tokenCookie) {
        cookieStore = tokenCookie.split(';')[0]; // Get just the token=value part
        console.log('Extracted cookie:', cookieStore);
      }
    }

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed');
      return;
    }

    // Step 2: Test authenticated request with manual cookie
    console.log('\n2. Testing authenticated access with manual cookie...');
    const schoolResponse = await client.get('/api/schools/me', {
      headers: {
        'Cookie': cookieStore
      }
    });
    
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
      status: error.response?.status
    });
  }
}

testSchoolAuthWithCookies();
