/**
 * Quick test to check cookie authentication
 */

const axios = require('axios');

// Test cookie-based auth
async function testCookieAuth() {
  console.log('Testing cookie-based authentication...\n');
  
  try {
    // Create axios instance with credentials
    const client = axios.create({
      baseURL: 'http://localhost:5000/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await client.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });

    console.log('Login successful:', loginResponse.data.success);
    console.log('User:', loginResponse.data.data.full_name);

    // 2. Check what cookies were set
    console.log('\n2. Checking cookies...');
    const cookies = loginResponse.headers['set-cookie'];
    console.log('Cookies received:', cookies);

    // 3. Test authenticated request
    console.log('\n3. Testing authenticated request...');
    const authResponse = await client.get('/auth/me');
    console.log('Auth check successful:', authResponse.data.success);
    console.log('Authenticated user:', authResponse.data.data.full_name);

    // 4. Test tournament creation
    console.log('\n4. Testing tournament creation...');
    const tournamentData = {
      name: 'Cookie Test Tournament',
      description: 'Testing cookie authentication',
      start_date: '2024-08-01',
      end_date: '2024-08-03',
      location: 'Test Location',
      status: 'Draft',
      sports_config: []
    };

    const tournamentResponse = await client.post('/tournaments', tournamentData);
    console.log('Tournament creation successful:', tournamentResponse.data.success);
    console.log('Tournament ID:', tournamentResponse.data.data.id);

    console.log('\n✅ All tests passed! Cookie authentication is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCookieAuth();
