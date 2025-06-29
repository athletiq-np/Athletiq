// src/controllers/matchController.js

const matchService = require('../services/matchService');

// Create match
exports.createMatch = async (req, res) => {
  try {
    const match = await matchService.createMatch(req.body, req.user);
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Generate fixtures
exports.generateFixtures = async (req, res) => {
  try {
    const fixtures = await matchService.generateFixtures(req.body, req.user);
    res.json(fixtures);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// List matches for a tournament
exports.getMatchesForTournament = async (req, res) => {
  try {
    const matches = await matchService.getMatchesForTournament(req.params.tournamentId, req.user);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one match
exports.getMatchById = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id, req.user);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update match
exports.updateMatch = async (req, res) => {
  try {
    const updated = await matchService.updateMatch(req.params.id, req.body, req.user);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Soft-delete
exports.deleteMatch = async (req, res) => {
  try {
    await matchService.deleteMatch(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
