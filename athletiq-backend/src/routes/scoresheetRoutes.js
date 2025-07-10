const express = require('express');
const router = express.Router();
const ScoresheetController = require('../controllers/scoresheetController');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Scoresheets
 *   description: Football scoresheet generation and management
 */

/**
 * @swagger
 * /api/scoresheets/football/generate:
 *   post:
 *     summary: Generate a football scoresheet
 *     tags: [Scoresheets]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               useRealData:
 *                 type: boolean
 *                 default: true
 *               format:
 *                 type: string
 *                 enum: [blank, pre-filled]
 *                 default: blank
 *               schoolLimit:
 *                 type: integer
 *                 default: 8
 *               useAdminFilter:
 *                 type: boolean
 *                 default: false
 *               adminEmail:
 *                 type: string
 *                 default: admin@test.com
 *               matchInfo:
 *                 type: object
 *                 properties:
 *                   homeTeamId:
 *                     type: integer
 *                   awayTeamId:
 *                     type: integer
 *                   matchDate:
 *                     type: string
 *                     format: date
 *                   venue:
 *                     type: string
 *     responses:
 *       200:
 *         description: Scoresheet generated successfully
 *       500:
 *         description: Server error
 */
router.post('/football/generate', generalLimiter, ScoresheetController.generateFootballScoresheet);

/**
 * @swagger
 * /api/scoresheets/football/batch:
 *   post:
 *     summary: Generate multiple football scoresheets
 *     tags: [Scoresheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchList:
 *                 type: array
 *                 items:
 *                   type: object
 *               defaultOptions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Batch scoresheets generated successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/football/batch', generalLimiter, protect, checkRole(['SuperAdmin', 'SchoolAdmin']), ScoresheetController.batchGenerateFootballScoresheets);

/**
 * @swagger
 * /api/scoresheets/schools:
 *   get:
 *     summary: Get available schools for scoresheet generation
 *     tags: [Scoresheets]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of schools to retrieve
 *       - in: query
 *         name: adminEmail
 *         schema:
 *           type: string
 *         description: Filter schools by admin email
 *     responses:
 *       200:
 *         description: Schools retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/schools', generalLimiter, ScoresheetController.getAvailableSchools);

/**
 * @swagger
 * /api/scoresheets/schools/{schoolId}/teams:
 *   get:
 *     summary: Get teams for a specific school
 *     tags: [Scoresheets]
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID
 *     responses:
 *       200:
 *         description: School teams retrieved successfully
 *       404:
 *         description: School not found
 *       500:
 *         description: Server error
 */
router.get('/schools/:schoolId/teams', generalLimiter, ScoresheetController.getSchoolTeams);

/**
 * @swagger
 * /api/scoresheets/teams/match:
 *   post:
 *     summary: Generate scoresheet for specific teams
 *     tags: [Scoresheets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - homeTeamId
 *               - awayTeamId
 *             properties:
 *               homeTeamId:
 *                 type: integer
 *               awayTeamId:
 *                 type: integer
 *               matchDate:
 *                 type: string
 *                 format: date
 *               venue:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [blank, pre-filled]
 *                 default: blank
 *     responses:
 *       200:
 *         description: Team match scoresheet generated successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.post('/teams/match', generalLimiter, ScoresheetController.generateTeamMatch);

/**
 * @swagger
 * /api/scoresheets/football/template-info:
 *   get:
 *     summary: Get football template information
 *     tags: [Scoresheets]
 *     responses:
 *       200:
 *         description: Template information retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/football/template-info', generalLimiter, ScoresheetController.getTemplateInfo);

/**
 * @swagger
 * /api/scoresheets/football/preview:
 *   get:
 *     summary: Preview scoresheet with sample data
 *     tags: [Scoresheets]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [blank, pre-filled]
 *           default: blank
 *         description: Template format
 *     responses:
 *       200:
 *         description: Preview scoresheet generated successfully
 *       500:
 *         description: Server error
 */
router.get('/football/preview', generalLimiter, ScoresheetController.previewScoresheet);

module.exports = router;
