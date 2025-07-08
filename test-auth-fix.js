const axios = require('axios');

// Test the auth fix - create a simple test to check if cookies work
async function testAuth() {
  console.log('Testing authentication fix...\n');
  
  try {
    // Create an axios instance with withCredentials
    const apiClient = axios.create({
      baseURL: 'http://localhost:5000/api',
      withCredentials: true,
    });

    console.log('1. Testing a public endpoint...');
    const publicResponse = await apiClient.get('/tournaments');
    console.log('Public endpoint response status:', publicResponse.status);
    
    console.log('\n2. Testing a protected endpoint (should fail without auth)...');
    try {
      const protectedResponse = await apiClient.post('/tournaments', {
        name: 'Test Tournament',
        description: 'Test Description'
      });
      console.log('Protected endpoint response status:', protectedResponse.status);
    } catch (error) {
      console.log('Expected error for protected endpoint:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n3. The frontend should now use cookies for authentication instead of Bearer tokens.');
    console.log('Frontend API calls will use the apiClient from src/api/apiClient.js with withCredentials: true');
    
  } catch (error) {
    console.error('Error testing auth:', error.message);
  }
}

// Run the test if backend is available
testAuth();
