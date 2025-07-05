// src/controllers/matchController.js

const matchService = require('../services/matchService');
const apiResponse = require('../utils/apiResponse');

// Create match
exports.createMatch = async (req, res) => {
  try {
    const match = await matchService.createMatch(req.body, req.user);
    res.status(201).json(apiResponse.success(match, 'Match created successfully'));
  } catch (err) {
    res.status(400).json(apiResponse.error(err.message, 400));
  }
};

// Generate fixtures
exports.generateFixtures = async (req, res) => {
  try {
    const fixtures = await matchService.generateFixtures(req.body, req.user);
    res.json(apiResponse.success(fixtures, 'Fixtures generated successfully'));
  } catch (err) {
    res.status(400).json(apiResponse.error(err.message, 400));
  }
};

// List matches for a tournament
exports.getMatchesForTournament = async (req, res) => {
  try {
    const matches = await matchService.getMatchesForTournament(req.params.tournamentId, req.user);
    res.json(apiResponse.success(matches, 'Matches retrieved successfully'));
  } catch (err) {
    res.status(500).json(apiResponse.error(err.message, 500));
  }
};

// Get one match
exports.getMatchById = async (req, res) => {
  try {
    const match = await matchService.getMatchById(req.params.id, req.user);
    if (!match) return res.status(404).json(apiResponse.error('Match not found', 404));
    res.json(apiResponse.success(match, 'Match retrieved successfully'));
  } catch (err) {
    res.status(500).json(apiResponse.error(err.message, 500));
  }
};

// Update match
exports.updateMatch = async (req, res) => {
  try {
    const updated = await matchService.updateMatch(req.params.id, req.body, req.user);
    res.json(apiResponse.success(updated, 'Match updated successfully'));
  } catch (err) {
    res.status(400).json(apiResponse.error(err.message, 400));
  }
};

// Soft-delete
exports.deleteMatch = async (req, res) => {
  try {
    await matchService.deleteMatch(req.params.id, req.user);
    res.status(204).json(apiResponse.success(null, 'Match deleted successfully'));
  } catch (err) {
    res.status(400).json(apiResponse.error(err.message, 400));
  }
};
