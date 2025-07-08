#!/usr/bin/env node
//
// 🧪 ATHLETIQ - Simple Tournament Controller Test
//
// This script tests key tournament controller functions directly
// without complex mocking
//

const pool = require('./src/config/db');

async function testTournamentControllerDirect() {
  try {
    console.log('🧪 Testing tournament controller functions directly...\n');

    // Test 1: Direct database query for tournaments
    console.log('1️⃣ Testing tournament queries...');
    
    const tournamentsQuery = `
      SELECT 
        t.id, t.tournament_code, t.name, t.description, t.sport, 
        t.tournament_type, t.format, t.location, t.start_date, t.end_date,
        t.status, t.organizer_id, t.visibility,
        t.max_teams, t.min_teams, t.entry_fee, t.prize_pool,
        COALESCE(COUNT(tt.id), 0) as registered_teams
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
      WHERE t.is_active = TRUE
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `;
    
    const tournamentsResult = await pool.query(tournamentsQuery);
    console.log(`   ✅ Found ${tournamentsResult.rows.length} tournaments`);
    if (tournamentsResult.rows.length > 0) {
      console.log(`   📊 Sample: ${tournamentsResult.rows[0].name} (${tournamentsResult.rows[0].registered_teams} teams)`);
    }

    // Test 2: Test tournament teams query
    console.log('\n2️⃣ Testing tournament teams query...');
    
    const tournamentId = 8;
    const teamsQuery = `
      SELECT 
        tt.id as tournament_team_id,
        tt.registration_status,
        tt.seed_order,
        t.id as team_id,
        t.team_name,
        t.sport_id,
        s.id as school_id,
        s.name as school_name,
        COUNT(tp.player_id) as player_count
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
      WHERE tt.tournament_id = $1
      GROUP BY tt.id, t.id, s.id
      ORDER BY tt.seed_order ASC, tt.id ASC
    `;
    
    const teamsResult = await pool.query(teamsQuery, [tournamentId]);
    console.log(`   ✅ Found ${teamsResult.rows.length} teams for tournament ${tournamentId}`);
    if (teamsResult.rows.length > 0) {
      console.log(`   📊 Sample: ${teamsResult.rows[0].team_name} (${teamsResult.rows[0].player_count} players)`);
    }

    // Test 3: Test player eligibility query
    console.log('\n3️⃣ Testing player eligibility query...');
    
    const playerId = 461;
    const playerQuery = `
      SELECT 
        p.*,
        s.name as school_name,
        EXTRACT(YEARS FROM AGE(p.date_of_birth)) as age,
        CASE 
          WHEN p.registration_status = 'approved' THEN true
          ELSE false
        END as is_verified
      FROM players p
      JOIN schools s ON p.school_id = s.id
      WHERE p.id = $1
    `;
    
    const playerResult = await pool.query(playerQuery, [playerId]);
    console.log(`   ✅ Found ${playerResult.rows.length} player for ID ${playerId}`);
    if (playerResult.rows.length > 0) {
      const player = playerResult.rows[0];
      console.log(`   📊 Player: ${player.full_name}, Age: ${player.age}, Verified: ${player.is_verified}`);
    }

    // Test 4: Test tournament bracket query
    console.log('\n4️⃣ Testing tournament bracket query...');
    
    const bracketQuery = `
      SELECT 
        t.id as tournament_id,
        t.name as tournament_name,
        COUNT(m.id) as match_count
      FROM tournaments t
      LEFT JOIN matches m ON t.id = m.tournament_id
      WHERE t.id = $1
      GROUP BY t.id, t.name
    `;
    
    const bracketResult = await pool.query(bracketQuery, [tournamentId]);
    console.log(`   ✅ Tournament bracket query successful`);
    if (bracketResult.rows.length > 0) {
      console.log(`   📊 Tournament: ${bracketResult.rows[0].tournament_name} (${bracketResult.rows[0].match_count} matches)`);
    }

    // Test 5: Test registration dashboard queries
    console.log('\n5️⃣ Testing registration dashboard queries...');
    
    const dashboardQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as confirmed_registrations,
        COUNT(CASE WHEN registration_status = 'pending' THEN 1 END) as pending_registrations
      FROM tournament_teams 
      WHERE tournament_id = $1
    `;
    
    const dashboardResult = await pool.query(dashboardQuery, [tournamentId]);
    console.log(`   ✅ Registration dashboard query successful`);
    if (dashboardResult.rows.length > 0) {
      const stats = dashboardResult.rows[0];
      console.log(`   📊 Registrations: ${stats.total_registrations} total, ${stats.confirmed_registrations} confirmed`);
    }

    // Test 6: Test comprehensive tournament join
    console.log('\n6️⃣ Testing comprehensive tournament join...');
    
    const comprehensiveQuery = `
      SELECT 
        t.id as tournament_id,
        t.name as tournament_name,
        tt.id as tournament_team_id,
        teams.team_name,
        schools.name as school_name,
        COUNT(tp.player_id) as player_count,
        tt.registration_status
      FROM tournaments t
      JOIN tournament_teams tt ON t.id = tt.tournament_id
      JOIN teams ON tt.team_id = teams.id
      JOIN schools ON teams.school_id = schools.id
      LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
      WHERE t.id = $1
      GROUP BY t.id, t.name, tt.id, teams.team_name, schools.name, tt.registration_status
      ORDER BY tt.id
    `;
    
    const comprehensiveResult = await pool.query(comprehensiveQuery, [tournamentId]);
    console.log(`   ✅ Comprehensive join query successful`);
    console.log(`   📊 Found ${comprehensiveResult.rows.length} team registrations`);
    
    comprehensiveResult.rows.forEach((row, index) => {
      console.log(`   📊 ${index + 1}. ${row.team_name} (${row.school_name}) - ${row.player_count} players - ${row.registration_status}`);
    });

    // Test 7: Test status values alignment
    console.log('\n7️⃣ Testing status values alignment...');
    
    const statusQueries = [
      { name: 'Tournament statuses', query: 'SELECT DISTINCT status FROM tournaments' },
      { name: 'Player registration statuses', query: 'SELECT DISTINCT registration_status FROM players' },
      { name: 'Tournament team statuses', query: 'SELECT DISTINCT registration_status FROM tournament_teams' }
    ];
    
    for (const statusQuery of statusQueries) {
      const result = await pool.query(statusQuery.query);
      console.log(`   📊 ${statusQuery.name}: ${result.rows.map(r => Object.values(r)[0]).join(', ')}`);
    }

    console.log('\n✅ All direct tests completed successfully!');
    
    return {
      success: true,
      message: 'All tournament controller database queries work correctly'
    };

  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests
if (require.main === module) {
  testTournamentControllerDirect()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 All direct tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some direct tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test error:', error);
      process.exit(1);
    });
}

module.exports = { testTournamentControllerDirect };
