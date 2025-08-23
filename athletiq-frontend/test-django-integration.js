#!/usr/bin/env node

/**
 * Comprehensive Django Backend Integration Test
 * Tests all API endpoints, authentication flow, CSRF protection, and configurations
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const DJANGO_BASE_URL = 'http://localhost:8000';
const FRONTEND_BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
  }
}

// Helper function to make HTTP requests with error handling
async function makeRequest(config) {
  try {
    const response = await axios({
      timeout: TEST_TIMEOUT,
      validateStatus: () => true, // Don't throw on any status code
      ...config
    });
    return response;
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Test 1: Django Backend Availability
async function testDjangoBackendAvailability() {
  console.log('\n🔍 Testing Django Backend Availability...');
  
  const response = await makeRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json'
    }
  });
  
  const isAvailable = response.status === 200 || response.status === 204;
  logTest('Django backend is running and accessible', isAvailable, 
    isAvailable ? `Status: ${response.status}` : `Failed to connect: ${response.error || response.status}`);
  
  return isAvailable;
}

// Test 2: CSRF Token Endpoint
async function testCSRFTokenEndpoint() {
  console.log('\n🔒 Testing CSRF Token Endpoint...');
  
  const response = await makeRequest({
    method: 'GET',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  const hasCSRF = response.status === 200 && (
    response.data?.csrfToken || 
    response.headers?.['set-cookie']?.some(cookie => cookie.includes('csrftoken'))
  );
  
  logTest('CSRF token endpoint works', hasCSRF, 
    hasCSRF ? 'CSRF token available' : `Status: ${response.status}, No CSRF token found`);
  
  return response.headers?.['set-cookie']?.find(cookie => cookie.includes('csrftoken'));
}

// Test 3: API Endpoints Structure
async function testAPIEndpointsStructure() {
  console.log('\n🌐 Testing API Endpoints Structure...');
  
  const endpoints = [
    '/api/auth/login',
    '/api/auth/csrf',
    '/api/athletes',
    '/api/schools',
    '/api/schools/register',
    '/api/tournaments',
    '/api/guardian/auth/register',
    '/api/guardian/profile'
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest({
      method: 'GET',
      url: `${DJANGO_BASE_URL}${endpoint}`,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Endpoints should return 200, 401, or 403 (not 404)
    const isValid = response.status !== 404 && response.status !== 0;
    logTest(`Endpoint ${endpoint} exists`, isValid, 
      isValid ? `Status: ${response.status}` : `Not found or unreachable: ${response.status}`);
  }
}

// Test 4: Authentication Flow
async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  // Test login endpoint structure
  const loginResponse = await makeRequest({
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
  
  // Should return 400/401 for invalid credentials, not 404/500
  const loginEndpointWorks = loginResponse.status === 400 || loginResponse.status === 401 || loginResponse.status === 200;
  logTest('Login endpoint accepts requests', loginEndpointWorks, 
    loginEndpointWorks ? `Status: ${loginResponse.status}` : `Unexpected status: ${loginResponse.status}`);
  
  // Test guardian registration endpoint structure
  const registerResponse = await makeRequest({
    method: 'POST',
    url: `${DJANGO_BASE_URL}/api/guardian/auth/register`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    data: {
      username: 'test@example.com',
      password: 'testpassword',
      email: 'test@example.com'
    }
  });
  
  const registerEndpointWorks = registerResponse.status !== 404 && registerResponse.status !== 500;
  logTest('Guardian registration endpoint accepts requests', registerEndpointWorks, 
    registerEndpointWorks ? `Status: ${registerResponse.status}` : `Unexpected status: ${registerResponse.status}`);
}

// Test 5: CORS Configuration
async function testCORSConfiguration() {
  console.log('\n🌍 Testing CORS Configuration...');
  
  const response = await makeRequest({
    method: 'OPTIONS',
    url: `${DJANGO_BASE_URL}/api/auth/csrf`,
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  });
  
  const hasCORS = response.headers?.['access-control-allow-origin'] || 
                  response.headers?.['Access-Control-Allow-Origin'];
  
  logTest('CORS is configured for frontend', !!hasCORS, 
    hasCORS ? `CORS origin: ${hasCORS}` : 'No CORS headers found');
}

// Test 6: Frontend Configuration Files
async function testFrontendConfiguration() {
  console.log('\n⚙️ Testing Frontend Configuration...');
  
  // Check .env file
  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);
  logTest('Frontend .env file exists', envExists);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDjangoURL = envContent.includes('REACT_APP_API_URL=http://localhost:8000');
    logTest('Environment points to Django backend', hasDjangoURL, 
      hasDjangoURL ? 'Correct Django URL configured' : 'Django URL not found or incorrect');
  }
  
  // Check proxy configuration
  const proxyPath = path.join(__dirname, 'src', 'setupProxy.js');
  const proxyExists = fs.existsSync(proxyPath);
  logTest('Proxy configuration exists', proxyExists);
  
  if (proxyExists) {
    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    const hasDjangoProxy = proxyContent.includes('localhost:8000');
    logTest('Proxy targets Django backend', hasDjangoProxy, 
      hasDjangoProxy ? 'Proxy correctly configured for Django' : 'Proxy not targeting Django');
  }
  
  // Check CRACO configuration
  const cracoPath = path.join(__dirname, 'craco.config.js');
  const cracoExists = fs.existsSync(cracoPath);
  logTest('CRACO configuration exists', cracoExists);
  
  if (cracoExists) {
    const cracoContent = fs.readFileSync(cracoPath, 'utf8');
    const hasDjangoProxy = cracoContent.includes('localhost:8000');
    logTest('CRACO proxy targets Django', hasDjangoProxy, 
      hasDjangoProxy ? 'CRACO proxy correctly configured' : 'CRACO proxy not targeting Django');
  }
}

// Test 7: API Client Configuration
async function testAPIClientConfiguration() {
  console.log('\n🔧 Testing API Client Configuration...');
  
  const apiClientPath = path.join(__dirname, 'src', 'utils', 'apiClient.js');
  const apiClientExists = fs.existsSync(apiClientPath);
  logTest('API client file exists', apiClientExists);
  
  if (apiClientExists) {
    const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
    
    // Check for Django-specific configurations
    const hasCSRFConfig = apiClientContent.includes('csrftoken') && apiClientContent.includes('X-CSRFToken');
    logTest('API client has CSRF configuration', hasCSRFConfig, 
      hasCSRFConfig ? 'CSRF token handling configured' : 'CSRF configuration missing');
    
    const hasCredentials = apiClientContent.includes('withCredentials: true');
    logTest('API client sends credentials', hasCredentials, 
      hasCredentials ? 'Credentials configured for Django' : 'Credentials not configured');
    
    const hasXMLHttpRequest = apiClientContent.includes('X-Requested-With');
    logTest('API client sets X-Requested-With header', hasXMLHttpRequest, 
      hasXMLHttpRequest ? 'Django-required header configured' : 'X-Requested-With header missing');
  }
  
  // Check API configuration
  const apiConfigPath = path.join(__dirname, 'src', 'config', 'api.config.js');
  const apiConfigExists = fs.existsSync(apiConfigPath);
  logTest('API configuration file exists', apiConfigExists);
  
  if (apiConfigExists) {
    const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
    const hasEndpoints = apiConfigContent.includes('API_ENDPOINTS');
    logTest('API endpoints are defined', hasEndpoints, 
      hasEndpoints ? 'API endpoints configuration found' : 'API endpoints not defined');
  }
}

// Test 8: Package Dependencies
async function testPackageDependencies() {
  console.log('\n📦 Testing Package Dependencies...');
  
  const packagePath = path.join(__dirname, 'package.json');
  const packageExists = fs.existsSync(packagePath);
  logTest('Package.json exists', packageExists);
  
  if (packageExists) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for essential dependencies
    const hasAxios = !!packageContent.dependencies?.axios;
    logTest('Axios dependency exists', hasAxios, 
      hasAxios ? `Version: ${packageContent.dependencies.axios}` : 'Axios not found');
    
    const hasProxy = !!packageContent.dependencies?.['http-proxy-middleware'];
    logTest('Proxy middleware dependency exists', hasProxy, 
      hasProxy ? `Version: ${packageContent.dependencies['http-proxy-middleware']}` : 'Proxy middleware not found');
    
    // Check for removed dependencies that shouldn't be there
    const hasPuppeteer = !!packageContent.dependencies?.puppeteer;
    logTest('Puppeteer dependency removed', !hasPuppeteer, 
      !hasPuppeteer ? 'Puppeteer correctly removed' : 'Puppeteer still present');
  }
}

// Test 9: Development Build Test
async function testDevelopmentBuild() {
  console.log('\n🏗️ Testing Development Build Configuration...');
  
  // This would require actually running the build, so we'll check configuration instead
  const cracoPath = path.join(__dirname, 'craco.config.js');
  if (fs.existsSync(cracoPath)) {
    const cracoContent = fs.readFileSync(cracoPath, 'utf8');
    const hasDevServer = cracoContent.includes('devServer');
    logTest('Development server configuration exists', hasDevServer, 
      hasDevServer ? 'Dev server config found in CRACO' : 'Dev server config missing');
  }
  
  // Check if start script uses CRACO
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const usesCraco = packageContent.scripts?.start?.includes('craco');
    logTest('Start script uses CRACO', usesCraco, 
      usesCraco ? 'CRACO start script configured' : 'Not using CRACO for start');
  }
}

// Test 10: Production Build Configuration
async function testProductionBuildConfiguration() {
  console.log('\n🚀 Testing Production Build Configuration...');
  
  // Check environment configuration for production
  const envProdPath = path.join(__dirname, '.env.production');
  const envProdExists = fs.existsSync(envProdPath);
  logTest('Production environment file exists', envProdExists);
  
  if (envProdExists) {
    const envProdContent = fs.readFileSync(envProdPath, 'utf8');
    const hasAPIURL = envProdContent.includes('REACT_APP_API_URL');
    logTest('Production API URL configured', hasAPIURL, 
      hasAPIURL ? 'Production API URL found' : 'Production API URL not configured');
  }
  
  // Check build script
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const usesCracoBuild = packageContent.scripts?.build?.includes('craco');
    logTest('Build script uses CRACO', usesCracoBuild, 
      usesCracoBuild ? 'CRACO build script configured' : 'Not using CRACO for build');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Django Backend Integration Tests...\n');
  console.log('=' .repeat(60));
  
  try {
    // Core backend tests
    const backendAvailable = await testDjangoBackendAvailability();
    
    if (backendAvailable) {
      await testCSRFTokenEndpoint();
      await testAPIEndpointsStructure();
      await testAuthenticationFlow();
      await testCORSConfiguration();
    } else {
      console.log('\n⚠️ Django backend not available - skipping backend-specific tests');
      console.log('Make sure Django is running on http://localhost:8000');
    }
    
    // Frontend configuration tests (can run without backend)
    await testFrontendConfiguration();
    await testAPIClientConfiguration();
    await testPackageDependencies();
    await testDevelopmentBuild();
    await testProductionBuildConfiguration();
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    testResults.errors.push(`Test runner error: ${error.message}`);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 FAILED TESTS:');
    testResults.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  // Save detailed results
  const resultsPath = path.join(__dirname, 'django-integration-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};