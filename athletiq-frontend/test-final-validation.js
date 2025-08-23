#!/usr/bin/env node

/**
 * Final Django Integration Validation Test
 * Comprehensive test to validate all aspects of the frontend-Django integration
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const DJANGO_BASE_URL = 'http://localhost:8000';
const FRONTEND_BASE_URL = 'http://localhost:3000';

// Test results
const validationResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: [],
  summary: {}
};

function logValidation(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  validationResults.details.push({
    test: testName,
    passed,
    details
  });
  
  if (passed) {
    validationResults.passed++;
  } else {
    validationResults.failed++;
    validationResults.errors.push(`${testName}: ${details}`);
  }
}

async function makeValidationRequest(config) {
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

// Test 1: Backend Connectivity
async function testBackendConnectivity() {
  console.log('\n🔗 Testing Backend Connectivity...');
  
  const response = await makeValidationRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: { 'Accept': 'application/json' }
  });
  
  const connected = response.status === 200;
  logValidation('Django backend is accessible', connected, 
    connected ? `Health check passed` : `Status: ${response.status}`);
  
  return connected;
}

// Test 2: CSRF Token Management
async function testCSRFTokenManagement() {
  console.log('\n🔒 Testing CSRF Token Management...');
  
  // Get CSRF token
  const csrfResponse = await makeValidationRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  const hasToken = csrfResponse.status === 200 && csrfResponse.data?.csrfToken;
  logValidation('CSRF token endpoint works', hasToken, 
    hasToken ? 'Token retrieved successfully' : `Status: ${csrfResponse.status}`);
  
  return { token: csrfResponse.data?.csrfToken, cookies: csrfResponse.headers['set-cookie'] };
}

// Test 3: API Endpoints Availability
async function testAPIEndpointsAvailability() {
  console.log('\n🌐 Testing API Endpoints Availability...');
  
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', expectedStatus: [400, 401, 405] },
    { path: '/api/auth/csrf', method: 'GET', expectedStatus: [200] },
    { path: '/api/guardian/auth/register', method: 'POST', expectedStatus: [400, 405] },
    { path: '/api/guardian/profile', method: 'GET', expectedStatus: [401] },
    { path: '/api/athletes', method: 'GET', expectedStatus: [200, 401] },
    { path: '/api/schools', method: 'GET', expectedStatus: [200, 401] },
    { path: '/api/tournaments', method: 'GET', expectedStatus: [200, 401] }
  ];
  
  let availableEndpoints = 0;
  
  for (const endpoint of endpoints) {
    const response = await makeValidationRequest({
      method: endpoint.method,
      url: `${DJANGO_BASE_URL}${endpoint.path}`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      data: endpoint.method === 'POST' ? {} : undefined
    });
    
    const isAvailable = endpoint.expectedStatus.includes(response.status);
    if (isAvailable) availableEndpoints++;
    
    logValidation(`Endpoint ${endpoint.path} is available`, isAvailable, 
      isAvailable ? `Status: ${response.status}` : `Unexpected status: ${response.status}`);
  }
  
  return availableEndpoints === endpoints.length;
}

// Test 4: CORS Configuration
async function testCORSConfiguration() {
  console.log('\n🌍 Testing CORS Configuration...');
  
  const response = await makeValidationRequest({
    method: 'OPTIONS',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type,X-CSRFToken'
    }
  });
  
  const corsHeaders = response.headers;
  const hasOrigin = corsHeaders['access-control-allow-origin'] || corsHeaders['Access-Control-Allow-Origin'];
  const hasMethods = corsHeaders['access-control-allow-methods'] || corsHeaders['Access-Control-Allow-Methods'];
  const hasHeaders = corsHeaders['access-control-allow-headers'] || corsHeaders['Access-Control-Allow-Headers'];
  
  logValidation('CORS allows frontend origin', !!hasOrigin, 
    hasOrigin ? `Origin: ${hasOrigin}` : 'No CORS origin header');
  
  logValidation('CORS allows required methods', !!hasMethods, 
    hasMethods ? `Methods: ${hasMethods}` : 'No CORS methods header');
  
  logValidation('CORS allows required headers', !!hasHeaders, 
    hasHeaders ? `Headers: ${hasHeaders}` : 'No CORS headers header');
  
  return !!(hasOrigin && hasMethods && hasHeaders);
}

// Test 5: Authentication Flow Structure
async function testAuthenticationFlowStructure() {
  console.log('\n🔐 Testing Authentication Flow Structure...');
  
  // Test guardian registration structure
  const registerResponse = await makeValidationRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/register`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    data: {
      email: 'test@example.com',
      password: 'testpassword',
      first_name: 'Test',
      last_name: 'User'
    }
  });
  
  // Should return validation error, not 404
  const registerWorks = registerResponse.status !== 404;
  logValidation('Guardian registration endpoint structure', registerWorks, 
    registerWorks ? `Status: ${registerResponse.status}` : 'Endpoint not found');
  
  // Test login structure
  const loginResponse = await makeValidationRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/auth/login`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    data: {
      email: 'test@example.com',
      password: 'testpassword'
    }
  });
  
  // Should return authentication error, not 404
  const loginWorks = loginResponse.status !== 404;
  logValidation('Login endpoint structure', loginWorks, 
    loginWorks ? `Status: ${loginResponse.status}` : 'Endpoint not found');
  
  return registerWorks && loginWorks;
}

// Test 6: Frontend Configuration Validation
async function testFrontendConfiguration() {
  console.log('\n⚙️ Testing Frontend Configuration...');
  
  // Check environment configuration
  const envPath = './.env';
  const envExists = fs.existsSync(envPath);
  logValidation('Environment file exists', envExists);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDjangoURL = envContent.includes('REACT_APP_API_URL=http://localhost:8000');
    logValidation('Environment points to Django', hasDjangoURL, 
      hasDjangoURL ? 'Django URL configured' : 'Django URL missing or incorrect');
  }
  
  // Check proxy configuration
  const proxyPath = './src/setupProxy.js';
  const proxyExists = fs.existsSync(proxyPath);
  logValidation('Proxy configuration exists', proxyExists);
  
  if (proxyExists) {
    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    const targetsPort8000 = proxyContent.includes('localhost:8000');
    logValidation('Proxy targets Django port', targetsPort8000, 
      targetsPort8000 ? 'Port 8000 configured' : 'Port 8000 not found');
  }
  
  // Check API client configuration
  const apiClientPath = './src/utils/apiClient.js';
  const apiClientExists = fs.existsSync(apiClientPath);
  logValidation('API client exists', apiClientExists);
  
  if (apiClientExists) {
    const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
    const hasCSRF = apiClientContent.includes('csrftoken') && apiClientContent.includes('X-CSRFToken');
    const hasCredentials = apiClientContent.includes('withCredentials: true');
    
    logValidation('API client has CSRF support', hasCSRF, 
      hasCSRF ? 'CSRF configuration found' : 'CSRF configuration missing');
    
    logValidation('API client sends credentials', hasCredentials, 
      hasCredentials ? 'Credentials configured' : 'Credentials not configured');
  }
  
  return true;
}

// Test 7: Error Handling Validation
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test 404 error handling
  const notFoundResponse = await makeValidationRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/nonexistent-endpoint`,
    headers: { 'Accept': 'application/json' }
  });
  
  const handles404 = notFoundResponse.status === 404;
  logValidation('404 errors are handled', handles404, 
    handles404 ? 'Returns 404 for missing endpoints' : `Unexpected status: ${notFoundResponse.status}`);
  
  // Test authentication error handling
  const authResponse = await makeValidationRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/guardian/profile`,
    headers: { 'Accept': 'application/json' }
  });
  
  const handlesAuth = authResponse.status === 401;
  logValidation('Authentication errors are handled', handlesAuth, 
    handlesAuth ? 'Returns 401 for protected endpoints' : `Unexpected status: ${authResponse.status}`);
  
  return handles404 && handlesAuth;
}

// Main validation runner
async function runFinalValidation() {
  console.log('🧪 Starting Final Django Integration Validation...\n');
  console.log('=' .repeat(70));
  console.log('🎯 FINAL VALIDATION - DJANGO BACKEND INTEGRATION');
  console.log('=' .repeat(70));
  
  try {
    // Run all validation tests
    const backendConnected = await testBackendConnectivity();
    
    if (backendConnected) {
      const { token } = await testCSRFTokenManagement();
      await testAPIEndpointsAvailability();
      await testCORSConfiguration();
      await testAuthenticationFlowStructure();
      await testErrorHandling();
    } else {
      console.log('\n⚠️ Skipping backend-dependent tests - Django not accessible');
    }
    
    await testFrontendConfiguration();
    
  } catch (error) {
    console.error('\n❌ Validation error:', error.message);
    validationResults.errors.push(`Validation error: ${error.message}`);
  }
  
  // Calculate summary
  validationResults.summary = {
    totalTests: validationResults.passed + validationResults.failed,
    passedTests: validationResults.passed,
    failedTests: validationResults.failed,
    successRate: validationResults.passed + validationResults.failed > 0 ? 
      Math.round((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100) : 0
  };
  
  // Print final summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 FINAL VALIDATION SUMMARY');
  console.log('=' .repeat(70));
  console.log(`📈 Total Tests: ${validationResults.summary.totalTests}`);
  console.log(`✅ Passed: ${validationResults.summary.passedTests}`);
  console.log(`❌ Failed: ${validationResults.summary.failedTests}`);
  console.log(`📊 Success Rate: ${validationResults.summary.successRate}%`);
  
  // Validation status
  if (validationResults.summary.failedTests === 0) {
    console.log('\n🎉 VALIDATION PASSED - Django integration is working correctly!');
    console.log('✅ Frontend is properly configured for Django backend');
    console.log('✅ API endpoints are accessible and working');
    console.log('✅ CSRF protection is configured correctly');
    console.log('✅ Authentication flow structure is valid');
    console.log('✅ Error handling is working properly');
  } else {
    console.log('\n⚠️ VALIDATION ISSUES FOUND:');
    validationResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  // Save results
  const resultsPath = './final-validation-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(validationResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  
  return validationResults.summary.failedTests === 0;
}

// Run if called directly
if (require.main === module) {
  runFinalValidation().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runFinalValidation,
  validationResults
};