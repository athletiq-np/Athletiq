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
  updateTournamentStatus,
  assignTournamentOrganizer,
  checkTournamentEligibility,
  getTournamentDashboard,
  registerTeamForTournament,
  generateTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  getRegistrationDashboard,
  checkPlayerEligibility,
  registerTeamEnhanced,
  updateTeamRegistrationStatus,
  getTournamentTeams,
  bulkUpdateTeamRegistrations,
} = require("../controllers/tournamentController");

// Import certificate controller functions
const {
  createCertificateTemplate,
  getCertificateTemplates,
  generateCertificate,
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  getTournamentCertificates,
  bulkGenerateCertificates,
} = require("../controllers/certificateController");

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

/**
 * @swagger
 * /api/tournaments/{id}/status:
 *   patch:
 *     summary: Update tournament status
 *     description: Update the status of a tournament (e.g., active, inactive)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status of the tournament
 *     responses:
 *       200:
 *         description: Tournament status updated successfully
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
 *                         status:
 *                           type: string
 *       400:
 *         description: Invalid tournament ID or status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   PATCH /api/tournaments/:id/status
// @desc    Update tournament status
// @access  Private (Admin/Organizer)
router.patch("/:id/status", generalLimiter, protect, updateTournamentStatus);

/**
 * @swagger
 * /api/tournaments/{id}/organizer:
 *   patch:
 *     summary: Assign tournament organizer
 *     description: Assign a user as the organizer of the tournament
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
 *               - organizer_id
 *             properties:
 *               organizer_id:
 *                 type: integer
 *                 description: ID of the user to assign as organizer
 *     responses:
 *       200:
 *         description: Organizer assigned successfully
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
 *                         organizer_id:
 *                           type: integer
 *       400:
 *         description: Invalid tournament ID or organizer ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   PATCH /api/tournaments/:id/organizer
// @desc    Assign tournament organizer
// @access  Private (SuperAdmin)
router.patch("/:id/organizer", generalLimiter, protect, checkRole(['SuperAdmin']), assignTournamentOrganizer);

/**
 * @swagger
 * /api/tournaments/{id}/check-eligibility:
 *   post:
 *     summary: Check tournament eligibility
 *     description: Check if a team is eligible to participate in the tournament
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
 *                 description: ID of the team to check eligibility for
 *     responses:
 *       200:
 *         description: Eligibility checked successfully
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
 *                         eligible:
 *                           type: boolean
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
// @route   POST /api/tournaments/:id/check-eligibility
// @desc    Check tournament eligibility
// @access  Private
router.post("/:id/check-eligibility", generalLimiter, protect, checkTournamentEligibility);

/**
 * @swagger
 * /api/tournaments/{id}/dashboard:
 *   get:
 *     summary: Get tournament dashboard data
 *     description: Retrieve dashboard data for a specific tournament
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
 *         description: Tournament dashboard data retrieved successfully
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
 *                         teams_registered:
 *                           type: integer
 *                         matches_played:
 *                           type: integer
 *                         current_stage:
 *                           type: string
 *       400:
 *         description: Invalid tournament ID
 *       404:
 *         description: Tournament not found
 *       429:
 *         description: Too many requests
 */
// @route   GET /api/tournaments/:id/dashboard
// @desc    Get tournament dashboard data
// @access  Private (Admin/Organizer)
router.get("/:id/dashboard", generalLimiter, protect, getTournamentDashboard);

// Enhanced Registration & Team Onboarding Routes

/**
 * @swagger
 * /api/tournaments/{id}/registration-dashboard:
 *   get:
 *     summary: Get tournament registration dashboard
 *     description: Get detailed registration dashboard with statistics and team details
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Registration dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   GET /api/tournaments/:id/registration-dashboard
// @desc    Get tournament registration dashboard
// @access  Private (Admin/Organizer)
router.get("/:id/registration-dashboard", generalLimiter, protect, getRegistrationDashboard);

/**
 * @swagger
 * /api/tournaments/{id}/check-eligibility:
 *   post:
 *     summary: Check player eligibility for tournament
 *     description: Check if players meet tournament eligibility requirements
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - player_ids
 *             properties:
 *               player_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of player IDs to check
 *     responses:
 *       200:
 *         description: Eligibility check completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   POST /api/tournaments/:id/check-eligibility
// @desc    Check player eligibility for tournament
// @access  Private (Admin/Organizer)
router.post("/:id/check-eligibility", generalLimiter, protect, checkPlayerEligibility);

/**
 * @swagger
 * /api/tournaments/{id}/register-team:
 *   post:
 *     summary: Enhanced team registration
 *     description: Register a team with enhanced validation and multi-step process
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               player_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of player IDs to register
 *               auto_confirm:
 *                 type: boolean
 *                 description: Whether to auto-confirm registration if eligible
 *               notes:
 *                 type: string
 *                 description: Additional notes for registration
 *     responses:
 *       200:
 *         description: Team registration completed
 *       400:
 *         description: Invalid request or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   POST /api/tournaments/:id/register-team
// @desc    Enhanced team registration with multi-step validation
// @access  Private (SchoolAdmin)
router.post("/:id/register-team", generalLimiter, protect, checkRole(['SchoolAdmin', 'SuperAdmin']), registerTeamEnhanced);

/**
 * @swagger
 * /api/tournaments/{id}/teams:
 *   get:
 *     summary: Get tournament teams
 *     description: Get all teams registered for a tournament
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, registered, rejected, withdrawn, all]
 *         description: Filter teams by registration status
 *       - in: query
 *         name: include_players
 *         schema:
 *           type: boolean
 *         description: Include player details in response
 *     responses:
 *       200:
 *         description: Tournament teams retrieved successfully
 *       404:
 *         description: Tournament not found
 */
// @route   GET /api/tournaments/:id/teams
// @desc    Get tournament registered teams with details
// @access  Public
router.get("/:id/teams", generalLimiter, getTournamentTeams);

/**
 * @swagger
 * /api/tournaments/{id}/teams/{teamId}/status:
 *   patch:
 *     summary: Update team registration status
 *     description: Update the registration status of a team
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, registered, rejected, withdrawn]
 *                 description: New registration status
 *               notes:
 *                 type: string
 *                 description: Notes for status change
 *               seed_order:
 *                 type: integer
 *                 description: Seed order for the team
 *     responses:
 *       200:
 *         description: Team registration status updated successfully
 *       400:
 *         description: Invalid status or request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament or team not found
 */
// @route   PATCH /api/tournaments/:id/teams/:teamId/status
// @desc    Update team registration status
// @access  Private (Admin/Organizer)
router.patch("/:id/teams/:teamId/status", generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), updateTeamRegistrationStatus);

/**
 * @swagger
 * /api/tournaments/{id}/teams/bulk-update:
 *   patch:
 *     summary: Bulk update team registrations
 *     description: Update multiple team registrations at once
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tournament_team_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [pending, registered, rejected, withdrawn]
 *                     seed_order:
 *                       type: integer
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk update completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   PATCH /api/tournaments/:id/teams/bulk-update
// @desc    Bulk update team registrations
// @access  Private (Admin/Organizer)
router.patch("/:id/teams/bulk-update", generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), bulkUpdateTeamRegistrations);

// =====================================================
// CERTIFICATE MANAGEMENT ROUTES
// =====================================================

/**
 * @swagger
 * /api/tournaments/{id}/certificates/templates:
 *   post:
 *     summary: Create a certificate template for a tournament
 *     tags: [Tournaments, Certificates]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - template_type
 *               - template_data
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               template_type:
 *                 type: string
 *                 enum: [participation, winner, runner_up, achievement]
 *                 description: Type of certificate
 *               template_data:
 *                 type: object
 *                 description: Template configuration
 *     responses:
 *       201:
 *         description: Certificate template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
// @route   POST /api/tournaments/:id/certificates/templates
// @desc    Create a certificate template for a tournament
// @access  Private (Admin/Organizer)
router.post("/:id/certificates/templates", generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), createCertificateTemplate);

/**
 * @swagger
 * /api/tournaments/{id}/certificates/templates:
 *   get:
 *     summary: Get certificate templates for a tournament
 *     tags: [Tournaments, Certificates]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Certificate templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   GET /api/tournaments/:id/certificates/templates
// @desc    Get certificate templates for a tournament
// @access  Private
router.get("/:id/certificates/templates", generalLimiter, protect, getCertificateTemplates);

/**
 * @swagger
 * /api/tournaments/{id}/certificates/generate:
 *   post:
 *     summary: Generate a certificate for a participant
 *     tags: [Tournaments, Certificates]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participant_id
 *               - participant_type
 *               - template_id
 *               - certificate_type
 *             properties:
 *               participant_id:
 *                 type: integer
 *                 description: ID of the participant (player or team)
 *               participant_type:
 *                 type: string
 *                 enum: [player, team]
 *                 description: Type of participant
 *               template_id:
 *                 type: integer
 *                 description: Certificate template ID
 *               certificate_type:
 *                 type: string
 *                 enum: [participation, winner, runner_up, achievement]
 *                 description: Type of certificate
 *               achievement_details:
 *                 type: object
 *                 description: Additional achievement information
 *     responses:
 *       201:
 *         description: Certificate generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
// @route   POST /api/tournaments/:id/certificates/generate
// @desc    Generate a certificate for a participant
// @access  Private (Admin/Organizer)
router.post("/:id/certificates/generate", generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), generateCertificate);

/**
 * @swagger
 * /api/tournaments/{id}/certificates:
 *   get:
 *     summary: Get all certificates for a tournament
 *     tags: [Tournaments, Certificates]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *       - name: participant_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [player, team]
 *         description: Filter by participant type
 *       - name: certificate_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [participation, winner, runner_up, achievement]
 *         description: Filter by certificate type
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
// @route   GET /api/tournaments/:id/certificates
// @desc    Get all certificates for a tournament
// @access  Private
router.get("/:id/certificates", generalLimiter, protect, getTournamentCertificates);

/**
 * @swagger
 * /api/tournaments/{id}/certificates/bulk-generate:
 *   post:
 *     summary: Bulk generate certificates for tournament participants
 *     tags: [Tournaments, Certificates]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - certificate_requests
 *             properties:
 *               certificate_requests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - participant_id
 *                     - participant_type
 *                     - template_id
 *                     - certificate_type
 *                   properties:
 *                     participant_id:
 *                       type: integer
 *                     participant_type:
 *                       type: string
 *                       enum: [player, team]
 *                     template_id:
 *                       type: integer
 *                     certificate_type:
 *                       type: string
 *                       enum: [participation, winner, runner_up, achievement]
 *                     achievement_details:
 *                       type: object
 *     responses:
 *       201:
 *         description: Certificates generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
// @route   POST /api/tournaments/:id/certificates/bulk-generate
// @desc    Bulk generate certificates for tournament participants
// @access  Private (Admin/Organizer)
router.post("/:id/certificates/bulk-generate", generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), bulkGenerateCertificates);

// =====================================================
// CERTIFICATE ROUTES (Global - outside tournament context)
// =====================================================

/**
 * These routes need to be mounted separately in the main app
 * as they are not tournament-specific
 */

// Example of a role-protected route we might add later:
// router.delete("/:id", protect, checkRole(['SuperAdmin']), deleteTournament);


module.exports = router;