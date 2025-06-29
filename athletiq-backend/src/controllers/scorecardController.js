// src/controllers/scorecardController.js

const scorecardService = require('../services/scorecardService');

// Upload scorecard
exports.uploadScorecard = async (req, res) => {
  try {
    const scorecard = await scorecardService.uploadScorecard(req.params.matchId, req.body, req.user);
    res.status(201).json(scorecard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// List scorecards for a match
exports.getScorecardsForMatch = async (req, res) => {
  try {
    const scorecards = await scorecardService.getScorecardsForMatch(req.params.matchId, req.user);
    res.json(scorecards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
