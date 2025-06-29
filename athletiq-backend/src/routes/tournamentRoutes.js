// src/routes/tournamentRoutes.js

const express = require("express");
const router = express.Router();
const {
  getTournaments,
  createTournament,
  getTournamentById,
} = require("../controllers/tournamentController");

// Get all tournaments
router.get("/", getTournaments);

// Get single tournament by ID
router.get("/:id", getTournamentById);

// Create tournament
router.post("/", createTournament);

module.exports = router;
