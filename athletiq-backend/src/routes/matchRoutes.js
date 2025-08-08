// src/routes/matchRoutes.js
// Match management (bulk creation & retrieval)
/**
 * @swagger
 * tags:
 *   name: Matches
 *   description: Tournament match scheduling & retrieval
 */

const express = require('express');
const router = express.Router();
const matchService = require('../services/matchService');
const { protect } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const { validateTournamentId, validateBulkMatchCreate, validatePagination } = require('../middlewares/validation');
const { sendResponse } = require('../utils/response');

/**
 * @swagger
 * /api/matches/bulk:
 *   post:
 *     summary: Bulk create matches for a tournament
 *     tags: [Matches]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matches]
 *             properties:
 *               matches:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [tournament_id, category_id, home_team_id, away_team_id]
 *                   properties:
 *                     tournament_id: { type: integer }
 *                     category_id: { type: integer }
 *                     home_team_id: { type: integer }
 *                     away_team_id: { type: integer }
 *                     round: { type: integer }
 *                     scheduled_at: { type: string, format: date-time }
 *                     venue: { type: string }
 *     responses:
 *       201:
 *         description: Matches created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       400: { description: Validation error }
 */
router.post('/bulk', generalLimiter, protect, validateBulkMatchCreate, async (req, res) => {
  try {
  const created = await matchService.bulkCreateMatches(req.body.matches, req.user);
    sendResponse(res, { status: 201, message: 'Matches created successfully', data: { matches: created } });
  } catch (err) {
    console.error("Bulk match create error:", err);
    sendResponse(res, { success: false, status: 500, message: err.message || 'Error creating matches' });
  }
});

/**
 * @swagger
 * /api/matches/by-tournament/{id}:
 *   get:
 *     summary: Get all matches for a tournament grouped by category
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Tournament ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *         description: Page size
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [scheduled, live, completed, cancelled, postponed] }
 *         description: Filter by match status
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Filter matches scheduled at or after this timestamp
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Filter matches scheduled at or before this timestamp
 *     responses:
 *       200:
 *         description: Grouped matches returned with pagination meta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 status: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     grouped:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items: { type: object }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *       400: { description: Invalid tournament ID }
 *       500: { description: Server error }
 */
router.get('/by-tournament/:id', generalLimiter, validateTournamentId, validatePagination, async (req, res) => {
  try {
  const { page, limit, status, from, to } = req.query;
  const result = await matchService.getGroupedMatchesForTournament(req.params.id, req.user, { page, limit, status, from, to });
  sendResponse(res, { data: { grouped: result.grouped, meta: result.meta } });
  } catch (err) {
    console.error("Error fetching matches by tournament:", err);
    sendResponse(res, { success: false, status: 500, message: 'Error fetching matches' });
  }
});

/**
 * @swagger
 * /api/matches/by-athlete/{athleteId}:
 *   get:
 *     summary: Get matches for a specific athlete (via team membership)
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema: { type: string }
 *         description: Athlete ID (UUID or string identifier)
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 25 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [scheduled, live, completed, cancelled, postponed] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Athlete matches returned with pagination meta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 status: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items: { type: object }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *       500: { description: Server error }
 */
router.get('/by-athlete/:athleteId', generalLimiter, validatePagination, async (req, res) => {
  try {
  const { page, limit, status, from, to } = req.query;
  const result = await matchService.getMatchesForAthlete(req.params.athleteId, req.user, { page, limit, status, from, to });
  sendResponse(res, { data: { matches: result.data, meta: result.meta } });
  } catch (err) {
    sendResponse(res, { success: false, status: 500, message: err.message || 'Error fetching athlete matches' });
  }
});

module.exports = router;
