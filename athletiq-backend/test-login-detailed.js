// Comprehensive login endpoint test
const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing login endpoint with detailed diagnostics...');
  
  try {
    // First, test if the server is running
    console.log('\n1️⃣ Testing server connectivity...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/', { timeout: 5000 });
      console.log('✅ Server is responding');
      console.log('Response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server connectivity failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Backend server is not running. Please start it with: npm run dev');
        return;
      }
    }
    
    // Test login endpoint
    console.log('\n2️⃣ Testing login endpoint...');
    const loginData = {
      email: 'superadmin@athletiq.com',
      password: 'admin123'
    };
    
    console.log('Request payload:', loginData);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true // Don't throw on error status codes
    });
    
    console.log('\n📊 Response Details:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', response.data);
    
    if (response.status === 500) {
      console.log('\n🔍 500 Error Analysis:');
      console.log('This indicates a server-side error. Common causes:');
      console.log('- Database connection issues');
      console.log('- Import/export mismatches in backend code');
      console.log('- Missing environment variables');
      console.log('- Backend server needs restart after code changes');
      
      if (response.data && response.data.message) {
        console.log('\nError message from server:', response.data.message);
      }
      if (response.data && response.data.stack) {
        console.log('\nStack trace:', response.data.stack);
      }
    } else if (response.status === 200) {
      console.log('✅ Login successful!');
    } else {
      console.log('⚠️ Unexpected status code:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testLogin();
