//
// 🧠 ATHLETIQ - Tournament Routes (Upgraded with Correct Middleware)
//
// This file defines the API endpoints related to tournaments.
// It now correctly uses the 'protect' and 'checkRole' middleware functions.
//

/**
 * @swagger
 * tags:
 *   name: Tournaments
 *   description: Tournament management endpoints
 */

const express = require("express");
const router = express.Router();

// --- Correctly import the specific middleware functions ---
const { protect, checkRole } = require("../middlewares/authMiddleware");
const { validateTournament, validateTournamentId } = require("../middlewares/validation");
const { generalLimiter } = require("../middlewares/rateLimiter");

// Import the controller functions
const {
  getTournaments,
  getTournamentById,
  createTournament,
  registerTeamForTournament,
  generateTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
} = require("../controllers/tournamentController");

// --- Route Definitions ---

/**
 * @swagger
 * /api/tournaments:
 *   post:
 *     summary: Create a new tournament
 *     description: Create a new tournament with the provided details
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Tournament name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Tournament description
 *               level:
 *                 type: string
 *                 enum: [school, district, provincial, national, international]
 *                 description: Tournament level
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Tournament start date
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Tournament end date
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 description: Tournament logo URL
 *               sports_config:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Sports configuration
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
// @route   POST /api/tournaments
// @desc    Create a new tournament
// @access  Private (any logged-in user, e.g., SuperAdmin or SchoolAdmin)
router.post("/", generalLimiter, protect, validateTournament, createTournament);

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Get all tournaments
 *     description: Retrieve a list of all tournaments
 *     tags: [Tournaments]
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tournament'
 *       429:
 *         description: Too many requests
 */
// @route   GET /api/tournaments
// @desc    Get a list of all tournaments
// @access  Public
router.get("/", generalLimiter, getTournaments);

/**
 * @swagger
 * /api/tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     description: Retrieve a specific tournament by its ID
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Invalid tournament ID
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   GET /api/tournaments/:id
// @desc    Get a single tournament by its ID
// @access  Public
router.get("/:id", generalLimiter, validateTournamentId, getTournamentById);

/**
 * @swagger
 * /api/tournaments/{id}/register:
 *   post:
 *     summary: Register a team for a tournament
 *     description: Register a team to participate in the tournament
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_id
 *             properties:
 *               team_id:
 *                 type: integer
 *                 description: ID of the team to register
 *     responses:
 *       200:
 *         description: Team registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tournament_id:
 *                           type: integer
 *                         team_id:
 *                           type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament or team not found
 *       429:
 *         description: Too many requests
 */
// @route   POST /api/tournaments/:id/register
// @desc    Register team for tournament
// @access  Private (SchoolAdmin)
router.post("/:id/register", generalLimiter, protect, checkRole(['SchoolAdmin', 'SuperAdmin']), registerTeamForTournament);

/**
 * @swagger
 * /api/tournaments/{id}/generate-bracket:
 *   post:
 *     summary: Generate tournament bracket
 *     description: Generate the bracket for the tournament
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Bracket generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tournament_id:
 *                           type: integer
 *                         bracket:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid tournament ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   POST /api/tournaments/:id/generate-bracket
// @desc    Generate tournament bracket
// @access  Private (Admin)
router.post("/:id/generate-bracket", generalLimiter, protect, checkRole(['SuperAdmin']), generateTournamentBracket);

/**
 * @swagger
 * /api/tournaments/{id}/bracket:
 *   get:
 *     summary: Get tournament bracket
 *     description: Retrieve the bracket for a specific tournament
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Bracket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tournament_id:
 *                           type: integer
 *                         bracket:
 *                           type: array
 *                           items:
 *                             type: object
 *       400:
 *         description: Invalid tournament ID
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   GET /api/tournaments/:id/bracket
// @desc    Get tournament bracket
// @access  Public
router.get("/:id/bracket", generalLimiter, getTournamentBracket);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/matches/{matchId}/result:
 *   patch:
 *     summary: Update match result
 *     description: Update the result of a match in the tournament
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Tournament ID
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *             properties:
 *               result:
 *                 type: string
 *                 description: Result of the match (e.g., 'Team A 3 - 1 Team B')
 *     responses:
 *       200:
 *         description: Match result updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tournament_id:
 *                           type: integer
 *                         match_id:
 *                           type: integer
 *                         result:
 *                           type: string
 *       400:
 *         description: Invalid tournament or match ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament or match not found
 *       429:
 *         description: Too many requests
 */
// @route   PATCH /api/tournaments/:tournamentId/matches/:matchId/result
// @desc    Update match result
// @access  Private (Admin/Referee)
router.patch("/:tournamentId/matches/:matchId/result", generalLimiter, protect, checkRole(['SuperAdmin', 'Referee']), updateMatchResult);


// Example of a role-protected route we might add later:
// router.delete("/:id", protect, checkRole(['SuperAdmin']), deleteTournament);


module.exports = router;