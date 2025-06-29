const service = require('../services/tournamentSportsService');

// Add sport
exports.addSport = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;
    const sport = await service.addSport(tournament_id, req.body);
    res.status(201).json(sport);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all sports for a tournament
exports.getSports = async (req, res) => {
  try {
    const { id: tournament_id } = req.params;
    const sports = await service.getSports(tournament_id);
    res.json(sports);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit
exports.editSport = async (req, res) => {
  try {
    const { sportId } = req.params;
    const updated = await service.editSport(sportId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteSport = async (req, res) => {
  try {
    const { sportId } = req.params;
    await service.deleteSport(sportId);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
