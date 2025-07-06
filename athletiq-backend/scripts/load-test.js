#!/usr/bin/env node

/**
 * Load Testing Script for AthletiQ API
 * Tests API performance under various load conditions
 */

const axios = require('axios');
const fs = require('fs').promises;

class LoadTester {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.results = [];
  }

  /**
   * Run concurrent requests
   */
  async runConcurrentRequests(endpoint, concurrency, duration, headers = {}) {
    const results = {
      endpoint,
      concurrency,
      duration,
      requests: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now(),
      endTime: null,
    };

    const startTime = Date.now();
    const endTime = startTime + duration;
    const promises = [];

    // Start concurrent workers
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.worker(endpoint, endTime, results, headers));
    }

    await Promise.all(promises);
    results.endTime = Date.now();

    // Calculate statistics
    results.totalDuration = results.endTime - results.startTime;
    results.requestsPerSecond = (results.requests / (results.totalDuration / 1000)).toFixed(2);
    results.errorRate = ((results.errors / results.requests) * 100).toFixed(2);
    results.avgResponseTime = results.responseTimes.length > 0
      ? (results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length).toFixed(2)
      : 0;
    
    // Calculate percentiles
    if (results.responseTimes.length > 0) {
      const sorted = results.responseTimes.sort((a, b) => a - b);
      results.p50 = sorted[Math.floor(sorted.length * 0.5)];
      results.p95 = sorted[Math.floor(sorted.length * 0.95)];
      results.p99 = sorted[Math.floor(sorted.length * 0.99)];
      results.min = sorted[0];
      results.max = sorted[sorted.length - 1];
    }

    return results;
  }

  /**
   * Worker function for making requests
   */
  async worker(endpoint, endTime, results, headers) {
    while (Date.now() < endTime) {
      const requestStart = Date.now();
      
      try {
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          headers,
          timeout: 30000, // 30 second timeout
        });
        
        const responseTime = Date.now() - requestStart;
        results.requests++;
        results.responseTimes.push(responseTime);
        
        if (response.status >= 400) {
          results.errors++;
        }
      } catch (error) {
        results.errors++;
        results.requests++;
        
        // Record timeout/error response time
        const responseTime = Date.now() - requestStart;
        results.responseTimes.push(responseTime);
      }

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Test health endpoint performance
   */
  async testHealthEndpoint() {
    console.log('🏥 Testing health endpoint performance...');
    
    const scenarios = [
      { concurrency: 1, duration: 10000, name: 'Low Load (1 user)' },
      { concurrency: 10, duration: 10000, name: 'Medium Load (10 users)' },
      { concurrency: 50, duration: 10000, name: 'High Load (50 users)' },
      { concurrency: 100, duration: 10000, name: 'Stress Test (100 users)' },
    ];

    for (const scenario of scenarios) {
      console.log(`\n📊 Running: ${scenario.name}`);
      const result = await this.runConcurrentRequests(
        '/api/health',
        scenario.concurrency,
        scenario.duration
      );
      
      result.scenarioName = scenario.name;
      this.results.push(result);
      this.printScenarioResults(result);
    }
  }

  /**
   * Test authenticated endpoints
   */
  async testAuthenticatedEndpoints() {
    console.log('\n🔐 Testing authenticated endpoints...');
    
    // First, get an auth token (this requires a test user to exist)
    try {
      const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      const authHeaders = {
        'Authorization': `Bearer ${loginResponse.data.token}`
      };

      console.log('✅ Authentication successful, testing protected endpoints...');

      const result = await this.runConcurrentRequests(
        '/api/tournaments',
        20,
        15000,
        authHeaders
      );
      
      result.scenarioName = 'Authenticated Endpoints (20 users)';
      this.results.push(result);
      this.printScenarioResults(result);
      
    } catch (error) {
      console.log('⚠️ Skipping authenticated endpoint tests (no test user available)');
    }
  }

  /**
   * Test error handling under load
   */
  async testErrorHandling() {
    console.log('\n💥 Testing error handling under load...');
    
    const result = await this.runConcurrentRequests(
      '/api/tournaments/invalid-id-12345',
      30,
      10000
    );
    
    result.scenarioName = 'Error Handling (404 responses)';
    this.results.push(result);
    this.printScenarioResults(result);
  }

  /**
   * Print scenario results
   */
  printScenarioResults(result) {
    console.log(`  📈 Requests: ${result.requests}`);
    console.log(`  ⚡ RPS: ${result.requestsPerSecond}`);
    console.log(`  ❌ Error Rate: ${result.errorRate}%`);
    console.log(`  ⏱️ Avg Response: ${result.avgResponseTime}ms`);
    
    if (result.p95) {
      console.log(`  📊 P50: ${result.p50}ms, P95: ${result.p95}ms, P99: ${result.p99}ms`);
      console.log(`  🎯 Min: ${result.min}ms, Max: ${result.max}ms`);
    }
  }

  /**
   * Print comprehensive summary
   */
  printSummary() {
    console.log('\n📋 Load Test Summary');
    console.log('===================');
    
    this.results.forEach(result => {
      console.log(`\n${result.scenarioName}:`);
      console.log(`  Total Requests: ${result.requests}`);
      console.log(`  Requests/sec: ${result.requestsPerSecond}`);
      console.log(`  Error Rate: ${result.errorRate}%`);
      console.log(`  Avg Response Time: ${result.avgResponseTime}ms`);
      
      if (result.p95) {
        console.log(`  95th Percentile: ${result.p95}ms`);
      }
    });

    // Overall recommendations
    console.log('\n💡 Recommendations:');
    
    const highErrorScenarios = this.results.filter(r => parseFloat(r.errorRate) > 5);
    if (highErrorScenarios.length > 0) {
      console.log(`  ⚠️ High error rates detected in ${highErrorScenarios.length} scenarios`);
      console.log(`  → Consider implementing better error handling and rate limiting`);
    }

    const slowScenarios = this.results.filter(r => parseFloat(r.avgResponseTime) > 1000);
    if (slowScenarios.length > 0) {
      console.log(`  🐌 Slow response times in ${slowScenarios.length} scenarios`);
      console.log(`  → Consider optimizing database queries and adding caching`);
    }

    const maxRPS = Math.max(...this.results.map(r => parseFloat(r.requestsPerSecond)));
    console.log(`  🚀 Peak performance: ${maxRPS} requests/second`);
    
    if (maxRPS < 50) {
      console.log(`  → Consider performance optimizations for production load`);
    }
  }

  /**
   * Export results to file
   */
  async exportResults() {
    const report = {
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      summary: {
        totalScenarios: this.results.length,
        totalRequests: this.results.reduce((sum, r) => sum + r.requests, 0),
        totalErrors: this.results.reduce((sum, r) => sum + r.errors, 0),
        peakRPS: Math.max(...this.results.map(r => parseFloat(r.requestsPerSecond))),
      },
      results: this.results,
    };

    try {
      const fileName = `load-test-results-${Date.now()}.json`;
      await fs.writeFile(`./logs/${fileName}`, JSON.stringify(report, null, 2));
      console.log(`\n📄 Results exported to: ./logs/${fileName}`);
    } catch (error) {
      console.warn(`⚠️ Failed to export results: ${error.message}`);
    }
  }

  /**
   * Run all load tests
   */
  async runAllTests() {
    console.log('🚀 Starting load testing...');
    console.log(`📍 Target: ${this.baseURL}\n`);

    await this.testHealthEndpoint();
    await this.testAuthenticatedEndpoints();
    await this.testErrorHandling();

    this.printSummary();
    await this.exportResults();
  }
}

// CLI execution
if (require.main === module) {
  const baseURL = process.argv[2] || 'http://localhost:5000';
  const tester = new LoadTester(baseURL);
  
  tester.runAllTests().catch(error => {
    console.error('💥 Load testing failed:', error);
    process.exit(1);
  });
}

module.exports = LoadTester;
