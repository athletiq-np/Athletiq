#!/usr/bin/env node

/**
 * End-to-End Authentication Flow Test
 * Tests the complete authentication workflow with Django backend
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const DJANGO_BASE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 30000;

// Test user data
const testUser = {
  username: 'test_integration_user@example.com',
  email: 'test_integration_user@example.com',
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'User'
};

// Test results
const authTestResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

function logAuthTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  authTestResults.details.push({
    test: testName,
    passed,
    details
  });
  
  if (passed) {
    authTestResults.passed++;
  } else {
    authTestResults.failed++;
    authTestResults.errors.push(`${testName}: ${details}`);
  }
}

async function makeAuthRequest(config) {
  try {
    const response = await axios({
      timeout: TEST_TIMEOUT,
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

// Step 1: Get CSRF Token
async function getCSRFToken() {
  console.log('\n🔒 Step 1: Getting CSRF Token...');
  
  const response = await makeAuthRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  let csrfToken = null;
  
  // Try to get CSRF token from response data
  if (response.data?.csrfToken) {
    csrfToken = response.data.csrfToken;
  }
  
  // Try to get CSRF token from cookies
  if (!csrfToken && response.headers['set-cookie']) {
    const csrfCookie = response.headers['set-cookie']
      .find(cookie => cookie.includes('csrftoken='));
    if (csrfCookie) {
      csrfToken = csrfCookie.split('csrftoken=')[1].split(';')[0];
    }
  }
  
  const success = !!csrfToken && response.status === 200;
  logAuthTest('CSRF token retrieval', success, 
    success ? `Token: ${csrfToken.substring(0, 10)}...` : `Status: ${response.status}, No token found`);
  
  return { csrfToken, cookies: response.headers['set-cookie'] };
}

// Step 2: Test Registration
async function testRegistration(csrfToken, cookies) {
  console.log('\n📝 Step 2: Testing User Registration...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeAuthRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/register`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: testUser
  });
  
  const success = response.status === 201 || response.status === 200;
  logAuthTest('User registration', success, 
    success ? `Status: ${response.status}` : `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
  
  return success;
}

// Step 3: Test Login
async function testLogin(csrfToken, cookies) {
  console.log('\n🔐 Step 3: Testing User Login...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeAuthRequest({
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
      email: testUser.email,
      password: testUser.password
    }
  });
  
  const success = response.status === 200;
  let accessToken = null;
  let refreshToken = null;
  
  if (success && response.data) {
    accessToken = response.data.access || response.data.access_token || response.data.token;
    refreshToken = response.data.refresh || response.data.refresh_token;
  }
  
  logAuthTest('User login', success, 
    success ? `Status: ${response.status}, Token: ${accessToken ? 'Present' : 'Missing'}` : 
    `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
  
  return { success, accessToken, refreshToken, loginCookies: response.headers['set-cookie'] };
}

// Step 4: Test Authenticated Request
async function testAuthenticatedRequest(accessToken, cookies) {
  console.log('\n🛡️ Step 4: Testing Authenticated Request...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeAuthRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/profile`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': cookieHeader
    }
  });
  
  const success = response.status === 200;
  logAuthTest('Authenticated request', success, 
    success ? `Status: ${response.status}, Profile data received` : 
    `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
  
  return success;
}

// Step 5: Test Token Refresh
async function testTokenRefresh(refreshToken, csrfToken, cookies) {
  console.log('\n🔄 Step 5: Testing Token Refresh...');
  
  if (!refreshToken) {
    logAuthTest('Token refresh', false, 'No refresh token available');
    return false;
  }
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeAuthRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/refresh`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    },
    data: {
      refresh: refreshToken
    }
  });
  
  const success = response.status === 200 && response.data?.access;
  logAuthTest('Token refresh', success, 
    success ? `Status: ${response.status}, New token received` : 
    `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
  
  return success;
}

// Step 6: Test Logout
async function testLogout(accessToken, csrfToken, cookies) {
  console.log('\n🚪 Step 6: Testing User Logout...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeAuthRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/logout`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRFToken': csrfToken,
      'Cookie': cookieHeader
    }
  });
  
  const success = response.status === 200 || response.status === 204;
  logAuthTest('User logout', success, 
    success ? `Status: ${response.status}` : 
    `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
  
  return success;
}

// Main authentication flow test
async function runAuthenticationFlowTest() {
  console.log('🔐 Starting End-to-End Authentication Flow Test...\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get CSRF Token
    const { csrfToken, cookies } = await getCSRFToken();
    
    if (!csrfToken) {
      console.log('\n❌ Cannot proceed without CSRF token');
      return;
    }
    
    // Step 2: Test Registration (optional - might fail if user exists)
    await testRegistration(csrfToken, cookies);
    
    // Step 3: Test Login
    const { success: loginSuccess, accessToken, refreshToken, loginCookies } = await testLogin(csrfToken, cookies);
    
    if (!loginSuccess || !accessToken) {
      console.log('\n❌ Cannot proceed without successful login');
      return;
    }
    
    // Combine cookies from CSRF and login
    const allCookies = [...(cookies || []), ...(loginCookies || [])];
    
    // Step 4: Test Authenticated Request
    await testAuthenticatedRequest(accessToken, allCookies);
    
    // Step 5: Test Token Refresh
    await testTokenRefresh(refreshToken, csrfToken, allCookies);
    
    // Step 6: Test Logout
    await testLogout(accessToken, csrfToken, allCookies);
    
  } catch (error) {
    console.error('\n❌ Authentication flow test error:', error.message);
    authTestResults.errors.push(`Authentication flow error: ${error.message}`);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 AUTHENTICATION FLOW TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${authTestResults.passed}`);
  console.log(`❌ Failed: ${authTestResults.failed}`);
  console.log(`📈 Total: ${authTestResults.passed + authTestResults.failed}`);
  
  if (authTestResults.errors.length > 0) {
    console.log('\n🚨 FAILED TESTS:');
    authTestResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  // Save results
  const resultsPath = './auth-flow-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(authTestResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);
  
  return authTestResults.failed === 0;
}

// Run if called directly
if (require.main === module) {
  runAuthenticationFlowTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAuthenticationFlowTest,
  authTestResults
};