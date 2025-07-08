//
// 🏆 ATHLETIQ - Pre-Tournament Management Routes
//
// This file defines the API endpoints for pre-tournament operations:
// - Bracket generation and management
// - Match scheduling
// - Venue management
// - Tournament setup validation
//

const express = require("express");
const router = express.Router();

// Import middleware
const { protect, checkRole } = require("../middlewares/authMiddleware");
const { validateTournamentId } = require("../middlewares/validation");
const { generalLimiter } = require("../middlewares/rateLimiter");

// Import controller functions
const {
  customizeBracketSeeding,
  scheduleMatchesAdvanced,
  getMatchScheduleDetailed,
  validateTournamentSetup,
  generatePreTournamentReport
} = require("../controllers/preTournamentController");

// --- Pre-Tournament Management Routes ---

/**
 * @swagger
 * /api/pre-tournament/{tournamentId}/seeding:
 *   put:
 *     summary: Customize tournament bracket seeding
 *     description: Update team seeding positions for tournament bracket
 *     tags: [Pre-Tournament]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seedingData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     teamId:
 *                       type: integer
 *                     position:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Seeding updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
router.put(
  "/:tournamentId/seeding",
  generalLimiter,
  protect,
  checkRole(['admin', 'tournament_organizer']),
  validateTournamentId,
  customizeBracketSeeding
);

/**
 * @swagger
 * /api/pre-tournament/{tournamentId}/schedule-advanced:
 *   post:
 *     summary: Schedule tournament matches with advanced options
 *     description: Generate and assign optimized schedule for all tournament matches
 *     tags: [Pre-Tournament]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Tournament start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Tournament end date
 *               venues:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available venues
 *               matchDuration:
 *                 type: integer
 *                 default: 90
 *                 description: Match duration in minutes
 *               breakDuration:
 *                 type: integer
 *                 default: 30
 *                 description: Break between matches in minutes
 *               dailyStartTime:
 *                 type: string
 *                 default: "09:00"
 *                 description: Daily start time (HH:MM)
 *               dailyEndTime:
 *                 type: string
 *                 default: "20:00"
 *                 description: Daily end time (HH:MM)
 *               optimizeVenues:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to optimize venue allocation
 *     responses:
 *       200:
 *         description: Matches scheduled successfully
 *       400:
 *         description: Invalid request or no matches to schedule
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
router.post(
  "/:tournamentId/schedule-advanced",
  generalLimiter,
  protect,
  checkRole(['admin', 'tournament_organizer']),
  validateTournamentId,
  scheduleMatchesAdvanced
);

/**
 * @swagger
 * /api/pre-tournament/{tournamentId}/schedule:
 *   get:
 *     summary: Get detailed tournament schedule
 *     description: Retrieve the detailed match schedule for a tournament with analytics
 *     tags: [Pre-Tournament]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeAnalytics
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include scheduling analytics
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *       404:
 *         description: Tournament not found
 */
router.get(
  "/:tournamentId/schedule",
  generalLimiter,
  validateTournamentId,
  getMatchScheduleDetailed
);

/**
 * @swagger
 * /api/pre-tournament/{tournamentId}/report:
 *   get:
 *     summary: Generate pre-tournament analytics report
 *     description: Generate comprehensive pre-tournament analytics and readiness report
 *     tags: [Pre-Tournament]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
router.get(
  "/:tournamentId/report",
  generalLimiter,
  protect,
  checkRole(['admin', 'tournament_organizer']),
  validateTournamentId,
  generatePreTournamentReport
);

module.exports = router;
