// src/routes/scorecardRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const scorecardController = require('../controllers/scorecardController');

// Upload a new scorecard (manual or PDF/image)
router.post('/:matchId', auth(['data-entry', 'manager', 'owner']), scorecardController.uploadScorecard);

// Get all scorecards for a match
router.get('/:matchId', auth(), scorecardController.getScorecardsForMatch);

module.exports = router;
