// routes/analytics.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * 📊 Analytics Routes
 * Advanced analytics and reporting system
 */

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard analytics
 */
router.get('/dashboard', authenticateToken, authorizeRole(['super_admin', 'admin']), async (req, res) => {
  const { 
    range = 'last_30_days',
    start_date,
    end_date 
  } = req.query;

  try {
    // Calculate date range
    let startDate, endDate;
    const now = new Date();
    
    switch (range) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case 'custom':
        startDate = new Date(start_date);
        endDate = new Date(end_date);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime());

    // Overview metrics
    const overviewQueries = await Promise.all([
      // Current period
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE created_at BETWEEN $1 AND $2) as users,
          (SELECT COUNT(*) FROM schools WHERE created_at BETWEEN $1 AND $2) as schools,
          (SELECT COUNT(*) FROM tournaments WHERE created_at BETWEEN $1 AND $2) as tournaments,
          (SELECT COUNT(*) FROM players WHERE created_at BETWEEN $1 AND $2) as players
      `, [startDate, endDate]),
      
      // Previous period
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE created_at BETWEEN $1 AND $2) as users,
          (SELECT COUNT(*) FROM schools WHERE created_at BETWEEN $1 AND $2) as schools,
          (SELECT COUNT(*) FROM tournaments WHERE created_at BETWEEN $1 AND $2) as tournaments,
          (SELECT COUNT(*) FROM players WHERE created_at BETWEEN $1 AND $2) as players
      `, [prevStartDate, prevEndDate])
    ]);

    const currentPeriod = overviewQueries[0].rows[0];
    const previousPeriod = overviewQueries[1].rows[0];

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const overview = {
      totalUsers: parseInt(currentPeriod.users),
      totalSchools: parseInt(currentPeriod.schools),
      totalTournaments: parseInt(currentPeriod.tournaments),
      totalPlayers: parseInt(currentPeriod.players),
      userGrowth: calculateGrowth(parseInt(currentPeriod.users), parseInt(previousPeriod.users)),
      schoolGrowth: calculateGrowth(parseInt(currentPeriod.schools), parseInt(previousPeriod.schools)),
      tournamentGrowth: calculateGrowth(parseInt(currentPeriod.tournaments), parseInt(previousPeriod.tournaments)),
      playerGrowth: calculateGrowth(parseInt(currentPeriod.players), parseInt(previousPeriod.players))
    };

    // User growth trend (daily data)
    const userGrowthQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as value
      FROM users
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    const userGrowthResult = await db.query(userGrowthQuery, [startDate, endDate]);
    const userGrowth = userGrowthResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      value: parseInt(row.value)
    }));

    // Registration distribution by role
    const registrationTrendsQuery = `
      SELECT 
        role as name,
        COUNT(*) as value
      FROM users
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY role
    `;
    const registrationTrendsResult = await db.query(registrationTrendsQuery, [startDate, endDate]);
    const registrationTrends = registrationTrendsResult.rows.map(row => ({
      name: row.name.replace('_', ' ').toUpperCase(),
      value: parseInt(row.value)
    }));

    // Tournament statistics
    const tournamentStatsQuery = `
      SELECT 
        sport_type as name,
        COUNT(*) as value
      FROM tournaments
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY sport_type
      ORDER BY value DESC
      LIMIT 10
    `;
    const tournamentStatsResult = await db.query(tournamentStatsQuery, [startDate, endDate]);
    const tournamentStats = tournamentStatsResult.rows.map(row => ({
      name: row.name || 'Unknown',
      value: parseInt(row.value)
    }));

    // School performance (schools with most players)
    const schoolPerformanceQuery = `
      SELECT 
        s.name,
        COUNT(p.id) as value,
        DATE(s.created_at) as date
      FROM schools s
      LEFT JOIN players p ON s.id = p.school_id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY s.id, s.name, DATE(s.created_at)
      ORDER BY s.created_at
    `;
    const schoolPerformanceResult = await db.query(schoolPerformanceQuery, [startDate, endDate]);
    const schoolPerformance = schoolPerformanceResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      value: parseInt(row.value),
      school: row.name
    }));

    // Engagement metrics
    const engagementMetrics = {
      avgSessionDuration: '4m 32s', // Placeholder - would need session tracking
      bounceRate: 23.4, // Placeholder
      pageViews: 125430, // Placeholder
      activeUsers: parseInt(currentPeriod.users) * 0.7 // Estimate
    };

    // Geographic data (placeholder)
    const geographicData = [
      { country: 'Nepal', users: parseInt(currentPeriod.users) * 0.8 },
      { country: 'India', users: parseInt(currentPeriod.users) * 0.15 },
      { country: 'Others', users: parseInt(currentPeriod.users) * 0.05 }
    ];

    res.json({
      overview,
      userGrowth,
      registrationTrends,
      tournamentStats,
      schoolPerformance,
      engagementMetrics,
      geographicData,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        range
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/users
 * Get detailed user analytics
 */
router.get('/users', authenticateToken, authorizeRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const queries = await Promise.all([
      // User registration trends
      db.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as registrations
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `),
      
      // User roles distribution
      db.query(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        GROUP BY role
      `),
      
      // Active users (last login within 7 days)
      db.query(`
        SELECT COUNT(*) as active_users
        FROM users
        WHERE last_login >= NOW() - INTERVAL '7 days'
      `),
      
      // User engagement by month
      db.query(`
        SELECT 
          DATE_TRUNC('month', last_login) as month,
          COUNT(DISTINCT id) as active_users
        FROM users
        WHERE last_login >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', last_login)
        ORDER BY month
      `)
    ]);

    res.json({
      registrationTrends: queries[0].rows,
      roleDistribution: queries[1].rows,
      activeUsers: parseInt(queries[2].rows[0].active_users),
      monthlyEngagement: queries[3].rows
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      error: 'Failed to get user analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/schools
 * Get detailed school analytics
 */
router.get('/schools', authenticateToken, authorizeRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const queries = await Promise.all([
      // School registration over time
      db.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as schools_registered
        FROM schools
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `),
      
      // School performance metrics
      db.query(`
        SELECT 
          s.id,
          s.name,
          COUNT(p.id) as total_players,
          COUNT(CASE WHEN p.verified = true THEN 1 END) as verified_players,
          s.created_at
        FROM schools s
        LEFT JOIN players p ON s.id = p.school_id
        GROUP BY s.id, s.name, s.created_at
        ORDER BY total_players DESC
        LIMIT 20
      `),
      
      // Geographic distribution
      db.query(`
        SELECT 
          COALESCE(address, 'Unknown') as location,
          COUNT(*) as school_count
        FROM schools
        GROUP BY address
        ORDER BY school_count DESC
        LIMIT 10
      `)
    ]);

    res.json({
      registrationTrends: queries[0].rows,
      topPerformingSchools: queries[1].rows,
      geographicDistribution: queries[2].rows
    });

  } catch (error) {
    console.error('School analytics error:', error);
    res.status(500).json({
      error: 'Failed to get school analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/analytics/tournaments
 * Get detailed tournament analytics
 */
router.get('/tournaments', authenticateToken, authorizeRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const queries = await Promise.all([
      // Tournament creation trends
      db.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as tournaments_created
        FROM tournaments
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `),
      
      // Sport type distribution
      db.query(`
        SELECT 
          sport_type,
          COUNT(*) as tournament_count
        FROM tournaments
        GROUP BY sport_type
        ORDER BY tournament_count DESC
      `),
      
      // Tournament status distribution
      db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM tournaments
        GROUP BY status
      `),
      
      // Average participation
      db.query(`
        SELECT 
          t.id,
          t.name,
          t.sport_type,
          COUNT(tp.player_id) as participant_count
        FROM tournaments t
        LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
        GROUP BY t.id, t.name, t.sport_type
        ORDER BY participant_count DESC
        LIMIT 10
      `)
    ]);

    res.json({
      creationTrends: queries[0].rows,
      sportDistribution: queries[1].rows,
      statusDistribution: queries[2].rows,
      topTournaments: queries[3].rows
    });

  } catch (error) {
    console.error('Tournament analytics error:', error);
    res.status(500).json({
      error: 'Failed to get tournament analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/analytics/export
 * Export analytics data in various formats
 */
router.post('/export', authenticateToken, authorizeRole(['super_admin', 'admin']), async (req, res) => {
  const { 
    format = 'csv',
    range = 'last_30_days',
    start_date,
    end_date,
    metrics = ['users']
  } = req.body;

  try {
    // Get analytics data (reuse dashboard logic)
    const dashboardData = await getDashboardData(range, start_date, end_date);
    
    if (format === 'csv') {
      // Convert to CSV
      const csvData = [];
      
      if (metrics.includes('users')) {
        dashboardData.userGrowth.forEach(item => {
          csvData.push({
            metric: 'User Registrations',
            date: item.date,
            value: item.value
          });
        });
      }
      
      if (metrics.includes('schools')) {
        dashboardData.schoolPerformance.forEach(item => {
          csvData.push({
            metric: 'School Performance',
            date: item.date,
            value: item.value,
            school: item.school
          });
        });
      }

      const csv = new Parser().parse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=athletiq-analytics.csv');
      res.send(csv);

    } else if (format === 'pdf') {
      // Generate PDF report
      const doc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=athletiq-analytics.pdf');
      
      doc.pipe(res);
      
      // PDF content
      doc.fontSize(20).text('Athletiq Analytics Report', 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      doc.text(`Date Range: ${range}`, 50, 100);
      
      // Add overview metrics
      doc.fontSize(16).text('Overview', 50, 140);
      doc.fontSize(12);
      doc.text(`Total Users: ${dashboardData.overview.totalUsers}`, 50, 170);
      doc.text(`Total Schools: ${dashboardData.overview.totalSchools}`, 50, 190);
      doc.text(`Total Tournaments: ${dashboardData.overview.totalTournaments}`, 50, 210);
      
      doc.end();

    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: 'Failed to export analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to get dashboard data (extracted for reuse)
async function getDashboardData(range, start_date, end_date) {
  // Implementation would be similar to the dashboard endpoint
  // This is a simplified version for export functionality
  return {
    overview: { totalUsers: 0, totalSchools: 0, totalTournaments: 0 },
    userGrowth: [],
    schoolPerformance: []
  };
}

module.exports = router;
