//
// 🏆 ATHLETIQ - Advanced Pre-Tournament Management Controller
//
// This controller handles advanced pre-tournament operations:
// - Advanced scheduling and venue management
// - Tournament setup validation and pre-checks
// - Seeding and bracket customization
// - Pre-tournament analytics and reporting
//

const pool = require('../config/db');
const { getCache, setCache, deleteCache } = require('../config/cache');
const { logPerformanceMetric } = require('../config/monitoring');
const { v4: uuidv4 } = require('uuid');
const { sendResponse } = require('../utils/response');

/**
 * Advanced tournament bracket management with custom seeding
 */
const customizeBracketSeeding = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tournamentId } = req.params;
    const { seedingData } = req.body;
    
    // Validate tournament exists
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Update team seeding positions
    for (const seed of seedingData) {
      await pool.query(
        'UPDATE tournament_teams SET seed_order = $1 WHERE tournament_id = $2 AND team_id = $3',
        [seed.position, tournamentId, seed.teamId]
      );
    }
    
    // Log seeding update
    await pool.query(
      'INSERT INTO tournament_audit_log (tournament_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [tournamentId, req.user.id, 'seeding_updated', JSON.stringify(seedingData)]
    );
    
    // Clear bracket cache
    await deleteCache(`tournament_bracket_${tournamentId}`);
    
    logPerformanceMetric('customize_bracket_seeding', Date.now() - startTime, {
      tournamentId,
      seedingCount: seedingData.length
    });
    
  return sendResponse(res, { data: {
      tournamentId,
      seedingCount: seedingData.length,
      message: 'Bracket seeding updated successfully'
  } });
    
  } catch (error) {
    console.error('Error customizing bracket seeding:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to customize bracket seeding' });
  }
};

/**
 * Advanced match scheduling with venue optimization
 */
const scheduleMatchesAdvanced = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tournamentId } = req.params;
    const { 
      venues = [], 
      startDate, 
      endDate, 
      matchDuration = 90, 
      breakDuration = 30,
      dailyStartTime = '09:00',
      dailyEndTime = '20:00',
      optimizeVenues = true
    } = req.body;
    
    // Validate tournament
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Get matches that need scheduling
    const matchesResult = await pool.query(`
      SELECT m.*, 
             ht.team_name as home_team_name,
             at.team_name as away_team_name
      FROM matches m
      LEFT JOIN tournament_teams htt ON m.home_team_id = htt.id
      LEFT JOIN teams ht ON htt.team_id = ht.id
      LEFT JOIN tournament_teams att ON m.away_team_id = att.id
      LEFT JOIN teams at ON att.team_id = at.id
      WHERE m.tournament_id = $1 AND m.scheduled_at IS NULL
      ORDER BY m.round, m.id
    `, [tournamentId]);
    
    const matches = matchesResult.rows;
    
    if (matches.length === 0) {
  return sendResponse(res, { success: false, status: 400, message: 'No matches found to schedule' });
    }
    
    // Generate optimized schedule
    const schedule = await generateOptimizedSchedule(matches, {
      venues,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      matchDuration,
      breakDuration,
      dailyStartTime,
      dailyEndTime,
      optimizeVenues
    });
    
    // Update matches with schedule
    for (const scheduledMatch of schedule) {
      await pool.query(`
        UPDATE matches 
        SET scheduled_at = $1, venue = $2, updated_at = NOW()
        WHERE id = $3
      `, [
        scheduledMatch.scheduledAt,
        scheduledMatch.venue,
        scheduledMatch.matchId
      ]);
    }
    
    // Update tournament status
    await pool.query(`
      UPDATE tournaments 
      SET status = 'scheduled', updated_at = NOW()
      WHERE id = $1
    `, [tournamentId]);
    
    // Log scheduling activity
    await pool.query(
      'INSERT INTO tournament_audit_log (tournament_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [tournamentId, req.user.id, 'matches_scheduled', JSON.stringify({
        matchesCount: matches.length,
        venuesCount: venues.length,
        dateRange: { startDate, endDate }
      })]
    );
    
    logPerformanceMetric('schedule_matches_advanced', Date.now() - startTime, {
      tournamentId,
      matchesCount: matches.length,
      venuesCount: venues.length
    });
    
  return sendResponse(res, { data: {
      tournamentId,
      matchesScheduled: schedule.length,
      schedule: schedule
  }, message: 'Matches scheduled successfully' });
    
  } catch (error) {
    console.error('Error scheduling matches:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to schedule matches' });
  }
};

/**
 * Get detailed match schedule with analytics
 */
const getMatchScheduleDetailed = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tournamentId } = req.params;
    const { includeAnalytics = false } = req.query;
    
    // Get match schedule with team details
    const matchesResult = await pool.query(`
      SELECT 
        m.*,
        ht.team_name as home_team_name,
        hs.name as home_school_name,
        at.team_name as away_team_name,
        as_.name as away_school_name,
        t.name as tournament_name,
        t.format as tournament_format
      FROM matches m
      LEFT JOIN tournament_teams htt ON m.home_team_id = htt.id
      LEFT JOIN teams ht ON htt.team_id = ht.id
      LEFT JOIN schools hs ON ht.school_id = hs.id
      LEFT JOIN tournament_teams att ON m.away_team_id = att.id
      LEFT JOIN teams at ON att.team_id = at.id
      LEFT JOIN schools as_ ON at.school_id = as_.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE m.tournament_id = $1
      ORDER BY m.scheduled_at NULLS LAST, m.round, m.id
    `, [tournamentId]);
    
    const matches = matchesResult.rows;
    
    // Group matches by date and venue
    const schedule = {};
    const analytics = {
      totalMatches: matches.length,
      scheduledMatches: matches.filter(m => m.scheduled_at).length,
      unscheduledMatches: matches.filter(m => !m.scheduled_at).length,
      venues: [...new Set(matches.map(m => m.venue).filter(v => v))],
      dateRange: {
        start: null,
        end: null
      }
    };
    
    matches.forEach(match => {
      if (match.scheduled_at) {
        const date = match.scheduled_at.toISOString().split('T')[0];
        const venue = match.venue || 'TBD';
        
        if (!schedule[date]) {
          schedule[date] = {};
        }
        if (!schedule[date][venue]) {
          schedule[date][venue] = [];
        }
        
        schedule[date][venue].push(match);
        
        // Update date range
        if (!analytics.dateRange.start || match.scheduled_at < analytics.dateRange.start) {
          analytics.dateRange.start = match.scheduled_at;
        }
        if (!analytics.dateRange.end || match.scheduled_at > analytics.dateRange.end) {
          analytics.dateRange.end = match.scheduled_at;
        }
      }
    });
    
    // Calculate venue utilization if analytics requested
    if (includeAnalytics === 'true') {
      analytics.venueUtilization = {};
      analytics.venues.forEach(venue => {
        const venueMatches = matches.filter(m => m.venue === venue);
        analytics.venueUtilization[venue] = {
          totalMatches: venueMatches.length,
          scheduledMatches: venueMatches.filter(m => m.scheduled_at).length,
          utilizationRate: venueMatches.length > 0 ? 
            (venueMatches.filter(m => m.scheduled_at).length / venueMatches.length) * 100 : 0
        };
      });
    }
    
    logPerformanceMetric('get_match_schedule_detailed', Date.now() - startTime, {
      tournamentId,
      matchesCount: matches.length
    });
    
    const responseData = {
      schedule,
      matches,
      tournamentId
    };
    
    if (includeAnalytics === 'true') {
      responseData.analytics = analytics;
    }
    
  return sendResponse(res, { data: responseData });
    
  } catch (error) {
  console.error('Error getting detailed match schedule:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to get match schedule' });
  }
};

/**
 * Comprehensive tournament validation with detailed checks
 */
const validateTournamentSetup = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tournamentId } = req.params;
    
    // Get tournament details
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }
    
    const tournament = tournamentResult.rows[0];
    
    const validationResults = {
      tournamentId,
      tournamentName: tournament.name,
      status: tournament.status,
      checks: [],
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: []
    };
    
    // Check 1: Tournament basic information
    const basicInfoCheck = await validateBasicInfo(tournament);
    validationResults.checks.push(basicInfoCheck);
    if (!basicInfoCheck.passed) {
      validationResults.isValid = false;
      validationResults.errors.push(...basicInfoCheck.errors);
    }
    
    // Check 2: Team registration status
    const registrationResult = await pool.query(`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as confirmed_teams
      FROM tournament_teams WHERE tournament_id = $1
    `, [tournamentId]);
    
    const registrationCheck = await validateRegistration(
      parseInt(registrationResult.rows[0].confirmed_teams),
      tournament.min_teams,
      tournament.max_teams
    );
    validationResults.checks.push(registrationCheck);
    if (!registrationCheck.passed) {
      validationResults.isValid = false;
      validationResults.errors.push(...registrationCheck.errors);
    }
    
    // Check 3: Bracket/Matches generation
    const bracketResult = await pool.query(
      'SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    
    const bracketCheck = await validateBracket(parseInt(bracketResult.rows[0].count));
    validationResults.checks.push(bracketCheck);
    if (!bracketCheck.passed) {
      validationResults.isValid = false;
      validationResults.errors.push(...bracketCheck.errors);
    }
    
    // Check 4: Match scheduling
    const schedulingResult = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN scheduled_at IS NOT NULL THEN 1 END) as scheduled_matches
      FROM matches WHERE tournament_id = $1
    `, [tournamentId]);
    
    const schedulingCheck = await validateScheduling(
      parseInt(schedulingResult.rows[0].total_matches),
      parseInt(schedulingResult.rows[0].scheduled_matches)
    );
    validationResults.checks.push(schedulingCheck);
    if (!schedulingCheck.passed) {
      validationResults.warnings.push(...schedulingCheck.warnings);
    }
    
    // Check 5: Venue allocation
    const venueResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT venue) as venue_count,
        COUNT(CASE WHEN venue IS NULL THEN 1 END) as unassigned_venues
      FROM matches WHERE tournament_id = $1
    `, [tournamentId]);
    
    const venueCheck = await validateVenues(
      parseInt(venueResult.rows[0].venue_count),
      parseInt(venueResult.rows[0].unassigned_venues)
    );
    validationResults.checks.push(venueCheck);
    if (!venueCheck.passed) {
      validationResults.warnings.push(...venueCheck.warnings);
    }
    
    // Check 6: Player eligibility (if applicable)
    const playerResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT tp.player_id) as total_players,
        COUNT(CASE WHEN p.registration_status = 'approved' THEN 1 END) as approved_players
      FROM tournament_players tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_team_id IN (
        SELECT id FROM tournament_teams WHERE tournament_id = $1
      )
    `, [tournamentId]);
    
    if (playerResult.rows[0] && parseInt(playerResult.rows[0].total_players) > 0) {
      const playerCheck = await validatePlayers(
        parseInt(playerResult.rows[0].total_players),
        parseInt(playerResult.rows[0].approved_players)
      );
      validationResults.checks.push(playerCheck);
      if (!playerCheck.passed) {
        validationResults.warnings.push(...playerCheck.warnings);
      }
    }
    
    // Generate recommendations
    if (validationResults.warnings.length > 0) {
      validationResults.recommendations.push(
        'Consider addressing the warnings before starting the tournament'
      );
    }
    
    if (tournament.status === 'draft') {
      validationResults.recommendations.push(
        'Tournament is in draft status. Consider publishing when ready.'
      );
    }
    
    logPerformanceMetric('validate_tournament_setup', Date.now() - startTime, {
      tournamentId,
      isValid: validationResults.isValid,
      checksCount: validationResults.checks.length
    });
    
  return sendResponse(res, { data: validationResults });
    
  } catch (error) {
  console.error('Error validating tournament setup:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to validate tournament setup' });
  }
};

/**
 * Generate pre-tournament analytics report
 */
const generatePreTournamentReport = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { tournamentId } = req.params;
    
    // Get tournament details
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Get team statistics
    const teamStats = await pool.query(`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as confirmed_teams,
        COUNT(CASE WHEN registration_status = 'pending' THEN 1 END) as pending_teams
      FROM tournament_teams WHERE tournament_id = $1
    `, [tournamentId]);
    
    // Get match statistics
    const matchStats = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN scheduled_at IS NOT NULL THEN 1 END) as scheduled_matches,
        COUNT(DISTINCT venue) as unique_venues,
        MIN(scheduled_at) as first_match,
        MAX(scheduled_at) as last_match
      FROM matches WHERE tournament_id = $1
    `, [tournamentId]);
    
    // Get player statistics
    const playerStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT tp.player_id) as total_players,
        COUNT(CASE WHEN p.registration_status = 'approved' THEN 1 END) as approved_players,
        COUNT(CASE WHEN p.gender = 'Male' THEN 1 END) as male_players,
        COUNT(CASE WHEN p.gender = 'Female' THEN 1 END) as female_players,
        ROUND(AVG(EXTRACT(YEARS FROM AGE(p.date_of_birth)))) as avg_age
      FROM tournament_players tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_team_id IN (
        SELECT id FROM tournament_teams WHERE tournament_id = $1
      )
    `, [tournamentId]);
    
    // Get venue utilization
    const venueStats = await pool.query(`
      SELECT 
        venue,
        COUNT(*) as match_count,
        MIN(scheduled_at) as first_match,
        MAX(scheduled_at) as last_match
      FROM matches 
      WHERE tournament_id = $1 AND venue IS NOT NULL
      GROUP BY venue
      ORDER BY match_count DESC
    `, [tournamentId]);
    
    const report = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        tournament_code: tournament.tournament_code,
        status: tournament.status,
        format: tournament.format,
        sport: tournament.sport,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        location: tournament.location
      },
      statistics: {
        teams: teamStats.rows[0],
        matches: matchStats.rows[0],
        players: playerStats.rows[0],
        venues: venueStats.rows
      },
      readiness: {
        teamsReady: parseInt(teamStats.rows[0].confirmed_teams) >= (tournament.min_teams || 2),
        matchesGenerated: parseInt(matchStats.rows[0].total_matches) > 0,
        matchesScheduled: parseInt(matchStats.rows[0].scheduled_matches) === parseInt(matchStats.rows[0].total_matches),
        venuesAssigned: parseInt(matchStats.rows[0].unique_venues) > 0
      },
      generatedAt: new Date().toISOString(),
      reportId: uuidv4()
    };
    
    // Calculate overall readiness score
    const readinessChecks = Object.values(report.readiness);
    const readinessScore = (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100;
    report.readiness.overallScore = Math.round(readinessScore);
    
    logPerformanceMetric('generate_pre_tournament_report', Date.now() - startTime, {
      tournamentId,
      readinessScore
    });
    
  return sendResponse(res, { data: report });
    
  } catch (error) {
  console.error('Error generating pre-tournament report:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate pre-tournament report' });
  }
};

// Helper functions

async function generateOptimizedSchedule(matches, config) {
  const { venues, startDate, endDate, matchDuration, breakDuration, dailyStartTime, dailyEndTime } = config;
  
  const schedule = [];
  const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
  const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
  
  let currentDate = new Date(startDate);
  let currentVenueIndex = 0;
  
  for (const match of matches) {
    // Find next available time slot
    let currentTime = new Date(currentDate);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    // Check if we need to move to next day
    const endTime = new Date(currentTime);
    endTime.setMinutes(endTime.getMinutes() + matchDuration);
    
    if (endTime.getHours() > endHour || 
        (endTime.getHours() === endHour && endTime.getMinutes() > endMinute)) {
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentTime = new Date(currentDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
    }
    
    const venue = venues.length > 0 ? venues[currentVenueIndex] : 'Main Arena';
    
    schedule.push({
      matchId: match.id,
      scheduledAt: new Date(currentTime),
      venue
    });
    
    // Move to next venue
    currentVenueIndex = (currentVenueIndex + 1) % Math.max(venues.length, 1);
    
    // Update current time for next match
    currentTime.setMinutes(currentTime.getMinutes() + matchDuration + breakDuration);
  }
  
  return schedule;
}

// Validation helper functions

async function validateBasicInfo(tournament) {
  const errors = [];
  
  if (!tournament.name || tournament.name.trim() === '') {
    errors.push('Tournament name is required');
  }
  
  if (!tournament.sport) {
    errors.push('Tournament sport is required');
  }
  
  if (!tournament.format) {
    errors.push('Tournament format is required');
  }
  
  if (!tournament.start_date) {
    errors.push('Tournament start date is required');
  }
  
  if (!tournament.end_date) {
    errors.push('Tournament end date is required');
  }
  
  if (tournament.start_date && tournament.end_date) {
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    
    if (startDate >= endDate) {
      errors.push('Tournament end date must be after start date');
    }
  }
  
  return {
    check: 'Basic Information',
    passed: errors.length === 0,
    errors
  };
}

async function validateRegistration(confirmedTeams, minTeams, maxTeams) {
  const errors = [];
  
  if (confirmedTeams < 2) {
    errors.push('At least 2 teams must be registered');
  }
  
  if (minTeams && confirmedTeams < minTeams) {
    errors.push(`Minimum ${minTeams} teams required, only ${confirmedTeams} registered`);
  }
  
  if (maxTeams && confirmedTeams > maxTeams) {
    errors.push(`Maximum ${maxTeams} teams allowed, ${confirmedTeams} registered`);
  }
  
  return {
    check: 'Team Registration',
    passed: errors.length === 0,
    errors,
    teamsCount: confirmedTeams
  };
}

async function validateBracket(matchCount) {
  const errors = [];
  
  if (matchCount === 0) {
    errors.push('Tournament bracket has not been generated');
  }
  
  return {
    check: 'Bracket Generation',
    passed: errors.length === 0,
    errors,
    matchCount
  };
}

async function validateScheduling(totalMatches, scheduledMatches) {
  const warnings = [];
  
  if (scheduledMatches === 0) {
    warnings.push('No matches have been scheduled');
  } else if (scheduledMatches < totalMatches) {
    warnings.push(`Only ${scheduledMatches} out of ${totalMatches} matches are scheduled`);
  }
  
  return {
    check: 'Match Scheduling',
    passed: scheduledMatches === totalMatches,
    warnings,
    totalMatches,
    scheduledMatches
  };
}

async function validateVenues(venueCount, unassignedVenues) {
  const warnings = [];
  
  if (venueCount === 0) {
    warnings.push('No venues assigned to matches');
  }
  
  if (unassignedVenues > 0) {
    warnings.push(`${unassignedVenues} matches have no venue assigned`);
  }
  
  return {
    check: 'Venue Allocation',
    passed: venueCount > 0 && unassignedVenues === 0,
    warnings,
    venueCount,
    unassignedVenues
  };
}

async function validatePlayers(totalPlayers, approvedPlayers) {
  const warnings = [];
  
  if (totalPlayers === 0) {
    warnings.push('No players registered for tournament');
  }
  
  if (approvedPlayers < totalPlayers) {
    warnings.push(`${totalPlayers - approvedPlayers} players are not yet approved`);
  }
  
  return {
    check: 'Player Eligibility',
    passed: approvedPlayers === totalPlayers,
    warnings,
    totalPlayers,
    approvedPlayers
  };
}

module.exports = {
  customizeBracketSeeding,
  scheduleMatchesAdvanced,
  getMatchScheduleDetailed,
  validateTournamentSetup,
  generatePreTournamentReport
};
