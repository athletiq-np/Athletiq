#!/usr/bin/env node

/**
 * CSRF Protection Test
 * Tests Django CSRF protection is working properly with frontend
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const DJANGO_BASE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 30000;

// Test results
const csrfTestResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

function logCSRFTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  csrfTestResults.details.push({
    test: testName,
    passed,
    details
  });
  
  if (passed) {
    csrfTestResults.passed++;
  } else {
    csrfTestResults.failed++;
    csrfTestResults.errors.push(`${testName}: ${details}`);
  }
}

async function makeCSRFRequest(config) {
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

// Test 1: CSRF Token Endpoint Availability
async function testCSRFEndpoint() {
  console.log('\n🔒 Test 1: CSRF Token Endpoint Availability...');
  
  const response = await makeCSRFRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  const success = response.status === 200 || response.status === 204;
  logCSRFTest('CSRF endpoint is accessible', success, 
    success ? `Status: ${response.status}` : `Failed with status: ${response.status}`);
  
  return response;
}

// Test 2: CSRF Token in Response
async function testCSRFTokenInResponse(csrfResponse) {
  console.log('\n🎫 Test 2: CSRF Token in Response...');
  
  let csrfToken = null;
  let tokenSource = '';
  
  // Check response body
  if (csrfResponse.data?.csrfToken) {
    csrfToken = csrfResponse.data.csrfToken;
    tokenSource = 'response body';
  }
  
  // Check cookies
  if (!csrfToken && csrfResponse.headers['set-cookie']) {
    const csrfCookie = csrfResponse.headers['set-cookie']
      .find(cookie => cookie.includes('csrftoken='));
    if (csrfCookie) {
      csrfToken = csrfCookie.split('csrftoken=')[1].split(';')[0];
      tokenSource = 'cookie';
    }
  }
  
  const success = !!csrfToken;
  logCSRFTest('CSRF token is provided', success, 
    success ? `Token found in ${tokenSource}: ${csrfToken.substring(0, 10)}...` : 'No CSRF token found');
  
  return { csrfToken, cookies: csrfResponse.headers['set-cookie'] };
}

// Test 3: Request Without CSRF Token (Should Fail)
async function testRequestWithoutCSRF() {
  console.log('\n🚫 Test 3: Request Without CSRF Token (Should Fail)...');
  
  const response = await makeCSRFRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    data: {
      username: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  // Should fail with 403 CSRF error
  const success = response.status === 403;
  logCSRFTest('Request without CSRF token is rejected', success, 
    success ? `Correctly rejected with status: ${response.status}` : 
    `Unexpected status: ${response.status} (should be 403)`);
  
  return success;
}

// Test 4: Request With Invalid CSRF Token (Should Fail)
async function testRequestWithInvalidCSRF() {
  console.log('\n❌ Test 4: Request With Invalid CSRF Token (Should Fail)...');
  
  const response = await makeCSRFRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': 'invalid-csrf-token-12345'
    },
    data: {
      username: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  // Should fail with 403 CSRF error
  const success = response.status === 403;
  logCSRFTest('Request with invalid CSRF token is rejected', success, 
    success ? `Correctly rejected with status: ${response.status}` : 
    `Unexpected status: ${response.status} (should be 403)`);
  
  return success;
}

// Test 5: Request With Valid CSRF Token (Should Work)
async function testRequestWithValidCSRF(csrfToken, cookies) {
  console.log('\n✅ Test 5: Request With Valid CSRF Token (Should Work)...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  const response = await makeCSRFRequest({
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
  
  // Should not fail with CSRF error (400/401 for invalid credentials is OK)
  const success = response.status !== 403;
  logCSRFTest('Request with valid CSRF token is not rejected for CSRF', success, 
    success ? `Status: ${response.status} (not CSRF error)` : 
    `CSRF error with status: ${response.status}`);
  
  return success;
}

// Test 6: CSRF Token in FormData
async function testCSRFWithFormData(csrfToken, cookies) {
  console.log('\n📋 Test 6: CSRF Token with FormData...');
  
  const cookieHeader = cookies ? cookies.join('; ') : '';
  const formData = new FormData();
  formData.append('username', 'test@example.com');
  formData.append('password', 'testpassword');
  formData.append('csrfmiddlewaretoken', csrfToken);
  
  const response = await makeCSRFRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookieHeader
    },
    data: formData
  });
  
  // Should not fail with CSRF error
  const success = response.status !== 403;
  logCSRFTest('FormData with CSRF token is not rejected for CSRF', success, 
    success ? `Status: ${response.status} (not CSRF error)` : 
    `CSRF error with status: ${response.status}`);
  
  return success;
}

// Test 7: CSRF Cookie Configuration
async function testCSRFCookieConfiguration(cookies) {
  console.log('\n🍪 Test 7: CSRF Cookie Configuration...');
  
  if (!cookies) {
    logCSRFTest('CSRF cookie configuration', false, 'No cookies received');
    return false;
  }
  
  const csrfCookie = cookies.find(cookie => cookie.includes('csrftoken='));
  
  if (!csrfCookie) {
    logCSRFTest('CSRF cookie configuration', false, 'No CSRF cookie found');
    return false;
  }
  
  // Check cookie attributes
  const hasHttpOnly = csrfCookie.includes('HttpOnly');
  const hasSecure = csrfCookie.includes('Secure');
  const hasSameSite = csrfCookie.includes('SameSite');
  
  logCSRFTest('CSRF cookie has HttpOnly', !hasHttpOnly, 
    !hasHttpOnly ? 'Correctly accessible to JavaScript' : 'HttpOnly set (may cause issues)');
  
  logCSRFTest('CSRF cookie SameSite configuration', hasSameSite, 
    hasSameSite ? 'SameSite attribute configured' : 'No SameSite attribute');
  
  return true;
}

// Main CSRF protection test
async function runCSRFProtectionTest() {
  console.log('🔒 Starting CSRF Protection Test...\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: CSRF Endpoint
    const csrfResponse = await testCSRFEndpoint();
    
    // Test 2: CSRF Token in Response
    const { csrfToken, cookies } = await testCSRFTokenInResponse(csrfResponse);
    
    // Test 3: Request Without CSRF (Should Fail)
    await testRequestWithoutCSRF();
    
    // Test 4: Request With Invalid CSRF (Should Fail)
    await testRequestWithInvalidCSRF();
    
    if (csrfToken) {
      // Test 5: Request With Valid CSRF (Should Work)
      await testRequestWithValidCSRF(csrfToken, cookies);
      
      // Test 6: CSRF with FormData
      await testCSRFWithFormData(csrfToken, cookies);
    } else {
      console.log('\n⚠️ Skipping valid CSRF tests - no token available');
    }
    
    // Test 7: CSRF Cookie Configuration
    await testCSRFCookieConfiguration(cookies);
    
  } catch (error) {
    console.error('\n❌ CSRF protection test error:', error.message);
    csrfTestResults.errors.push(`CSRF test error: ${error.message}`);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 CSRF PROTECTION TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${csrfTestResults.passed}`);
  console.log(`❌ Failed: ${csrfTestResults.failed}`);
  console.log(`📈 Total: ${csrfTestResults.passed + csrfTestResults.failed}`);
  
  if (csrfTestResults.errors.length > 0) {
    console.log('\n🚨 FAILED TESTS:');
    csrfTestResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  // Save results
  const resultsPath = './csrf-protection-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(csrfTestResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);
  
  return csrfTestResults.failed === 0;
}

// Run if called directly
if (require.main === module) {
  runCSRFProtectionTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runCSRFProtectionTest,
  csrfTestResults
};