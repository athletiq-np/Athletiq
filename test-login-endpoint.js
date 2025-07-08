const axios = require('axios');

// Test the login endpoint directly
async function testLogin() {
  console.log('Testing login endpoint...\n');
  
  try {
    console.log('1. Testing connection to backend...');
    const healthResponse = await axios.get('http://localhost:5000/api/health')
      .catch(() => ({ status: 'Server not running' }));
    
    if (healthResponse.status === 'Server not running') {
      console.log('❌ Backend server is not running on port 5000');
      console.log('Please start the backend server first:');
      console.log('cd athletiq-backend && npm start');
      return;
    }
    
    console.log('✅ Backend server is running');
    
    console.log('\n2. Testing login with test credentials...');
    const apiClient = axios.create({
      baseURL: 'http://localhost:5000/api',
      withCredentials: true,
    });
    
    // Test with the credentials shown in the frontend
    const testCredentials = {
      email: 'superadmin@athletiq.com',
      password: 'admin123'
    };
    
    const loginResponse = await apiClient.post('/auth/login', testCredentials);
    
    console.log('✅ Login successful!');
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 This looks like the backend server is not running.');
      console.log('Please start it with: cd athletiq-backend && npm start');
    }
  }
}

testLogin();
