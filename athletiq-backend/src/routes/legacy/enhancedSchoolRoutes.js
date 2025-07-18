const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/schools/me/students
// @desc    Get all students for the current school
// @access  Private
router.get('/me/students', protect, async (req, res) => {
  try {
    console.log('📚 Getting students for school:', req.user.school_id || 21);
    
    const result = await pool.query(`
      SELECT 
        id,
        player_code,
        full_name,
        class,
        gender,
        date_of_birth,
        email,
        contact_no,
        registration_status,
        created_at
      FROM players 
      WHERE school_id = $1 AND is_active = true
      ORDER BY full_name ASC
    `, [req.user.school_id || 21]);
    
    console.log(`✅ Found ${result.rows.length} students`);
    
    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error getting students:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
});

// @route   POST /api/schools/me/teams/:teamId/players
// @desc    Add a player to a team
// @access  Private
router.post('/me/teams/:teamId/players', protect, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { playerId } = req.body;
    const schoolId = req.user.school_id || 21;
    
    console.log('👥 Adding player to team:', { teamId, playerId, schoolId });
    
    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );
    
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied'
      });
    }
    
    // Check if player belongs to school
    const playerCheck = await pool.query(
      'SELECT id FROM players WHERE id = $1 AND school_id = $2',
      [playerId, schoolId]
    );
    
    if (playerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Player not found or access denied'
      });
    }
    
    // Check if player is already in team
    const existingAssignment = await pool.query(
      'SELECT id FROM team_players WHERE team_id = $1 AND player_id = $2',
      [teamId, playerId]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Player is already in this team'
      });
    }
    
    // Add player to team
    const result = await pool.query(`
      INSERT INTO team_players (team_id, player_id, assigned_by, assigned_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [teamId, playerId, req.user.userId]);
    
    console.log('✅ Player added to team successfully');
    
    res.status(201).json({
      success: true,
      message: 'Player added to team successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error adding player to team:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add player to team',
      error: error.message
    });
  }
});

// @route   DELETE /api/schools/me/teams/:teamId/players/:playerId
// @desc    Remove a player from a team
// @access  Private
router.delete('/me/teams/:teamId/players/:playerId', protect, async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    const schoolId = req.user.school_id || 21;
    
    console.log('👥 Removing player from team:', { teamId, playerId, schoolId });
    
    // Verify team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );
    
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied'
      });
    }
    
    // Remove player from team
    const result = await pool.query(
      'DELETE FROM team_players WHERE team_id = $1 AND player_id = $2 RETURNING *',
      [teamId, playerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Player assignment not found'
      });
    }
    
    console.log('✅ Player removed from team successfully');
    
    res.status(200).json({
      success: true,
      message: 'Player removed from team successfully'
    });
    
  } catch (error) {
    console.error('❌ Error removing player from team:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove player from team',
      error: error.message
    });
  }
});

// @route   GET /api/schools/me/teams/:teamId/players
// @desc    Get all players in a specific team
// @access  Private
router.get('/me/teams/:teamId/players', protect, async (req, res) => {
  try {
    const { teamId } = req.params;
    const schoolId = req.user.school_id || 21;
    
    console.log('👥 Getting team players:', { teamId, schoolId });
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.player_code,
        p.full_name,
        p.class,
        p.gender,
        p.email,
        tp.assigned_at,
        tp.position,
        tp.jersey_number
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      JOIN school_teams st ON tp.team_id = st.id
      WHERE tp.team_id = $1 AND st.school_id = $2
      ORDER BY p.full_name ASC
    `, [teamId, schoolId]);
    
    console.log(`✅ Found ${result.rows.length} players in team`);
    
    res.status(200).json({
      success: true,
      message: 'Team players retrieved successfully',
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Error getting team players:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team players',
      error: error.message
    });
  }
});

module.exports = router;
