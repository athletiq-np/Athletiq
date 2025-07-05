// src/controllers/healthController.js
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
exports.healthCheck = async (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    return ApiResponse.success(res, healthData, 'Health check passed');
  } catch (error) {
    return ApiResponse.error(res, 'Health check failed', 500);
  }
};
