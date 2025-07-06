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

// You can add the update route here later, pointing to a controller function
// router.patch('/:id', protect, upload.fields([...]), schoolController.updateSchool);

module.exports = router;