//
// 🧠 ATHLETIQ - Tournament Routes
//
// This file defines the API endpoints for all actions related to tournaments.
// It connects the HTTP methods (GET, POST, etc.) to the corresponding controller functions.
//

// --- MODULE IMPORTS ---
const express = require("express");
const router = express.Router();
const {
  getTournaments,
  createTournament,
  getTournamentById,
} = require("../controllers/tournamentController");

// Import our authentication middleware
const authMiddleware = require('../middlewares/authMiddleware');

// --- ROUTE DEFINITIONS ---

// @route   POST /api/tournaments
// @desc    Create a new tournament
// @access  Private (Requires a valid token)
// We add the 'authMiddleware' here. It will run before the 'createTournament' controller.
// If the token is invalid, the middleware will send an error and the controller will never be reached.
router.post("/", authMiddleware, createTournament);

// @route   GET /api/tournaments
// @desc    Get all tournaments
// @access  Public
// This route is public so anyone (even non-logged-in users) can see a list of tournaments.
router.get("/", getTournaments);

// @route   GET /api/tournaments/:id
// @desc    Get a single tournament by its ID
// @access  Public
router.get("/:id", getTournamentById);

// --- MODULE EXPORTS ---
module.exports = router;