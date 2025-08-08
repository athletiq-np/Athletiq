/**
 * Simplified Matchday Controller for Testing
 * Works with the current database schema
 */

const pool = require('../config/simple-database');
const { validationResult } = require('express-validator');

const { sendResponse } = require('../utils/response');

/**
 * @desc    Get live tournament dashboard - Simplified Version
 * @route   GET /api/matchday/tournaments/:id/dashboard
 * @access  Private (Organizer/Admin)
 */
const getLiveTournamentDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tournament details
    const tournamentQuery = `
      SELECT t.*, 
             COUNT(DISTINCT m.id) as total_matches,
             COUNT(CASE WHEN m.match_status = 'completed' THEN 1 END) as completed_matches,
             COUNT(CASE WHEN m.match_status = 'in_progress' THEN 1 END) as active_matches,
             COUNT(CASE WHEN m.match_status = 'scheduled' THEN 1 END) as scheduled_matches
      FROM tournaments t
      LEFT JOIN tournament_matches m ON t.id = m.tournament_id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const tournamentResult = await pool.query(tournamentQuery, [id]);
    if (tournamentResult.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    // Get active/upcoming matches
    const activeMatchesQuery = `
      SELECT m.*, 
             t1.team_name as team1_name, 
             t2.team_name as team2_name
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.tournament_id = $1 AND m.match_status IN ('in_progress', 'scheduled')
      ORDER BY m.scheduled_at ASC
      LIMIT 10
    `;
    
    const activeMatches = await pool.query(activeMatchesQuery, [id]);

    // Build response
    const dashboardData = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        tournament_code: tournament.tournament_code,
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date
      },
      statistics: {
        total_matches: parseInt(tournament.total_matches) || 0,
        completed_matches: parseInt(tournament.completed_matches) || 0,
        active_matches: parseInt(tournament.active_matches) || 0,
        scheduled_matches: parseInt(tournament.scheduled_matches) || 0,
        completion_percentage: tournament.total_matches > 0 
          ? Math.round((tournament.completed_matches / tournament.total_matches) * 100)
          : 0
      },
      active_matches: activeMatches.rows,
      last_updated: new Date().toISOString()
    };

  return sendResponse(res, { data: dashboardData, message: 'Live tournament dashboard retrieved successfully' });

  } catch (error) {
    console.error('Dashboard error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

/**
 * @desc    Start a live match - Simplified
 */
const startLiveMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update match status
    const result = await pool.query(
      'UPDATE tournament_matches SET match_status = $1 WHERE id = $2 RETURNING *',
      ['in_progress', id]
    );

    if (result.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
    }

  return sendResponse(res, { data: result.rows[0], message: 'Match started successfully' });
  } catch (error) {
    console.error('Start match error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

/**
 * @desc    Update live score - Simplified
 */
const updateLiveScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { home_score, away_score } = req.body;

    const result = await pool.query(
      'UPDATE tournament_matches SET home_score = $1, away_score = $2 WHERE id = $3 RETURNING *',
      [home_score, away_score, id]
    );

    if (result.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
    }

  return sendResponse(res, { data: result.rows[0], message: 'Score updated successfully' });
  } catch (error) {
    console.error('Update score error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

/**
 * @desc    End a live match - Simplified
 */
const endLiveMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE tournament_matches SET match_status = $1 WHERE id = $2 RETURNING *',
      ['completed', id]
    );

    if (result.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
    }

  return sendResponse(res, { data: result.rows[0], message: 'Match ended successfully' });
  } catch (error) {
    console.error('End match error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

/**
 * @desc    Get live match details - Simplified
 */
const getLiveMatchDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT m.*, 
             t1.team_name as home_team_name,
             t2.team_name as away_team_name
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
    }

  return sendResponse(res, { data: result.rows[0], message: 'Match details retrieved successfully' });
  } catch (error) {
    console.error('Get match details error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

/**
 * @desc    Get live leaderboard - Simplified
 */
const getLiveLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Simple leaderboard based on wins
    const query = `
      SELECT t.team_name,
             COUNT(CASE WHEN m.winner_team_id = t.id THEN 1 END) as wins,
             COUNT(CASE WHEN m.match_status = 'completed' THEN 1 END) as matches_played
      FROM teams t
      JOIN tournament_matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
      WHERE m.tournament_id = $1
      GROUP BY t.id, t.team_name
      ORDER BY wins DESC, matches_played ASC
      LIMIT 10
    `;

    const result = await pool.query(query, [id]);

  return sendResponse(res, { data: result.rows, message: 'Live leaderboard retrieved successfully' });
  } catch (error) {
    console.error('Get leaderboard error:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Internal server error' });
  }
};

module.exports = {
  getLiveTournamentDashboard,
  startLiveMatch,
  updateLiveScore,
  endLiveMatch,
  getLiveMatchDetails,
  getLiveLeaderboard
};
