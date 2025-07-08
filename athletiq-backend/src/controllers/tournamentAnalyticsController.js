//
// 🏆 ATHLETIQ - Advanced Tournament Analytics Controller
//
// This controller provides comprehensive analytics and insights for tournaments,
// leveraging the enhanced database schema with proper foreign key relationships
//

const pool = require("../config/db");
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @desc    Get comprehensive tournament analytics
 * @route   GET /api/tournaments/:id/analytics
 * @access  Private (Admin/Organizer)
 */
const getTournamentAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      include_player_stats = false,
      include_school_breakdown = false,
      include_match_timeline = false 
    } = req.query;

    // Get tournament basic info
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];

    // Core analytics data
    const analytics = {
      tournament_info: {
        id: tournament.id,
        name: tournament.name,
        tournament_code: tournament.tournament_code,
        status: tournament.status,
        format: tournament.format,
        sport: tournament.sport
      },
      registration_analytics: {},
      team_analytics: {},
      match_analytics: {},
      engagement_metrics: {}
    };

    // Registration Analytics
    const registrationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as confirmed_teams,
        COUNT(CASE WHEN registration_status = 'pending' THEN 1 END) as pending_teams,
        COUNT(CASE WHEN registration_status = 'rejected' THEN 1 END) as rejected_teams,
        AVG(CASE WHEN registration_status = 'registered' THEN 
          (SELECT COUNT(*) FROM tournament_players tp WHERE tp.tournament_team_id = tt.id)
        END) as avg_players_per_team,
        MIN(EXTRACT(DOY FROM tr.registration_date)) as first_registration_day,
        MAX(EXTRACT(DOY FROM tr.registration_date)) as last_registration_day
      FROM tournament_teams tt
      LEFT JOIN tournament_registrations tr ON tt.tournament_id = tr.tournament_id AND tt.team_id = tr.team_id
      WHERE tt.tournament_id = $1
    `, [id]);

    analytics.registration_analytics = {
      ...registrationStats.rows[0],
      registration_rate: Math.round((parseInt(registrationStats.rows[0].confirmed_teams) / tournament.max_teams) * 100),
      spots_remaining: tournament.max_teams - parseInt(registrationStats.rows[0].confirmed_teams)
    };

    // Team Analytics with School Breakdown
    if (include_school_breakdown === 'true') {
      const schoolBreakdown = await pool.query(`
        SELECT 
          s.id as school_id,
          s.name as school_name,
          s.city,
          s.province,
          COUNT(tt.id) as teams_registered,
          COUNT(tp.player_id) as total_players,
          AVG(EXTRACT(YEARS FROM AGE(p.date_of_birth))) as avg_player_age,
          COUNT(CASE WHEN p.gender = 'Male' THEN 1 END) as male_players,
          COUNT(CASE WHEN p.gender = 'Female' THEN 1 END) as female_players
        FROM schools s
        JOIN teams t ON s.id = t.school_id
        JOIN tournament_teams tt ON t.id = tt.team_id
        LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
        LEFT JOIN players p ON tp.player_id = p.id
        WHERE tt.tournament_id = $1 AND tt.registration_status = 'registered'
        GROUP BY s.id, s.name, s.city, s.province
        ORDER BY teams_registered DESC, total_players DESC
      `, [id]);

      analytics.team_analytics.school_breakdown = schoolBreakdown.rows;
    }

    // Match Analytics
    const matchStats = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_matches,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_matches,
        AVG(CASE WHEN home_score IS NOT NULL AND away_score IS NOT NULL 
            THEN home_score + away_score END) as avg_total_score,
        COUNT(CASE WHEN home_score = away_score AND status = 'completed' THEN 1 END) as draws,
        COUNT(CASE WHEN ABS(home_score - away_score) = 1 AND status = 'completed' THEN 1 END) as close_matches
      FROM matches 
      WHERE tournament_id = $1
    `, [id]);

    analytics.match_analytics = {
      ...matchStats.rows[0],
      completion_rate: matchStats.rows[0].total_matches > 0 ? 
        Math.round((parseInt(matchStats.rows[0].completed_matches) / parseInt(matchStats.rows[0].total_matches)) * 100) : 0
    };

    // Match Timeline (if requested)
    if (include_match_timeline === 'true') {
      const matchTimeline = await pool.query(`
        SELECT 
          m.id,
          m.code,
          m.scheduled_at,
          m.status,
          m.home_score,
          m.away_score,
          ht.team_name as home_team,
          hs.name as home_school,
          at.team_name as away_team,
          as_school.name as away_school,
          CASE WHEN m.winner_team_id = m.home_team_id THEN 'home'
               WHEN m.winner_team_id = m.away_team_id THEN 'away'
               ELSE 'draw' END as winner
        FROM matches m
        JOIN tournament_teams htt ON m.home_team_id = htt.id
        JOIN teams ht ON htt.team_id = ht.id
        JOIN schools hs ON ht.school_id = hs.id
        JOIN tournament_teams att ON m.away_team_id = att.id
        JOIN teams at ON att.team_id = at.id
        JOIN schools as_school ON at.school_id = as_school.id
        WHERE m.tournament_id = $1
        ORDER BY m.scheduled_at ASC
      `, [id]);

      analytics.match_analytics.timeline = matchTimeline.rows;
    }

    // Player Statistics (if requested)
    if (include_player_stats === 'true') {
      const playerStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT tp.player_id) as total_players,
          AVG(EXTRACT(YEARS FROM AGE(p.date_of_birth))) as avg_age,
          MIN(EXTRACT(YEARS FROM AGE(p.date_of_birth))) as youngest_age,
          MAX(EXTRACT(YEARS FROM AGE(p.date_of_birth))) as oldest_age,
          COUNT(CASE WHEN p.gender = 'Male' THEN 1 END) as male_players,
          COUNT(CASE WHEN p.gender = 'Female' THEN 1 END) as female_players,
          COUNT(DISTINCT p.school_id) as participating_schools
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        JOIN tournament_teams tt ON tp.tournament_team_id = tt.id
        WHERE tt.tournament_id = $1 AND tt.registration_status = 'registered'
      `, [id]);

      analytics.engagement_metrics.player_statistics = playerStats.rows[0];

      // Top performing players (based on matches played)
      const topPlayers = await pool.query(`
        SELECT 
          p.id,
          p.full_name,
          p.gender,
          EXTRACT(YEARS FROM AGE(p.date_of_birth)) as age,
          s.name as school_name,
          t.team_name,
          tp.jersey_number,
          COUNT(m.id) as matches_played
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        JOIN tournament_teams tt ON tp.tournament_team_id = tt.id
        JOIN teams t ON tt.team_id = t.id
        JOIN schools s ON t.school_id = s.id
        LEFT JOIN matches m ON (m.home_team_id = tt.id OR m.away_team_id = tt.id) 
                             AND m.status = 'completed'
        WHERE tt.tournament_id = $1 AND tt.registration_status = 'registered'
        GROUP BY p.id, p.full_name, p.gender, p.date_of_birth, s.name, t.team_name, tp.jersey_number
        ORDER BY matches_played DESC, p.full_name ASC
        LIMIT 10
      `, [id]);

      analytics.engagement_metrics.top_players = topPlayers.rows;
    }

    // Engagement Metrics
    const engagementData = await pool.query(`
      SELECT 
        COUNT(DISTINCT tal.user_id) as active_organizers,
        COUNT(tal.id) as total_actions,
        COUNT(CASE WHEN tal.action = 'team_registered' THEN 1 END) as registration_actions,
        COUNT(CASE WHEN tal.action = 'match_updated' THEN 1 END) as match_updates,
        MAX(tal.created_at) as last_activity
      FROM tournament_audit_log tal
      WHERE tal.tournament_id = $1
    `, [id]);

    analytics.engagement_metrics.activity_summary = engagementData.rows[0];

    // Tournament Progress Metrics
    const progressMetrics = {
      overall_progress: 0,
      registration_phase: tournament.status === 'registration_open' ? 'active' : 
                         tournament.status === 'registration_closed' ? 'completed' : 'pending',
      matches_phase: analytics.match_analytics.total_matches > 0 ? 
                    (analytics.match_analytics.completed_matches === analytics.match_analytics.total_matches ? 'completed' : 'active') : 'pending',
      estimated_completion: null
    };

    // Calculate overall progress
    let progress = 0;
    if (tournament.status === 'registration_open' || tournament.status === 'registration_closed') progress += 25;
    if (tournament.status === 'active' || tournament.status === 'completed') progress += 25;
    if (analytics.match_analytics.total_matches > 0) progress += 25;
    if (analytics.match_analytics.completion_rate === 100) progress += 25;
    
    progressMetrics.overall_progress = progress;
    analytics.engagement_metrics.progress = progressMetrics;

    return ApiResponse.success(res, analytics, 'Tournament analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament leaderboard and standings
 * @route   GET /api/tournaments/:id/leaderboard
 * @access  Public
 */
const getTournamentLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include_player_stats = false } = req.query;

    // Check if tournament exists
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];

    // Team standings based on match results
    const teamStandings = await pool.query(`
      WITH team_stats AS (
        SELECT 
          tt.id as tournament_team_id,
          t.team_name,
          s.name as school_name,
          COUNT(m.id) as matches_played,
          COUNT(CASE WHEN m.winner_team_id = tt.id THEN 1 END) as wins,
          COUNT(CASE WHEN m.status = 'completed' AND m.winner_team_id IS NULL THEN 1 END) as draws,
          COUNT(CASE WHEN m.status = 'completed' AND m.winner_team_id != tt.id AND m.winner_team_id IS NOT NULL THEN 1 END) as losses,
          COALESCE(SUM(CASE WHEN m.home_team_id = tt.id THEN m.home_score 
                            WHEN m.away_team_id = tt.id THEN m.away_score END), 0) as goals_for,
          COALESCE(SUM(CASE WHEN m.home_team_id = tt.id THEN m.away_score 
                            WHEN m.away_team_id = tt.id THEN m.home_score END), 0) as goals_against
        FROM tournament_teams tt
        JOIN teams t ON tt.team_id = t.id
        JOIN schools s ON t.school_id = s.id
        LEFT JOIN matches m ON (m.home_team_id = tt.id OR m.away_team_id = tt.id) 
                             AND m.tournament_id = $1 AND m.status = 'completed'
        WHERE tt.tournament_id = $1 AND tt.registration_status = 'registered'
        GROUP BY tt.id, t.team_name, s.name
      )
      SELECT 
        *,
        (goals_for - goals_against) as goal_difference,
        (wins * 3 + draws * 1) as points,
        CASE WHEN matches_played > 0 THEN 
          ROUND((wins::decimal / matches_played) * 100, 1) 
        ELSE 0 END as win_percentage
      FROM team_stats
      ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_name ASC
    `, [id]);

    const leaderboard = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        format: tournament.format
      },
      standings: teamStandings.rows.map((team, index) => ({
        position: index + 1,
        ...team
      })),
      summary: {
        total_teams: teamStandings.rows.length,
        matches_completed: teamStandings.rows.reduce((sum, team) => sum + parseInt(team.matches_played), 0) / 2,
        top_scorer: null,
        most_wins: teamStandings.rows[0] || null
      }
    };

    // Find top scoring team
    if (teamStandings.rows.length > 0) {
      const topScoringTeam = teamStandings.rows.reduce((prev, current) => 
        parseInt(current.goals_for) > parseInt(prev.goals_for) ? current : prev
      );
      leaderboard.summary.top_scorer = topScoringTeam;
    }

    // Player statistics if requested
    if (include_player_stats === 'true') {
      const playerStats = await pool.query(`
        SELECT 
          p.id,
          p.full_name,
          p.gender,
          EXTRACT(YEARS FROM AGE(p.date_of_birth)) as age,
          t.team_name,
          s.name as school_name,
          tp.jersey_number,
          COUNT(m.id) as matches_played,
          COUNT(CASE WHEN m.winner_team_id = tt.id THEN 1 END) as wins
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        JOIN tournament_teams tt ON tp.tournament_team_id = tt.id
        JOIN teams t ON tt.team_id = t.id
        JOIN schools s ON t.school_id = s.id
        LEFT JOIN matches m ON (m.home_team_id = tt.id OR m.away_team_id = tt.id) 
                             AND m.status = 'completed'
        WHERE tt.tournament_id = $1 AND tt.registration_status = 'registered'
        GROUP BY p.id, p.full_name, p.gender, p.date_of_birth, t.team_name, s.name, tp.jersey_number
        ORDER BY wins DESC, matches_played DESC, p.full_name ASC
        LIMIT 20
      `, [id]);

      leaderboard.player_stats = playerStats.rows;
    }

    return ApiResponse.success(res, leaderboard, 'Tournament leaderboard retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get tournament performance insights
 * @route   GET /api/tournaments/:id/insights
 * @access  Private (Admin/Organizer)
 */
const getTournamentInsights = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tournament overview
    const tournamentResult = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (tournamentResult.rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }

    const tournament = tournamentResult.rows[0];

    const insights = {
      tournament_health: {},
      recommendations: [],
      performance_metrics: {},
      comparison_data: {}
    };

    // Calculate tournament health score
    const healthMetrics = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tournament_teams WHERE tournament_id = $1 AND registration_status = 'registered') as confirmed_teams,
        (SELECT COUNT(*) FROM matches WHERE tournament_id = $1) as total_matches,
        (SELECT COUNT(*) FROM matches WHERE tournament_id = $1 AND status = 'completed') as completed_matches,
        (SELECT COUNT(DISTINCT tp.player_id) FROM tournament_players tp 
         JOIN tournament_teams tt ON tp.tournament_team_id = tt.id 
         WHERE tt.tournament_id = $1) as total_players,
        (SELECT COUNT(*) FROM tournament_audit_log WHERE tournament_id = $1) as activity_count
    `, [id]);

    const metrics = healthMetrics.rows[0];
    
    // Health score calculation (0-100)
    let healthScore = 0;
    
    // Registration health (30 points)
    const registrationRate = (parseInt(metrics.confirmed_teams) / tournament.max_teams) * 100;
    healthScore += Math.min(30, (registrationRate / 100) * 30);
    
    // Match completion health (25 points)
    if (parseInt(metrics.total_matches) > 0) {
      const completionRate = (parseInt(metrics.completed_matches) / parseInt(metrics.total_matches)) * 100;
      healthScore += Math.min(25, (completionRate / 100) * 25);
    }
    
    // Participation health (25 points)
    const avgPlayersPerTeam = parseInt(metrics.total_players) / parseInt(metrics.confirmed_teams);
    if (avgPlayersPerTeam >= 8) healthScore += 25;
    else if (avgPlayersPerTeam >= 5) healthScore += 15;
    else if (avgPlayersPerTeam >= 3) healthScore += 10;
    
    // Activity health (20 points)
    if (parseInt(metrics.activity_count) >= 20) healthScore += 20;
    else if (parseInt(metrics.activity_count) >= 10) healthScore += 15;
    else if (parseInt(metrics.activity_count) >= 5) healthScore += 10;

    insights.tournament_health = {
      score: Math.round(healthScore),
      grade: healthScore >= 90 ? 'A' : 
             healthScore >= 80 ? 'B' : 
             healthScore >= 70 ? 'C' : 
             healthScore >= 60 ? 'D' : 'F',
      metrics: {
        registration_rate: Math.round(registrationRate),
        match_completion: parseInt(metrics.total_matches) > 0 ? 
          Math.round((parseInt(metrics.completed_matches) / parseInt(metrics.total_matches)) * 100) : 0,
        avg_players_per_team: Math.round(avgPlayersPerTeam * 10) / 10,
        activity_level: parseInt(metrics.activity_count)
      }
    };

    // Generate recommendations
    if (registrationRate < 50) {
      insights.recommendations.push({
        type: 'registration',
        priority: 'high',
        message: 'Low registration rate. Consider extending registration deadline or improving promotion.',
        action: 'Extend registration period and increase outreach efforts'
      });
    }

    if (parseInt(metrics.total_matches) === 0 && tournament.status === 'active') {
      insights.recommendations.push({
        type: 'matches',
        priority: 'critical',
        message: 'No matches scheduled for active tournament.',
        action: 'Generate tournament bracket and schedule matches'
      });
    }

    if (avgPlayersPerTeam < 5) {
      insights.recommendations.push({
        type: 'participation',
        priority: 'medium',
        message: 'Teams have low player counts. This may affect match quality.',
        action: 'Contact team managers to encourage more player registrations'
      });
    }

    // Performance compared to similar tournaments
    const comparisonData = await pool.query(`
      SELECT 
        AVG((SELECT COUNT(*) FROM tournament_teams tt2 WHERE tt2.tournament_id = t.id AND tt2.registration_status = 'registered')::float / t.max_teams * 100) as avg_registration_rate,
        AVG(CASE WHEN (SELECT COUNT(*) FROM matches m2 WHERE m2.tournament_id = t.id) > 0 
            THEN (SELECT COUNT(*) FROM matches m3 WHERE m3.tournament_id = t.id AND m3.status = 'completed')::float / 
                 (SELECT COUNT(*) FROM matches m4 WHERE m4.tournament_id = t.id) * 100
            ELSE 0 END) as avg_completion_rate
      FROM tournaments t
      WHERE t.sport = $1 AND t.tournament_type = $2 AND t.id != $3 AND t.status IN ('completed', 'active')
    `, [tournament.sport, tournament.tournament_type, id]);

    if (comparisonData.rows.length > 0 && comparisonData.rows[0].avg_registration_rate) {
      insights.comparison_data = {
        registration_vs_average: Math.round(registrationRate - parseFloat(comparisonData.rows[0].avg_registration_rate)),
        completion_vs_average: Math.round(insights.tournament_health.metrics.match_completion - parseFloat(comparisonData.rows[0].avg_completion_rate || 0))
      };
    }

    return ApiResponse.success(res, insights, 'Tournament insights retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTournamentAnalytics,
  getTournamentLeaderboard,
  getTournamentInsights,
};
