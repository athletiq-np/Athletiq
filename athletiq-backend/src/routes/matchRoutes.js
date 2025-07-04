// src/routes/matchRoutes.js

const express = require('express');
const router = express.Router();
const matchService = require('../services/matchService');
const { protect } = require('../middlewares/authMiddleware');
const { generalLimiter } = require('../middlewares/rateLimiter');
const { validateTournamentId } = require('../middlewares/validation');
const pool = require('../config/db');
const apiResponse = require('../utils/apiResponse');

/**
 * Bulk create matches for a tournament.
 * POST /api/matches/bulk
 * Body: { matches: [ {home_team_id, away_team_id, ...}, ... ] }
 */
router.post('/bulk', generalLimiter, protect, async (req, res) => {
  try {
    if (!Array.isArray(req.body.matches)) {
      return res.status(400).json(apiResponse.error("matches should be an array", 400));
    }
    const created = await matchService.bulkCreateMatches(req.body.matches);
    res.status(201).json(apiResponse.success(created, 'Matches created successfully'));
  } catch (err) {
    console.error("Bulk match create error:", err);
    res.status(500).json(apiResponse.error(err.message || "Error creating matches", 500));
  }
});

/**
 * Get all matches for a tournament (grouped by category)
 * GET /api/matches/by-tournament/:id
 */
router.get('/by-tournament/:id', generalLimiter, validateTournamentId, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM matches WHERE tournament_id = $1 ORDER BY category_id, round, id`,
      [id]
    );

    // Group by category_id
    const grouped = {};
    for (const match of result.rows) {
      if (!grouped[match.category_id]) {
        grouped[match.category_id] = [];
      }
      grouped[match.category_id].push(match);
    }

    res.json({ grouped });
  } catch (err) {
    console.error("Error fetching matches by tournament:", err);
    res.status(500).json({ error: "Error fetching matches" });
  }
});

module.exports = router;
