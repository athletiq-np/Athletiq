const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateSchoolCode } = require('../utils/codeGenerator'); // Assuming you have this utility
const { sendResponse } = require('../utils/response');

/**
 * @desc    Register a new school and its primary admin user
 * @route   POST /api/schools/register
 * @access  Public
 */
exports.registerSchool = async (req, res) => {
  const {
    name, address, country, province, district, city, ward,
    phone, email: schoolEmail, website,
    principal_name,
    admin_name, admin_email, password
  } = req.body;

  // Basic validation
  if (!name || !address || !admin_name || !admin_email || !password) {
    return sendResponse(res, { success: false, status: 400, message: 'Missing required fields for school and admin.' });
  }

  const client = await pool.connect();

  try {
    // --- Start Transaction ---
    await client.query('BEGIN');

    // Check for duplicate admin email
    const userExists = await client.query('SELECT 1 FROM users WHERE email=$1', [admin_email]);
    if (userExists.rows.length) {
      throw new Error('This administrator email is already registered.');
    }

    // Check for duplicate school name
    const schoolExists = await client.query('SELECT 1 FROM schools WHERE LOWER(name)=LOWER($1)', [name]);
    if (schoolExists.rows.length) {
      throw new Error('A school with this name is already registered.');
    }

    // 1. Create the admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, 'SchoolAdmin') RETURNING user_id`,
      [admin_name, admin_email, passwordHash]
    );
    const adminUserId = userRes.rows[0].user_id;

    // 2. Generate a unique school code
    const school_code = await generateSchoolCode();

    // 3. Create the school, linking the new admin user to it
    const schoolRes = await client.query(
      `INSERT INTO schools (school_code, name, address, country, province, district, city, ward, phone, email, website, principal_name, admin_user_id, onboarding_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending') 
       RETURNING school_id, school_code`,
      [school_code, name, address, country, province, district, city, ward, phone, schoolEmail, website, principal_name, adminUserId]
    );
    const { school_id, school_code: new_school_code } = schoolRes.rows[0];

    // --- Commit Transaction ---
    await client.query('COMMIT');

    sendResponse(res, {
      status: 201,
      data: {
        school_id: school_id,
        school_code: new_school_code
      },
      message: 'School and admin registered successfully!'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Register school error:", err);
    sendResponse(res, { success: false, status: 500, message: err.message || 'Server error during registration.' });
  } finally {
    client.release();
  }
};


/**
 * @desc    Get a list of all schools (for SuperAdmin)
 * @route   GET /api/schools
 * @access  Private (SuperAdmin)
 */
exports.getAllSchools = async (req, res) => {
  // This check ensures only SuperAdmins can get the full list
  if (req.user.role !== 'SuperAdmin') {
    return sendResponse(res, { success: false, status: 403, message: 'Access denied.' });
  }
  try {
    const result = await pool.query('SELECT * FROM schools ORDER BY created_at DESC');
    sendResponse(res, { data: result.rows, message: 'Schools retrieved successfully' });
  } catch (error) {
    console.error('Error fetching all schools:', error);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching schools.' });
  }
};


/**
 * @desc    Get the profile for the currently logged-in admin's school
 * @route   GET /api/schools/me
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolProfile = async (req, res) => {
  try {
    console.log('🏫 getMySchoolProfile - START');
    console.log('User:', req.user);

    // The school_id is securely taken from the user's token, not a URL parameter
    const schoolId = req.user.school_id;
    console.log('School ID:', schoolId);

    if (!schoolId) {
      console.log('❌ No school_id found');
      return sendResponse(res, { success: false, status: 404, message: 'No school associated with this user.' });
    }

    console.log('🔍 Querying database for school ID:', schoolId);
    const { rows } = await pool.query("SELECT * FROM schools WHERE id=$1", [schoolId]);
    console.log('📊 Query completed. Rows found:', rows.length);

    if (!rows.length) {
      console.log('❌ No school found');
      return sendResponse(res, { success: false, status: 404, message: 'Associated school not found.' });
    }

    console.log('✅ School found:', rows[0].name);
    console.log('📤 Sending response');
    sendResponse(res, { data: rows[0], message: 'School profile retrieved successfully' });
  } catch (err) {
    console.error("Get my school error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school profile.' });
  }
};


/**
 * @desc    Update the profile for the currently logged-in admin's school
 * @route   PATCH /api/schools/me
 * @access  Private (SchoolAdmin)
 */
exports.updateMySchoolProfile = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    if (!schoolId) {
      return sendResponse(res, { success: false, status: 404, message: 'No school associated with this user.' });
    }

    const {
      name,
      address,
      phone,
      email,
      province,
      district,
      city,
      ward,
      website,
      principal_name
    } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (address) {
      updateFields.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (phone) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (province) {
      updateFields.push(`province = $${paramIndex++}`);
      values.push(province);
    }
    if (district) {
      updateFields.push(`district = $${paramIndex++}`);
      values.push(district);
    }
    if (city) {
      updateFields.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (ward) {
      updateFields.push(`ward = $${paramIndex++}`);
      values.push(ward);
    }
    if (website) {
      updateFields.push(`website = $${paramIndex++}`);
      values.push(website);
    }
    if (principal_name) {
      updateFields.push(`principal_name = $${paramIndex++}`);
      values.push(principal_name);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, { success: false, status: 400, message: 'No fields to update.' });
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add school_id for WHERE clause
    values.push(schoolId);

    const query = `
      UPDATE schools 
      SET ${updateFields.join(', ')} 
      WHERE school_id = $${paramIndex} 
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (!rows.length) {
      return sendResponse(res, { success: false, status: 404, message: 'School not found.' });
    }

    sendResponse(res, { data: rows[0], message: 'School profile updated successfully' });
  } catch (err) {
    console.error("Update my school error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while updating school profile.' });
  }
};


/**
 * @desc    Get tournaments for the school
 * @route   GET /api/schools/me/tournaments
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolTournaments = async (req, res) => {
  try {
    console.log('🏫 getMySchoolTournaments - req.user:', req.user);

    // Ensure user is authenticated
    if (!req.user || !req.user.school_id) {
      console.log('❌ No authenticated user or school_id found');
      return sendResponse(res, { success: false, status: 401, message: 'Authentication required. Please log in.' });
    }

    const schoolId = req.user.school_id;
    console.log('🏫 Fetching tournaments for school_id:', schoolId);

    // Get tournaments where school's teams are registered OR tournaments organized by school users
    const { rows } = await pool.query(`
      SELECT DISTINCT
        t.id,
        t.name,
        t.tournament_code,
        t.tournament_type,
        t.format,
        t.start_date,
        t.end_date,
        t.location,
        t.status,
        t.max_teams,
        t.sport,
        t.description,
        t.category,
        t.visibility,
        CASE 
          WHEN organizer_users.school_id = $1 THEN 'organized'
          ELSE 'registered'
        END as relationship_type
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
      LEFT JOIN teams ON tt.team_id = teams.id
      LEFT JOIN schools s ON teams.school_id = s.id
      LEFT JOIN users organizer_users ON t.organizer_id = organizer_users.id
      WHERE (s.id = $1) OR (organizer_users.school_id = $1)
      ORDER BY t.start_date DESC
    `, [schoolId]);

    console.log('✅ Successfully fetched tournaments:', rows.length);

    // Also get available tournaments (not registered yet)
    const { rows: availableTournaments } = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.tournament_code,
        t.tournament_type,
        t.format,
        t.start_date,
        t.end_date,
        t.location,
        t.status,
        t.max_teams,
        t.sport,
        COUNT(tt.id) as current_teams
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
      WHERE t.status IN ('draft', 'open', 'active')
        AND t.id NOT IN (
          SELECT DISTINCT tr.tournament_id 
          FROM tournament_registrations tr 
          JOIN teams ON tr.team_id = teams.id 
          WHERE teams.school_id = $1
        )
      GROUP BY t.id, t.name, t.tournament_code, t.tournament_type, t.format, t.start_date, t.end_date, t.location, t.status, t.max_teams, t.sport
      ORDER BY t.start_date ASC
    `, [schoolId]);

    sendResponse(res, {
      data: {
        registered_tournaments: rows,
        available_tournaments: availableTournaments
      }, message: 'School tournaments retrieved successfully'
    });

  } catch (err) {
    console.error("Get school tournaments error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    sendResponse(res, { success: false, status: 500, message: `Server error while fetching school tournaments: ${err.message}` });
  }
};

/**
 * @desc    Get school teams
 * @route   GET /api/schools/me/teams
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolTeams = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.school_id) {
      return sendResponse(res, { success: false, status: 401, message: 'Authentication required. Please log in.' });
    }

    const schoolId = req.user.school_id;

    const { rows } = await pool.query(`
      SELECT 
        t.id,
        t.team_name as name,
        s.name as sport,
        t.season,
        COUNT(psp.athlete_id) as athlete_count,
        json_agg(
          json_build_object(
            'id', p.id,
            'name', p.full_name,
            'athlete_code', p.athlete_id,
            'position', psp.event_category
          )
        ) FILTER (WHERE p.id IS NOT NULL) as athletes
      FROM teams t
      LEFT JOIN sports s ON t.sport_id = s.id
      LEFT JOIN player_sport_participation psp ON t.id = psp.team_id
      LEFT JOIN players p ON psp.athlete_id = p.id
      WHERE t.school_id = $1
      GROUP BY t.id, t.team_name, s.name, t.season
      ORDER BY t.team_name, t.season DESC
    `, [schoolId]);

    sendResponse(res, { data: rows, message: 'School teams retrieved successfully' });

  } catch (err) {
    console.error("Get school teams error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school teams.' });
  }
};

/**
 * @desc    Get school athletes
 * @route   GET /api/schools/me/athletes
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolAthletes = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.school_id) {
      return sendResponse(res, { success: false, status: 401, message: 'Authentication required. Please log in.' });
    }

    const schoolId = req.user.school_id;
    // Debug: basic presence log (avoid logging PII beyond IDs)
    console.log('[getMySchoolAthletes] schoolId:', schoolId);

    // Lightweight sanity check to help diagnose 500 errors (does table & FK data exist?)
    try {
      const sanity = await pool.query('SELECT id, full_name FROM players WHERE school_id = $1 LIMIT 1', [schoolId]);
      console.log('[getMySchoolAthletes] sanityCheck count:', sanity.rowCount);
    } catch (innerErr) {
      console.error('[getMySchoolAthletes] sanityCheck failed:', innerErr.message);
    }

    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.athlete_id,
        p.full_name,
        p.date_of_birth,
        p.gender,
        p.grade AS class,               -- Backwards compatibility alias
        p.section,
        p.guardian_phone AS contact_no, -- Alias to match older field name
        p.guardian_email AS email,
        p.enrollment_status AS registration_status,
        (p.active_status = 'Active') AS is_active,
        p.created_at,
        COALESCE(json_agg(
          json_build_object(
            'sport', s.name,
            'team', t.team_name,
            'position', psp.event_category
          )
        ) FILTER (WHERE s.id IS NOT NULL), '[]'::json) as sports_participation
      FROM players p
      LEFT JOIN player_sport_participation psp ON p.id = psp.player_id
      LEFT JOIN sports s ON psp.sport_id = s.id
      LEFT JOIN teams t ON psp.team_id = t.id
      WHERE p.school_id = $1
      GROUP BY p.id, p.athlete_id, p.full_name, p.date_of_birth, p.gender, p.grade, p.section, p.guardian_phone, p.guardian_email, p.enrollment_status, p.active_status, p.created_at
      ORDER BY p.full_name
    `, [schoolId]);

    // Ensure rows is an array even if nullish
    const safeRows = Array.isArray(rows) ? rows : [];
    sendResponse(res, { data: safeRows, message: 'School athletes retrieved successfully' });

  } catch (err) {
    // Enhanced structured logging
    console.error('[getMySchoolAthletes] error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
    const isProd = process.env.NODE_ENV === 'production';
    const publicMessage = 'Server error while fetching school athletes.';
    sendResponse(res, { success: false, status: 500, message: publicMessage, ...(isProd ? {} : { errors: { message: err.message, code: err.code, detail: err.detail } }) });
  }
};

/**
 * @desc    Get school tournament statistics
 * @route   GET /api/schools/me/tournament-stats
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolTournamentStats = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.school_id) {
      return sendResponse(res, { success: false, status: 401, message: 'Authentication required. Please log in.' });
    }

    const schoolId = req.user.school_id;

    // Get tournament statistics
    const { rows } = await pool.query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_tournaments,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tournaments,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tournaments,
        COUNT(DISTINCT tt.id) as total_teams_registered,
        COUNT(DISTINCT m.id) as total_matches_played,
        COUNT(DISTINCT CASE WHEN m.status = 'completed' AND 
              ((m.home_team_id = tt.id AND m.home_score > m.away_score) OR 
               (m.away_team_id = tt.id AND m.away_score > m.home_score)) 
              THEN m.id END) as matches_won,
        COUNT(DISTINCT players.id) as total_athletes
      FROM schools s
      LEFT JOIN teams teams ON s.id = teams.school_id
      LEFT JOIN tournament_teams tt ON teams.id = tt.team_id
      LEFT JOIN tournaments t ON tt.tournament_id = t.id
      LEFT JOIN matches m ON t.id = m.tournament_id AND (m.home_team_id = tt.id OR m.away_team_id = tt.id)
      LEFT JOIN players ON s.id = players.school_id
      WHERE s.id = $1
    `, [schoolId]);

    const stats = rows[0] || {
      total_tournaments: 0,
      active_tournaments: 0,
      completed_tournaments: 0,
      total_teams_registered: 0,
      total_matches_played: 0,
      matches_won: 0,
      total_athletes: 0
    };

    // Calculate win rate
    const winRate = stats.total_matches_played > 0
      ? ((stats.matches_won / stats.total_matches_played) * 100).toFixed(2)
      : 0;

    sendResponse(res, {
      data: {
        ...stats,
        win_rate: winRate
      }, message: 'School tournament statistics retrieved successfully'
    });

  } catch (err) {
    console.error("Get school tournament stats error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school tournament statistics.' });
  }
};

/**
 * @desc    Get school houses from database
 * @route   GET /api/schools/houses
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolHouses = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    if (!schoolId) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID not found for user.' });
    }

    // Get houses from database
    const housesQuery = `
      SELECT 
        h.id,
        h.name,
        h.color,
        h.points,
        COUNT(a.athlete_id) as members,
        c.full_name as captain_name
      FROM school_houses h
      LEFT JOIN athletes a ON h.id = a.house_id AND a.school_id = $1
      LEFT JOIN athletes c ON h.captain_id = c.athlete_id
      WHERE h.school_id = $1
      GROUP BY h.id, h.name, h.color, h.points, c.full_name
      ORDER BY h.points DESC, h.name
    `;

    const result = await pool.query(housesQuery, [schoolId]);

    if (result.rows.length === 0) {
      // If no houses exist, return empty array with message
      return sendResponse(res, {
        data: [],
        message: 'No houses configured for this school. Please contact administration to set up house system.'
      });
    }

    const houses = result.rows.map(house => ({
      id: house.id,
      name: house.name,
      color: house.color || '#6B7280', // Default gray if no color set
      captain: house.captain_name || 'Not assigned',
      members: parseInt(house.members) || 0,
      points: parseInt(house.points) || 0
    }));

    sendResponse(res, { data: houses, message: 'School houses retrieved successfully' });
  } catch (err) {
    console.error("Get school houses error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school houses.' });
  }
};

/**
 * @desc    Get school staff from database
 * @route   GET /api/schools/staff
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolStaff = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    if (!schoolId) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID not found for user.' });
    }

    // Get staff from database
    const staffQuery = `
      SELECT 
        s.id,
        s.full_name as name,
        s.position,
        s.department,
        s.email,
        s.phone,
        s.hire_date,
        s.status
      FROM school_staff s
      WHERE s.school_id = $1 AND s.status = 'active'
      ORDER BY 
        CASE s.position 
          WHEN 'Principal' THEN 1
          WHEN 'Vice Principal' THEN 2
          WHEN 'Sports Coordinator' THEN 3
          ELSE 4
        END,
        s.full_name
    `;

    const result = await pool.query(staffQuery, [schoolId]);

    if (result.rows.length === 0) {
      // If no staff records exist, return basic school admin info
      const schoolAdminQuery = `
        SELECT 
          u.user_id as id,
          u.full_name as name,
          'School Administrator' as position,
          'Administration' as department,
          u.email,
          s.phone
        FROM users u
        JOIN schools s ON u.user_id = s.admin_user_id
        WHERE s.school_id = $1
      `;

      const adminResult = await pool.query(schoolAdminQuery, [schoolId]);

      return sendResponse(res, {
        data: adminResult.rows,
        message: 'Staff information retrieved. Only admin user found - please add more staff members.'
      });
    }

    sendResponse(res, { data: result.rows, message: 'School staff retrieved successfully' });
  } catch (err) {
    console.error("Get school staff error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school staff.' });
  }
};

/**
 * @desc    Get school notifications from database
 * @route   GET /api/schools/notifications
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolNotifications = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    if (!schoolId) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID not found for user.' });
    }

    // Get notifications from database
    const notificationsQuery = `
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.read_status as read,
        n.created_at
      FROM school_notifications n
      WHERE n.school_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(notificationsQuery, [schoolId]);

    if (result.rows.length === 0) {
      // If no notifications exist, return empty array
      return sendResponse(res, {
        data: [],
        message: 'No notifications found. You will receive notifications here when there are updates.'
      });
    }

    const notifications = result.rows.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority || 'medium',
      read: notification.read || false,
      created_at: notification.created_at
    }));

    sendResponse(res, { data: notifications, message: 'School notifications retrieved successfully' });
  } catch (err) {
    console.error("Get school notifications error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school notifications.' });
  }
};

/**
 * @desc    Get school activities from database
 * @route   GET /api/schools/activities
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolActivities = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    if (!schoolId) {
      return sendResponse(res, { success: false, status: 400, message: 'School ID not found for user.' });
    }

    // Get activities from database (matches, practices, tournaments)
    const activitiesQuery = `
      SELECT 
        'match' as type,
        m.id,
        CONCAT(s.name, ' Match vs ', 
          CASE 
            WHEN ht.school_id = $1 THEN aws.name 
            ELSE hs.name 
          END
        ) as title,
        s.name as sport,
        m.scheduled_at as date,
        m.venue as location,
        COUNT(tp.athlete_id) as participants,
        m.status
      FROM matches m
      JOIN sports s ON m.sport_id = s.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN schools hs ON ht.school_id = hs.school_id
      JOIN schools aws ON at.school_id = aws.school_id
      LEFT JOIN team_players tp ON (ht.id = tp.team_id OR at.id = tp.team_id)
      WHERE (ht.school_id = $1 OR at.school_id = $1)
        AND m.scheduled_at >= NOW()
      GROUP BY m.id, s.name, ht.school_id, hs.name, aws.name, m.scheduled_at, m.venue, m.status
      
      UNION ALL
      
      SELECT 
        'tournament' as type,
        t.tournament_id as id,
        t.name as title,
        s.name as sport,
        t.start_date as date,
        t.venue as location,
        COUNT(tr.team_id) as participants,
        t.status
      FROM tournaments t
      JOIN sports s ON t.sport_id = s.id
      LEFT JOIN tournament_registrations tr ON t.tournament_id = tr.tournament_id
      JOIN teams tm ON tr.team_id = tm.id
      WHERE tm.school_id = $1
        AND t.start_date >= NOW()
      GROUP BY t.tournament_id, t.name, s.name, t.start_date, t.venue, t.status
      
      ORDER BY date ASC
      LIMIT 20
    `;

    const result = await pool.query(activitiesQuery, [schoolId]);

    if (result.rows.length === 0) {
      return sendResponse(res, {
        data: [],
        message: 'No upcoming activities found. Activities will appear here when matches or tournaments are scheduled.'
      });
    }

    const activities = result.rows.map(activity => ({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      sport: activity.sport,
      date: activity.date,
      location: activity.location || 'TBD',
      participants: parseInt(activity.participants) || 0,
      status: activity.status || 'scheduled'
    }));

    sendResponse(res, { data: activities, message: 'School activities retrieved successfully' });
  } catch (err) {
    console.error("Get school activities error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching school activities.' });
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
    const { name, sport, coach, gender, age_group, description, status = "active" } = req.body;

    if (!name || !sport || !gender || !age_group) {
      return sendResponse(res, { success: false, status: 400, message: 'Team name, sport, gender, and age group are required.' });
    }

    // Mock response for now - will be replaced with actual database implementation
    const mockTeam = {
      id: Math.floor(Math.random() * 1000),
      name,
      sport,
      coach: coach || null,
      gender,
      age_group,
      description: description || null,
      status,
      school_id: 1, // Mock school ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      athletes: []
    };

    sendResponse(res, { status: 201, data: mockTeam, message: 'Team created successfully' });
  } catch (err) {
    console.error("Create school team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while creating team.' });
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
    const updateData = req.body;

    // Mock response for now
    const mockUpdatedTeam = {
      id: parseInt(id),
      ...updateData,
      updated_at: new Date().toISOString()
    };

    sendResponse(res, { data: mockUpdatedTeam, message: 'Team updated successfully' });
  } catch (err) {
    console.error("Update school team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while updating team.' });
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
    // Mock deletion
    sendResponse(res, { data: null, message: 'Team deleted successfully' });
  } catch (err) {
    console.error("Delete school team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while deleting team.' });
  }
};

/**
 * @desc    Get a specific team with athletes
 * @route   GET /api/schools/me/teams/:id
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Mock team data
    const mockTeam = {
      id: parseInt(id),
      name: "School Eagles",
      sport: "football",
      coach: "John Doe",
      gender: "male",
      age_group: "u16",
      description: "Main school football team",
      status: "active",
      athletes: []
    };

    sendResponse(res, { data: mockTeam, message: 'Team retrieved successfully' });
  } catch (err) {
    console.error("Get school team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching team.' });
  }
};

/**
 * @desc    Add an athlete to a team
 * @route   POST /api/schools/me/teams/:id/athletes
 * @access  Private (SchoolAdmin)
 */
exports.addAthleteToTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const { athlete_id, position } = req.body;

    if (!athlete_id) {
      return sendResponse(res, { success: false, status: 400, message: 'Athlete ID is required.' });
    }

    // Mock response
    const mockResult = {
      team_id: parseInt(teamId),
      athlete_id: athlete_id,
      position: position || null,
      created_at: new Date().toISOString()
    };

    sendResponse(res, { status: 201, data: mockResult, message: 'Athlete added to team successfully' });
  } catch (err) {
    console.error("Add athlete to team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while adding athlete to team.' });
  }
};

/**
 * @desc    Remove a player from a team
 * @route   DELETE /api/schools/me/teams/:id/players/:playerId
 * @access  Private (SchoolAdmin)
 */
exports.removeAthleteFromTeam = async (req, res) => {
  try {
    const { id: teamId, athleteId } = req.params;
    // Mock removal
    sendResponse(res, { data: null, message: 'Athlete removed from team successfully' });
  } catch (err) {
    console.error("Remove athlete from team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while removing athlete from team.' });
  }
};

/**
 * @desc    Update an athlete's position in a team
 * @route   PATCH /api/schools/me/teams/:id/athletes/:athleteId
 * @access  Private (SchoolAdmin)
 */
exports.updateAthletePosition = async (req, res) => {
  try {
    const { id: teamId, athleteId } = req.params;
    const { position } = req.body;

    // Mock response
    sendResponse(res, { data: null, message: 'Athlete position updated successfully' });
  } catch (err) {
    console.error("Update athlete position error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while updating athlete position.' });
  }
};

// =====================================================
// TEAM MANAGEMENT FUNCTIONS
// =====================================================

/**
 * @desc    Get all teams for the authenticated school
 * @route   GET /api/schools/me/teams
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolTeams = async (req, res) => {
  try {
    const schoolId = req.user.school_id;

    const query = `
      SELECT 
        st.*,
        COUNT(tp.player_id) as player_count,
        coach.full_name as coach_name,
        captain_player.full_name as captain_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', tp.id,
              'player_id', tp.player_id,
              'athlete_id', p.athlete_id,
              'name', p.full_name,
              'grade', p.grade,
              'position', tp.position,
              'jersey_number', tp.jersey_number,
              'is_starter', tp.is_starter,
              'is_captain', tp.is_captain,
              'is_vice_captain', tp.is_vice_captain
            ) ORDER BY tp.jersey_number NULLS LAST
          ) FILTER (WHERE tp.id IS NOT NULL), 
          '[]'::json
        ) as players
      FROM school_teams st
      LEFT JOIN team_players tp ON st.id = tp.team_id AND tp.status = 'active'
      LEFT JOIN players p ON tp.player_id = p.id
      LEFT JOIN users coach ON st.coach_id = coach.id
      LEFT JOIN team_players captain_tp ON st.team_captain_id = captain_tp.id
      LEFT JOIN players captain_player ON captain_tp.player_id = captain_player.id
      WHERE st.school_id = $1 AND st.status = 'active'
      GROUP BY st.id, coach.full_name, captain_player.full_name
      ORDER BY st.created_at DESC
    `;

    const result = await pool.query(query, [schoolId]);
    sendResponse(res, { data: result.rows, message: 'Teams retrieved successfully' });
  } catch (err) {
    console.error("Get teams error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching teams.' });
  }
};

/**
 * @desc    Get sports configuration
 * @route   GET /api/schools/me/teams/sports
 * @access  Private (SchoolAdmin)
 */
exports.getSportsConfig = async (req, res) => {
  try {
    const query = `
      SELECT sport_code as id, sport_name as name, max_players_per_team as maxPlayers, 
             min_players_per_team as minPlayers, positions
      FROM sports_config 
      WHERE is_active = true
      ORDER BY sport_name
    `;

    const result = await pool.query(query);
    sendResponse(res, { data: result.rows, message: 'Sports configuration retrieved successfully' });
  } catch (err) {
    console.error("Get sports config error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while fetching sports configuration.' });
  }
};

/**
 * @desc    Create a new team
 * @route   POST /api/schools/me/teams
 * @access  Private (SchoolAdmin)
 */
exports.createSchoolTeam = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const createdBy = req.user.user_id;
    const { name, sport, maxPlayers, minPlayers } = req.body;

    if (!name || !sport) {
      return sendResponse(res, { success: false, status: 400, message: 'Team name and sport are required.' });
    }

    // Check for duplicate team name within school and sport
    const existingTeam = await pool.query(
      'SELECT id FROM school_teams WHERE school_id = $1 AND LOWER(name) = LOWER($2) AND sport = $3 AND status = $4',
      [schoolId, name, sport, 'active']
    );

    if (existingTeam.rows.length > 0) {
      return sendResponse(res, { success: false, status: 409, message: 'A team with this name already exists for this sport.' });
    }

    const query = `
      INSERT INTO school_teams (school_id, name, sport, max_players, min_players, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *, 0 as player_count, '[]'::json as players
    `;

    const result = await pool.query(query, [schoolId, name, sport, maxPlayers || 11, minPlayers || 7, createdBy]);
    sendResponse(res, { status: 201, data: result.rows[0], message: 'Team created successfully' });
  } catch (err) {
    console.error("Create team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while creating team.' });
  }
};

/**
 * @desc    Update a team
 * @route   PUT /api/schools/me/teams/:teamId
 * @access  Private (SchoolAdmin)
 */
exports.updateSchoolTeam = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { teamId } = req.params;
    const { name, sport, maxPlayers, minPlayers } = req.body;

    if (!name || !sport) {
      return sendResponse(res, { success: false, status: 400, message: 'Team name and sport are required.' });
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Team not found or access denied.' });
    }

    const query = `
      UPDATE school_teams 
      SET name = $1, sport = $2, max_players = $3, min_players = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND school_id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [name, sport, maxPlayers, minPlayers, teamId, schoolId]);
    sendResponse(res, { data: result.rows[0], message: 'Team updated successfully' });
  } catch (err) {
    console.error("Update team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while updating team.' });
  }
};

/**
 * @desc    Delete a team
 * @route   DELETE /api/schools/me/teams/:teamId
 * @access  Private (SchoolAdmin)
 */
exports.deleteSchoolTeam = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { teamId } = req.params;

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Team not found or access denied.' });
    }

    // Soft delete - update status to inactive
    await pool.query(
      'UPDATE school_teams SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['inactive', teamId]
    );

    // Also update all team players to inactive
    await pool.query(
      'UPDATE team_players SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE team_id = $2',
      ['inactive', teamId]
    );

    sendResponse(res, { data: { id: teamId }, message: 'Team deleted successfully' });
  } catch (err) {
    console.error("Delete team error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while deleting team.' });
  }
};

/**
 * @desc    Add a player to a team
 * @route   POST /api/schools/me/teams/:teamId/players
 * @access  Private (SchoolAdmin)
 */
exports.addPlayerToTeam = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { teamId } = req.params;
    const { name, studentId, grade, position } = req.body;

    if (!name || !studentId) {
      return sendResponse(res, { success: false, status: 400, message: 'Player name and student ID are required.' });
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id, max_players FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Team not found or access denied.' });
    }

    const maxPlayers = teamCheck.rows[0].max_players;

    // Check current player count
    const playerCount = await pool.query(
      'SELECT COUNT(*) as count FROM team_players WHERE team_id = $1 AND status = $2',
      [teamId, 'active']
    );

    if (parseInt(playerCount.rows[0].count) >= maxPlayers) {
      return sendResponse(res, { success: false, status: 409, message: `Team is full. Maximum ${maxPlayers} players allowed.` });
    }

    // Check if player already exists in school
    let playerId;
    const existingPlayer = await pool.query(
      'SELECT id FROM players WHERE (player_code = $1 OR roll_no = $1) AND school_id = $2',
      [studentId, schoolId]
    );

    if (existingPlayer.rows.length > 0) {
      playerId = existingPlayer.rows[0].id;

      // Check if player is already in this team
      const playerInTeam = await pool.query(
        'SELECT id FROM team_players WHERE team_id = $1 AND player_id = $2 AND status = $3',
        [teamId, playerId, 'active']
      );

      if (playerInTeam.rows.length > 0) {
        return sendResponse(res, { success: false, status: 409, message: 'Player is already in this team.' });
      }
    } else {
      // Create new player record
      const createPlayerQuery = `
        INSERT INTO players (player_code, full_name, class, school_id, created_by, registration_status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING id
      `;
      const newPlayer = await pool.query(createPlayerQuery, [studentId, name, grade, schoolId, req.user.user_id]);
      playerId = newPlayer.rows[0].id;
    }

    // Add player to team
    const addPlayerQuery = `
      INSERT INTO team_players (team_id, player_id, position)
      VALUES ($1, $2, $3)
      RETURNING *, $4 as name, $5 as grade
    `;

    const result = await pool.query(addPlayerQuery, [teamId, playerId, position, name, grade]);
    sendResponse(res, { status: 201, data: result.rows[0], message: 'Player added to team successfully' });
  } catch (err) {
    console.error("Add player error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while adding player to team.' });
  }
};

/**
 * @desc    Remove a player from a team
 * @route   DELETE /api/schools/me/teams/:teamId/players/:playerId
 * @access  Private (SchoolAdmin)
 */
exports.removePlayerFromTeam = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { teamId, playerId } = req.params;

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Team not found or access denied.' });
    }

    // Remove player from team
    const result = await pool.query(
      'UPDATE team_players SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE team_id = $2 AND player_id = $3 RETURNING *',
      ['inactive', teamId, playerId]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Player not found in team.' });
    }

    sendResponse(res, { data: { playerId }, message: 'Player removed from team successfully' });
  } catch (err) {
    console.error("Remove player error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while removing player from team.' });
  }
};

/**
 * @desc    Update player positions in team
 * @route   PUT /api/schools/me/teams/:teamId/players/positions
 * @access  Private (SchoolAdmin)
 */
exports.updatePlayerPositions = async (req, res) => {
  try {
    const schoolId = req.user.school_id;
    const { teamId } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return sendResponse(res, { success: false, status: 400, message: 'Updates must be an array.' });
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return sendResponse(res, { success: false, status: 404, message: 'Team not found or access denied.' });
    }

    // Update positions for each player
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        await client.query(
          'UPDATE team_players SET jersey_number = $1, updated_at = CURRENT_TIMESTAMP WHERE team_id = $2 AND player_id = $3',
          [update.position, teamId, update.id]
        );
      }

      await client.query('COMMIT');
      sendResponse(res, { data: { teamId, updates }, message: 'Player positions updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Update player positions error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while updating player positions.' });
  }
};


/**
 * @desc    Export school data as Excel file
 * @route   GET /api/schools/me/export
 * @access  Private (SchoolAdmin)
 */
exports.exportSchoolData = async (req, res) => {
  try {
    let schoolId = req.user?.school_id;

    if (!schoolId) {
      if (process.env.NODE_ENV === 'development') {
        schoolId = 1;
      } else {
        return sendResponse(res, { success: false, status: 404, message: 'No school associated with this user.' });
      }
    }

    // Get real school data from database for export
    const [schoolInfo, students, teams, tournaments] = await Promise.all([
      // School basic info
      pool.query('SELECT * FROM schools WHERE school_id = $1', [schoolId]),

      // Students/Athletes
      pool.query(`
        SELECT 
          athlete_id as id,
          full_name as name,
          grade as class,
          section,
          ARRAY_AGG(DISTINCT s.name) as sports
        FROM athletes a
        LEFT JOIN team_players tp ON a.athlete_id = tp.athlete_id
        LEFT JOIN teams t ON tp.team_id = t.id
        LEFT JOIN sports s ON t.sport_id = s.id
        WHERE a.school_id = $1
        GROUP BY a.athlete_id, a.full_name, a.grade, a.section
        ORDER BY a.grade, a.section, a.full_name
      `, [schoolId]),

      // Teams
      pool.query(`
        SELECT 
          t.id,
          t.name,
          s.name as sport,
          COUNT(tp.athlete_id) as players
        FROM teams t
        LEFT JOIN sports s ON t.sport_id = s.id
        LEFT JOIN team_players tp ON t.id = tp.team_id
        WHERE t.school_id = $1
        GROUP BY t.id, t.name, s.name
        ORDER BY s.name, t.name
      `, [schoolId]),

      // Tournaments
      pool.query(`
        SELECT 
          t.tournament_id as id,
          t.name,
          t.status,
          COUNT(tr.team_id) as teams
        FROM tournaments t
        LEFT JOIN tournament_registrations tr ON t.tournament_id = tr.tournament_id
        LEFT JOIN teams tm ON tr.team_id = tm.id
        WHERE tm.school_id = $1
        GROUP BY t.tournament_id, t.name, t.status
        ORDER BY t.start_date DESC
      `, [schoolId])
    ]);

    const school = schoolInfo.rows[0];
    if (!school) {
      return sendResponse(res, { success: false, status: 404, message: 'School not found.' });
    }

    const exportData = {
      school_info: {
        name: school.name,
        code: school.school_code,
        address: school.address,
        phone: school.phone,
        email: school.email
      },
      summary: {
        total_students: students.rows.length,
        total_teams: teams.rows.length,
        total_tournaments: tournaments.rows.length,
        export_date: new Date().toISOString()
      },
      students: students.rows.map(student => ({
        id: student.id,
        name: student.name,
        class: student.class,
        section: student.section,
        sports: student.sports ? student.sports.filter(s => s !== null) : []
      })),
      teams: teams.rows,
      tournaments: tournaments.rows
    };

    // Set headers for JSON export (can be enhanced to Excel later)
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="school_data_export_${school.school_code}_${Date.now()}.json"`);

    sendResponse(res, {
      data: exportData,
      message: "School data exported successfully"
    });

  } catch (err) {
    console.error("Export school data error:", err);
    sendResponse(res, { success: false, status: 500, message: 'Server error while exporting school data.' });
  }
};

// Export handled by individual exports.functionName above
// module.exports = {
//   // registerSchool, // Temporarily disabled for debugging
//   getAllSchools,
//   getMySchoolProfile,
//   updateMySchoolProfile,
//   getMySchoolTournaments,
//   getMySchoolTeams: getSchoolTeams, // Alias for consistency
//   getMySchoolPlayers,
//   getMySchoolTournamentStats,
//   getSchoolHouses,
//   getSchoolStaff,
//   getSchoolNotifications,
//   getSchoolActivities,
//   createSchoolTeam,
//   updateSchoolTeam,
//   deleteSchoolTeam,
//   getSchoolTeam,
//   addPlayerToTeam,
//   removePlayerFromTeam,
//   updatePlayerPositions: updatePlayerPosition, // Alias for route consistency
//   getSchoolTeams,
//   getSportsConfig
// };
