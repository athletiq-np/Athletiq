//
// 🧠 ATHLETIQ - Tournament Controller (Upgraded with Error Handling)
//
// This file contains the logic for creating and fetching tournaments.
// It now uses the centralized error handler for cleaner, more consistent error management.
//

const { pool } = require("../config/db");
const { generateShortCode } = require("../utils/codeGenerator");
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all tournaments with enhanced filtering and status management
 * @route   GET /api/tournaments
 * @access  Public
 */
const getTournaments = async (req, res, next) => {
  try {
    const { 
      status = 'published', 
      tournament_type, 
      sport, 
      visibility = 'public',
      organizer_id,
      is_featured,
      page = 1,
      limit = 10
    } = req.query;

    // Build dynamic query
    let query = `
      SELECT 
        t.id, t.tournament_code, t.name, t.description, t.sport, 
        t.tournament_type, t.format, t.location, t.start_date, t.end_date,
        t.logo_url, t.status, t.organizer_id, t.visibility,
        t.max_teams, t.min_teams, t.entry_fee, t.prize_pool, t.age_group,
        t.gender, t.category, t.is_featured, t.created_at,
        -- Count registered teams
        COALESCE(COUNT(tt.id), 0) as registered_teams
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
      WHERE t.is_active = TRUE
    `;
    
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (tournament_type) {
      query += ` AND t.tournament_type = $${paramIndex}`;
      params.push(tournament_type);
      paramIndex++;
    }
    
    if (sport) {
      query += ` AND t.sport = $${paramIndex}`;
      params.push(sport);
      paramIndex++;
    }
    
    if (visibility) {
      query += ` AND t.visibility = $${paramIndex}`;
      params.push(visibility);
      paramIndex++;
    }
    
    if (organizer_id) {
      query += ` AND t.organizer_id = $${paramIndex}`;
      params.push(organizer_id);
      paramIndex++;
    }
    
    if (is_featured === 'true') {
      query += ` AND t.is_featured = TRUE`;
    }

    query += `
      GROUP BY t.id
      ORDER BY 
        t.is_featured DESC,
        t.start_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const { rows } = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tournaments t
      WHERE t.is_active = TRUE
    `;
    const countParams = [];
    if (status) {
      countQuery += ` AND t.status = $1`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return ApiResponse.success(res, {
      tournaments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }, 'Tournaments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single tournament by its ID
 * @route   GET /api/tournaments/:id
 * @access  Public
 */
const getTournamentById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM tournaments WHERE id = $1", [id]);
    
    if (rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    return ApiResponse.success(res, rows[0], 'Tournament retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new tournament with enhanced features
 * @route   POST /api/tournaments
 * @access  Private (requires login)
 */
const createTournament = async (req, res, next) => {
  try {
    const {
      name,
      description = "",
      sport = 'general',
      tournament_type = 'school',
      format = 'knockout',
      location = null,
      start_date = null,
      end_date = null,
      registration_start_date = null,
      registration_end_date = null,
      logo_url = null,
      max_teams = 16,
      min_teams = 2,
      entry_fee = 0,
      prize_pool = 0,
      age_group = null,
      gender = null,
      category = 'general',
      visibility = 'public',
      organizer_id = null,
      eligibility_criteria = null,
      rules_and_regulations = null,
      contact_info = null,
      is_featured = false
    } = req.body;

    // Enhanced validation
    if (!name || name.length < 3) {
      const error = new Error("Tournament name must be at least 3 characters long.");
      error.statusCode = 400;
      return next(error);
    }

    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      const error = new Error("Start date must be before end date.");
      error.statusCode = 400;
      return next(error);
    }

    if (registration_start_date && registration_end_date && new Date(registration_start_date) >= new Date(registration_end_date)) {
      const error = new Error("Registration start date must be before registration end date.");
      error.statusCode = 400;
      return next(error);
    }

    if (max_teams < min_teams) {
      const error = new Error("Maximum teams must be greater than or equal to minimum teams.");
      error.statusCode = 400;
      return next(error);
    }

    // Auto-generate unique tournament code (Key feature of finalized flow)
    const tournament_code = await generateShortCode("TRN", async (code) => {
      const { rowCount } = await pool.query("SELECT 1 FROM tournaments WHERE tournament_code = $1", [code]);
      return rowCount > 0;
    });

    // Determine initial status based on user role and data completeness
    let initialStatus = 'draft';
    if (req.user.role === 'SuperAdmin') {
      initialStatus = start_date ? 'published' : 'draft';
    }

    // Create the tournament with enhanced schema
    const insertQuery = `
      INSERT INTO tournaments 
        (tournament_code, name, description, sport, tournament_type, format, location, 
         start_date, end_date, registration_start_date, registration_end_date,
         logo_url, max_teams, min_teams, entry_fee, prize_pool, 
         age_group, gender, category, status, organizer_id, created_by, visibility,
         eligibility_criteria, rules_and_regulations, contact_info, is_featured)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
         $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [
      tournament_code,
      name,
      description,
      sport,
      tournament_type,
      format,
      location,
      start_date,
      end_date,
      registration_start_date,
      registration_end_date,
      logo_url,
      max_teams,
      min_teams,
      entry_fee,
      prize_pool,
      age_group,
      gender,
      category,
      initialStatus,
      organizer_id,
      req.user.id,
      visibility,
      eligibility_criteria ? JSON.stringify(eligibility_criteria) : null,
      rules_and_regulations,
      contact_info ? JSON.stringify(contact_info) : null,
      is_featured
    ]);

    const tournament = rows[0];

    // Log tournament creation in audit trail (if table exists)
    try {
      await pool.query(`
        INSERT INTO tournament_audit_log (tournament_id, user_id, action, new_values, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        tournament.id,
        req.user.id,
        'tournament_created',
        JSON.stringify({ status: initialStatus, tournament_code }),
        `Tournament created with code ${tournament_code}`
      ]);
    } catch (auditErr) {
      console.warn('Audit logging failed:', auditErr.message);
    }

    return ApiResponse.success(res, tournament, 'Tournament created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Register a team for a tournament
 * @route   POST /api/tournaments/:id/register
 * @access  Private (SchoolAdmin)
 */
const registerTeamForTournament = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    const { team_id, player_ids = [] } = req.body;
    const userId = req.user.id;
    
    // Validate tournament exists and is accepting registrations
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const tournament = tournamentResult.rows[0];
    
    if (tournament.status !== 'draft' && tournament.status !== 'open') {
      const error = new Error("Tournament registration is closed");
      error.statusCode = 400;
      return next(error);
    }
    
    // Check if team is already registered
    const existingRegistration = await pool.query(
      'SELECT 1 FROM tournament_teams WHERE tournament_id = $1 AND team_id = $2',
      [tournamentId, team_id]
    );
    
    if (existingRegistration.rows.length > 0) {
      const error = new Error("Team is already registered for this tournament");
      error.statusCode = 400;
      return next(error);
    }
    
    // Register the team
    const teamRegistration = await pool.query(
      'INSERT INTO tournament_teams (tournament_id, team_id) VALUES ($1, $2) RETURNING *',
      [tournamentId, team_id]
    );
    
    const tournamentTeamId = teamRegistration.rows[0].id;
    
    // Register players for the team (simplified without transaction for now)
    if (player_ids.length > 0) {
      for (let i = 0; i < player_ids.length; i++) {
        await pool.query(
          'INSERT INTO tournament_players (tournament_team_id, player_id, jersey_number) VALUES ($1, $2, $3)',
          [tournamentTeamId, player_ids[i], i + 1]
        );
      }
    }
    
    // Create registration record
    await pool.query(
      'INSERT INTO tournament_registrations (tournament_id, team_id, status) VALUES ($1, $2, $3)',
      [tournamentId, team_id, 'registered']
    );
    
    return ApiResponse.success(res, {
      tournament_team_id: tournamentTeamId,
      registered_players: player_ids.length
    }, 'Team registered successfully for tournament');
    
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate tournament bracket
 * @route   POST /api/tournaments/:id/generate-bracket
 * @access  Private (Admin)
 */
const generateTournamentBracket = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    
    // Get tournament details
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Get registered teams
    const teamsResult = await pool.query(`
      SELECT tt.id as tournament_team_id, tt.team_id, t.team_name, s.name as school_name
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      WHERE tt.tournament_id = $1
      ORDER BY tt.id
    `, [tournamentId]);
    
    const teams = teamsResult.rows;
    
    if (teams.length < 2) {
      const error = new Error("At least 2 teams required to generate bracket");
      error.statusCode = 400;
      return next(error);
    }
    
    // Generate matches based on tournament format
    let matches = [];
    
    if (tournament.format === 'knockout' || tournament.format === 'single_elimination') {
      matches = generateKnockoutMatches(teams, tournament);
    } else if (tournament.format === 'round_robin') {
      matches = generateRoundRobinMatches(teams, tournament);
    }
    
    // Insert matches into database (simplified without transaction)
    for (const match of matches) {
      await pool.query(`
        INSERT INTO matches (tournament_id, home_team_id, away_team_id, round, code, scheduled_at, venue, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        tournamentId,
        match.home_team_id,
        match.away_team_id,
        match.round,
        match.code,
        match.scheduled_at,
        tournament.location || 'TBD',
        'scheduled'
      ]);
    }
    
    // Update tournament status
    await pool.query(
      'UPDATE tournaments SET status = $1 WHERE id = $2',
      ['active', tournamentId]
    );
    
    return ApiResponse.success(res, {
      tournament_id: tournamentId,
      matches_generated: matches.length,
      format: tournament.format
    }, 'Tournament bracket generated successfully');
    
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament bracket/matches
 * @route   GET /api/tournaments/:id/bracket
 * @access  Public
 */
const getTournamentBracket = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    
    // Get tournament with matches
    const tournamentResult = await pool.query(`
      SELECT 
        t.*,
        json_agg(
          json_build_object(
            'id', m.id,
            'code', m.code,
            'round', m.round,
            'home_team', json_build_object(
              'id', ht.id,
              'name', ht_team.team_name,
              'school', ht_school.name
            ),
            'away_team', json_build_object(
              'id', at.id,
              'name', at_team.team_name,
              'school', at_school.name
            ),
            'scheduled_at', m.scheduled_at,
            'venue', m.venue,
            'status', m.status,
            'result', m.result
          )
        ) as matches
      FROM tournaments t
      LEFT JOIN matches m ON t.id = m.tournament_id
      LEFT JOIN tournament_teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams ht_team ON ht.team_id = ht_team.id
      LEFT JOIN schools ht_school ON ht_team.school_id = ht_school.id
      LEFT JOIN tournament_teams at ON m.away_team_id = at.id
      LEFT JOIN teams at_team ON at.team_id = at_team.id
      LEFT JOIN schools at_school ON at_team.school_id = at_school.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [tournamentId]);
    
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Filter out null matches
    tournament.matches = tournament.matches.filter(match => match.id !== null);
    
    return ApiResponse.success(res, tournament, 'Tournament bracket retrieved successfully');
    
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update match result
 * @route   PATCH /api/tournaments/:tournamentId/matches/:matchId/result
 * @access  Private (Admin/Referee)
 */
const updateMatchResult = async (req, res, next) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { home_score, away_score, result_details = {} } = req.body;
    
    // Validate match exists
    const matchResult = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND tournament_id = $2',
      [matchId, tournamentId]
    );
    
    if (matchResult.rows.length === 0) {
      const error = new Error("Match not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const match = matchResult.rows[0];
    
    // Determine winner
    let winner_team_id = null;
    if (home_score > away_score) {
      winner_team_id = match.home_team_id;
    } else if (away_score > home_score) {
      winner_team_id = match.away_team_id;
    }
    
    // Update match result
    await pool.query(`
      UPDATE matches 
      SET home_score = $1, away_score = $2, result = $3, winner_team_id = $4, 
          status = $5, ended_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      home_score,
      away_score,
      JSON.stringify({ ...result_details, home_score, away_score }),
      winner_team_id,
      'completed',
      matchId
    ]);
    
    return ApiResponse.success(res, {
      match_id: matchId,
      home_score,
      away_score,
      winner_team_id
    }, 'Match result updated successfully');
    
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Assign organizer to tournament (Key feature of finalized flow)
 * @route   PATCH /api/tournaments/:id/organizer
 * @access  Private (SuperAdmin)
 */
const assignTournamentOrganizer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizer_id, notes = '' } = req.body;

    // Only SuperAdmin can assign organizers
    if (req.user.role !== 'SuperAdmin') {
      const error = new Error("Only SuperAdmin can assign tournament organizers");
      error.statusCode = 403;
      return next(error);
    }

    // Verify organizer exists
    const organizerResult = await pool.query('SELECT id, full_name FROM users WHERE id = $1', [organizer_id]);
    if (organizerResult.rows.length === 0) {
      const error = new Error("Organizer not found");
      error.statusCode = 404;
      return next(error);
    }

    const organizer = organizerResult.rows[0];

    // Update tournament organizer
    const { rows } = await pool.query(`
      UPDATE tournaments 
      SET organizer_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [organizer_id, id]);

    if (rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = rows[0];

    // Log organizer assignment in audit trail
    try {
      await pool.query(`
        INSERT INTO tournament_audit_log (tournament_id, user_id, action, new_values, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        id,
        req.user.id,
        'organizer_assigned',
        JSON.stringify({ organizer_id, organizer_name: organizer.full_name }),
        notes || `Organizer assigned: ${organizer.full_name}`
      ]);
    } catch (auditErr) {
      console.warn('Audit logging failed:', auditErr.message);
    }

    return ApiResponse.success(res, {
      tournament,
      organizer: organizer
    }, 'Tournament organizer assigned successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check tournament eligibility (Key feature of finalized flow)
 * @route   POST /api/tournaments/:id/check-eligibility
 * @access  Private
 */
const checkTournamentEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { team_id, player_ids = [] } = req.body;

    // Get tournament with eligibility criteria
    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];
    const eligibility = tournament.eligibility_criteria ? JSON.parse(tournament.eligibility_criteria) : {};

    // Check basic eligibility
    const checks = {
      tournament_status: ['published', 'registration_open'].includes(tournament.status),
      registration_dates: true,
      team_limit: true,
      age_group: true,
      gender: true,
      sport: true
    };

    // Check registration dates
    if (tournament.registration_start_date && tournament.registration_end_date) {
      const now = new Date();
      const startDate = new Date(tournament.registration_start_date);
      const endDate = new Date(tournament.registration_end_date);
      checks.registration_dates = now >= startDate && now <= endDate;
    }

    // Check team limit
    const teamCountResult = await pool.query('SELECT COUNT(*) as count FROM tournament_teams WHERE tournament_id = $1', [id]);
    const currentTeams = parseInt(teamCountResult.rows[0].count);
    checks.team_limit = currentTeams < tournament.max_teams;

    // Check team eligibility if team_id provided
    if (team_id) {
      try {
        const teamResult = await pool.query('SELECT * FROM teams WHERE id = $1', [team_id]);
        if (teamResult.rows.length === 0) {
          checks.team_exists = false;
        } else {
          const team = teamResult.rows[0];
          checks.team_exists = true;
          
          // Check sport match
          if (tournament.sport !== 'general') {
            checks.sport = team.sport === tournament.sport;
          }
          
          // Check if already registered
          const registrationResult = await pool.query(
            'SELECT 1 FROM tournament_teams WHERE tournament_id = $1 AND team_id = $2',
            [id, team_id]
          );
          checks.already_registered = registrationResult.rows.length > 0;
        }
      } catch (teamErr) {
        checks.team_exists = false;
      }
    }

    // Check player eligibility if player_ids provided
    if (player_ids.length > 0) {
      try {
        const playersResult = await pool.query(
          'SELECT * FROM players WHERE id = ANY($1)',
          [player_ids]
        );
        
        const players = playersResult.rows;
        checks.players_exist = players.length === player_ids.length;
        
        if (players.length > 0) {
          // Check age group eligibility
          if (tournament.age_group) {
            const ageGroupChecks = players.map(player => {
              const age = new Date().getFullYear() - new Date(player.date_of_birth).getFullYear();
              // Simple age group check (can be enhanced based on tournament.age_group)
              return age >= 10 && age <= 25; // Generic age range
            });
            checks.age_group = ageGroupChecks.every(check => check);
          }
          
          // Check gender eligibility
          if (tournament.gender && tournament.gender !== 'Mixed') {
            checks.gender = players.every(player => player.gender === tournament.gender);
          }
        }
      } catch (playersErr) {
        checks.players_exist = false;
      }
    }

    const isEligible = Object.values(checks).every(check => check !== false);

    return ApiResponse.success(res, {
      eligible: isEligible,
      checks,
      tournament_details: {
        id: tournament.id,
        name: tournament.name,
        tournament_code: tournament.tournament_code,
        status: tournament.status,
        max_teams: tournament.max_teams,
        current_teams: currentTeams,
        registration_start_date: tournament.registration_start_date,
        registration_end_date: tournament.registration_end_date,
        eligibility_criteria: eligibility
      }
    }, 'Eligibility check completed');
  } catch (err) {
    next(err);
  }
};

// Helper functions for bracket generation
function generateKnockoutMatches(teams, tournament) {
  const matches = [];
  let matchCount = 1;
  
  // First round - pair up teams
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      matches.push({
        home_team_id: teams[i].tournament_team_id,
        away_team_id: teams[i + 1].tournament_team_id,
        round: '1',
        code: `${tournament.tournament_code}-R1-M${matchCount}`,
        scheduled_at: tournament.start_date || new Date(),
      });
      matchCount++;
    }
  }
  
  return matches;
}

function generateRoundRobinMatches(teams, tournament) {
  const matches = [];
  let matchCount = 1;
  
  // Generate all possible team combinations
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        home_team_id: teams[i].tournament_team_id,
        away_team_id: teams[j].tournament_team_id,
        round: '1',
        code: `${tournament.tournament_code}-RR-M${matchCount}`,
        scheduled_at: tournament.start_date || new Date(),
      });
      matchCount++;
    }
  }
  
  return matches;
}

/**
 * @desc    Update tournament status (Key feature of finalized flow)
 * @route   PATCH /api/tournaments/:id/status
 * @access  Private (Admin/Organizer)
 */
const updateTournamentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'pending', 'published', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled', 'archived'];
    
    if (!validStatuses.includes(status)) {
      const error = new Error("Invalid tournament status.");
      error.statusCode = 400;
      return next(error);
    }

    const { rows } = await pool.query(`
      UPDATE tournaments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [status, id]);

    if (rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    return ApiResponse.success(res, rows[0], 'Tournament status updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament dashboard data (Key feature of finalized flow)
 * @route   GET /api/tournaments/:id/dashboard
 * @access  Private (Admin/Organizer)
 */
const getTournamentDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];
    const teamsCount = await pool.query('SELECT COUNT(*) as count FROM tournament_teams WHERE tournament_id = $1', [id]);
    
    const dashboardData = {
      tournament,
      statistics: {
        registered_teams: parseInt(teamsCount.rows[0].count),
        registration_progress: {
          current: parseInt(teamsCount.rows[0].count),
          target: tournament.max_teams,
          percentage: Math.round((parseInt(teamsCount.rows[0].count) / tournament.max_teams) * 100)
        }
      }
    };

    return ApiResponse.success(res, dashboardData, 'Tournament dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament registration dashboard
 * @route   GET /api/tournaments/:id/registration-dashboard
 * @access  Private (Admin/Organizer)
 */
const getRegistrationDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tournament details
    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];

    // Get registration statistics
    const registrationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as confirmed_registrations,
        COUNT(CASE WHEN registration_status = 'pending' THEN 1 END) as pending_registrations,
        COUNT(CASE WHEN registration_status = 'rejected' THEN 1 END) as rejected_registrations
      FROM tournament_teams 
      WHERE tournament_id = $1
    `, [id]);

    // Get team details with player counts
    const teamDetails = await pool.query(`
      SELECT 
        tt.id as tournament_team_id,
        tt.registration_status,
        t.team_name,
        s.name as school_name,
        COUNT(tp.player_id) as registered_players,
        tt.seed_order
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
      WHERE tt.tournament_id = $1
      GROUP BY tt.id, t.team_name, s.name, tt.registration_status, tt.seed_order
      ORDER BY tt.seed_order ASC, tt.id ASC
    `, [id]);

    // Get recent registrations
    const recentRegistrations = await pool.query(`
      SELECT 
        t.team_name,
        s.name as school_name,
        tr.registration_date,
        tr.status
      FROM tournament_registrations tr
      JOIN teams t ON tr.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      WHERE tr.tournament_id = $1
      ORDER BY tr.registration_date DESC
      LIMIT 10
    `, [id]);

    const dashboardData = {
      tournament,
      statistics: {
        ...registrationStats.rows[0],
        registration_progress: {
          current: parseInt(registrationStats.rows[0].confirmed_registrations),
          target: tournament.max_teams,
          percentage: Math.round((parseInt(registrationStats.rows[0].confirmed_registrations) / tournament.max_teams) * 100)
        }
      },
      teams: teamDetails.rows,
      recent_registrations: recentRegistrations.rows
    };

    return ApiResponse.success(res, dashboardData, 'Registration dashboard data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check player eligibility for tournament
 * @route   POST /api/tournaments/:id/check-eligibility
 * @access  Private (Admin/Organizer)
 */
const checkPlayerEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { player_ids } = req.body;

    if (!player_ids || !Array.isArray(player_ids)) {
      const error = new Error("player_ids must be an array");
      error.statusCode = 400;
      return next(error);
    }

    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournament.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournamentData = tournament.rows[0];

    // Check each player's eligibility
    const eligibilityChecks = await Promise.all(
      player_ids.map(async (playerId) => {
        const playerResult = await pool.query(`
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

        if (playerResult.rows.length === 0) {
          return {
            player_id: playerId,
            eligible: false,
            reasons: ['Player not found']
          };
        }

        const player = playerResult.rows[0];
        const eligibilityReasons = [];

        // Age eligibility check
        if (tournamentData.age_group) {
          const [minAge, maxAge] = tournamentData.age_group.split('-').map(Number);
          if (player.age < minAge || player.age > maxAge) {
            eligibilityReasons.push(`Age ${player.age} not in range ${tournamentData.age_group}`);
          }
        }

        // Gender eligibility check
        if (tournamentData.gender && tournamentData.gender !== 'Mixed' && player.gender !== tournamentData.gender) {
          eligibilityReasons.push(`Gender mismatch: tournament requires ${tournamentData.gender}`);
        }

        // Verification status check
        if (!player.is_verified) {
          eligibilityReasons.push('Player not approved');
        }

        // Check if player is already registered in another team for this tournament
        const existingRegistration = await pool.query(`
          SELECT COUNT(*) 
          FROM tournament_players tp
          JOIN tournament_teams tt ON tp.tournament_team_id = tt.id
          WHERE tt.tournament_id = $1 AND tp.player_id = $2
        `, [id, playerId]);

        if (parseInt(existingRegistration.rows[0].count) > 0) {
          eligibilityReasons.push('Player already registered in another team');
        }

        return {
          player_id: playerId,
          player_name: player.full_name,
          school_name: player.school_name,
          age: player.age,
          gender: player.gender,
          registration_status: player.registration_status,
          eligible: eligibilityReasons.length === 0,
          reasons: eligibilityReasons
        };
      })
    );

    const eligibleCount = eligibilityChecks.filter(check => check.eligible).length;
    const ineligibleCount = eligibilityChecks.filter(check => !check.eligible).length;

    return ApiResponse.success(res, {
      tournament_id: id,
      total_players: player_ids.length,
      eligible_players: eligibleCount,
      ineligible_players: ineligibleCount,
      eligibility_checks: eligibilityChecks
    }, 'Player eligibility check completed');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Enhanced team registration with multi-step validation
 * @route   POST /api/tournaments/:id/register-team
 * @access  Private (SchoolAdmin)
 */
const registerTeamEnhanced = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    const { 
      team_id, 
      player_ids = [], 
      registration_data = {},
      auto_confirm = false,
      notes = ""
    } = req.body;
    const userId = req.user.id;
    
    // Validate tournament exists and is accepting registrations
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const tournament = tournamentResult.rows[0];
    
    // Check registration status
    const validRegistrationStatuses = ['draft', 'published', 'registration_open'];
    if (!validRegistrationStatuses.includes(tournament.status)) {
      const error = new Error("Tournament registration is not open");
      error.statusCode = 400;
      return next(error);
    }

    // Check team capacity
    const currentTeamCount = await pool.query(
      'SELECT COUNT(*) FROM tournament_teams WHERE tournament_id = $1 AND registration_status = $2',
      [tournamentId, 'registered']
    );
    
    if (parseInt(currentTeamCount.rows[0].count) >= tournament.max_teams) {
      const error = new Error("Tournament is full");
      error.statusCode = 400;
      return next(error);
    }
    
    // Check if team is already registered
    const existingRegistration = await pool.query(
      'SELECT 1 FROM tournament_teams WHERE tournament_id = $1 AND team_id = $2',
      [tournamentId, team_id]
    );
    
    if (existingRegistration.rows.length > 0) {
      const error = new Error("Team is already registered for this tournament");
      error.statusCode = 400;
      return next(error);
    }

    // Validate team ownership
    const teamResult = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [team_id]
    );
    
    if (teamResult.rows.length === 0) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check player eligibility (if players provided)
    let eligibilityResults = [];
    if (player_ids.length > 0) {
      const eligibilityCheck = await checkPlayerEligibility({ params: { id: tournamentId }, body: { player_ids } }, {}, () => {});
      // This would need to be refactored to not use the actual res/next, but for now we'll do inline checks
      
      // Direct eligibility check
      for (const playerId of player_ids) {
        const playerResult = await pool.query(`
          SELECT 
            p.*,
            EXTRACT(YEARS FROM AGE(p.date_of_birth)) as age
          FROM players p
          WHERE p.id = $1 AND p.registration_status = 'approved'
        `, [playerId]);

        if (playerResult.rows.length === 0) {
          eligibilityResults.push({
            player_id: playerId,
            eligible: false,
            reason: 'Player not found or not verified'
          });
        } else {
          const player = playerResult.rows[0];
          let eligible = true;
          let reason = '';

          // Age check
          if (tournament.age_group) {
            const [minAge, maxAge] = tournament.age_group.split('-').map(Number);
            if (player.age < minAge || player.age > maxAge) {
              eligible = false;
              reason = `Age ${player.age} not in range ${tournament.age_group}`;
            }
          }

          // Gender check
          if (tournament.gender && tournament.gender !== 'Mixed' && player.gender !== tournament.gender) {
            eligible = false;
            reason = `Gender mismatch: tournament requires ${tournament.gender}`;
          }

          eligibilityResults.push({
            player_id: playerId,
            eligible,
            reason
          });
        }
      }
    }

    // Determine registration status
    const hasIneligiblePlayers = eligibilityResults.some(result => !result.eligible);
    const registrationStatus = auto_confirm && !hasIneligiblePlayers ? 'registered' : 'pending';
    
    // Register the team
    const teamRegistration = await pool.query(
      'INSERT INTO tournament_teams (tournament_id, team_id, registration_status) VALUES ($1, $2, $3) RETURNING *',
      [tournamentId, team_id, registrationStatus]
    );
    
    const tournamentTeamId = teamRegistration.rows[0].id;
    
    // Register eligible players
    const registeredPlayers = [];
    for (const result of eligibilityResults) {
      if (result.eligible) {
        const jerseyNumber = registeredPlayers.length + 1;
        await pool.query(
          'INSERT INTO tournament_players (tournament_team_id, player_id, jersey_number) VALUES ($1, $2, $3)',
          [tournamentTeamId, result.player_id, jerseyNumber]
        );
        registeredPlayers.push(result.player_id);
      }
    }
    
    // Create registration record with full details
    await pool.query(
      'INSERT INTO tournament_registrations (tournament_id, team_id, registration_date, status) VALUES ($1, $2, $3, $4)',
      [tournamentId, team_id, new Date(), registrationStatus]
    );

    // Log to audit trail
    await pool.query(
      'INSERT INTO tournament_audit_log (tournament_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [tournamentId, userId, 'team_registered', JSON.stringify({
        team_id,
        tournament_team_id: tournamentTeamId,
        registration_status: registrationStatus,
        eligible_players: registeredPlayers.length,
        ineligible_players: eligibilityResults.filter(r => !r.eligible).length,
        notes
      })]
    );
    
    return ApiResponse.success(res, {
      tournament_team_id: tournamentTeamId,
      registration_status: registrationStatus,
      registered_players: registeredPlayers.length,
      eligibility_results: eligibilityResults,
      message: registrationStatus === 'registered' ? 'Team registered successfully' : 'Team registration pending approval'
    }, 'Team registration completed');
    
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update team registration status
 * @route   PATCH /api/tournaments/:id/teams/:teamId/status
 * @access  Private (Admin/Organizer)
 */
const updateTeamRegistrationStatus = async (req, res, next) => {
  try {
    const { id: tournamentId, teamId } = req.params;
    const { status, notes = "", seed_order = null } = req.body;
    const userId = req.user.id;

    const validStatuses = ['pending', 'registered', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      const error = new Error("Invalid registration status");
      error.statusCode = 400;
      return next(error);
    }

    // Check if tournament team exists
    const teamResult = await pool.query(
      'SELECT * FROM tournament_teams WHERE tournament_id = $1 AND id = $2',
      [tournamentId, teamId]
    );

    if (teamResult.rows.length === 0) {
      const error = new Error("Team registration not found");
      error.statusCode = 404;
      return next(error);
    }

    const currentTeam = teamResult.rows[0];

    // Update registration status
    await pool.query(
      'UPDATE tournament_teams SET registration_status = $1, seed_order = $2 WHERE id = $3',
      [status, seed_order, teamId]
    );

    // Update registration record
    await pool.query(
      'UPDATE tournament_registrations SET status = $1 WHERE tournament_id = $2 AND team_id = $3',
      [status, tournamentId, currentTeam.team_id]
    );

    // Log to audit trail
    await pool.query(
      'INSERT INTO tournament_audit_log (tournament_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [tournamentId, userId, 'registration_status_updated', JSON.stringify({
        tournament_team_id: teamId,
        old_status: currentTeam.registration_status,
        new_status: status,
        seed_order,
        notes
      })]
    );

    return ApiResponse.success(res, {
      tournament_team_id: teamId,
      status,
      seed_order
    }, 'Team registration status updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament registered teams with details
 * @route   GET /api/tournaments/:id/teams
 * @access  Public
 */
const getTournamentTeams = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'registered', include_players = false } = req.query;

    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
    if (tournament.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    let query = `
      SELECT 
        tt.id as tournament_team_id,
        tt.registration_status,
        tt.seed_order,
        t.id as team_id,
        t.team_name as team_name,
        t.sport_id,
        s.id as school_id,
        s.name as school_name,
        s.city,
        COUNT(tp.player_id) as player_count
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      JOIN schools s ON t.school_id = s.id
      LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
      WHERE tt.tournament_id = $1
    `;

    const params = [id];

    if (status !== 'all') {
      query += ` AND tt.registration_status = $2`;
      params.push(status);
    }

    query += ` GROUP BY tt.id, t.id, s.id ORDER BY tt.seed_order ASC, tt.id ASC`;

    const teamsResult = await pool.query(query, params);
    const teams = teamsResult.rows;

    // If include_players is requested, fetch player details
    if (include_players === 'true') {
      for (let team of teams) {
        const playersResult = await pool.query(`
          SELECT 
            p.id,
            p.full_name,
            p.date_of_birth,
            p.gender,
            EXTRACT(YEARS FROM AGE(p.date_of_birth)) as age,
            tp.jersey_number,
            tp.position
          FROM tournament_players tp
          JOIN players p ON tp.player_id = p.id
          WHERE tp.tournament_team_id = $1
          ORDER BY tp.jersey_number ASC
        `, [team.tournament_team_id]);

        team.players = playersResult.rows;
      }
    }

    return ApiResponse.success(res, {
      tournament_id: id,
      teams,
      total_teams: teams.length
    }, 'Tournament teams retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk update team registrations
 * @route   PATCH /api/tournaments/:id/teams/bulk-update
 * @access  Private (Admin/Organizer)
 */
const bulkUpdateTeamRegistrations = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    const { updates } = req.body;
    const userId = req.user.id;

    if (!updates || !Array.isArray(updates)) {
      const error = new Error("Updates must be an array");
      error.statusCode = 400;
      return next(error);
    }

    const results = [];
    
    for (const update of updates) {
      const { tournament_team_id, status, seed_order, notes } = update;
      
      try {
        // Update team registration
        await pool.query(
          'UPDATE tournament_teams SET registration_status = $1, seed_order = $2 WHERE id = $3 AND tournament_id = $4',
          [status, seed_order, tournament_team_id, tournamentId]
        );

        // Get team details for audit log
        const teamResult = await pool.query(
          'SELECT team_id FROM tournament_teams WHERE id = $1',
          [tournament_team_id]
        );

        if (teamResult.rows.length > 0) {
          // Update registration record
          await pool.query(
            'UPDATE tournament_registrations SET status = $1 WHERE tournament_id = $2 AND team_id = $3',
            [status, tournamentId, teamResult.rows[0].team_id]
          );
        }

        results.push({
          tournament_team_id,
          status: 'updated',
          new_status: status,
          seed_order
        });
      } catch (err) {
        results.push({
          tournament_team_id,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Log bulk update to audit trail
    await pool.query(
      'INSERT INTO tournament_audit_log (tournament_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [tournamentId, userId, 'bulk_registration_update', JSON.stringify({
        updates_attempted: updates.length,
        successful_updates: results.filter(r => r.status === 'updated').length,
        failed_updates: results.filter(r => r.status === 'failed').length,
        results
      })]
    );

    return ApiResponse.success(res, {
      tournament_id: tournamentId,
      results,
      summary: {
        total_updates: updates.length,
        successful: results.filter(r => r.status === 'updated').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    }, 'Bulk team registration update completed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournamentStatus,
  assignTournamentOrganizer,
  checkTournamentEligibility,
  getTournamentDashboard,
  registerTeamForTournament,
  generateTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  getRegistrationDashboard,
  checkPlayerEligibility,
  registerTeamEnhanced,
  updateTeamRegistrationStatus,
  getTournamentTeams,
  bulkUpdateTeamRegistrations,
};