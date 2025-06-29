const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/tournamentSportsController');

// Add a sport to a tournament
router.post('/:id/sports', auth, ctrl.addSport);

// Get all sports for a tournament
router.get('/:id/sports', auth, ctrl.getSports);

// Edit a tournament sport entry
router.put('/sports/:sportId', auth, ctrl.editSport);

// Delete a tournament sport
router.delete('/sports/:sportId', auth, ctrl.deleteSport);

module.exports = router;
