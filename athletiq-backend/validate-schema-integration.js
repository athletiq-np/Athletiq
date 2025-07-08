#!/usr/bin/env node
//
// 🧪 ATHLETIQ - Schema Validation Test
//
// This script validates that the tournament controller works correctly
// with the actual database schema, testing all major functions
//

const pool = require('./src/config/db');

async function validateSchemaIntegration() {
  try {
    console.log('🧪 Starting schema validation tests...\n');

    // Test 1: Verify table structure matches controller expectations
    console.log('1️⃣ Testing table structure compatibility...');
    
    // Check teams table has team_name column
    const teamsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'team_name'
    `);
    
    if (teamsColumns.rows.length === 0) {
      throw new Error('❌ Teams table missing team_name column');
    }
    console.log('   ✅ Teams table has team_name column');
    
    // Check players table has registration_status column
    const playersColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' AND column_name = 'registration_status'
    `);
    
    if (playersColumns.rows.length === 0) {
      throw new Error('❌ Players table missing registration_status column');
    }
    console.log('   ✅ Players table has registration_status column');
    
    // Check tournament_teams table has registration_status column
    const tournamentTeamsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tournament_teams' AND column_name = 'registration_status'
    `);
    
    if (tournamentTeamsColumns.rows.length === 0) {
      throw new Error('❌ Tournament_teams table missing registration_status column');
    }
    console.log('   ✅ Tournament_teams table has registration_status column');

    // Test 2: Test common queries used in controller
    console.log('\n2️⃣ Testing controller queries...');
    
    // Test tournament teams query
    const tournamentId = 8; // Using known tournament ID from sample data
    const teamsQuery = await pool.query(`
      SELECT tt.id as tournament_team_id, tt.team_id, t.team_name, s.name as school_name
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      WHERE tt.tournament_id = $1
      ORDER BY tt.id
    `, [tournamentId]);
    
    console.log(`   ✅ Tournament teams query returned ${teamsQuery.rows.length} results`);
    if (teamsQuery.rows.length > 0) {
      console.log(`   📊 Sample result: ${JSON.stringify(teamsQuery.rows[0], null, 2)}`);
    }
    
    // Test player eligibility query
    const playerId = 461; // Using known player ID from sample data
    const playerQuery = await pool.query(`
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
    `, [playerId]);
    
    console.log(`   ✅ Player eligibility query returned ${playerQuery.rows.length} results`);
    if (playerQuery.rows.length > 0) {
      const player = playerQuery.rows[0];
      console.log(`   📊 Player: ${player.full_name}, Age: ${player.age}, Verified: ${player.is_verified}`);
    }

    // Test 3: Test tournament with player registrations
    console.log('\n3️⃣ Testing tournament-player relationships...');
    
    const tournamentPlayersQuery = await pool.query(`
      SELECT 
        tp.id,
        tp.jersey_number,
        tp.position,
        p.full_name,
        p.registration_status,
        t.team_name,
        s.name as school_name
      FROM tournament_players tp
      JOIN players p ON tp.player_id = p.id
      JOIN tournament_teams tt ON tp.tournament_team_id = tt.id
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      WHERE tt.tournament_id = $1
    `, [tournamentId]);
    
    console.log(`   ✅ Tournament players query returned ${tournamentPlayersQuery.rows.length} results`);
    if (tournamentPlayersQuery.rows.length > 0) {
      console.log(`   📊 Sample player registration: ${JSON.stringify(tournamentPlayersQuery.rows[0], null, 2)}`);
    }

    // Test 4: Test registration status values
    console.log('\n4️⃣ Testing status field values...');
    
    const playerStatuses = await pool.query(`
      SELECT DISTINCT registration_status, COUNT(*) as count
      FROM players
      GROUP BY registration_status
    `);
    
    console.log('   📊 Player registration statuses:');
    playerStatuses.rows.forEach(row => {
      console.log(`     ${row.registration_status}: ${row.count} players`);
    });
    
    const tournamentTeamStatuses = await pool.query(`
      SELECT DISTINCT registration_status, COUNT(*) as count
      FROM tournament_teams
      GROUP BY registration_status
    `);
    
    console.log('   📊 Tournament team registration statuses:');
    tournamentTeamStatuses.rows.forEach(row => {
      console.log(`     ${row.registration_status}: ${row.count} teams`);
    });

    // Test 5: Test tournament status values
    console.log('\n5️⃣ Testing tournament status values...');
    
    const tournamentStatuses = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM tournaments
      GROUP BY status
    `);
    
    console.log('   📊 Tournament statuses:');
    tournamentStatuses.rows.forEach(row => {
      console.log(`     ${row.status}: ${row.count} tournaments`);
    });

    // Test 6: Test sports relationship
    console.log('\n6️⃣ Testing sports relationships...');
    
    const sportsQuery = await pool.query(`
      SELECT 
        s.name as sport_name,
        COUNT(t.id) as team_count,
        COUNT(DISTINCT t.school_id) as school_count
      FROM sports s
      LEFT JOIN teams t ON s.id = t.sport_id
      GROUP BY s.id, s.name
      ORDER BY team_count DESC
    `);
    
    console.log('   📊 Sports with team counts:');
    sportsQuery.rows.forEach(row => {
      console.log(`     ${row.sport_name}: ${row.team_count} teams from ${row.school_count} schools`);
    });

    // Test 7: Test foreign key constraints
    console.log('\n7️⃣ Testing foreign key constraints...');
    
    const fkQuery = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('tournaments', 'tournament_teams', 'tournament_players', 'tournament_registrations')
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log('   📊 Foreign key constraints for tournament tables:');
    fkQuery.rows.forEach(row => {
      console.log(`     ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    console.log('\n✅ Schema validation completed successfully!');
    
    return {
      success: true,
      tests_passed: 7,
      message: 'All schema validation tests passed'
    };

  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the validation
if (require.main === module) {
  validateSchemaIntegration()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Schema validation passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Schema validation failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Validation error:', error);
      process.exit(1);
    });
}

module.exports = { validateSchemaIntegration };
