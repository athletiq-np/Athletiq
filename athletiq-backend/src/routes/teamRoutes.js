// src/routes/teamRoutes.js - Enhanced Teams Management

const express = require('express');
const router = express.Router();
const { protect: authMiddleware } = require('../middlewares/authMiddleware');
const { pool, query } = require('../config/db');
const { sendResponse } = require('../utils/response');

/**
 * Create a team (school admin only)
 * POST /api/teams
 */
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'school_admin')
    return sendResponse(res, { success: false, status: 403, message: 'Access denied: school admin only.' });

  const { name, sport, coach, gender, age_group, description, status = 'active' } = req.body;

  if (!name || !sport || !gender || !age_group) {
    return sendResponse(res, { success: false, status: 400, message: 'Team name, sport, gender, and age group are required.' });
  }

  try {
    // Find the school of the admin
    const school = await query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );
    if (school.rows.length === 0) {
      return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
    }

    const teamRes = await query(
      `INSERT INTO teams (name, sport, coach, gender, age_group, description, status, school_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [name, sport, coach || null, gender, age_group, description || null, status, school.rows[0].id]
    );
    
  sendResponse(res, { status: 201, message: 'Team created successfully', data: teamRes.rows[0] });
  } catch (err) {
    console.error('Create team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

/**
 * Edit a team (school admin or super admin)
 * PATCH /api/teams/:id
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, sport, coach, gender, age_group, description, status } = req.body;

  try {
    // Only allow school admin for their own team, or super admin
    let teamCheck;
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [id, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return sendResponse(res, { success: false, status: 403, message: 'Not authorized to edit this team.' });
    } else if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }

    // Build query dynamically
    const fields = [];
    const values = [];
    let idx = 1;
    if (name) fields.push(`name = $${idx++}`), values.push(name);
    if (sport) fields.push(`sport = $${idx++}`), values.push(sport);
    if (coach !== undefined) fields.push(`coach = $${idx++}`), values.push(coach);
    if (gender) fields.push(`gender = $${idx++}`), values.push(gender);
    if (age_group) fields.push(`age_group = $${idx++}`), values.push(age_group);
    if (description !== undefined) fields.push(`description = $${idx++}`), values.push(description);
    if (status) fields.push(`status = $${idx++}`), values.push(status);
    fields.push(`updated_at = NOW()`);
    values.push(id);

    if (fields.length === 1) // Only updated_at
      return sendResponse(res, { success: false, status: 400, message: 'No fields to update.' });

    const result = await query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0)
      return sendResponse(res, { success: false, status: 404, message: 'Team not found.' });

  sendResponse(res, { message: 'Team updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Edit team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
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
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [id, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return sendResponse(res, { success: false, status: 403, message: 'Not authorized to delete this team.' });
    } else if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }

    const result = await query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0)
      return sendResponse(res, { success: false, status: 404, message: 'Team not found.' });

  sendResponse(res, { message: 'Team deleted.' });
  } catch (err) {
    console.error('Delete team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
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
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      
      // Enhanced query with player count
      result = await query(
        `SELECT t.*, 
                COUNT(tp.player_id) as player_count,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', p.id,
                      'full_name', p.full_name,
                      'gender', p.gender,
                      'grade', p.grade,
                      'position', tp.position
                    )
                  ) FILTER (WHERE p.id IS NOT NULL), 
                  '[]'::json
                ) as players
         FROM teams t
         LEFT JOIN team_players tp ON t.id = tp.team_id
         LEFT JOIN players p ON tp.player_id = p.id
         WHERE t.school_id = $1
         GROUP BY t.id
         ORDER BY t.created_at DESC`,
        [school.rows[0].id]
      );
    } else if (req.user.role === 'super_admin') {
      result = await query(
        `SELECT t.*, 
                COUNT(tp.player_id) as player_count,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', p.id,
                      'full_name', p.full_name,
                      'gender', p.gender,
                      'grade', p.grade,
                      'position', tp.position
                    )
                  ) FILTER (WHERE p.id IS NOT NULL), 
                  '[]'::json
                ) as players
         FROM teams t
         LEFT JOIN team_players tp ON t.id = tp.team_id
         LEFT JOIN players p ON tp.player_id = p.id
         GROUP BY t.id
         ORDER BY t.created_at DESC`
      );
    } else {
  return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }
    
  sendResponse(res, { data: result.rows });
  } catch (err) {
    console.error('List teams error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

/**
 * Get team by ID with players
 * GET /api/teams/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    let teamQuery;
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      
      teamQuery = await query(
        `SELECT t.*, 
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', p.id,
                      'full_name', p.full_name,
                      'gender', p.gender,
                      'grade', p.grade,
                      'position', tp.position,
                      'date_of_birth', p.date_of_birth
                    )
                  ) FILTER (WHERE p.id IS NOT NULL), 
                  '[]'::json
                ) as players
         FROM teams t
         LEFT JOIN team_players tp ON t.id = tp.team_id
         LEFT JOIN players p ON tp.player_id = p.id
         WHERE t.id = $1 AND t.school_id = $2
         GROUP BY t.id`,
        [id, school.rows[0].id]
      );
    } else if (req.user.role === 'super_admin') {
      teamQuery = await query(
        `SELECT t.*, 
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                      'id', p.id,
                      'full_name', p.full_name,
                      'gender', p.gender,
                      'grade', p.grade,
                      'position', tp.position,
                      'date_of_birth', p.date_of_birth
                    )
                  ) FILTER (WHERE p.id IS NOT NULL), 
                  '[]'::json
                ) as players
         FROM teams t
         LEFT JOIN team_players tp ON t.id = tp.team_id
         LEFT JOIN players p ON tp.player_id = p.id
         WHERE t.id = $1
         GROUP BY t.id`,
        [id]
      );
    } else {
  return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }
    
    if (teamQuery.rows.length === 0) {
  return sendResponse(res, { success: false, status: 404, message: 'Team not found.' });
    }
    
  sendResponse(res, { data: teamQuery.rows[0] });
  } catch (err) {
    console.error('Get team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

/**
 * Add player to team
 * POST /api/teams/:id/players
 */
router.post('/:id/players', authMiddleware, async (req, res) => {
  const { id: teamId } = req.params;
  const { student_id, position } = req.body;
  
  if (!student_id) {
    return sendResponse(res, { success: false, status: 400, message: 'Student ID is required.' });
  }
  
  try {
    // Verify team ownership
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      
      const teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [teamId, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return sendResponse(res, { success: false, status: 403, message: 'Not authorized to modify this team.' });
    } else if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }
    
    // Check if player already in team
    const existingPlayer = await query(
      'SELECT * FROM team_players WHERE team_id = $1 AND player_id = $2',
      [teamId, student_id]
    );
    if (existingPlayer.rows.length > 0) {
      return sendResponse(res, { success: false, status: 409, message: 'Player already in this team.' });
    }
    
    // Add player to team
    const result = await query(
      `INSERT INTO team_players (team_id, player_id, position, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [teamId, student_id, position || null]
    );
    
  sendResponse(res, { status: 201, message: 'Player added to team successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Add player to team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

/**
 * Remove player from team
 * DELETE /api/teams/:id/players/:playerId
 */
router.delete('/:id/players/:playerId', authMiddleware, async (req, res) => {
  const { id: teamId, playerId } = req.params;
  
  try {
    // Verify team ownership
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      
      const teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [teamId, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return sendResponse(res, { success: false, status: 403, message: 'Not authorized to modify this team.' });
    } else if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }
    
    // Remove player from team
    const result = await query(
      'DELETE FROM team_players WHERE team_id = $1 AND player_id = $2 RETURNING *',
      [teamId, playerId]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Player not found in this team.' });
    }
    
  sendResponse(res, { message: 'Player removed from team successfully' });
  } catch (err) {
    console.error('Remove player from team error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

/**
 * Update player position in team
 * PATCH /api/teams/:id/players/:playerId
 */
router.patch('/:id/players/:playerId', authMiddleware, async (req, res) => {
  const { id: teamId, playerId } = req.params;
  const { position } = req.body;
  
  try {
    // Verify team ownership
    if (req.user.role === 'school_admin') {
      const school = await query(
        'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
        [req.user.id]
      );
      if (school.rows.length === 0)
        return sendResponse(res, { success: false, status: 400, message: 'School not found for this admin.' });
      
      const teamCheck = await query(
        'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
        [teamId, school.rows[0].id]
      );
      if (teamCheck.rows.length === 0)
        return sendResponse(res, { success: false, status: 403, message: 'Not authorized to modify this team.' });
    } else if (req.user.role !== 'super_admin') {
      return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
    }
    
    // Update player position
    const result = await query(
      'UPDATE team_players SET position = $1, updated_at = NOW() WHERE team_id = $2 AND player_id = $3 RETURNING *',
      [position, teamId, playerId]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Player not found in this team.' });
    }
    
  sendResponse(res, { message: 'Player position updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Update player position error:', err);
  sendResponse(res, { success: false, status: 500, message: 'Server error' });
  }
});

module.exports = router;

/**
 * ONBOARDING NOTES:
 * - School admins can CRUD their own teams only; super admins can manage all.
 * - All routes are JWT-protected.
 * - To use: register route in server.js with `app.use('/api/teams', require('./src/routes/teamRoutes'))`
 */
