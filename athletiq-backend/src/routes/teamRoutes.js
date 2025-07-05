// src/routes/teamRoutes.js

const express = require('express');
const router = express.Router();
const { protect: authMiddleware } = require('../middlewares/authMiddleware');
const { pool, query } = require('../config/db');

/**
 * Create a team (school admin only)
 * POST /api/teams
 */
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'school_admin')
    return res.status(403).json({ message: 'Access denied: school admin only.' });

  const { name, sport, coach_name } = req.body;

  if (!name || !sport) {
    return res.status(400).json({ message: 'Team name and sport are required.' });
  }

  try {
    // Find the school of the admin
    const school = await query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );
    if (school.rows.length === 0) {
      return res.status(400).json({ message: 'School not found for this admin.' });
    }

    const teamRes = await query(
      `INSERT INTO teams (name, sport, coach_name, school_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, sport, coach_name || null, school.rows[0].id]
    );
    res.status(201).json({ team: teamRes.rows[0] });
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Edit a team (school admin or super admin)
 * PATCH /api/teams/:id
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, sport, coach_name } = req.body;

  try {
    // Only allow school admin for their own team, or super admin
    let teamCheck;
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return res.status(400).json({ message: 'School not found for this admin.' });
      teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [id, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return res.status(403).json({ message: 'Not authorized to edit this team.' });
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Build query dynamically
    const fields = [];
    const values = [];
    let idx = 1;
    if (name) fields.push(`name = $${idx++}`), values.push(name);
    if (sport) fields.push(`sport = $${idx++}`), values.push(sport);
    if (coach_name) fields.push(`coach_name = $${idx++}`), values.push(coach_name);
    fields.push(`updated_at = NOW()`);
    values.push(id);

    if (fields.length === 1) // Only updated_at
      return res.status(400).json({ message: 'No fields to update.' });

    const result = await query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Team not found.' });

    res.json({ team: result.rows[0] });
  } catch (err) {
    console.error('Edit team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Delete a team (school admin: own only, super admin: any)
 * DELETE /api/teams/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership or role
    let teamCheck;
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return res.status(400).json({ message: 'School not found for this admin.' });
      teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [id, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return res.status(403).json({ message: 'Not authorized to delete this team.' });
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const result = await query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Team not found.' });

    res.json({ message: 'Team deleted.' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * List teams (school admin: their teams; super admin: all)
 * GET /api/teams
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return res.status(400).json({ message: 'School not found for this admin.' });
      result = await query(
        'SELECT * FROM teams WHERE school_id = $1',
        [school.rows[0].id]
      );
    } else if (req.user.role === 'super_admin') {
      result = await query('SELECT * FROM teams');
    } else {
      return res.status(403).json({ message: 'Access denied.' });
    }
    res.json({ teams: result.rows });
  } catch (err) {
    console.error('List teams error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

/**
 * ONBOARDING NOTES:
 * - School admins can CRUD their own teams only; super admins can manage all.
 * - All routes are JWT-protected.
 * - To use: register route in server.js with `app.use('/api/teams', require('./src/routes/teamRoutes'))`
 */
