// src/routes/monitoringRoutes.js
const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middlewares/authMiddleware');
const monitoring = require('../config/monitoring');
const apiResponse = require('../utils/apiResponse');

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
    res.status(200).json(apiResponse.success(healthStatus, 'Health check completed'));
  } catch (error) {
    res.status(500).json(apiResponse.error('Health check failed', 500));
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
    res.status(200).json(apiResponse.success(metrics, 'Metrics retrieved successfully'));
  } catch (error) {
    res.status(500).json(apiResponse.error('Failed to retrieve metrics', 500));
  }
});

module.exports = router;
