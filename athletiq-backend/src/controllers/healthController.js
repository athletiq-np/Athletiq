// src/controllers/healthController.js
// Refactored to use unified sendResponse helper instead of legacy ApiResponse
const { sendResponse } = require('../utils/response');

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

    return sendResponse(res, { data: healthData, message: 'Health check passed' });
  } catch (error) {
    return sendResponse(res, { success: false, status: 500, message: 'Health check failed' });
  }
};
