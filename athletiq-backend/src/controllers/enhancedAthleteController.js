const pool = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');
const { sendResponse } = require('../utils/response');

/**
 * Enhanced Athlete Controller
 * Supports the complete AthletiQ Athlete Flow system
 */

/**
 * @desc    Get athlete dashboard data
 * @route   GET /api/athletes/:athleteId/dashboard
 * @access  Private (Athlete/Guardian/School)
 */
exports.getAthleteDashboard = async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Get athlete basic info
    const athleteQuery = `
      SELECT 
        p.*,
        s.name AS school_name,
        s.school_code,
        COUNT(DISTINCT asa.sport_id) AS sports_count,
        COUNT(DISTINCT aa.id) AS achievements_count
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      LEFT JOIN athlete_sport_assignments asa ON p.athlete_id = asa.athlete_id AND asa.is_active = TRUE
      LEFT JOIN athlete_achievements aa ON p.athlete_id = aa.athlete_id
      WHERE p.athlete_id = $1
      GROUP BY p.id, s.name, s.school_code
    `;

    const athleteResult = await pool.query(athleteQuery, [athleteId]);
    
    if (athleteResult.rowCount === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Athlete not found' });
    }

    const athlete = athleteResult.rows[0];

    // Get sports assignments
    const sportsQuery = `
      SELECT 
        asa.*,
        sp.name AS sport_name,
        t.team_name
      FROM athlete_sport_assignments asa
      LEFT JOIN sports sp ON asa.sport_id = sp.id
      LEFT JOIN teams t ON asa.team_id = t.id
      WHERE asa.athlete_id = $1 AND asa.is_active = TRUE
    `;
    const sportsResult = await pool.query(sportsQuery, [athleteId]);

    // Get recent achievements
    const achievementsQuery = `
      SELECT *
      FROM athlete_achievements
      WHERE athlete_id = $1
      ORDER BY awarded_date DESC
      LIMIT 5
    `;
    const achievementsResult = await pool.query(achievementsQuery, [athleteId]);

    // Get recent stats
    const statsQuery = `
      SELECT 
        ast.*,
        sp.name AS sport_name,
        m.match_date,
        t.name AS tournament_name
      FROM athlete_stats ast
      LEFT JOIN sports sp ON ast.sport_id = sp.id
      LEFT JOIN matches m ON ast.match_id = m.id
      LEFT JOIN tournaments t ON ast.tournament_id = t.id
      WHERE ast.athlete_id = $1
      ORDER BY ast.recorded_at DESC
      LIMIT 10
    `;
    const statsResult = await pool.query(statsQuery, [athleteId]);

    // Get upcoming events
    const eventsQuery = `
      SELECT DISTINCT
        t.id,
        t.name,
        t.start_date,
        t.end_date,
        t.location,
        sp.name AS sport_name
      FROM tournaments t
      JOIN tournament_teams tt ON t.id = tt.tournament_id
      JOIN teams tm ON tt.team_id = tm.id
      JOIN athlete_sport_assignments asa ON tm.id = asa.team_id
      JOIN sports sp ON asa.sport_id = sp.id
      WHERE asa.athlete_id = $1 
        AND t.start_date > CURRENT_DATE
        AND t.status IN ('open', 'active')
      ORDER BY t.start_date
      LIMIT 5
    `;
    const eventsResult = await pool.query(eventsQuery, [athleteId]);

    const dashboardData = {
      athlete: athlete,
      sports: sportsResult.rows,
      achievements: achievementsResult.rows,
      recentStats: statsResult.rows,
      upcomingEvents: eventsResult.rows,
      summary: {
        sportsCount: parseInt(athlete.sports_count),
        achievementsCount: parseInt(athlete.achievements_count),
        eligibilityStatus: await checkAthleteEligibility(athleteId)
      }
    };

  return sendResponse(res, { data: dashboardData, message: 'Athlete dashboard retrieved successfully' });

  } catch (err) {
  console.error('Get athlete dashboard error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while fetching athlete dashboard' });
  }
};

/**
 * @desc    Verify athlete eligibility for tournaments
 * @route   GET /api/athletes/:athleteId/eligibility
 * @access  Private
 */
exports.checkAthleteEligibility = async (req, res) => {
  try {
    const { athleteId } = req.params;
    
    const eligibility = await checkAthleteEligibility(athleteId);
    
  return sendResponse(res, { data: eligibility, message: 'Athlete eligibility checked' });

  } catch (err) {
  console.error('Check athlete eligibility error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while checking eligibility' });
  }
};

/**
 * @desc    Get athlete performance analytics
 * @route   GET /api/athletes/:athleteId/analytics
 * @access  Private
 */
exports.getAthleteAnalytics = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { sport_id, period = '6months' } = req.query;

    let dateFilter = '';
    switch (period) {
      case '1month':
        dateFilter = "AND ast.recorded_at >= NOW() - INTERVAL '1 month'";
        break;
      case '3months':
        dateFilter = "AND ast.recorded_at >= NOW() - INTERVAL '3 months'";
        break;
      case '6months':
        dateFilter = "AND ast.recorded_at >= NOW() - INTERVAL '6 months'";
        break;
      case '1year':
        dateFilter = "AND ast.recorded_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    const sportFilter = sport_id ? `AND ast.sport_id = ${sport_id}` : '';

    // Get performance trends
    const trendsQuery = `
      SELECT 
        ast.stat_type,
        COUNT(*) AS total_records,
        AVG(ast.stat_value) AS average_value,
        MAX(ast.stat_value) AS best_value,
        MIN(ast.stat_value) AS min_value,
        DATE_TRUNC('month', ast.recorded_at) AS month
      FROM athlete_stats ast
      WHERE ast.athlete_id = $1 ${dateFilter} ${sportFilter}
      GROUP BY ast.stat_type, DATE_TRUNC('month', ast.recorded_at)
      ORDER BY month DESC, ast.stat_type
    `;

    const trendsResult = await pool.query(trendsQuery, [athleteId]);

    // Get tournament participation
    const tournamentsQuery = `
      SELECT DISTINCT
        t.id,
        t.name,
        t.start_date,
        t.end_date,
        sp.name AS sport_name,
        COUNT(ast.id) AS stats_recorded,
        AVG(CASE WHEN ast.stat_type = 'goals' THEN ast.stat_value END) AS avg_goals,
        AVG(CASE WHEN ast.stat_type = 'assists' THEN ast.stat_value END) AS avg_assists
      FROM tournaments t
      JOIN athlete_stats ast ON t.id = ast.tournament_id
      JOIN sports sp ON ast.sport_id = sp.id
      WHERE ast.athlete_id = $1 ${dateFilter} ${sportFilter}
      GROUP BY t.id, t.name, t.start_date, t.end_date, sp.name
      ORDER BY t.start_date DESC
    `;

    const tournamentsResult = await pool.query(tournamentsQuery, [athleteId]);

    // Get comparative rankings (mock data for now)
    const rankingData = {
      schoolRank: Math.floor(Math.random() * 50) + 1,
      districtRank: Math.floor(Math.random() * 200) + 1,
      provinceRank: Math.floor(Math.random() * 1000) + 1,
      totalAthletes: {
        school: 150,
        district: 800,
        province: 5000
      }
    };

    const analyticsData = {
      performanceTrends: trendsResult.rows,
      tournamentHistory: tournamentsResult.rows,
      rankings: rankingData,
      period: period
    };

  return sendResponse(res, { data: analyticsData, message: 'Athlete analytics retrieved successfully' });

  } catch (err) {
  console.error('Get athlete analytics error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while fetching analytics' });
  }
};

/**
 * @desc    Record athlete statistics
 * @route   POST /api/athletes/:athleteId/stats
 * @access  Private (Coach/Official)
 */
exports.recordAthleteStats = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { match_id, tournament_id, sport_id, stats } = req.body;
    const recorded_by = req.user.id;

    const client = await pool.connect();
    await client.query('BEGIN');

    const insertedStats = [];

    for (const [statType, statValue] of Object.entries(stats)) {
      const insertQuery = `
        INSERT INTO athlete_stats (
          athlete_id, match_id, tournament_id, sport_id, stat_type, stat_value, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [athleteId, match_id, tournament_id, sport_id, statType, statValue, recorded_by];
      const result = await client.query(insertQuery, values);
      insertedStats.push(result.rows[0]);
    }

    await client.query('COMMIT');
    client.release();

  return sendResponse(res, { status: 201, data: insertedStats, message: 'Athlete statistics recorded successfully' });

  } catch (err) {
  await client?.query('ROLLBACK');
  client?.release();
  console.error('Record athlete stats error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while recording statistics' });
  }
};

/**
 * @desc    Award achievement to athlete
 * @route   POST /api/athletes/:athleteId/achievements
 * @access  Private (Admin/Coach)
 */
exports.awardAchievement = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const {
      achievement_type,
      achievement_name,
      achievement_description,
      tournament_id,
      event_id,
      awarded_date
    } = req.body;

    // Generate verification code
    const verification_code = await generateShortCode('CERT', 10);

    const insertQuery = `
      INSERT INTO athlete_achievements (
        athlete_id, achievement_type, achievement_name, achievement_description,
        tournament_id, event_id, awarded_date, verification_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      athleteId,
      achievement_type,
      achievement_name,
      achievement_description,
      tournament_id,
      event_id,
      awarded_date || new Date().toISOString().split('T')[0],
      verification_code
    ];

    const result = await pool.query(insertQuery, values);

    // TODO: Generate certificate and send notification
    // await generateCertificate(result.rows[0]);
    // await sendAchievementNotification(athleteId, result.rows[0]);

  return sendResponse(res, { status: 201, data: result.rows[0], message: 'Achievement awarded successfully' });

  } catch (err) {
  console.error('Award achievement error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while awarding achievement' });
  }
};

/**
 * @desc    Get athlete's downloadable certificates
 * @route   GET /api/athletes/:athleteId/certificates
 * @access  Private
 */
exports.getAthleteCertificates = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const certificatesQuery = `
      SELECT 
        aa.*,
        t.name AS tournament_name,
        t.start_date AS tournament_date
      FROM athlete_achievements aa
      LEFT JOIN tournaments t ON aa.tournament_id = t.id
      WHERE aa.athlete_id = $1 
        AND aa.achievement_type IN ('medal', 'certificate', 'trophy')
      ORDER BY aa.awarded_date DESC
    `;

    const result = await pool.query(certificatesQuery, [athleteId]);

  return sendResponse(res, { data: result.rows, message: 'Athlete certificates retrieved successfully' });

  } catch (err) {
  console.error('Get athlete certificates error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while fetching certificates' });
  }
};

/**
 * @desc    Process athlete transfer approval
 * @route   PUT /api/athletes/transfers/:transferId/approve
 * @access  Private (SchoolAdmin)
 */
exports.approveAthleteTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { approved, comments } = req.body;
    const approved_by = req.user.id;

    const client = await pool.connect();
    await client.query('BEGIN');

    // Update transfer status
    const updateTransferQuery = `
      UPDATE athlete_transfers 
      SET status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP,
          approval_comments = $3
      WHERE id = $4
      RETURNING *
    `;

    const transferStatus = approved ? 'approved' : 'rejected';
    const transferResult = await client.query(updateTransferQuery, [
      transferStatus, approved_by, comments, transferId
    ]);

    if (transferResult.rowCount === 0) {
      await client.query('ROLLBACK');
      client.release();
  return sendResponse(res, { success: false, status: 404, message: 'Transfer request not found' });
    }

    const transfer = transferResult.rows[0];

    // If approved, update athlete's school
    if (approved) {
      const updateAthleteQuery = `
        UPDATE players 
        SET school_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE athlete_id = $2
      `;
      
      await client.query(updateAthleteQuery, [transfer.target_school_id, transfer.athlete_id]);

      // Update sport assignments to new school teams if needed
      const updateAssignmentsQuery = `
        UPDATE athlete_sport_assignments 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE athlete_id = $1
      `;
      
      await client.query(updateAssignmentsQuery, [transfer.athlete_id]);
    }

    await client.query('COMMIT');
    client.release();

    // TODO: Send notification to athlete/guardian
    // await sendTransferNotification(transfer);

  const message = approved ? 'Transfer approved successfully' : 'Transfer rejected';
  return sendResponse(res, { data: transfer, message });

  } catch (err) {
  await client?.query('ROLLBACK');
  client?.release();
  console.error('Approve athlete transfer error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while processing transfer' });
  }
};

/**
 * @desc    Generate athlete QR code for quick access
 * @route   GET /api/athletes/:athleteId/qrcode
 * @access  Private
 */
exports.generateAthleteQRCode = async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Verify athlete exists
    const athleteQuery = "SELECT athlete_id, full_name FROM players WHERE athlete_id = $1";
    const athleteResult = await pool.query(athleteQuery, [athleteId]);

    if (athleteResult.rowCount === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Athlete not found' });
    }

    const qrData = {
      type: 'athlete_profile',
      athlete_id: athleteId,
      verification_url: `${process.env.FRONTEND_URL}/athlete/${athleteId}/verify`,
      generated_at: new Date().toISOString()
    };

    // TODO: Generate actual QR code image
    // const qrCodeUrl = await generateQRCodeImage(JSON.stringify(qrData));

    return sendResponse(res, { data: {
      athlete_id: athleteId,
      qr_data: qrData,
      qr_url: `data:text/plain;base64,${Buffer.from(JSON.stringify(qrData)).toString('base64')}`
    }, message: 'QR code generated successfully' });

  } catch (err) {
  console.error('Generate athlete QR code error:', err);
  return sendResponse(res, { success: false, status: 500, message: 'Server error while generating QR code' });
  }
};

/**
 * Helper function to check athlete eligibility
 */
async function checkAthleteEligibility(athleteId) {
  try {
    const eligibilityQuery = "SELECT check_athlete_eligibility($1) AS eligibility";
    const result = await pool.query(eligibilityQuery, [athleteId]);
    return result.rows[0].eligibility;
  } catch (err) {
    console.error('Check eligibility error:', err);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

module.exports = {
  getAthleteDashboard: exports.getAthleteDashboard,
  checkAthleteEligibility: exports.checkAthleteEligibility,
  getAthleteAnalytics: exports.getAthleteAnalytics,
  recordAthleteStats: exports.recordAthleteStats,
  awardAchievement: exports.awardAchievement,
  getAthleteCertificates: exports.getAthleteCertificates,
  approveAthleteTransfer: exports.approveAthleteTransfer,
  generateAthleteQRCode: exports.generateAthleteQRCode
};
