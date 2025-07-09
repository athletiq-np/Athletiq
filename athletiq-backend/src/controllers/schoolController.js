const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateSchoolCode } = require('../utils/codeGenerator'); // Assuming you have this utility
const { ApiResponse } = require('../utils/apiResponse');

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
    return ApiResponse.error(res, 'Missing required fields for school and admin.', 400);
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

    ApiResponse.success(res, 
      { 
        school_id: school_id, 
        school_code: new_school_code 
      }, 
      'School and admin registered successfully!',
      201
    );

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Register school error:", err);
    ApiResponse.error(res, err.message || "Server error during registration.", 500);
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
    return ApiResponse.error(res, 'Access denied.', 403);
  }
  try {
    const result = await pool.query('SELECT * FROM schools ORDER BY created_at DESC');
    ApiResponse.success(res, result.rows, 'Schools retrieved successfully');
  } catch (error) {
    console.error('Error fetching all schools:', error);
    ApiResponse.error(res, 'Server error while fetching schools.', 500);
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
        return ApiResponse.error(res, "No school associated with this user.", 404);
    }
    
    console.log('🔍 Querying database for school ID:', schoolId);
    const { rows } = await pool.query("SELECT * FROM schools WHERE id=$1", [schoolId]);
    console.log('📊 Query completed. Rows found:', rows.length);
    
    if (!rows.length) {
      console.log('❌ No school found');
      return ApiResponse.error(res, "Associated school not found.", 404);
    }
    
    console.log('✅ School found:', rows[0].name);
    console.log('📤 Sending response');
    ApiResponse.success(res, rows[0], 'School profile retrieved successfully');
  } catch (err) {
    console.error("Get my school error:", err);
    ApiResponse.error(res, "Server error while fetching school profile.", 500);
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
      return ApiResponse.error(res, "No school associated with this user.", 404);
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
      return ApiResponse.error(res, "No fields to update.", 400);
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
      return ApiResponse.error(res, "School not found.", 404);
    }

    ApiResponse.success(res, rows[0], 'School profile updated successfully');
  } catch (err) {
    console.error("Update my school error:", err);
    ApiResponse.error(res, "Server error while updating school profile.", 500);
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
    
    // Development mode: Allow testing without full authentication
    let schoolId = req.user?.school_id;
    
    if (!schoolId) {
      console.log('❌ No school_id found for user:', req.user?.id);
      
      // For development testing, use a default school_id
      if (process.env.NODE_ENV === 'development' || !req.user) {
        console.log('🔧 Development mode: Using default school_id = 1');
        schoolId = 1;
      } else {
        return ApiResponse.error(res, "No school associated with this user.", 404);
      }
    }
    
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
    
    ApiResponse.success(res, {
      registered_tournaments: rows,
      available_tournaments: availableTournaments
    }, 'School tournaments retrieved successfully');
    
  } catch (err) {
    console.error("Get school tournaments error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    ApiResponse.error(res, `Server error while fetching school tournaments: ${err.message}`, 500);
  }
};

/**
 * @desc    Get school teams
 * @route   GET /api/schools/me/teams
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolTeams = async (req, res) => {
  try {
    // Development mode: Allow testing without full authentication
    let schoolId = req.user?.school_id;
    
    if (!schoolId) {
      // For development testing, use a default school_id
      if (process.env.NODE_ENV === 'development' || !req.user) {
        schoolId = 1;
      } else {
        return ApiResponse.error(res, "No school associated with this user.", 404);
      }
    }
    
    const { rows } = await pool.query(`
      SELECT 
        t.id,
        t.team_name as name,
        s.name as sport,
        t.season,
        COUNT(psp.player_id) as player_count,
        json_agg(
          json_build_object(
            'id', p.id,
            'name', p.full_name,
            'player_code', p.player_code,
            'position', psp.event_category
          )
        ) FILTER (WHERE p.id IS NOT NULL) as players
      FROM teams t
      LEFT JOIN sports s ON t.sport_id = s.id
      LEFT JOIN player_sport_participation psp ON t.id = psp.team_id
      LEFT JOIN players p ON psp.player_id = p.id
      WHERE t.school_id = $1
      GROUP BY t.id, t.team_name, s.name, t.season
      ORDER BY t.team_name, t.season DESC
    `, [schoolId]);
    
    ApiResponse.success(res, rows, 'School teams retrieved successfully');
    
  } catch (err) {
    console.error("Get school teams error:", err);
    ApiResponse.error(res, "Server error while fetching school teams.", 500);
  }
};

/**
 * @desc    Get school players
 * @route   GET /api/schools/me/players
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolPlayers = async (req, res) => {
  try {
    // Development mode: Allow testing without full authentication
    let schoolId = req.user?.school_id;
    
    if (!schoolId) {
      // For development testing, use a default school_id
      if (process.env.NODE_ENV === 'development' || !req.user) {
        schoolId = 1;
      } else {
        return ApiResponse.error(res, "No school associated with this user.", 404);
      }
    }
    
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.player_code,
        p.full_name,
        p.date_of_birth,
        p.gender,
        p.class,
        p.section,
        p.contact_no,
        p.email,
        p.registration_status,
        p.is_active,
        p.created_at,
        json_agg(
          json_build_object(
            'sport', s.name,
            'team', t.team_name,
            'position', psp.event_category
          )
        ) FILTER (WHERE s.id IS NOT NULL) as sports_participation
      FROM players p
      LEFT JOIN player_sport_participation psp ON p.id = psp.player_id
      LEFT JOIN sports s ON psp.sport_id = s.id
      LEFT JOIN teams t ON psp.team_id = t.id
      WHERE p.school_id = $1
      GROUP BY p.id, p.player_code, p.full_name, p.date_of_birth, p.gender, p.class, p.section, p.contact_no, p.email, p.registration_status, p.is_active, p.created_at
      ORDER BY p.full_name
    `, [schoolId]);
    
    ApiResponse.success(res, rows, 'School players retrieved successfully');
    
  } catch (err) {
    console.error("Get school players error:", err);
    ApiResponse.error(res, "Server error while fetching school players.", 500);
  }
};

/**
 * @desc    Get school tournament statistics
 * @route   GET /api/schools/me/tournament-stats
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolTournamentStats = async (req, res) => {
  try {
    // Development mode: Allow testing without full authentication
    let schoolId = req.user?.school_id;
    
    if (!schoolId) {
      // For development testing, use a default school_id
      if (process.env.NODE_ENV === 'development' || !req.user) {
        schoolId = 1;
      } else {
        return ApiResponse.error(res, "No school associated with this user.", 404);
      }
    }
    
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
        COUNT(DISTINCT players.id) as total_players
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
      total_players: 0
    };
    
    // Calculate win rate
    const winRate = stats.total_matches_played > 0 
      ? ((stats.matches_won / stats.total_matches_played) * 100).toFixed(2)
      : 0;
    
    ApiResponse.success(res, {
      ...stats,
      win_rate: winRate
    }, 'School tournament statistics retrieved successfully');
    
  } catch (err) {
    console.error("Get school tournament stats error:", err);
    ApiResponse.error(res, "Server error while fetching school tournament statistics.", 500);
  }
};

/**
 * @desc    Get school houses (mock data for now)
 * @route   GET /api/schools/houses
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolHouses = async (req, res) => {
  try {
    // Mock data for houses
    const houses = [
      {
        id: 1,
        name: 'Red House',
        color: '#EF4444',
        captain: 'John Doe',
        members: 25,
        points: 150
      },
      {
        id: 2,
        name: 'Blue House',
        color: '#3B82F6',
        captain: 'Jane Smith',
        members: 23,
        points: 142
      },
      {
        id: 3,
        name: 'Green House',
        color: '#10B981',
        captain: 'Mike Johnson',
        members: 27,
        points: 138
      },
      {
        id: 4,
        name: 'Yellow House',
        color: '#F59E0B',
        captain: 'Sarah Wilson',
        members: 24,
        points: 145
      }
    ];

    ApiResponse.success(res, houses, 'School houses retrieved successfully');
  } catch (err) {
    console.error("Get school houses error:", err);
    ApiResponse.error(res, "Server error while fetching school houses.", 500);
  }
};

/**
 * @desc    Get school staff (mock data for now)
 * @route   GET /api/schools/staff
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolStaff = async (req, res) => {
  try {
    // Mock data for staff
    const staff = [
      {
        id: 1,
        name: 'Dr. Robert Smith',
        position: 'Principal',
        department: 'Administration',
        email: 'principal@school.edu',
        phone: '+977-1-1234567'
      },
      {
        id: 2,
        name: 'Ms. Emily Johnson',
        position: 'Vice Principal',
        department: 'Administration',
        email: 'vp@school.edu',
        phone: '+977-1-1234568'
      },
      {
        id: 3,
        name: 'Mr. David Wilson',
        position: 'Sports Coordinator',
        department: 'Sports',
        email: 'sports@school.edu',
        phone: '+977-1-1234569'
      }
    ];

    ApiResponse.success(res, staff, 'School staff retrieved successfully');
  } catch (err) {
    console.error("Get school staff error:", err);
    ApiResponse.error(res, "Server error while fetching school staff.", 500);
  }
};

/**
 * @desc    Get school notifications (mock data for now)
 * @route   GET /api/schools/notifications
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolNotifications = async (req, res) => {
  try {
    // Mock data for notifications
    const notifications = [
      {
        id: 1,
        title: 'Tournament Registration Open',
        message: 'Registration for the Inter-House Football Tournament is now open.',
        type: 'tournament',
        priority: 'high',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 2,
        title: 'New Player Registration',
        message: '5 new players have registered for cricket team.',
        type: 'registration',
        priority: 'medium',
        read: false,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        id: 3,
        title: 'Schedule Update',
        message: 'Basketball practice has been rescheduled to 4 PM.',
        type: 'schedule',
        priority: 'low',
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    ApiResponse.success(res, notifications, 'School notifications retrieved successfully');
  } catch (err) {
    console.error("Get school notifications error:", err);
    ApiResponse.error(res, "Server error while fetching school notifications.", 500);
  }
};

/**
 * @desc    Get school activities (mock data for now)
 * @route   GET /api/schools/activities
 * @access  Private (SchoolAdmin)
 */
exports.getSchoolActivities = async (req, res) => {
  try {
    // Mock data for activities
    const activities = [
      {
        id: 1,
        title: 'Football Practice',
        type: 'practice',
        sport: 'Football',
        date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        location: 'Main Ground',
        participants: 22,
        status: 'scheduled'
      },
      {
        id: 2,
        title: 'Basketball Match vs. ABC School',
        type: 'match',
        sport: 'Basketball',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        location: 'School Gym',
        participants: 10,
        status: 'confirmed'
      },
      {
        id: 3,
        title: 'Swimming Training',
        type: 'training',
        sport: 'Swimming',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        location: 'Pool Complex',
        participants: 15,
        status: 'scheduled'
      }
    ];

    ApiResponse.success(res, activities, 'School activities retrieved successfully');
  } catch (err) {
    console.error("Get school activities error:", err);
    ApiResponse.error(res, "Server error while fetching school activities.", 500);
  }
};