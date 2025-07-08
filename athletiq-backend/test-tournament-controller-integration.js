#!/usr/bin/env node
//
// 🧪 ATHLETIQ - Tournament Controller Integration Test
//
// This script tests all major tournament controller functions
// to ensure they work correctly with the actual database schema
//

const pool = require('./src/config/db');
const { ApiResponse } = require('./src/utils/apiResponse');

// Simple mock functions without Jest
const createMockFn = () => {
  const mockFn = (...args) => {
    mockFn.mock.calls.push(args);
    return mockFn;
  };
  mockFn.mock = { calls: [] };
  mockFn.mockReturnValue = (value) => {
    mockFn.returnValue = value;
    return mockFn;
  };
  return mockFn;
};

// Mock request and response objects
const createMockReq = (body = {}, params = {}, query = {}, user = { id: 1, role: 'SuperAdmin' }) => ({
  body,
  params,
  query,
  user
});

const createMockRes = () => {
  const res = {};
  res.status = createMockFn().mockReturnValue(res);
  res.json = createMockFn().mockReturnValue(res);
  return res;
};

const mockNext = createMockFn();

// Import controller functions
const tournamentController = require('./src/controllers/tournamentController');

async function testTournamentControllerIntegration() {
  try {
    console.log('🧪 Starting tournament controller integration tests...\n');

    // Test 1: Get tournaments
    console.log('1️⃣ Testing getTournaments...');
    const req1 = createMockReq({}, {}, { status: 'published', page: 1, limit: 5 });
    const res1 = createMockRes();
    
    await tournamentController.getTournaments(req1, res1, mockNext);
    
    if (mockNext.mock.calls.length > 0) {
      console.log('   ❌ getTournaments failed:', mockNext.mock.calls[0][0].message);
    } else {
      console.log('   ✅ getTournaments completed successfully');
      if (res1.json.mock.calls.length > 0) {
        const result = res1.json.mock.calls[0][0];
        console.log(`   📊 Found ${result.data.tournaments.length} tournaments`);
      }
    }

    // Test 2: Get tournament by ID
    console.log('\n2️⃣ Testing getTournamentById...');
    const req2 = createMockReq({}, { id: 8 }); // Using known tournament ID
    const res2 = createMockRes();
    
    await tournamentController.getTournamentById(req2, res2, mockNext);
    
    if (mockNext.mock.calls.length > 1) {
      console.log('   ❌ getTournamentById failed:', mockNext.mock.calls[1][0].message);
    } else {
      console.log('   ✅ getTournamentById completed successfully');
      if (res2.json.mock.calls.length > 0) {
        const result = res2.json.mock.calls[0][0];
        console.log(`   📊 Tournament: ${result.data.name}`);
      }
    }

    // Test 3: Check tournament eligibility
    console.log('\n3️⃣ Testing checkTournamentEligibility...');
    const req3 = createMockReq(
      { team_id: 3, player_ids: [461, 462] },
      { id: 8 }
    );
    const res3 = createMockRes();
    
    await tournamentController.checkTournamentEligibility(req3, res3, mockNext);
    
    if (mockNext.mock.calls.length > 2) {
      console.log('   ❌ checkTournamentEligibility failed:', mockNext.mock.calls[2][0].message);
    } else {
      console.log('   ✅ checkTournamentEligibility completed successfully');
      if (res3.json.mock.calls.length > 0) {
        const result = res3.json.mock.calls[0][0];
        console.log(`   📊 Eligibility: ${result.data.eligible}`);
      }
    }

    // Test 4: Get tournament teams
    console.log('\n4️⃣ Testing getTournamentTeams...');
    const req4 = createMockReq({}, { id: 8 }, { status: 'registered', include_players: 'true' });
    const res4 = createMockRes();
    
    await tournamentController.getTournamentTeams(req4, res4, mockNext);
    
    if (mockNext.mock.calls.length > 3) {
      console.log('   ❌ getTournamentTeams failed:', mockNext.mock.calls[3][0].message);
    } else {
      console.log('   ✅ getTournamentTeams completed successfully');
      if (res4.json.mock.calls.length > 0) {
        const result = res4.json.mock.calls[0][0];
        console.log(`   📊 Found ${result.data.teams.length} teams`);
        if (result.data.teams.length > 0) {
          console.log(`   📊 Sample team: ${result.data.teams[0].team_name}`);
        }
      }
    }

    // Test 5: Get tournament dashboard
    console.log('\n5️⃣ Testing getTournamentDashboard...');
    const req5 = createMockReq({}, { id: 8 });
    const res5 = createMockRes();
    
    await tournamentController.getTournamentDashboard(req5, res5, mockNext);
    
    if (mockNext.mock.calls.length > 4) {
      console.log('   ❌ getTournamentDashboard failed:', mockNext.mock.calls[4][0].message);
    } else {
      console.log('   ✅ getTournamentDashboard completed successfully');
      if (res5.json.mock.calls.length > 0) {
        const result = res5.json.mock.calls[0][0];
        console.log(`   📊 Registered teams: ${result.data.statistics.registered_teams}`);
      }
    }

    // Test 6: Get registration dashboard
    console.log('\n6️⃣ Testing getRegistrationDashboard...');
    const req6 = createMockReq({}, { id: 8 });
    const res6 = createMockRes();
    
    await tournamentController.getRegistrationDashboard(req6, res6, mockNext);
    
    if (mockNext.mock.calls.length > 5) {
      console.log('   ❌ getRegistrationDashboard failed:', mockNext.mock.calls[5][0].message);
    } else {
      console.log('   ✅ getRegistrationDashboard completed successfully');
      if (res6.json.mock.calls.length > 0) {
        const result = res6.json.mock.calls[0][0];
        console.log(`   📊 Total registrations: ${result.data.statistics.total_registrations}`);
      }
    }

    // Test 7: Check player eligibility
    console.log('\n7️⃣ Testing checkPlayerEligibility...');
    const req7 = createMockReq(
      { player_ids: [461, 462, 463] },
      { id: 8 }
    );
    const res7 = createMockRes();
    
    await tournamentController.checkPlayerEligibility(req7, res7, mockNext);
    
    if (mockNext.mock.calls.length > 6) {
      console.log('   ❌ checkPlayerEligibility failed:', mockNext.mock.calls[6][0].message);
    } else {
      console.log('   ✅ checkPlayerEligibility completed successfully');
      if (res7.json.mock.calls.length > 0) {
        const result = res7.json.mock.calls[0][0];
        console.log(`   📊 Eligible players: ${result.data.eligible_players}/${result.data.total_players}`);
      }
    }

    // Test 8: Test tournament bracket
    console.log('\n8️⃣ Testing getTournamentBracket...');
    const req8 = createMockReq({}, { id: 8 });
    const res8 = createMockRes();
    
    await tournamentController.getTournamentBracket(req8, res8, mockNext);
    
    if (mockNext.mock.calls.length > 7) {
      console.log('   ❌ getTournamentBracket failed:', mockNext.mock.calls[7][0].message);
    } else {
      console.log('   ✅ getTournamentBracket completed successfully');
      if (res8.json.mock.calls.length > 0) {
        const result = res8.json.mock.calls[0][0];
        console.log(`   📊 Matches: ${result.data.matches ? result.data.matches.length : 0}`);
      }
    }

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    const totalTests = 8;
    const passedTests = totalTests - mockNext.mock.calls.length;
    const failedTests = mockNext.mock.calls.length;
    
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed tests:');
      mockNext.mock.calls.forEach((call, index) => {
        console.log(`   ${index + 1}. ${call[0].message}`);
      });
    }

    console.log('\n✅ Tournament controller integration tests completed!');
    
    return {
      success: failedTests === 0,
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests
    };

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mock Jest functions if not available
// This is now handled by createMockFn above

// Run the tests
if (require.main === module) {
  testTournamentControllerIntegration()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 All integration tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some integration tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Integration test error:', error);
      process.exit(1);
    });
}

module.exports = { testTournamentControllerIntegration };
