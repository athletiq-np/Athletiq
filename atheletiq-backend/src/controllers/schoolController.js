    ApiResponse.success(res, activities, 'School activities retrieved successfully');
  } catch (err) {
    console.error("Get school activities error:", err);
    ApiResponse.error(res, "Server error while fetching school activities.", 500);
  }
};

// ==========================================
// TEAM MANAGEMENT FUNCTIONS
// ==========================================

/**
 * @desc    Create a new team for the school
 * @route   POST /api/schools/me/teams
 * @access  Private (SchoolAdmin)
 */
exports.createSchoolTeam = async (req, res) => {
  try {
    const { name, sport, coach, gender, age_group, description, status = 'active' } = req.body;

    if (!name || !sport || !gender || !age_group) {
      return ApiResponse.error(res, 'Team name, sport, gender, and age group are required.', 400);
    }

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Create the team
    const teamResult = await pool.query(
      `INSERT INTO teams (name, sport, coach, gender, age_group, description, status, school_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [name, sport, coach || null, gender, age_group, description || null, status, schoolId]
    );

    ApiResponse.success(res, teamResult.rows[0], 'Team created successfully', 201);
  } catch (err) {
    console.error("Create school team error:", err);
    ApiResponse.error(res, "Server error while creating team.", 500);
  }
};

/**
 * @desc    Update a team for the school
 * @route   PATCH /api/schools/me/teams/:id
 * @access  Private (SchoolAdmin)
 */
exports.updateSchoolTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sport, coach, gender, age_group, description, status } = req.body;

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Verify team belongs to this school
    const teamCheck = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
      [id, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found or not authorized to edit this team.', 404);
    }

    // Build dynamic update query
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
    values.push(id, schoolId);

    if (fields.length === 1) {
      return ApiResponse.error(res, 'No fields to update.', 400);
    }

    const result = await pool.query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx++} AND school_id = $${idx++} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found.', 404);
    }

    ApiResponse.success(res, result.rows[0], 'Team updated successfully');
  } catch (err) {
    console.error("Update school team error:", err);
    ApiResponse.error(res, "Server error while updating team.", 500);
  }
};

/**
 * @desc    Delete a team for the school
 * @route   DELETE /api/schools/me/teams/:id
 * @access  Private (SchoolAdmin)
 */
exports.deleteSchoolTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Delete team (this will also delete team_players due to foreign key constraints)
    const result = await pool.query(
      'DELETE FROM teams WHERE id = $1 AND school_id = $2 RETURNING *',
      [id, schoolId]
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found or not authorized to delete this team.', 404);
    }

    ApiResponse.success(res, null, 'Team deleted successfully');
  } catch (err) {
    console.error("Delete school team error:", err);
    ApiResponse.error(res, "Server error while deleting team.", 500);
  }
};

/**
 * @desc    Get a specific team with players
 * @route   GET /api/schools/me/teams/:id
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Get team with players
    const teamQuery = await pool.query(
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
      [id, schoolId]
    );

    if (teamQuery.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found.', 404);
    }

    ApiResponse.success(res, teamQuery.rows[0], 'Team retrieved successfully');
  } catch (err) {
    console.error("Get school team error:", err);
    ApiResponse.error(res, "Server error while fetching team.", 500);
  }
};

/**
 * @desc    Add a player to a team
 * @route   POST /api/schools/me/teams/:id/players
 * @access  Private (SchoolAdmin)
 */
exports.addPlayerToTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const { student_id, position } = req.body;

    if (!student_id) {
      return ApiResponse.error(res, 'Student ID is required.', 400);
    }

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Verify team belongs to this school
    const teamCheck = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found or not authorized.', 404);
    }

    // Check if player already in team
    const existingPlayer = await pool.query(
      'SELECT * FROM team_players WHERE team_id = $1 AND player_id = $2',
      [teamId, student_id]
    );

    if (existingPlayer.rows.length > 0) {
      return ApiResponse.error(res, 'Player already in this team.', 409);
    }

    // Add player to team
    const result = await pool.query(
      `INSERT INTO team_players (team_id, player_id, position, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [teamId, student_id, position || null]
    );

    ApiResponse.success(res, result.rows[0], 'Player added to team successfully', 201);
  } catch (err) {
    console.error("Add player to team error:", err);
    ApiResponse.error(res, "Server error while adding player to team.", 500);
  }
};

/**
 * @desc    Remove a player from a team
 * @route   DELETE /api/schools/me/teams/:id/players/:playerId
 * @access  Private (SchoolAdmin)
 */
exports.removePlayerFromTeam = async (req, res) => {
  try {
    const { id: teamId, playerId } = req.params;

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Verify team belongs to this school
    const teamCheck = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found or not authorized.', 404);
    }

    // Remove player from team
    const result = await pool.query(
      'DELETE FROM team_players WHERE team_id = $1 AND player_id = $2 RETURNING *',
      [teamId, playerId]
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Player not found in this team.', 404);
    }

    ApiResponse.success(res, null, 'Player removed from team successfully');
  } catch (err) {
    console.error("Remove player from team error:", err);
    ApiResponse.error(res, "Server error while removing player from team.", 500);
  }
};

/**
 * @desc    Update a player's position in a team
 * @route   PATCH /api/schools/me/teams/:id/players/:playerId
 * @access  Private (SchoolAdmin)
 */
exports.updatePlayerPosition = async (req, res) => {
  try {
    const { id: teamId, playerId } = req.params;
    const { position } = req.body;

    // Get school ID from the authenticated user
    const schoolQuery = await pool.query(
      'SELECT id FROM schools WHERE created_by = $1 LIMIT 1',
      [req.user.id]
    );

    if (schoolQuery.rows.length === 0) {
      return ApiResponse.error(res, 'School not found for this admin.', 404);
    }

    const schoolId = schoolQuery.rows[0].id;

    // Verify team belongs to this school
    const teamCheck = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, 'Team not found or not authorized.', 404);
    }

    // Update player position
    const result = await pool.query(
      'UPDATE team_players SET position = $1, updated_at = NOW() WHERE team_id = $2 AND player_id = $3 RETURNING *',
      [position, teamId, playerId]
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(res, 'Player not found in this team.', 404);
    }

    ApiResponse.success(res, result.rows[0], 'Player position updated successfully');
  } catch (err) {
    console.error("Update player position error:", err);
    ApiResponse.error(res, "Server error while updating player position.", 500);
  }
};