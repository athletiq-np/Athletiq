// src/controllers/matchController.js

const matchService = require('../services/matchService');
const { sendResponse } = require('../utils/response');

// NOTE: Additional endpoints added for athlete-level match retrieval (frontend widget integration)

// Create match
exports.createMatch = async (req, res) => {
  try {
  const match = await matchService.createMatch(req.body, req.user);
  return sendResponse(res, { status: 201, data: match, message: 'Match created successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 400, message: err.message });
  }
};

// Generate fixtures
exports.generateFixtures = async (req, res) => {
  try {
  const fixtures = await matchService.generateFixtures(req.body, req.user);
  return sendResponse(res, { data: fixtures, message: 'Fixtures generated successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 400, message: err.message });
  }
};

// List matches for a tournament
exports.getMatchesForTournament = async (req, res) => {
  try {
  const matches = await matchService.getMatchesForTournament(req.params.tournamentId, req.user);
  return sendResponse(res, { data: matches, message: 'Matches retrieved successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 500, message: err.message });
  }
};

// Get one match
exports.getMatchById = async (req, res) => {
  try {
  const match = await matchService.getMatchById(req.params.id, req.user);
  if (!match) return sendResponse(res, { success: false, status: 404, message: 'Match not found' });
  return sendResponse(res, { data: match, message: 'Match retrieved successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 500, message: err.message });
  }
};

// Update match
exports.updateMatch = async (req, res) => {
  try {
  const updated = await matchService.updateMatch(req.params.id, req.body, req.user);
  return sendResponse(res, { data: updated, message: 'Match updated successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 400, message: err.message });
  }
};

// Soft-delete
exports.deleteMatch = async (req, res) => {
  try {
  await matchService.deleteMatch(req.params.id, req.user);
  return sendResponse(res, { status: 204, data: null, message: 'Match deleted successfully' });
  } catch (err) {
  return sendResponse(res, { success: false, status: 400, message: err.message });
  }
};

// Get matches for a specific athlete (placeholder implementation calling service stub)
exports.getMatchesForAthlete = async (req, res) => {
  try {
    const athleteId = req.params.athleteId;
    const matches = await matchService.getMatchesForAthlete(athleteId, req.user);
    return sendResponse(res, { data: { matches }, message: 'Athlete matches retrieved successfully' });
  } catch (err) {
    return sendResponse(res, { success: false, status: 500, message: err.message });
  }
};
