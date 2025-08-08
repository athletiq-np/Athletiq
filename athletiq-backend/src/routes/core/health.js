// src/routes/health.js

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 */

const express = require('express');
const router = express.Router();
const { healthCheck } = require('../../controllers/healthController');
const { generalLimiter } = require('../../middlewares/rateLimiter');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Health check passed
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: Server uptime in seconds
 *                     environment:
 *                       type: string
 *                       example: development
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *       500:
 *         description: Health check failed
 *       429:
 *         description: Too many requests
 */
/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', generalLimiter, healthCheck);

module.exports = router;
