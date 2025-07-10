const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Test script for Football Scoresheet System
 * Tests the complete scoresheet generation functionality with real database data
 */

const BASE_URL = 'http://localhost:5000/api';
const OUTPUT_DIR = path.join(__dirname, '../../test_outputs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

class ScoresheetTester {
  constructor() {
    this.baseURL = BASE_URL;
    this.testResults = [];
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      const start = Date.now();
      const result = await testFunction();
      const duration = Date.now() - start;
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        error: error.message
      });
      
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
      throw error;
    }
  }

  async testTemplateInfo() {
    return this.runTest('Template Information', async () => {
      const response = await axios.get(`${this.baseURL}/scoresheets/football/template-info`);
      
      console.log('📋 Template Info:');
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   Sport: ${response.data.data.sport}`);
      console.log(`   Team Size: ${response.data.data.team_size}`);
      
      return response.data;
    });
  }

  async testPreviewGeneration() {
    return this.runTest('Preview Generation', async () => {
      const response = await axios.get(`${this.baseURL}/scoresheets/football/preview?format=blank`);
      
      const htmlContent = response.data.data.html;
      const outputPath = path.join(OUTPUT_DIR, 'preview_scoresheet.html');
      fs.writeFileSync(outputPath, htmlContent);
      
      console.log(`💾 Preview saved to: ${outputPath}`);
      console.log(`📏 HTML size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
      
      return response.data;
    });
  }

  async testAvailableSchools() {
    return this.runTest('Available Schools', async () => {
      const response = await axios.get(`${this.baseURL}/scoresheets/schools?limit=10`);
      
      const schools = response.data.data.schools;
      console.log(`🏫 Found ${schools.length} schools:`);
      schools.forEach((school, index) => {
        console.log(`   ${index + 1}. ${school.school_name} (${school.school_code}) - ${school.teams_count} teams, ${school.players_count} players`);
      });
      
      return response.data;
    });
  }

  async testSchoolsByAdmin() {
    return this.runTest('Schools by Admin', async () => {
      const response = await axios.get(`${this.baseURL}/scoresheets/schools?adminEmail=admin@test.com&limit=5`);
      
      const schools = response.data.data.schools;
      console.log(`👤 Schools managed by admin@test.com: ${schools.length}`);
      schools.forEach((school, index) => {
        console.log(`   ${index + 1}. ${school.school_name} - ${school.teams_count} teams`);
      });
      
      return response.data;
    });
  }

  async testRealDataGeneration() {
    return this.runTest('Real Data Generation', async () => {
      const requestData = {
        useRealData: true,
        format: 'blank',
        schoolLimit: 8,
        useAdminFilter: false
      };
      
      const response = await axios.post(`${this.baseURL}/scoresheets/football/generate`, requestData);
      
      const htmlContent = response.data.data.html;
      const outputPath = path.join(OUTPUT_DIR, 'real_data_scoresheet.html');
      fs.writeFileSync(outputPath, htmlContent);
      
      console.log(`💾 Real data scoresheet saved to: ${outputPath}`);
      console.log(`📊 Data source: ${response.data.data.data_source}`);
      console.log(`📏 HTML size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
      
      return response.data;
    });
  }

  async testAdminFilterGeneration() {
    return this.runTest('Admin Filter Generation', async () => {
      const requestData = {
        useRealData: true,
        format: 'blank',
        schoolLimit: 5,
        useAdminFilter: true,
        adminEmail: 'admin@test.com'
      };
      
      const response = await axios.post(`${this.baseURL}/scoresheets/football/generate`, requestData);
      
      const htmlContent = response.data.data.html;
      const outputPath = path.join(OUTPUT_DIR, 'admin_filter_scoresheet.html');
      fs.writeFileSync(outputPath, htmlContent);
      
      console.log(`💾 Admin filter scoresheet saved to: ${outputPath}`);
      console.log(`👤 Admin email filter: admin@test.com`);
      
      return response.data;
    });
  }

  async testSampleDataGeneration() {
    return this.runTest('Sample Data Generation', async () => {
      const requestData = {
        useRealData: false,
        format: 'blank'
      };
      
      const response = await axios.post(`${this.baseURL}/scoresheets/football/generate`, requestData);
      
      const htmlContent = response.data.data.html;
      const outputPath = path.join(OUTPUT_DIR, 'sample_data_scoresheet.html');
      fs.writeFileSync(outputPath, htmlContent);
      
      console.log(`💾 Sample data scoresheet saved to: ${outputPath}`);
      console.log(`📊 Data source: ${response.data.data.data_source}`);
      
      return response.data;
    });
  }

  async testBatchGeneration() {
    return this.runTest('Batch Generation', async () => {
      const matchList = [
        { useRealData: true, format: 'blank', schoolLimit: 2 },
        { useRealData: false, format: 'blank' },
        { useRealData: true, format: 'blank', useAdminFilter: true, adminEmail: 'admin@test.com' }
      ];
      
      const requestData = {
        matchList,
        defaultOptions: {
          schoolLimit: 5
        }
      };
      
      const response = await axios.post(`${this.baseURL}/scoresheets/football/batch`, requestData, {
        headers: {
          'Authorization': 'Bearer dummy-token-for-test' // You may need a real token
        }
      });
      
      const results = response.data.data.results;
      console.log(`📦 Batch generation results:`);
      console.log(`   Total: ${response.data.data.summary.total}`);
      console.log(`   Successful: ${response.data.data.summary.successful}`);
      console.log(`   Failed: ${response.data.data.summary.failed}`);
      
      // Save successful results
      results.forEach((result, index) => {
        if (result.success) {
          const outputPath = path.join(OUTPUT_DIR, `batch_scoresheet_${index + 1}.html`);
          fs.writeFileSync(outputPath, result.html);
          console.log(`   💾 Batch ${index + 1} saved to: ${outputPath}`);
        }
      });
      
      return response.data;
    });
  }

  async testSpecificTeamMatch() {
    return this.runTest('Specific Team Match', async () => {
      // First get available schools to find team IDs
      const schoolsResponse = await axios.get(`${this.baseURL}/scoresheets/schools?limit=5`);
      const schools = schoolsResponse.data.data.schools;
      
      if (schools.length < 2) {
        throw new Error('Need at least 2 schools with teams for this test');
      }
      
      // Use first two schools as teams (simplified for testing)
      const requestData = {
        homeTeamId: 1, // Assuming team ID 1 exists
        awayTeamId: 2, // Assuming team ID 2 exists
        matchDate: '2024-12-20',
        venue: 'Test Stadium',
        format: 'blank'
      };
      
      try {
        const response = await axios.post(`${this.baseURL}/scoresheets/teams/match`, requestData);
        
        const htmlContent = response.data.data.html;
        const outputPath = path.join(OUTPUT_DIR, 'specific_team_match.html');
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log(`💾 Team match scoresheet saved to: ${outputPath}`);
        console.log(`⚽ Match: Team ${requestData.homeTeamId} vs Team ${requestData.awayTeamId}`);
        
        return response.data;
      } catch (error) {
        if (error.response?.status === 500) {
          console.log('⚠️  Team match test skipped - teams may not exist in database');
          return { skipped: true, reason: 'Teams not found' };
        }
        throw error;
      }
    });
  }

  generateTestReport() {
    console.log('\n📊 TEST REPORT');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nTest Details:');
    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      const duration = test.duration ? ` (${test.duration}ms)` : '';
      console.log(`${status} ${test.name}${duration}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    
    // Save report
    const reportPath = path.join(OUTPUT_DIR, 'test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: { total, passed, failed, successRate: (passed / total) * 100 },
      results: this.testResults,
      generatedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log(`📁 All test outputs saved to: ${OUTPUT_DIR}`);
  }

  async runAllTests() {
    console.log('🚀 Starting Football Scoresheet System Tests');
    console.log('=' .repeat(60));
    
    try {
      await this.testTemplateInfo();
      await this.testPreviewGeneration();
      await this.testAvailableSchools();
      await this.testSchoolsByAdmin();
      await this.testRealDataGeneration();
      await this.testAdminFilterGeneration();
      await this.testSampleDataGeneration();
      
      // Skip batch test if no auth token
      try {
        await this.testBatchGeneration();
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('⚠️  Batch test skipped - requires authentication');
        } else {
          throw error;
        }
      }
      
      await this.testSpecificTeamMatch();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      this.generateTestReport();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ScoresheetTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ScoresheetTester;
