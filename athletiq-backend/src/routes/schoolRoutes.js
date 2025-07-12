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
router.post('/register', generalLimiter, validateSchoolRegistration, schoolController.registerSchool);

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
router.get('/me/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolTeams);

/**
 * @route   GET /api/schools/me/teams/sports
 * @desc    Get sports configuration
 * @access  Private (SchoolAdmin)
 */
router.get('/me/teams/sports', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSportsConfig);

/**
 * @route   POST /api/schools/me/teams
 * @desc    Create a new team
 * @access  Private (SchoolAdmin)
 */
router.post('/me/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.createSchoolTeam);

/**
 * @route   PUT /api/schools/me/teams/:teamId
 * @desc    Update a team
 * @access  Private (SchoolAdmin)
 */
router.put('/me/teams/:teamId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updateSchoolTeam);

/**
 * @route   DELETE /api/schools/me/teams/:teamId
 * @desc    Delete a team
 * @access  Private (SchoolAdmin)
 */
router.delete('/me/teams/:teamId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.deleteSchoolTeam);

/**
 * @route   POST /api/schools/me/teams/:teamId/players
 * @desc    Add a player to a team
 * @access  Private (SchoolAdmin)
 */
router.post('/me/teams/:teamId/players', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.addPlayerToTeam);

/**
 * @route   DELETE /api/schools/me/teams/:teamId/players/:playerId
 * @desc    Remove a player from a team
 * @access  Private (SchoolAdmin)
 */
router.delete('/me/teams/:teamId/players/:playerId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.removePlayerFromTeam);

/**
 * @route   PUT /api/schools/me/teams/:teamId/players/positions
 * @desc    Update player positions in team
 * @access  Private (SchoolAdmin)
 */
router.put('/me/teams/:teamId/players/positions', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updatePlayerPositions);

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
 * @desc    Get houses for the school (mock data for now)
 * @access  Private (SchoolAdmin)
 */
router.get('/houses', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolHouses);

/**
 * @route   GET /api/schools/staff
 * @desc    Get staff for the school (mock data for now)
 * @access  Private (SchoolAdmin)
 */
router.get('/staff', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolStaff);

/**
 * @route   GET /api/schools/notifications
 * @desc    Get notifications for the school (mock data for now)
 * @access  Private (SchoolAdmin)
 */
router.get('/notifications', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolNotifications);

/**
 * @route   GET /api/schools/activities
 * @desc    Get activities for the school (mock data for now)
 * @access  Private (SchoolAdmin)
 */
router.get('/activities', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolActivities);

// You can add the update route here later, pointing to a controller function
// router.patch('/:id', protect, upload.fields([...]), schoolController.updateSchool);

module.exports = router;