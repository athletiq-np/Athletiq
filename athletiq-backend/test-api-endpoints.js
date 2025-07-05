/**
 * Test API Endpoints and Complete AI Pipeline
 * Tests all new routes and services integration
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

class APITester {
  constructor() {
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTests() {
    console.log('🚀 Starting API Endpoint Tests\n');
    
    try {
      // Test 1: Authentication
      await this.testAuthentication();
      
      // Test 2: AI Routes
      await this.testAIRoutes();
      
      // Test 3: Document Routes (without actual file upload)
      await this.testDocumentRoutes();
      
      // Test 4: Health and System Status
      await this.testSystemHealth();
      
      // Summary
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
      // Try to get existing auth token (if server has a test user)
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      if (response.data.token) {
        this.authToken = response.data.token;
        console.log('✅ Authentication successful');
        this.testResults.passed++;
      } else {
        console.log('⚠️  Authentication failed - no test user available');
        console.log('   (This is expected if no test user exists)');
        this.testResults.failed++;
      }
    } catch (error) {
      console.log('⚠️  Authentication test skipped:', error.response?.data?.message || error.message);
      console.log('   (This is expected if no test user exists)');
    }
  }

  async testAIRoutes() {
    console.log('\n🤖 Testing AI Routes...');
    
    const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
    
    // Test athlete ID stats (public endpoint)
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/ai/athlete-ids/stats`, { headers });
      console.log('✅ Athlete ID stats endpoint working');
      console.log('   Stats:', JSON.stringify(statsResponse.data.data, null, 2));
      this.testResults.passed++;
    } catch (error) {
      console.log('❌ Athlete ID stats failed:', error.response?.data?.message || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`AI Stats: ${error.message}`);
    }
    
    // Test queue status
    try {
      const queueResponse = await axios.get(`${BASE_URL}/api/ai/queue/status`, { headers });
      console.log('✅ Queue status endpoint working');
      console.log('   Queue stats:', JSON.stringify(queueResponse.data.data.queue_stats, null, 2));
      this.testResults.passed++;
    } catch (error) {
      console.log('❌ Queue status failed:', error.response?.data?.message || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Queue Status: ${error.message}`);
    }
    
    // Test OCR templates
    try {
      const templatesResponse = await axios.get(`${BASE_URL}/api/ai/ocr/templates`, { headers });
      console.log('✅ OCR templates endpoint working');
      console.log('   Available templates:', Object.keys(templatesResponse.data.data.templates));
      this.testResults.passed++;
    } catch (error) {
      console.log('❌ OCR templates failed:', error.response?.data?.message || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`OCR Templates: ${error.message}`);
    }
  }

  async testDocumentRoutes() {
    console.log('\n📄 Testing Document Routes...');
    
    const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
    
    // Test document analytics
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/api/documents/analytics`, { headers });
      console.log('✅ Document analytics endpoint working');
      console.log('   Analytics:', JSON.stringify(analyticsResponse.data.data, null, 2));
      this.testResults.passed++;
    } catch (error) {
      console.log('❌ Document analytics failed:', error.response?.data?.message || error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`Document Analytics: ${error.message}`);
    }
    
    // Test document upload (without actual file - should fail gracefully)
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/api/documents/upload`, {
        document_type: 'birth_certificate',
        entity_type: 'player',
        entity_id: 1
      }, { headers });
      
      console.log('⚠️  Document upload returned success (unexpected)');
      this.testResults.failed++;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('file')) {
        console.log('✅ Document upload validation working (correctly rejected empty request)');
        this.testResults.passed++;
      } else {
        console.log('❌ Document upload failed unexpectedly:', error.response?.data?.message || error.message);
        this.testResults.failed++;
        this.testResults.errors.push(`Document Upload: ${error.message}`);
      }
    }
  }

  async testSystemHealth() {
    console.log('\n🏥 Testing System Health...');
    
    // Test main API health
    try {
      const healthResponse = await axios.get(`${BASE_URL}/`);
      if (healthResponse.data.includes('Athletiq API is running')) {
        console.log('✅ Main API health check passed');
        this.testResults.passed++;
      } else {
        console.log('❌ Main API health check failed - unexpected response');
        this.testResults.failed++;
      }
    } catch (error) {
      console.log('❌ Main API health check failed:', error.message);
      this.testResults.failed++;
      this.testResults.errors.push(`API Health: ${error.message}`);
    }
    
    // Test health endpoint if it exists
    try {
      const healthEndpointResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Health endpoint working');
      console.log('   Health data:', JSON.stringify(healthEndpointResponse.data, null, 2));
      this.testResults.passed++;
    } catch (error) {
      console.log('⚠️  Health endpoint not available:', error.response?.status || error.message);
      // Don't count this as a failure since it might not be implemented
    }
  }

  printTestSummary() {
    console.log('\n📊 Test Summary');
    console.log('═'.repeat(50));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`🔄 Total: ${this.testResults.passed + this.testResults.failed}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n🐛 Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const successRate = this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100;
    console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('🎉 Test suite mostly successful!');
    } else if (successRate >= 60) {
      console.log('⚠️  Some tests failed - check errors above');
    } else {
      console.log('❌ Many tests failed - system needs attention');
    }
  }
}

// Additional utility tests
class SystemTester {
  static async testDatabaseConnection() {
    console.log('\n🗄️  Testing Database Connection...');
    
    try {
      const db = require('./src/config/db');
      const result = await db.query('SELECT NOW() as current_time, version() as version');
      console.log('✅ Database connection successful');
      console.log('   Current time:', result.rows[0].current_time);
      console.log('   Version:', result.rows[0].version.split(' ')[0]);
      return true;
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
  }
  
  static async testAIServices() {
    console.log('\n🧠 Testing AI Services...');
    
    try {
      const athleteIdGenerator = require('./src/services/ai/athleteIdGenerator');
      const ocrService = require('./src/services/ai/ocrService');
      
      // Test athlete ID generation
      const stats = await athleteIdGenerator.getStats();
      console.log('✅ Athlete ID generator working');
      console.log('   Current stats:', stats);
      
      // Test OCR service
      const templates = ocrService.getDocumentTemplates();
      console.log('✅ OCR service working');
      console.log('   Available templates:', Object.keys(templates));
      
      return true;
    } catch (error) {
      console.log('❌ AI services failed:', error.message);
      return false;
    }
  }
  
  static async testEnvironmentConfig() {
    console.log('\n⚙️  Testing Environment Configuration...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];
    
    const optionalEnvVars = [
      'OPENAI_API_KEY',
      'GOOGLE_PROJECT_ID',
      'REDIS_HOST',
      'REDIS_PORT',
      'UPLOAD_DIR',
      'MAX_FILE_SIZE'
    ];
    
    console.log('✅ Required environment variables:');
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`   ${envVar}: ✅ Set`);
      } else {
        console.log(`   ${envVar}: ❌ Missing`);
      }
    });
    
    console.log('\n⚠️  Optional environment variables:');
    optionalEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`   ${envVar}: ✅ Set`);
      } else {
        console.log(`   ${envVar}: ⚠️  Not set`);
      }
    });
    
    return true;
  }
}

// Main execution
async function main() {
  console.log('🏁 AthletiQ API & AI Pipeline Test Suite');
  console.log('═'.repeat(50));
  
  // System tests
  await SystemTester.testEnvironmentConfig();
  await SystemTester.testDatabaseConnection();
  await SystemTester.testAIServices();
  
  // API tests
  const apiTester = new APITester();
  await apiTester.runTests();
  
  console.log('\n🏁 Test Suite Complete');
  console.log('═'.repeat(50));
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { APITester, SystemTester };
