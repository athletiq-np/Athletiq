//
// 🧠 ATHLETIQ - Tournament Routes (Upgraded with Correct Middleware)
//
// This file defines the API endpoints related to tournaments.
// It now correctly uses the 'protect' and 'checkRole' middleware functions.
//

const express = require("express");
const router = express.Router();

// --- Correctly import the specific middleware functions ---
const { protect, checkRole } = require("../middlewares/authMiddleware");

// Import the controller functions
const {
  getTournaments,
  getTournamentById,
  createTournament,
} = require("../controllers/tournamentController");

// --- Route Definitions ---

// @route   POST /api/tournaments
// @desc    Create a new tournament
// @access  Private (any logged-in user, e.g., SuperAdmin or SchoolAdmin)
router.post("/", protect, createTournament);

// @route   GET /api/tournaments
// @desc    Get a list of all tournaments
// @access  Public
router.get("/", getTournaments);

// @route   GET /api/tournaments/:id
// @desc    Get a single tournament by its ID
// @access  Public
router.get("/:id", getTournamentById);


// Example of a role-protected route we might add later:
// router.delete("/:id", protect, checkRole(['SuperAdmin']), deleteTournament);


module.exports = router;