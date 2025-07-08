const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testConfig = {
  adminCredentials: {
    email: 'admin@athletiq.com',
    password: 'Admin123!'
  },
  testTournament: {
    name: 'Pre-Tournament Test Championship',
    description: 'Test tournament for pre-tournament management',
    sport: 'football',
    tournament_type: 'school',
    format: 'single_elimination',
    max_teams: 8,
    min_teams: 4,
    start_date: '2024-08-15',
    end_date: '2024-08-20',
    location: 'Test Arena',
    visibility: 'public'
  },
  testTeams: [
    { team_name: 'Team Alpha', sport_id: 1 },
    { team_name: 'Team Beta', sport_id: 1 },
    { team_name: 'Team Gamma', sport_id: 1 },
    { team_name: 'Team Delta', sport_id: 1 }
  ],
  venues: ['Arena A', 'Arena B', 'Arena C'],
  scheduleConfig: {
    startDate: '2024-08-15',
    endDate: '2024-08-20',
    matchDuration: 90,
    breakDuration: 30
  }
};

let authToken = null;
let testTournamentId = null;
let testTeamIds = [];

// Utility functions
const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const error = (message, err = null) => {
  console.error(`\n❌ ${message}`);
  if (err) {
    console.error(err.response?.data || err.message);
  }
};

const success = (message, data = null) => {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// API Helper functions
const apiCall = async (method, endpoint, data = null, headers = {}) => {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (err) {
    throw err;
  }
};

// Test functions
async function authenticateAdmin() {
  try {
    log('Authenticating admin user...');
    const response = await apiCall('POST', '/auth/login', testConfig.adminCredentials);
    
    if (response.token) {
      authToken = response.token;
      success('Admin authenticated successfully');
      return true;
    } else {
      error('Authentication failed - no token received');
      return false;
    }
  } catch (err) {
    error('Authentication failed', err);
    return false;
  }
}

async function createTestTournament() {
  try {
    log('Creating test tournament...');
    const response = await apiCall('POST', '/tournaments', testConfig.testTournament);
    
    if (response.data && response.data.id) {
      testTournamentId = response.data.id;
      success('Test tournament created successfully', {
        id: testTournamentId,
        name: response.data.name,
        tournament_code: response.data.tournament_code
      });
      return true;
    } else {
      error('Failed to create test tournament');
      return false;
    }
  } catch (err) {
    error('Failed to create test tournament', err);
    return false;
  }
}

async function createTestTeams() {
  try {
    log('Creating test teams...');
    
    // First get a school to associate teams with
    const schoolsResponse = await apiCall('GET', '/schools');
    const schools = schoolsResponse.data;
    
    if (!schools || schools.length === 0) {
      error('No schools found - cannot create teams');
      return false;
    }
    
    const schoolId = schools[0].id;
    
    for (const teamData of testConfig.testTeams) {
      try {
        const response = await apiCall('POST', '/teams', {
          ...teamData,
          school_id: schoolId
        });
        
        if (response.data && response.data.id) {
          testTeamIds.push(response.data.id);
          log(`Created team: ${teamData.team_name} (ID: ${response.data.id})`);
        }
      } catch (err) {
        error(`Failed to create team ${teamData.team_name}`, err);
      }
    }
    
    success(`Created ${testTeamIds.length} test teams`);
    return testTeamIds.length > 0;
  } catch (err) {
    error('Failed to create test teams', err);
    return false;
  }
}

async function registerTeamsForTournament() {
  try {
    log('Registering teams for tournament...');
    
    let registeredCount = 0;
    
    for (const teamId of testTeamIds) {
      try {
        const response = await apiCall('POST', `/tournaments/${testTournamentId}/register-team`, {
          team_id: teamId,
          player_ids: [], // Empty for now
          auto_confirm: true
        });
        
        if (response.success) {
          registeredCount++;
          log(`Registered team ID ${teamId} for tournament`);
        }
      } catch (err) {
        error(`Failed to register team ID ${teamId}`, err);
      }
    }
    
    success(`Registered ${registeredCount} teams for tournament`);
    return registeredCount > 0;
  } catch (err) {
    error('Failed to register teams for tournament', err);
    return false;
  }
}

async function testGenerateBracket() {
  try {
    log('Testing bracket generation...');
    
    const response = await apiCall('POST', `/pre-tournament/${testTournamentId}/bracket`, {
      format: 'single_elimination',
      seedingMethod: 'random'
    });
    
    if (response.success) {
      success('Bracket generated successfully', {
        format: response.data.format,
        teamsCount: response.data.teamsCount,
        matchesCount: response.data.matchesCount
      });
      return true;
    } else {
      error('Failed to generate bracket');
      return false;
    }
  } catch (err) {
    error('Failed to generate bracket', err);
    return false;
  }
}

async function testGetBracket() {
  try {
    log('Testing get bracket...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/bracket`);
    
    if (response.success) {
      success('Bracket retrieved successfully', {
        tournamentName: response.data.tournament.name,
        format: response.data.tournament.format,
        matchesCount: response.data.matches.length,
        roundsCount: Object.keys(response.data.rounds).length
      });
      return true;
    } else {
      error('Failed to get bracket');
      return false;
    }
  } catch (err) {
    error('Failed to get bracket', err);
    return false;
  }
}

async function testScheduleMatches() {
  try {
    log('Testing match scheduling...');
    
    const response = await apiCall('POST', `/pre-tournament/${testTournamentId}/schedule`, {
      ...testConfig.scheduleConfig,
      venues: testConfig.venues
    });
    
    if (response.success) {
      success('Matches scheduled successfully', {
        tournamentId: response.data.tournamentId,
        matchesCount: response.data.matchesCount
      });
      return true;
    } else {
      error('Failed to schedule matches');
      return false;
    }
  } catch (err) {
    error('Failed to schedule matches', err);
    return false;
  }
}

async function testGetSchedule() {
  try {
    log('Testing get schedule...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/schedule`);
    
    if (response.success) {
      success('Schedule retrieved successfully', {
        tournamentId: response.data.tournamentId,
        matchesCount: response.data.matches.length,
        scheduledDates: Object.keys(response.data.schedule).length
      });
      return true;
    } else {
      error('Failed to get schedule');
      return false;
    }
  } catch (err) {
    error('Failed to get schedule', err);
    return false;
  }
}

async function testValidateTournamentSetup() {
  try {
    log('Testing tournament setup validation...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/validate`);
    
    if (response.success) {
      success('Tournament validation completed', {
        tournamentId: response.data.tournamentId,
        isValid: response.data.isValid,
        checksCount: response.data.checks.length,
        errorsCount: response.data.errors.length,
        warningsCount: response.data.warnings.length
      });
      
      // Show validation details
      log('Validation Details:');
      response.data.checks.forEach(check => {
        const status = check.passed ? '✅' : '❌';
        console.log(`  ${status} ${check.check}`);
        if (check.errors) {
          check.errors.forEach(err => console.log(`    Error: ${err}`));
        }
        if (check.warnings) {
          check.warnings.forEach(warn => console.log(`    Warning: ${warn}`));
        }
      });
      
      return true;
    } else {
      error('Failed to validate tournament setup');
      return false;
    }
  } catch (err) {
    error('Failed to validate tournament setup', err);
    return false;
  }
}

async function testPreTournamentOperations() {
  try {
    log('Testing pre-tournament operations workflow...');
    
    const results = {
      auth: await authenticateAdmin(),
      createTournament: false,
      createTeams: false,
      registerTeams: false,
      generateBracket: false,
      customizeSeeding: false,
      scheduleAdvanced: false,
      getScheduleDetailed: false,
      validateSetup: false,
      generateReport: false
    };
    
    if (results.auth) {
      results.createTournament = await createTestTournament();
      
      if (results.createTournament) {
        results.createTeams = await createTestTeams();
        
        if (results.createTeams) {
          results.registerTeams = await registerTeamsForTournament();
          
          if (results.registerTeams) {
            // Test basic bracket generation from main tournament routes
            results.generateBracket = await testGenerateBracket();
            
            if (results.generateBracket) {
              // Test advanced pre-tournament features
              results.customizeSeeding = await testCustomizeSeeding();
              results.scheduleAdvanced = await testAdvancedScheduling();
              results.getScheduleDetailed = await testGetScheduleDetailed();
              results.validateSetup = await testValidateTournamentSetup();
              results.generateReport = await testGenerateReport();
            }
          }
        }
      }
    }
    
    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      testResults: results,
      summary: {
        total: Object.keys(results).length,
        passed: Object.values(results).filter(r => r === true).length,
        failed: Object.values(results).filter(r => r === false).length
      },
      testData: {
        tournamentId: testTournamentId,
        teamIds: testTeamIds,
        authToken: authToken ? 'Present' : 'Missing'
      }
    };
    
    // Save report
    fs.writeFileSync('pre-tournament-test-report.json', JSON.stringify(report, null, 2));
    
    log('Pre-Tournament Management Test Report', report);
    
    if (report.summary.passed === report.summary.total) {
      success('🎉 All pre-tournament management tests passed!');
    } else {
      error(`❌ ${report.summary.failed} out of ${report.summary.total} tests failed`);
    }
    
    return report;
    
  } catch (err) {
    error('Pre-tournament operations test failed', err);
    return null;
  }
}

async function testGenerateBracket() {
  try {
    log('Testing bracket generation (using existing tournament routes)...');
    
    const response = await apiCall('POST', `/tournaments/${testTournamentId}/generate-bracket`, {
      format: 'single_elimination'
    });
    
    if (response.success || response.data) {
      success('Bracket generated successfully', {
        tournamentId: response.data?.tournament_id || testTournamentId,
        matchesGenerated: response.data?.matches_generated || 'Unknown',
        format: response.data?.format || 'single_elimination'
      });
      return true;
    } else {
      error('Failed to generate bracket');
      return false;
    }
  } catch (err) {
    error('Failed to generate bracket', err);
    return false;
  }
}

async function testCustomizeSeeding() {
  try {
    log('Testing bracket seeding customization...');
    
    // Create seeding data for our test teams
    const seedingData = testTeamIds.map((teamId, index) => ({
      teamId: teamId,
      position: index + 1
    }));
    
    const response = await apiCall('PUT', `/pre-tournament/${testTournamentId}/seeding`, {
      seedingData
    });
    
    if (response.success) {
      success('Bracket seeding customized successfully', {
        tournamentId: response.data.tournamentId,
        seedingCount: response.data.seedingCount
      });
      return true;
    } else {
      error('Failed to customize bracket seeding');
      return false;
    }
  } catch (err) {
    error('Failed to customize bracket seeding', err);
    return false;
  }
}

async function testAdvancedScheduling() {
  try {
    log('Testing advanced match scheduling...');
    
    const response = await apiCall('POST', `/pre-tournament/${testTournamentId}/schedule-advanced`, {
      startDate: '2024-08-15',
      endDate: '2024-08-20',
      venues: testConfig.venues,
      matchDuration: 90,
      breakDuration: 30,
      dailyStartTime: '09:00',
      dailyEndTime: '20:00',
      optimizeVenues: true
    });
    
    if (response.success) {
      success('Advanced scheduling completed successfully', {
        tournamentId: response.data.tournamentId,
        matchesScheduled: response.data.matchesScheduled
      });
      return true;
    } else {
      error('Failed to schedule matches with advanced options');
      return false;
    }
  } catch (err) {
    error('Failed to schedule matches with advanced options', err);
    return false;
  }
}

async function testGetScheduleDetailed() {
  try {
    log('Testing detailed schedule retrieval...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/schedule?includeAnalytics=true`);
    
    if (response.success) {
      success('Detailed schedule retrieved successfully', {
        tournamentId: response.data.tournamentId,
        matchesCount: response.data.matches.length,
        analyticsIncluded: !!response.data.analytics
      });
      return true;
    } else {
      error('Failed to get detailed schedule');
      return false;
    }
  } catch (err) {
    error('Failed to get detailed schedule', err);
    return false;
  }
}

async function testValidateTournamentSetup() {
  try {
    log('Testing tournament setup validation...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/validate`);
    
    if (response.success) {
      success('Tournament validation completed', {
        tournamentId: response.data.tournamentId,
        isValid: response.data.isValid,
        checksCount: response.data.checks.length,
        errorsCount: response.data.errors.length,
        warningsCount: response.data.warnings.length
      });
      
      // Show validation details
      log('Validation Details:');
      response.data.checks.forEach(check => {
        const status = check.passed ? '✅' : '❌';
        console.log(`  ${status} ${check.check}`);
        if (check.errors) {
          check.errors.forEach(err => console.log(`    Error: ${err}`));
        }
        if (check.warnings) {
          check.warnings.forEach(warn => console.log(`    Warning: ${warn}`));
        }
      });
      
      return true;
    } else {
      error('Failed to validate tournament setup');
      return false;
    }
  } catch (err) {
    error('Failed to validate tournament setup', err);
    return false;
  }
}

async function testGenerateReport() {
  try {
    log('Testing pre-tournament analytics report generation...');
    
    const response = await apiCall('GET', `/pre-tournament/${testTournamentId}/report`);
    
    if (response.success) {
      success('Pre-tournament report generated successfully', {
        tournamentId: response.data.tournament.id,
        tournamentName: response.data.tournament.name,
        readinessScore: response.data.readiness.overallScore,
        reportId: response.data.reportId
      });
      
      // Show key statistics
      log('Tournament Statistics:');
      console.log(`  Teams: ${response.data.statistics.teams.total_teams} total, ${response.data.statistics.teams.confirmed_teams} confirmed`);
      console.log(`  Matches: ${response.data.statistics.matches.total_matches} total, ${response.data.statistics.matches.scheduled_matches} scheduled`);
      console.log(`  Players: ${response.data.statistics.players.total_players} total, ${response.data.statistics.players.approved_players} approved`);
      console.log(`  Readiness Score: ${response.data.readiness.overallScore}%`);
      
      return true;
    } else {
      error('Failed to generate pre-tournament report');
      return false;
    }
  } catch (err) {
    error('Failed to generate pre-tournament report', err);
    return false;
  }
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting Pre-Tournament Management System Test...');
  testPreTournamentOperations();
}

module.exports = { testPreTournamentOperations };
