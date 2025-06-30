const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getTournaments,
  getTournamentById,
  createTournament,
} = require("../controllers/tournamentController");

router.post("/", authMiddleware, createTournament);
router.get("/", getTournaments);
router.get("/:id", getTournamentById);

module.exports = router;
