/**
 * Matchday Operations Routes
 * Live tournament execution, real-time scoring, and match management
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validation');
const {
  getLiveTournamentDashboard,
  startLiveMatch,
  updateLiveScore,
  endLiveMatch,
  getLiveMatchDetails,
  getLiveLeaderboard
} = require('../controllers/simpleMatchdayController');

// Validation rules
const matchIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid match ID format')
];

const tournamentIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid tournament ID format')
];

const startMatchValidation = [
  body('referee_id').optional().isInt({ min: 1 }).withMessage('Invalid referee ID'),
  body('official_notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
];

const scoreUpdateValidation = [
  body('team1_score').isInt({ min: 0 }).withMessage('Team 1 score must be a non-negative integer'),
  body('team2_score').isInt({ min: 0 }).withMessage('Team 2 score must be a non-negative integer'),
  body('event_description').optional().isLength({ max: 200 }).withMessage('Event description too long'),
  body('event_type').optional().isIn(['goal', 'penalty', 'card', 'substitution', 'score_update', 'other']).withMessage('Invalid event type')
];

const endMatchValidation = [
  body('final_notes').optional().isLength({ max: 500 }).withMessage('Final notes too long'),
  body('winner_team_id').optional().isInt({ min: 1 }).withMessage('Invalid winner team ID')
];

/**
 * @route   GET /api/matchday/tournaments/:id/dashboard
 * @desc    Get live tournament dashboard with real-time statistics
 * @access  Private (Organizer/Admin)
 */
router.get('/tournaments/:id/dashboard', 
  tournamentIdValidation,
  validateRequest,
  auth,
  getLiveTournamentDashboard
);

/**
 * @route   POST /api/matchday/matches/:id/start
 * @desc    Start a live match
 * @access  Private (Referee/Admin)
 */
router.post('/matches/:id/start',
  matchIdValidation,
  startMatchValidation,
  validateRequest,
  auth,
  startLiveMatch
);

/**
 * @route   PUT /api/matchday/matches/:id/score
 * @desc    Update live match score in real-time
 * @access  Private (Referee/Admin)
 */
router.put('/matches/:id/score',
  matchIdValidation,
  scoreUpdateValidation,
  validateRequest,
  auth,
  updateLiveScore
);

/**
 * @route   POST /api/matchday/matches/:id/end
 * @desc    End a live match and finalize results
 * @access  Private (Referee/Admin)
 */
router.post('/matches/:id/end',
  matchIdValidation,
  endMatchValidation,
  validateRequest,
  auth,
  endLiveMatch
);

/**
 * @route   GET /api/matchday/matches/:id/live
 * @desc    Get live match details with real-time data
 * @access  Public
 */
router.get('/matches/:id/live',
  matchIdValidation,
  validateRequest,
  getLiveMatchDetails
);

/**
 * @route   GET /api/matchday/tournaments/:id/leaderboard
 * @desc    Get real-time tournament leaderboard
 * @access  Public
 */
router.get('/tournaments/:id/leaderboard',
  tournamentIdValidation,
  validateRequest,
  getLiveLeaderboard
);

module.exports = router;
