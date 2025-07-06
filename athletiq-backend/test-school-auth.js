const axios = require('axios');

// Configure axios to use cookies
axios.defaults.withCredentials = true;

const testSchoolAuth = async () => {
  try {
    console.log('🔍 Testing School Authentication Flow...\n');

    // Step 1: Try to access protected route without auth
    console.log('1. Testing unauthorized access...');
    try {
      await axios.get('http://localhost:5000/api/schools/me');
    } catch (err) {
      console.log('✅ Correctly rejected:', err.response?.data?.message || 'Unknown error');
    }

    // Step 2: Login as school admin
    console.log('\n2. Attempting login...');
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    console.log('✅ Login successful:', loginResponse.data.message);

    // Step 3: Try to access school profile
    console.log('\n3. Testing authenticated access...');
    const schoolResponse = await axios.get('http://localhost:5000/api/schools/me');
    console.log('✅ School data retrieved:', {
      name: schoolResponse.data.data?.name,
      email: schoolResponse.data.data?.email,
      id: schoolResponse.data.data?.school_id
    });

    // Step 4: Test updating school profile
    console.log('\n4. Testing school profile update...');
    const updateData = {
      name: 'Updated Test School',
      address: '123 Updated Street',
      phone: '+1-555-0123'
    };

    const updateResponse = await axios.patch('http://localhost:5000/api/schools/me', updateData);
    console.log('✅ School updated:', updateResponse.data.message);

    console.log('\n🎉 All tests passed! School dashboard should work correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    // If login failed because user doesn't exist, let's create the user
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/login')) {
      console.log('\n💡 User may not exist. Creating test school and admin...');
      
      try {
        const registerData = {
          name: 'Test School',
          address: '123 Test Street',
          country: 'Rwanda',
          province: 'Kigali',
          district: 'Gasabo',
          admin_name: 'Test Admin',
          admin_email: 'admin@testschool.com',
          password: 'TestPassword123!',
          principal_name: 'Test Principal'
        };

        const registerResponse = await axios.post('http://localhost:5000/api/schools/register', registerData);
        console.log('✅ Test school created:', registerResponse.data.message);
        console.log('🔄 Please run this test again to verify login works.');
        
      } catch (regError) {
        console.error('❌ Failed to create test school:', regError.response?.data || regError.message);
      }
    }
  }
};

testSchoolAuth();
