#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all major endpoints and functionality
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class APITester {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.authToken = null;
    this.testResults = [];
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    };
  }

  /**
   * Run a test case
   */
  async runTest(testName, testFunction) {
    this.stats.total++;
    const startTime = Date.now();

    try {
      console.log(`🧪 Running: ${testName}`);
      await testFunction();
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        error: null,
      });
      
      this.stats.passed++;
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name: testName,
        status: 'FAILED',
        duration: `${duration}ms`,
        error: error.message,
      });
      
      this.stats.failed++;
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  /**
   * Skip a test
   */
  skipTest(testName, reason) {
    this.stats.total++;
    this.stats.skipped++;
    
    this.testResults.push({
      name: testName,
      status: 'SKIPPED',
      duration: '0ms',
      error: reason,
    });
    
    console.log(`⏭️ SKIPPED: ${testName} - ${reason}`);
  }

  /**
   * Make authenticated request
   */
  async request(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response;
  }

  /**
   * Test health endpoint
   */
  async testHealth() {
    const response = await this.request('GET', '/api/health');
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('Health check failed');
    }

    if (response.data.data.status !== 'OK') {
      throw new Error(`Expected status OK, got ${response.data.data.status}`);
    }
  }

  /**
   * Test user registration
   */
  async testUserRegistration() {
    const testUser = {
      schoolName: 'Test High School',
      adminEmail: `test.admin.${Date.now()}@example.com`,
      adminPassword: 'TestPassword123!',
      adminFullName: 'Test Administrator',
      schoolAddress: '123 Test Street',
      schoolCity: 'Test City',
      schoolState: 'Test State',
      schoolPostalCode: '12345',
      schoolCountry: 'Test Country',
      schoolPhone: '+1234567890',
    };

    const response = await this.request('POST', '/api/auth/register', testUser);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Registration failed');
    }

    // Store for later tests
    this.testUser = testUser;
  }

  /**
   * Test user login
   */
  async testUserLogin() {
    if (!this.testUser) {
      throw new Error('No test user available, registration test must run first');
    }

    const loginData = {
      email: this.testUser.adminEmail,
      password: this.testUser.adminPassword,
    };

    const response = await this.request('POST', '/api/auth/login', loginData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Login failed');
    }

    if (!response.data.token) {
      throw new Error('No auth token received');
    }

    // Store auth token for authenticated requests
    this.authToken = response.data.token;
  }

  /**
   * Test protected endpoint access
   */
  async testProtectedEndpoint() {
    if (!this.authToken) {
      throw new Error('No auth token available, login test must run first');
    }

    const response = await this.request('GET', '/api/tournaments');
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Failed to access protected endpoint');
    }
  }

  /**
   * Test tournament creation
   */
  async testTournamentCreation() {
    const tournamentData = {
      name: `Test Tournament ${Date.now()}`,
      description: 'A test tournament for API testing',
      sport: 'Basketball',
      tournamentType: 'Single Elimination',
      format: 'Team',
      startDate: '2024-12-01',
      endDate: '2024-12-05',
      location: 'Test Gym',
      maxParticipants: 16,
    };

    const response = await this.request('POST', '/api/tournaments', tournamentData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Tournament creation failed');
    }

    if (!response.data.data.id) {
      throw new Error('No tournament ID returned');
    }

    // Store for later tests
    this.testTournament = response.data.data;
  }

  /**
   * Test tournament retrieval
   */
  async testTournamentRetrieval() {
    if (!this.testTournament) {
      throw new Error('No test tournament available');
    }

    const response = await this.request('GET', `/api/tournaments/${this.testTournament.id}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Tournament retrieval failed');
    }

    if (response.data.data.id !== this.testTournament.id) {
      throw new Error('Retrieved tournament ID does not match');
    }
  }

  /**
   * Test rate limiting
   */
  async testRateLimit() {
    console.log('Testing rate limits (this may take a moment)...');
    
    const promises = [];
    const requestCount = 15; // Try to exceed rate limit
    
    for (let i = 0; i < requestCount; i++) {
      promises.push(
        this.request('GET', '/api/health').catch(error => ({
          status: error.response?.status,
          error: error.message,
        }))
      );
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.some(response => 
      response.status === 429 || response.error?.includes('rate limit')
    );

    if (!rateLimited) {
      console.warn('⚠️ Rate limiting may not be working properly');
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    try {
      await this.request('GET', '/api/tournaments/invalid-id');
      throw new Error('Expected error for invalid tournament ID');
    } catch (error) {
      if (error.response?.status !== 400 && error.response?.status !== 404) {
        throw new Error(`Expected 400 or 404 status, got ${error.response?.status}`);
      }
    }
  }

  /**
   * Test CORS headers
   */
  async testCORSHeaders() {
    const response = await this.request('OPTIONS', '/api/health');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
    ];

    for (const header of corsHeaders) {
      if (!response.headers[header]) {
        throw new Error(`Missing CORS header: ${header}`);
      }
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    const response = await this.request('GET', '/api/health');
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
    ];

    for (const header of securityHeaders) {
      if (!response.headers[header]) {
        console.warn(`⚠️ Missing security header: ${header}`);
      }
    }
  }

  /**
   * Performance test
   */
  async testPerformance() {
    const startTime = Date.now();
    const promises = [];
    
    // Send 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(this.request('GET', '/api/health'));
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    if (duration > 5000) { // 5 seconds
      throw new Error(`Performance test too slow: ${duration}ms for 10 concurrent requests`);
    }

    console.log(`📊 Performance: 10 concurrent requests completed in ${duration}ms`);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting comprehensive API testing...\n');
    console.log(`📍 Testing API at: ${this.baseURL}\n`);

    // Health and basic functionality
    await this.runTest('Health Check', () => this.testHealth());
    await this.runTest('CORS Headers', () => this.testCORSHeaders());
    await this.runTest('Security Headers', () => this.testSecurityHeaders());

    // Authentication flow
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('User Login', () => this.testUserLogin());
    await this.runTest('Protected Endpoint Access', () => this.testProtectedEndpoint());

    // Core functionality
    await this.runTest('Tournament Creation', () => this.testTournamentCreation());
    await this.runTest('Tournament Retrieval', () => this.testTournamentRetrieval());
    
    // Error handling and security
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('Rate Limiting', () => this.testRateLimit());
    
    // Performance
    await this.runTest('Performance Test', () => this.testPerformance());

    // Print summary
    this.printSummary();
    
    // Export results
    await this.exportResults();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${this.stats.total}`);
    console.log(`✅ Passed: ${this.stats.passed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏭️ Skipped: ${this.stats.skipped}`);
    console.log(`Success Rate: ${((this.stats.passed / this.stats.total) * 100).toFixed(1)}%\n`);

    if (this.stats.failed > 0) {
      console.log('❌ Failed Tests:');
      this.testResults
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
      console.log('');
    }
  }

  /**
   * Export test results
   */
  async exportResults() {
    const report = {
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      summary: this.stats,
      results: this.testResults,
    };

    try {
      const fileName = `api-test-results-${Date.now()}.json`;
      const filePath = path.join('./logs', fileName);
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`📄 Test results exported to: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to export results: ${error.message}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseURL = process.argv[2] || 'http://localhost:5000';
  const tester = new APITester(baseURL);
  
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = APITester;
