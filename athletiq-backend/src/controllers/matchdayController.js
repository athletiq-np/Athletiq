/**
 * Matchday Operations Controller
 * Handles live tournament execution, real-time scoring, and match management
 */

const pool = require('../config/simple-database');
const { validationResult } = require('express-validator');

const { sendResponse } = require('../utils/response');

/**
 * @desc    Get live tournament dashboard
 * @route   GET /api/matchday/tournaments/:id/dashboard
 * @access  Private (Organizer/Admin)
 */
const getLiveTournamentDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tournament details with live status
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

    // Get current active matches
    const activeMatchesQuery = `
      SELECT m.*, 
             t1.team_name as team1_name, t2.team_name as team2_name,
             m.home_score as team1_score, m.away_score as team2_score
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.tournament_id = $1 AND m.match_status IN ('in_progress', 'scheduled')
      ORDER BY m.scheduled_at ASC
    `;
    
    const activeMatches = await pool.query(activeMatchesQuery, [id]);

    // Get live statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT p.athlete_id) as total_participants,
        COUNT(DISTINCT m.id) as matches_today,
        AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60) as avg_match_duration
      FROM tournament_matches m
      LEFT JOIN match_participants p ON m.id = p.match_id
      LEFT JOIN match_scores s ON m.id = s.match_id
      WHERE m.tournament_id = $1 
        AND DATE(m.scheduled_time) = CURRENT_DATE
    `;
    
    const stats = await pool.query(statsQuery, [id]);

    const dashboardData = {
      tournament: tournament,
      activeMatches: activeMatches.rows,
      todayStats: stats.rows[0],
      summary: {
        totalMatches: parseInt(tournament.total_matches) || 0,
        completedMatches: parseInt(tournament.completed_matches) || 0,
        activeMatches: parseInt(tournament.active_matches) || 0,
        scheduledMatches: parseInt(tournament.scheduled_matches) || 0,
        completionRate: tournament.total_matches > 0 
          ? Math.round((tournament.completed_matches / tournament.total_matches) * 100) 
          : 0
      }
    };

  return sendResponse(res, { data: dashboardData, message: 'Live tournament dashboard retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start a live match
 * @route   POST /api/matchday/matches/:id/start
 * @access  Private (Referee/Admin)
 */
const startLiveMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { referee_id, official_notes } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update match status to active
      const updateMatchQuery = `
        UPDATE tournament_matches 
        SET status = 'active', 
            actual_start_time = NOW(),
            referee_id = $2
        WHERE id = $1 AND status = 'scheduled'
        RETURNING *
      `;
      
      const matchResult = await client.query(updateMatchQuery, [id, referee_id]);
      
      if (matchResult.rows.length === 0) {
        await client.query('ROLLBACK');
  return sendResponse(res, { success: false, status: 400, message: 'Match not found or cannot be started' });
      }

      // Initialize match score record
      const initScoreQuery = `
        INSERT INTO match_scores (match_id, team1_score, team2_score, status, start_time)
        VALUES ($1, 0, 0, 'active', NOW())
        ON CONFLICT (match_id) DO UPDATE SET
          status = 'active',
          start_time = NOW()
        RETURNING *
      `;
      
      await client.query(initScoreQuery, [id]);

      // Log match event
      const logEventQuery = `
        INSERT INTO match_events (match_id, event_type, description, timestamp, created_by)
        VALUES ($1, 'match_start', $2, NOW(), $3)
      `;
      
      await client.query(logEventQuery, [
        id, 
        official_notes || 'Match started', 
        req.user.id
      ]);

      await client.query('COMMIT');

  return sendResponse(res, { data: matchResult.rows[0], message: 'Match started successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update live match score
 * @route   PUT /api/matchday/matches/:id/score
 * @access  Private (Referee/Admin)
 */
const updateLiveScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { team1_score, team2_score, event_description, event_type } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update match score
      const updateScoreQuery = `
        UPDATE match_scores 
        SET team1_score = $2, 
            team2_score = $3, 
            last_updated = NOW()
        WHERE match_id = $1 AND status = 'active'
        RETURNING *
      `;
      
      const scoreResult = await client.query(updateScoreQuery, [id, team1_score, team2_score]);
      
      if (scoreResult.rows.length === 0) {
        await client.query('ROLLBACK');
  return sendResponse(res, { success: false, status: 400, message: 'Match not found or not active' });
      }

      // Log scoring event
      if (event_description) {
        const logEventQuery = `
          INSERT INTO match_events (match_id, event_type, description, timestamp, created_by, team1_score, team2_score)
          VALUES ($1, $2, $3, NOW(), $4, $5, $6)
        `;
        
        await client.query(logEventQuery, [
          id, 
          event_type || 'score_update',
          event_description, 
          req.user.id,
          team1_score,
          team2_score
        ]);
      }

      await client.query('COMMIT');

      // Emit real-time update (if WebSocket is implemented)
      // TODO: Add WebSocket broadcasting for live updates

  return sendResponse(res, { data: scoreResult.rows[0], message: 'Score updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End a live match
 * @route   POST /api/matchday/matches/:id/end
 * @access  Private (Referee/Admin)
 */
const endLiveMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { final_notes, winner_team_id } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current match and score
      const matchQuery = `
        SELECT m.*, s.team1_score, s.team2_score 
        FROM tournament_matches m
        LEFT JOIN match_scores s ON m.id = s.match_id
        WHERE m.id = $1 AND m.match_status = 'in_progress'
      `;
      
      const matchResult = await client.query(matchQuery, [id]);
      
      if (matchResult.rows.length === 0) {
        await client.query('ROLLBACK');
  return sendResponse(res, { success: false, status: 400, message: 'Active match not found' });
      }

      const match = matchResult.rows[0];
      
      // Determine winner if not provided
      let determinedWinner = winner_team_id;
      if (!determinedWinner) {
        if (match.team1_score > match.team2_score) {
          determinedWinner = match.team1_id;
        } else if (match.team2_score > match.team1_score) {
          determinedWinner = match.team2_id;
        }
        // If scores are equal, it's a draw (determinedWinner remains null)
      }

      // Update match status to completed
      const updateMatchQuery = `
        UPDATE tournament_matches 
        SET status = 'completed', 
            actual_end_time = NOW(),
            winner_team_id = $2
        WHERE id = $1
        RETURNING *
      `;
      
      const updatedMatch = await client.query(updateMatchQuery, [id, determinedWinner]);

      // Update match score status
      const updateScoreQuery = `
        UPDATE match_scores 
        SET status = 'completed', 
            end_time = NOW(),
            winner_team_id = $2
        WHERE match_id = $1
      `;
      
      await client.query(updateScoreQuery, [id, determinedWinner]);

      // Log match completion event
      const logEventQuery = `
        INSERT INTO match_events (match_id, event_type, description, timestamp, created_by)
        VALUES ($1, 'match_end', $2, NOW(), $3)
      `;
      
      await client.query(logEventQuery, [
        id, 
        final_notes || 'Match completed', 
        req.user.id
      ]);

      // Update tournament bracket progression if applicable
      if (determinedWinner && match.tournament_id) {
        // TODO: Implement bracket progression logic
        // This would advance the winner to the next round
      }

      await client.query('COMMIT');

      return sendResponse(res, { data: {
        match: updatedMatch.rows[0],
        winner_team_id: determinedWinner,
        final_score: {
          team1_score: match.team1_score,
          team2_score: match.team2_score
        }
      }, message: 'Match completed successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live match details with real-time data
 * @route   GET /api/matchday/matches/:id/live
 * @access  Public
 */
const getLiveMatchDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const matchQuery = `
      SELECT m.*, 
             t1.name as team1_name, t1.logo as team1_logo,
             t2.name as team2_name, t2.logo as team2_logo,
             v.name as venue_name, v.location as venue_location,
             s.team1_score, s.team2_score, s.status as match_status,
             s.start_time as actual_start_time, s.end_time as actual_end_time,
             u.full_name as referee_name
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN venues v ON m.venue_id = v.id
      LEFT JOIN match_scores s ON m.id = s.match_id
      LEFT JOIN users u ON m.referee_id = u.id
      WHERE m.id = $1
    `;
    
    const matchResult = await pool.query(matchQuery, [id]);
    
    if (matchResult.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
    }

    // Get match events/timeline
    const eventsQuery = `
      SELECT event_type, description, timestamp, team1_score, team2_score
      FROM match_events
      WHERE match_id = $1
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    
    const events = await pool.query(eventsQuery, [id]);

    // Get participating athletes
    const participantsQuery = `
      SELECT p.*, a.full_name, a.athlete_id, t.name as team_name
      FROM match_participants p
      JOIN athletes a ON p.athlete_id = a.id
      JOIN teams t ON p.team_id = t.id
      WHERE p.match_id = $1
      ORDER BY t.name, a.full_name
    `;
    
    const participants = await pool.query(participantsQuery, [id]);

    const liveMatchData = {
      match: matchResult.rows[0],
      events: events.rows,
      participants: participants.rows,
      isLive: matchResult.rows[0].status === 'active',
      duration: matchResult.rows[0].actual_start_time ? 
        Math.floor((new Date() - new Date(matchResult.rows[0].actual_start_time)) / 1000 / 60) : 
        null
    };

  return sendResponse(res, { data: liveMatchData, message: 'Live match details retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time tournament leaderboard
 * @route   GET /api/matchday/tournaments/:id/leaderboard
 * @access  Public
 */
const getLiveLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leaderboardQuery = `
      SELECT t.id, t.name, t.logo,
             COUNT(m.id) as matches_played,
             COUNT(CASE WHEN m.winner_team_id = t.id THEN 1 END) as wins,
             COUNT(CASE WHEN m.winner_team_id IS NULL AND m.match_status = 'completed' THEN 1 END) as draws,
             COUNT(CASE WHEN m.winner_team_id IS NOT NULL AND m.winner_team_id != t.id AND m.match_status = 'completed' THEN 1 END) as losses,
             COALESCE(SUM(CASE WHEN tm.team1_id = t.id THEN s.team1_score ELSE s.team2_score END), 0) as goals_for,
             COALESCE(SUM(CASE WHEN tm.team1_id = t.id THEN s.team2_score ELSE s.team1_score END), 0) as goals_against,
             (COUNT(CASE WHEN m.winner_team_id = t.id THEN 1 END) * 3 + 
              COUNT(CASE WHEN m.winner_team_id IS NULL AND m.match_status = 'completed' THEN 1 END)) as points
      FROM teams t
      LEFT JOIN tournament_matches tm ON (t.id = tm.team1_id OR t.id = tm.team2_id)
      LEFT JOIN tournament_matches m ON m.id = tm.id AND m.match_status = 'completed'
      LEFT JOIN match_scores s ON m.id = s.match_id
      WHERE EXISTS (
        SELECT 1 FROM tournament_teams tt WHERE tt.team_id = t.id AND tt.tournament_id = $1
      )
      GROUP BY t.id, t.name, t.logo
      ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC
    `;
    
    const leaderboard = await pool.query(leaderboardQuery, [id]);

  return sendResponse(res, { data: leaderboard.rows, message: 'Live leaderboard retrieved successfully' });
  } catch (error) {
    next(error);
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
