// Enterprise Dashboard Controller
// Handles all enterprise-level API requests for system monitoring and business intelligence

const EnterpriseService = require('../services/EnterpriseService');

/**
 * @desc    Get comprehensive system health status
 * @route   GET /api/enterprise/health
 * @access  SuperAdmin only
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const healthData = await EnterpriseService.getSystemHealth();
    
    return res.status(200).json({
      success: true,
      message: 'System health retrieved successfully',
      data: healthData
    });
  } catch (error) {
    console.error('System health check failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'System health check failed'
    });
  }
};

/**
 * @desc    Get business intelligence metrics
 * @route   GET /api/enterprise/metrics
 * @access  SuperAdmin only
 */
const getBusinessMetrics = async (req, res, next) => {
  try {
    const metrics = await EnterpriseService.getBusinessMetrics();
    
    return res.status(200).json({
      success: true,
      message: 'Business metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    console.error('Business metrics retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Business metrics retrieval failed'
    });
  }
};

/**
 * @desc    Get multi-school analytics and comparison
 * @route   GET /api/enterprise/schools/analytics
 * @access  SuperAdmin only
 */
const getMultiSchoolAnalytics = async (req, res, next) => {
  try {
    const analytics = await EnterpriseService.getMultiSchoolAnalytics();
    
    return res.status(200).json({
      success: true,
      message: 'Multi-school analytics retrieved successfully',
      data: {
        schools: analytics,
        summary: {
          totalSchools: analytics.length,
          topPerformers: analytics.slice(0, 5),
          averageScore: analytics.length > 0 ? 
            Math.round(analytics.reduce((sum, school) => sum + school.performanceScore, 0) / analytics.length) : 0
        }
      }
    });
  } catch (error) {
    console.error('Multi-school analytics failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Multi-school analytics failed'
    });
  }
};

/**
 * @desc    Get performance analytics and monitoring data
 * @route   GET /api/enterprise/performance
 * @access  SuperAdmin only
 */
const getPerformanceAnalytics = async (req, res, next) => {
  try {
    const performance = await EnterpriseService.getPerformanceAnalytics();
    
    return res.status(200).json({
      success: true,
      message: 'Performance analytics retrieved successfully',
      data: performance
    });
  } catch (error) {
    console.error('Performance analytics failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Performance analytics failed'
    });
  }
};

/**
 * @desc    Get real-time dashboard overview
 * @route   GET /api/enterprise/dashboard
 * @access  SuperAdmin only
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    // Get all enterprise data in parallel for faster response
    const [systemHealth, businessMetrics, schoolAnalytics, performance] = await Promise.all([
      EnterpriseService.getSystemHealth(),
      EnterpriseService.getBusinessMetrics(),
      EnterpriseService.getMultiSchoolAnalytics(),
      EnterpriseService.getPerformanceAnalytics()
    ]);

    const dashboardData = {
      systemHealth,
      businessMetrics,
      topSchools: schoolAnalytics.slice(0, 10),
      performance: {
        summary: performance.summary,
        recentActivity: performance.api.slice(0, 6)
      },
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Enterprise dashboard overview retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard overview failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Dashboard overview failed'
    });
  }
};

/**
 * @desc    Get enterprise statistics summary
 * @route   GET /api/enterprise/stats
 * @access  SuperAdmin only
 */
const getEnterpriseStats = async (req, res, next) => {
  try {
    const metrics = await EnterpriseService.getBusinessMetrics();
    const health = await EnterpriseService.getSystemHealth();
    
    const stats = {
      system: {
        status: health.status,
        uptime: health.uptime?.formatted || 'Unknown',
        responseTime: health.performance?.responseTime || 'Unknown',
        memoryUsage: health.performance?.memoryUsage?.percentage || 0
      },
      business: {
        totalTournaments: metrics.tournaments.total,
        activeTournaments: metrics.tournaments.active,
        totalAthletes: metrics.athletes.total,
        totalSchools: metrics.schools.total,
        completionRate: metrics.summary.completionRate
      },
      activity: {
        tournamentsToday: metrics.tournaments.created_today,
        athletesToday: metrics.athletes.registered_today,
        certificatesToday: metrics.certificates.generated_today
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Enterprise statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Enterprise stats retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Enterprise stats retrieval failed'
    });
  }
};

/**
 * @desc    Get system alerts and notifications
 * @route   GET /api/enterprise/alerts
 * @access  SuperAdmin only
 */
const getSystemAlerts = async (req, res, next) => {
  try {
    // Simple mock alerts for now
    const alerts = [
      {
        id: `alert-${Date.now()}`,
        type: 'info',
        level: 'info',
        title: 'System Online',
        message: 'Enterprise dashboard is running normally',
        timestamp: new Date().toISOString(),
        action: 'No action required'
      }
    ];

    return res.status(200).json({
      success: true,
      message: 'System alerts retrieved successfully',
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.level === 'critical').length,
          warning: alerts.filter(a => a.level === 'warning').length,
          info: alerts.filter(a => a.level === 'info').length
        }
      }
    });
  } catch (error) {
    console.error('System alerts retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'System alerts retrieval failed'
    });
  }
};

module.exports = {
  getSystemHealth,
  getBusinessMetrics,
  getMultiSchoolAnalytics,
  getPerformanceAnalytics,
  getDashboardOverview,
  getSystemAlerts,
  getEnterpriseStats
};
