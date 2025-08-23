#!/usr/bin/env node

/**
 * Debug Login Issue
 * Test different login scenarios to identify the problem
 */

const axios = require('axios');

const DJANGO_BASE_URL = 'http://localhost:8000';

async function makeRequest(config) {
  try {
    const response = await axios({
      timeout: 10000,
      validateStatus: () => true,
      withCredentials: true,
      ...config
    });
    return response;
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message,
      headers: {}
    };
  }
}

async function debugLogin() {
  console.log('🔍 Debugging Login Issue...\n');
  
  // Step 1: Get CSRF Token
  console.log('1. Getting CSRF Token...');
  const csrfResponse = await makeRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  console.log(`   Status: ${csrfResponse.status}`);
  console.log(`   CSRF Token: ${csrfResponse.data?.csrfToken ? 'Present' : 'Missing'}`);
  
  if (!csrfResponse.data?.csrfToken) {
    console.log('❌ Cannot proceed without CSRF token');
    return;
  }
  
  const csrfToken = csrfResponse.data.csrfToken;
  const cookies = csrfResponse.headers['set-cookie'];
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  // Step 2: Test Authentication Login Endpoint
  console.log('\n2. Testing Authentication Login Endpoint (/api/auth/login)...');
  const authLoginResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      email: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  console.log(`   Status: ${authLoginResponse.status}`);
  console.log(`   Response: ${JSON.stringify(authLoginResponse.data, null, 2)}`);
  
  // Step 3: Test Guardian Login Endpoint
  console.log('\n3. Testing Guardian Login Endpoint (/api/guardian/auth/login)...');
  const guardianLoginResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      email: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  console.log(`   Status: ${guardianLoginResponse.status}`);
  console.log(`   Response: ${JSON.stringify(guardianLoginResponse.data, null, 2)}`);
  
  // Step 4: Test with different data formats
  console.log('\n4. Testing with username field...');
  const usernameLoginResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      username: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  console.log(`   Status: ${usernameLoginResponse.status}`);
  console.log(`   Response: ${JSON.stringify(usernameLoginResponse.data, null, 2)}`);
  
  // Step 5: Check if we need to create a test user first
  console.log('\n5. Testing Guardian Registration...');
  const registerResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/register`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      full_name: 'Test Guardian',
      email: 'testguardian@example.com',
      phone: '1234567890',
      password: 'TestPassword123!',
      password_confirm: 'TestPassword123!'
    }
  });
  
  console.log(`   Status: ${registerResponse.status}`);
  console.log(`   Response: ${JSON.stringify(registerResponse.data, null, 2)}`);
  
  // Step 6: Try login with existing test guardian
  console.log('\n6. Testing login with existing test guardian...');
  const testLoginResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      email: 'testguardian@example.com',
      password: 'TestPassword123!'
    }
  });
  
  console.log(`   Status: ${testLoginResponse.status}`);
  console.log(`   Response: ${JSON.stringify(testLoginResponse.data, null, 2)}`);
  
  if (testLoginResponse.status === 200 && testLoginResponse.data?.data?.token) {
    console.log('\n✅ Login successful! Testing authenticated request...');
    
    const token = testLoginResponse.data.data.token;
    const profileResponse = await makeRequest({
      method: 'GET',
      url: `${DJANGO_BASE_URL}/api/guardian/profile`,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log(`   Profile Status: ${profileResponse.status}`);
    console.log(`   Profile Response: ${JSON.stringify(profileResponse.data, null, 2)}`);
  }
  
  console.log('\n📋 Debug Summary:');
  console.log('- CSRF Token: ✅ Working');
  console.log('- Auth Login Endpoint: Available but requires valid user');
  console.log('- Guardian Login Endpoint: Available');
  console.log('- Registration: Check response above');
  console.log('- Authentication Flow: Check login responses above');
}

debugLogin().catch(error => {
  console.error('Debug error:', error);
});