// src/routes/bracketRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  generateKnockoutMatches,
  generateRoundRobinMatches,
  generateLeagueMatches,
} = require("../services/bracketGenerator");

// POST /api/brackets/generate
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { tournament_id, category_id, format, total_teams } = req.body;

    if (!tournament_id || !category_id || !format || !total_teams) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    let matches = [];

    switch (format) {
      case "knockout":
        matches = await generateKnockoutMatches(tournament_id, category_id, total_teams);
        break;
      case "roundrobin":
        matches = await generateRoundRobinMatches(tournament_id, category_id, total_teams);
        break;
      case "league":
        matches = await generateLeagueMatches(tournament_id, category_id, total_teams);
        break;
      default:
        return res.status(400).json({ error: "Unsupported format." });
    }

    return res.status(200).json({ message: "Matches generated successfully", matches });
  } catch (err) {
    console.error("Bracket generation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
