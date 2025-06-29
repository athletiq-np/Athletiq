// src/routes/registrationRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const pool = require('../config/db');

/**
 * Register a team for a tournament (school admin only)
 * POST /api/registrations
 * Body: { team_id, tournament_id }
 */
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'school_admin')
    return res.status(403).json({ message: 'Access denied: school admin only.' });

  const { team_id, tournament_id } = req.body;
  if (!team_id || !tournament_id)
    return res.status(400).json({ message: 'team_id and tournament_id required.' });

  try {
    // Check this admin owns the team
    const school = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );
    if (school.rows.length === 0)
      return res.status(400).json({ message: 'School not found for this admin.' });

    const team = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
      [team_id, school.rows[0].id]
    );
    if (team.rows.length === 0)
      return res.status(403).json({ message: 'Not authorized to register this team.' });

    // Check not already registered
    const exists = await pool.query(
      `SELECT * FROM tournament_registrations WHERE team_id = $1 AND tournament_id = $2`,
      [team_id, tournament_id]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ message: 'Team already registered for this tournament.' });

    // Register!
    const result = await pool.query(
      `INSERT INTO tournament_registrations (team_id, tournament_id, registered_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [team_id, tournament_id]
    );
    res.status(201).json({ registration: result.rows[0] });
  } catch (err) {
    console.error('Register team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * List teams registered for a tournament
 * GET /api/registrations/tournament/:tournament_id
 */
router.get('/tournament/:tournament_id', authMiddleware, async (req, res) => {
  const { tournament_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT tr.*, t.name AS team_name, t.sport
       FROM tournament_registrations tr
       JOIN teams t ON tr.team_id = t.id
       WHERE tr.tournament_id = $1`,
      [tournament_id]
    );
    res.json({ registrations: result.rows });
  } catch (err) {
    console.error('List registrations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

/**
 * ONBOARDING NOTES:
 * - School admins can register their teams to tournaments.
 * - Use POST /api/registrations { team_id, tournament_id } to register.
 * - To use: register route in server.js:
 *   app.use('/api/registrations', require('./src/routes/registrationRoutes'))
 */
