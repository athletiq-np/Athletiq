const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { validateSchoolRegistration } = require('../middlewares/validation');
const { generalLimiter } = require('../middlewares/rateLimiter');
const multer = require('multer');

// Configure multer for file uploads if needed for specific routes
const upload = multer({ dest: 'uploads/' });

/**
 * @route   POST /api/schools/register
 * @desc    Public route for a new school to register itself and an admin user.
 * @access  Public
 */
// Temporarily disabled for debugging
// router.post('/register', generalLimiter, validateSchoolRegistration, schoolController.registerSchool);

/**
 * @route   GET /api/schools
 * @desc    Get a list of all schools.
 * @access  Private (SuperAdmin only)
 */
router.get('/', generalLimiter, protect, checkRole(['SuperAdmin']), schoolController.getAllSchools);

/**
 * @route   GET /api/schools/me
 * @desc    Get the profile of the currently logged-in School Admin's school.
 * @access  Private (SchoolAdmin only)
 */
router.get('/me', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getMySchoolProfile);

/**
 * @route   PATCH /api/schools/me
 * @desc    Update the profile of the currently logged-in School Admin's school.
 * @access  Private (SchoolAdmin only)
 */
router.patch('/me', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updateMySchoolProfile);

/**
 * @route   GET /api/schools/me/tournaments
 * @desc    Get tournaments for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/me/tournaments', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getMySchoolTournaments);

/**
 * @route   GET /api/schools/me/teams
 * @desc    Get teams for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/me/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getMySchoolTeams);

/**
 * @route   GET /api/schools/me/players
 * @desc    Get players for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/me/players', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getMySchoolPlayers);

/**
 * @route   GET /api/schools/me/tournament-stats
 * @desc    Get tournament statistics for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/me/tournament-stats', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getMySchoolTournamentStats);

/**
 * @route   GET /api/schools/houses
 * @desc    Get school houses
 * @access  Private (SchoolAdmin)
 */
router.get('/houses', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolHouses);

/**
 * @route   GET /api/schools/staff
 * @desc    Get school staff
 * @access  Private (SchoolAdmin)
 */
router.get('/staff', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolStaff);

/**
 * @route   GET /api/schools/notifications
 * @desc    Get school notifications
 * @access  Private (SchoolAdmin)
 */
router.get('/notifications', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolNotifications);

/**
 * @route   GET /api/schools/activities
 * @desc    Get school activities
 * @access  Private (SchoolAdmin)
 */
router.get('/activities', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolActivities);

/**
 * @route   POST /api/schools/teams
 * @desc    Create a new team for the school
 * @access  Private (SchoolAdmin)
 */
router.post('/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.createSchoolTeam);

/**
 * @route   PUT /api/schools/teams/:teamId
 * @desc    Update a team
 * @access  Private (SchoolAdmin)
 */
router.put('/teams/:teamId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updateSchoolTeam);

/**
 * @route   DELETE /api/schools/teams/:teamId
 * @desc    Delete a team
 * @access  Private (SchoolAdmin)
 */
router.delete('/teams/:teamId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.deleteSchoolTeam);

/**
 * @route   GET /api/schools/teams/:teamId
 * @desc    Get a specific team
 * @access  Private (SchoolAdmin)
 */
router.get('/teams/:teamId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolTeam);

/**
 * @route   POST /api/schools/teams/:teamId/players
 * @desc    Add a player to a team
 * @access  Private (SchoolAdmin)
 */
router.post('/teams/:teamId/players', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.addPlayerToTeam);

/**
 * @route   DELETE /api/schools/teams/:teamId/players/:playerId
 * @desc    Remove a player from a team
 * @access  Private (SchoolAdmin)
 */
router.delete('/teams/:teamId/players/:playerId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.removePlayerFromTeam);

/**
 * @route   PUT /api/schools/teams/:teamId/players/:playerId/position
 * @desc    Update a player's position in a team
 * @access  Private (SchoolAdmin)
 */
router.put('/teams/:teamId/players/:playerId/position', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updatePlayerPosition);

/**
 * @route   GET /api/schools/teams
 * @desc    Get all teams for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolTeams);

/**
 * @route   GET /api/schools/sports-config
 * @desc    Get sports configuration for the school
 * @access  Private (SchoolAdmin)
 */
router.get('/sports-config', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSportsConfig);

module.exports = router;
