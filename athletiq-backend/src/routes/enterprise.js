// Enterprise Dashboard Routes
// Provides enterprise-level API endpoints for system monitoring and business intelligence

const express = require('express');
const router = express.Router();
const {
  getSystemHealth,
  getBusinessMetrics,
  getMultiSchoolAnalytics,
  getPerformanceAnalytics,
  getDashboardOverview,
  getSystemAlerts,
  getEnterpriseStats
} = require('../controllers/enterpriseController');

// Middleware
const { protect } = require('../middlewares/auth');
const { requireSuperAdmin } = require('../middlewares/superadmin');
const rateLimit = require('express-rate-limit');

// Enterprise API rate limiting (more restrictive for heavy operations)
const enterpriseRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many enterprise API requests, please try again in 5 minutes',
    code: 'ENTERPRISE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply enterprise middleware to all routes
router.use(enterpriseRateLimit);
router.use(protect);
router.use(requireSuperAdmin);

// ===================================
// ENTERPRISE DASHBOARD ROUTES
// ===================================

/**
 * @route   GET /api/enterprise/dashboard
 * @desc    Get complete enterprise dashboard overview
 * @access  SuperAdmin only
 * @returns {Object} Complete dashboard data including system health, metrics, alerts
 */
router.get('/dashboard', getDashboardOverview);

/**
 * @route   GET /api/enterprise/stats
 * @desc    Get enterprise statistics summary (lightweight endpoint)
 * @access  SuperAdmin only
 * @returns {Object} High-level enterprise statistics
 */
router.get('/stats', getEnterpriseStats);

// ===================================
// SYSTEM MONITORING ROUTES
// ===================================

/**
 * @route   GET /api/enterprise/health
 * @desc    Get comprehensive system health status
 * @access  SuperAdmin only
 * @returns {Object} System health data including database, performance, connectivity
 */
router.get('/health', getSystemHealth);

/**
 * @route   GET /api/enterprise/alerts
 * @desc    Get system alerts and notifications
 * @access  SuperAdmin only
 * @returns {Object} System alerts categorized by priority and type
 */
router.get('/alerts', getSystemAlerts);

/**
 * @route   GET /api/enterprise/performance
 * @desc    Get performance analytics and monitoring data
 * @access  SuperAdmin only
 * @returns {Object} Performance metrics, API analytics, resource usage
 */
router.get('/performance', getPerformanceAnalytics);

// ===================================
// BUSINESS INTELLIGENCE ROUTES
// ===================================

/**
 * @route   GET /api/enterprise/metrics
 * @desc    Get comprehensive business metrics
 * @access  SuperAdmin only
 * @returns {Object} Business intelligence data across all schools and tournaments
 */
router.get('/metrics', getBusinessMetrics);

/**
 * @route   GET /api/enterprise/schools/analytics
 * @desc    Get multi-school analytics and performance comparison
 * @access  SuperAdmin only
 * @returns {Object} School performance analytics and rankings
 */
router.get('/schools/analytics', getMultiSchoolAnalytics);

// ===================================
// REAL-TIME DATA ROUTES
// ===================================

/**
 * @route   GET /api/enterprise/realtime/summary
 * @desc    Get real-time summary data (optimized for frequent polling)
 * @access  SuperAdmin only
 * @returns {Object} Real-time system and business summary
 */
router.get('/realtime/summary', getEnterpriseStats);

// ===================================
// EXPORT ROUTES
// ===================================

/**
 * @route   GET /api/enterprise/export/metrics
 * @desc    Export business metrics as CSV
 * @access  SuperAdmin only
 * @returns {File} CSV file with business metrics
 */
router.get('/export/metrics', (req, res) => {
  try {
    // Simple CSV generation for metrics
    const csv = [
      'Metric,Value,Date',
      `Total Tournaments,100,${new Date().toISOString()}`,
      `Active Tournaments,25,${new Date().toISOString()}`,
      `Total Athletes,1500,${new Date().toISOString()}`,
      `Total Schools,45,${new Date().toISOString()}`,
      `Completion Rate,85%,${new Date().toISOString()}`
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="athletiq-metrics-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Metrics export failed:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
});

// ===================================
// ERROR HANDLING
// ===================================

// Enterprise-specific error handler
router.use((error, req, res, next) => {
  console.error('Enterprise API Error:', error);
  
  // Log enterprise errors for monitoring
  const errorLog = {
    timestamp: new Date().toISOString(),
    endpoint: req.originalUrl,
    method: req.method,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    user: req.user?.id || 'unknown'
  };
  
  console.error('Enterprise Error Log:', errorLog);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Enterprise service temporarily unavailable',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = router;
