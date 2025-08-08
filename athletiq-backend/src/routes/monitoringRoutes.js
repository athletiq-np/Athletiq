// src/routes/monitoringRoutes.js
const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middlewares/authMiddleware');
const monitoring = require('../config/monitoring');
const { sendResponse } = require('../utils/response');

/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: System monitoring and metrics endpoints
 */

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Get system health status
 *     description: Returns comprehensive health check including monitoring systems
 *     tags: [Monitoring]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/health', protect, checkRole(['SuperAdmin']), (req, res) => {
  try {
  const healthStatus = monitoring.healthCheck();
  return sendResponse(res, { data: healthStatus, message: 'Health check completed' });
  } catch (error) {
  return sendResponse(res, { success: false, status: 500, message: 'Health check failed' });
  }
});

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get performance metrics
 *     description: Returns detailed performance metrics for system monitoring
 *     tags: [Monitoring]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/metrics', protect, checkRole(['SuperAdmin']), (req, res) => {
  try {
  const metrics = monitoring.getPerformanceMetrics();
  return sendResponse(res, { data: metrics, message: 'Metrics retrieved successfully' });
  } catch (error) {
  return sendResponse(res, { success: false, status: 500, message: 'Failed to retrieve metrics' });
  }
});

module.exports = router;
