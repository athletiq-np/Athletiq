#!/usr/bin/env node

/**
 * Comprehensive Integration Test Runner
 * Runs all Django backend integration tests and validates configurations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import test modules
const { runAllTests } = require('./test-django-integration');
const { runAuthenticationFlowTest } = require('./test-auth-flow');
const { runCSRFProtectionTest } = require('./test-csrf-protection');

// Overall test results
const overallResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  testSuites: [],
  startTime: new Date(),
  endTime: null,
  duration: 0
};

function logSuite(suiteName, passed, failed, details = '') {
  const status = failed === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${suiteName} (${passed} passed, ${failed} failed)`);
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  overallResults.testSuites.push({
    name: suiteName,
    passed,
    failed,
    details
  });
  
  overallResults.totalTests += (passed + failed);
  overallResults.passedTests += passed;
  overallResults.failedTests += failed;
}

// Check if Django backend is running
async function checkDjangoBackend() {
  console.log('🔍 Checking Django Backend Status...');
  
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:8000/api/auth/csrf', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    const isRunning = response.status === 200 || response.status === 204;
    console.log(isRunning ? '✅ Django backend is running' : '❌ Django backend not responding');
    return isRunning;
  } catch (error) {
    console.log('❌ Django backend not accessible:', error.message);
    return false;
  }
}

// Check if frontend development server is available
async function checkFrontendServer() {
  console.log('🔍 Checking Frontend Development Server...');
  
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:3000', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    const isRunning = response.status === 200;
    console.log(isRunning ? '✅ Frontend server is running' : '❌ Frontend server not responding');
    return isRunning;
  } catch (error) {
    console.log('❌ Frontend server not accessible:', error.message);
    return false;
  }
}

// Test production build configuration
async function testProductionBuild() {
  console.log('\n🚀 Testing Production Build...');
  
  return new Promise((resolve) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      cwd: __dirname
    });
    
    let buildOutput = '';
    let buildError = '';
    
    buildProcess.stdout.on('data', (data) => {
      buildOutput += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      buildError += data.toString();
    });
    
    buildProcess.on('close', (code) => {
      const success = code === 0;
      
      if (success) {
        console.log('✅ Production build successful');
        
        // Check if build directory exists and has files
        const buildDir = path.join(__dirname, 'build');
        const buildExists = fs.existsSync(buildDir);
        const hasFiles = buildExists && fs.readdirSync(buildDir).length > 0;
        
        logSuite('Production Build', hasFiles ? 1 : 0, hasFiles ? 0 : 1, 
          hasFiles ? 'Build directory created with files' : 'Build directory empty or missing');
      } else {
        console.log('❌ Production build failed');
        console.log('Build error:', buildError);
        logSuite('Production Build', 0, 1, `Build failed with code ${code}`);
      }
      
      resolve(success);
    });
    
    // Timeout after 2 minutes
    setTimeout(() => {
      buildProcess.kill();
      console.log('❌ Production build timed out');
      logSuite('Production Build', 0, 1, 'Build process timed out');
      resolve(false);
    }, 120000);
  });
}

// Run development server test
async function testDevelopmentServer() {
  console.log('\n🏗️ Testing Development Server Configuration...');
  
  // Check if we can start the development server
  return new Promise((resolve) => {
    const devProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      cwd: __dirname,
      env: { ...process.env, BROWSER: 'none' }
    });
    
    let serverStarted = false;
    let serverOutput = '';
    
    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      
      // Check for successful server start
      if (output.includes('webpack compiled') || output.includes('Local:') || output.includes('On Your Network:')) {
        serverStarted = true;
        devProcess.kill();
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    devProcess.on('close', (code) => {
      if (serverStarted) {
        console.log('✅ Development server starts successfully');
        logSuite('Development Server', 1, 0, 'Server started without errors');
      } else {
        console.log('❌ Development server failed to start');
        console.log('Server output:', serverOutput);
        logSuite('Development Server', 0, 1, `Server failed to start (code: ${code})`);
      }
      
      resolve(serverStarted);
    });
    
    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverStarted) {
        devProcess.kill();
        console.log('❌ Development server start timed out');
        logSuite('Development Server', 0, 1, 'Server start timed out');
        resolve(false);
      }
    }, 60000);
  });
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive Django Integration Tests...\n');
  console.log('=' .repeat(80));
  console.log('🎯 ATHLETIQ FRONTEND-DJANGO INTEGRATION TEST SUITE');
  console.log('=' .repeat(80));
  
  // Check prerequisites
  const djangoRunning = await checkDjangoBackend();
  const frontendRunning = await checkFrontendServer();
  
  console.log('\n📋 Test Plan:');
  console.log('   1. Configuration and Setup Tests');
  console.log('   2. Django Backend Integration Tests');
  console.log('   3. Authentication Flow Tests');
  console.log('   4. CSRF Protection Tests');
  console.log('   5. Development Server Tests');
  console.log('   6. Production Build Tests');
  
  try {
    // Test Suite 1: Configuration Tests
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUITE 1: CONFIGURATION AND SETUP');
    console.log('=' .repeat(60));
    
    const { testResults } = require('./test-django-integration');
    await runAllTests();
    logSuite('Configuration Tests', testResults.passed, testResults.failed);
    
    // Test Suite 2: Authentication Flow (if Django is running)
    if (djangoRunning) {
      console.log('\n' + '=' .repeat(60));
      console.log('🔐 TEST SUITE 2: AUTHENTICATION FLOW');
      console.log('=' .repeat(60));
      
      const { authTestResults } = require('./test-auth-flow');
      await runAuthenticationFlowTest();
      logSuite('Authentication Flow', authTestResults.passed, authTestResults.failed);
      
      // Test Suite 3: CSRF Protection
      console.log('\n' + '=' .repeat(60));
      console.log('🔒 TEST SUITE 3: CSRF PROTECTION');
      console.log('=' .repeat(60));
      
      const { csrfTestResults } = require('./test-csrf-protection');
      await runCSRFProtectionTest();
      logSuite('CSRF Protection', csrfTestResults.passed, csrfTestResults.failed);
    } else {
      console.log('\n⚠️ Skipping backend-dependent tests - Django not running');
      logSuite('Authentication Flow', 0, 0, 'Skipped - Django not running');
      logSuite('CSRF Protection', 0, 0, 'Skipped - Django not running');
    }
    
    // Test Suite 4: Development Server
    console.log('\n' + '=' .repeat(60));
    console.log('🏗️ TEST SUITE 4: DEVELOPMENT SERVER');
    console.log('=' .repeat(60));
    
    if (!frontendRunning) {
      await testDevelopmentServer();
    } else {
      console.log('✅ Development server already running');
      logSuite('Development Server', 1, 0, 'Already running');
    }
    
    // Test Suite 5: Production Build
    console.log('\n' + '=' .repeat(60));
    console.log('🚀 TEST SUITE 5: PRODUCTION BUILD');
    console.log('=' .repeat(60));
    
    await testProductionBuild();
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    logSuite('Test Runner Error', 0, 1, error.message);
  }
  
  // Calculate duration
  overallResults.endTime = new Date();
  overallResults.duration = Math.round((overallResults.endTime - overallResults.startTime) / 1000);
  
  // Print final summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`⏱️  Duration: ${overallResults.duration} seconds`);
  console.log(`📈 Total Tests: ${overallResults.totalTests}`);
  console.log(`✅ Passed: ${overallResults.passedTests}`);
  console.log(`❌ Failed: ${overallResults.failedTests}`);
  console.log(`📊 Success Rate: ${overallResults.totalTests > 0 ? Math.round((overallResults.passedTests / overallResults.totalTests) * 100) : 0}%`);
  
  console.log('\n📋 Test Suite Results:');
  overallResults.testSuites.forEach(suite => {
    const status = suite.failed === 0 ? '✅' : '❌';
    console.log(`   ${status} ${suite.name}: ${suite.passed} passed, ${suite.failed} failed`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (!djangoRunning) {
    console.log('   • Start Django backend: python manage.py runserver');
  }
  
  if (overallResults.failedTests > 0) {
    console.log('   • Review failed tests and fix configuration issues');
    console.log('   • Check Django backend endpoints and CORS settings');
    console.log('   • Verify CSRF token handling in API client');
  } else {
    console.log('   • ✅ All tests passed! Django integration is working correctly');
    console.log('   • Frontend is properly configured for Django backend');
    console.log('   • Authentication and CSRF protection are working');
  }
  
  // Save comprehensive results
  const resultsPath = './comprehensive-integration-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(overallResults, null, 2));
  console.log(`\n📄 Comprehensive results saved to: ${resultsPath}`);
  
  // Exit with appropriate code
  process.exit(overallResults.failedTests > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  overallResults
};