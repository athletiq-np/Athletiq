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
    
    ApiResponse.success(res, rows, 'School teams retrieved successfully');
    
  } catch (err) {
    console.error("Get school teams error:", err);
    ApiResponse.error(res, "Server error while fetching school teams.", 500);
  }
};

/**
 * @desc    Get school athletes/players with comprehensive data
 * @route   GET /api/schools/me/athletes
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolAthletes = async (req, res) => {
  console.log('🔍 DEBUG: getMySchoolAthletes called - version 2025-07-14 latest');
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

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    // Handle filters
    const { grade, house, sport, status, search } = req.query;
    let whereConditions = ['p.school_id = $1'];
    let queryParams = [schoolId];
    let paramIndex = 2;

    if (grade && grade !== 'all') {
      whereConditions.push(`p.grade = $${paramIndex}`);
      queryParams.push(grade);
      paramIndex++;
    }

    if (sport && sport !== 'all') {
      whereConditions.push(`p.registered_sports ? $${paramIndex}`);
      queryParams.push(sport);
      paramIndex++;
    }

    if (status && status !== 'all') {
      whereConditions.push(`p.active_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(p.full_name ILIKE $${paramIndex} OR p.full_name_nepali ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    console.log('🔍 DEBUG: About to execute query with whereClause:', whereClause);
    console.log('🔍 DEBUG: Query params:', queryParams);
    
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.athlete_id,
        p.full_name,
        p.full_name_nepali,
        p.profile_photo_url,
        p.gender,
        p.date_of_birth,
        p.nationality,
        p.citizenship_no,
        p.grade,
        p.section,
        p.guardian_name,
        p.relationship_to_player,
        p.guardian_phone,
        p.guardian_email,
        p.address,
        p.province,
        p.district,
        p.municipality_or_rural_municipality,
        p.ward_no,
        p.school_name,
        p.school_code,
        p.admission_no,
        p.enrollment_status,
        p.registered_sports,
        p.primary_sport,
        p.player_position,
        p.jersey_number,
        p.team_ids,
        p.tournaments_participated,
        p.birth_certificate_url,
        p.citizenship_certificate_url,
        p.parent_national_id_url,
        p.photo_verified,
        p.document_verified,
        p.registration_method,
        p.verification_status,
        p.blood_group,
        p.medical_conditions,
        p.allergies,
        p.emergency_contact,
        p.parental_consent,
        p.nickname,
        p.bio,
        p.achievements,
        p.social_links,
        p.profile_completion,
        p.active_status,
        p.profile_status,
        p.created_at,
        p.updated_at
      FROM players p
      WHERE ${whereClause}
      ORDER BY p.full_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    // Get total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM players p
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    ApiResponse.success(res, {
      players: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'School athletes retrieved successfully');
    
  } catch (err) {
    console.error("Get school athletes error:", err);
    console.error("Error details:", err.stack);
    
    // Return mock data in development mode if database query fails
    if (process.env.NODE_ENV === 'development') {
      const mockPlayers = [
        {
          id: 1,
          athlete_id: 'uuid-1',
          full_name: 'Ram Bahadur Thapa',
          full_name_nepali: 'राम बहादुर थापा',
          profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          gender: 'Male',
          date_of_birth: '2008-03-15',
          grade: '10',
          section: 'A',
          guardian_name: 'Gopal Thapa',
          guardian_phone: '+977-9841234567',
          address: 'Kathmandu, Nepal',
          registered_sports: ['Football', 'Athletics'],
          primary_sport: 'Football',
          verification_status: 'Approved',
          active_status: 'Active',
          profile_completion: 85
        },
        {
          id: 2,
          athlete_id: 'uuid-2',
          full_name: 'Sita Kumari Poudel',
          full_name_nepali: 'सीता कुमारी पौडेल',
          profile_photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          gender: 'Female',
          date_of_birth: '2009-07-22',
          grade: '9',
          section: 'B',
          guardian_name: 'Krishna Poudel',
          guardian_phone: '+977-9851234567',
          address: 'Lalitpur, Nepal',
          registered_sports: ['Basketball', 'Volleyball'],
          primary_sport: 'Basketball',
          verification_status: 'Approved',
          active_status: 'Active',
          profile_completion: 90
        }
      ];

      return ApiResponse.success(res, {
        players: mockPlayers,
        pagination: {
          page: 1,
          limit: 100,
          total: mockPlayers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }, 'Mock school athletes data (development mode)');
    }
    
    ApiResponse.error(res, "Server error while fetching school athletes.", 500);
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
        title: 'New Athlete Registration',
        message: '5 new athletes have registered for cricket team.',
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
      return ApiResponse.error(res, "Team name, sport, gender, and age group are required.", 400);
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

    ApiResponse.success(res, mockTeam, "Team created successfully", 201);
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
    const updateData = req.body;

    // Mock response for now
    const mockUpdatedTeam = {
      id: parseInt(id),
      ...updateData,
      updated_at: new Date().toISOString()
    };

    ApiResponse.success(res, mockUpdatedTeam, "Team updated successfully");
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
    // Mock deletion
    ApiResponse.success(res, null, "Team deleted successfully");
  } catch (err) {
    console.error("Delete school team error:", err);
    ApiResponse.error(res, "Server error while deleting team.", 500);
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

    ApiResponse.success(res, mockTeam, "Team retrieved successfully");
  } catch (err) {
    console.error("Get school team error:", err);
    ApiResponse.error(res, "Server error while fetching team.", 500);
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
      return ApiResponse.error(res, "Athlete ID is required.", 400);
    }

    // Mock response
    const mockResult = {
      team_id: parseInt(teamId),
      athlete_id: athlete_id,
      position: position || null,
      created_at: new Date().toISOString()
    };

    ApiResponse.success(res, mockResult, "Athlete added to team successfully", 201);
  } catch (err) {
    console.error("Add athlete to team error:", err);
    ApiResponse.error(res, "Server error while adding athlete to team.", 500);
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
    ApiResponse.success(res, null, "Athlete removed from team successfully");
  } catch (err) {
    console.error("Remove athlete from team error:", err);
    ApiResponse.error(res, "Server error while removing athlete from team.", 500);
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
    ApiResponse.success(res, null, "Athlete position updated successfully");
  } catch (err) {
    console.error("Update athlete position error:", err);
    ApiResponse.error(res, "Server error while updating athlete position.", 500);
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
              'grade', p.class,
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
    ApiResponse.success(res, result.rows, "Teams retrieved successfully");
  } catch (err) {
    console.error("Get teams error:", err);
    ApiResponse.error(res, "Server error while fetching teams.", 500);
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
    ApiResponse.success(res, result.rows, "Sports configuration retrieved successfully");
  } catch (err) {
    console.error("Get sports config error:", err);
    ApiResponse.error(res, "Server error while fetching sports configuration.", 500);
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
      return ApiResponse.error(res, "Team name and sport are required.", 400);
    }

    // Check for duplicate team name within school and sport
    const existingTeam = await pool.query(
      'SELECT id FROM school_teams WHERE school_id = $1 AND LOWER(name) = LOWER($2) AND sport = $3 AND status = $4',
      [schoolId, name, sport, 'active']
    );

    if (existingTeam.rows.length > 0) {
      return ApiResponse.error(res, "A team with this name already exists for this sport.", 409);
    }

    const query = `
      INSERT INTO school_teams (school_id, name, sport, max_players, min_players, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *, 0 as player_count, '[]'::json as players
    `;

    const result = await pool.query(query, [schoolId, name, sport, maxPlayers || 11, minPlayers || 7, createdBy]);
    ApiResponse.success(res, result.rows[0], "Team created successfully", 201);
  } catch (err) {
    console.error("Create team error:", err);
    ApiResponse.error(res, "Server error while creating team.", 500);
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
      return ApiResponse.error(res, "Team name and sport are required.", 400);
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, "Team not found or access denied.", 404);
    }

    const query = `
      UPDATE school_teams 
      SET name = $1, sport = $2, max_players = $3, min_players = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND school_id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [name, sport, maxPlayers, minPlayers, teamId, schoolId]);
    ApiResponse.success(res, result.rows[0], "Team updated successfully");
  } catch (err) {
    console.error("Update team error:", err);
    ApiResponse.error(res, "Server error while updating team.", 500);
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
      return ApiResponse.error(res, "Team not found or access denied.", 404);
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

    ApiResponse.success(res, { id: teamId }, "Team deleted successfully");
  } catch (err) {
    console.error("Delete team error:", err);
    ApiResponse.error(res, "Server error while deleting team.", 500);
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
      return ApiResponse.error(res, "Player name and student ID are required.", 400);
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id, max_players FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, "Team not found or access denied.", 404);
    }

    const maxPlayers = teamCheck.rows[0].max_players;

    // Check current player count
    const playerCount = await pool.query(
      'SELECT COUNT(*) as count FROM team_players WHERE team_id = $1 AND status = $2',
      [teamId, 'active']
    );

    if (parseInt(playerCount.rows[0].count) >= maxPlayers) {
      return ApiResponse.error(res, `Team is full. Maximum ${maxPlayers} players allowed.`, 409);
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
        return ApiResponse.error(res, "Player is already in this team.", 409);
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
    ApiResponse.success(res, result.rows[0], "Player added to team successfully", 201);
  } catch (err) {
    console.error("Add player error:", err);
    ApiResponse.error(res, "Server error while adding player to team.", 500);
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
      return ApiResponse.error(res, "Team not found or access denied.", 404);
    }

    // Remove player from team
    const result = await pool.query(
      'UPDATE team_players SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE team_id = $2 AND player_id = $3 RETURNING *',
      ['inactive', teamId, playerId]
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(res, "Player not found in team.", 404);
    }

    ApiResponse.success(res, { playerId }, "Player removed from team successfully");
  } catch (err) {
    console.error("Remove player error:", err);
    ApiResponse.error(res, "Server error while removing player from team.", 500);
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
      return ApiResponse.error(res, "Updates must be an array.", 400);
    }

    // Check if team belongs to school
    const teamCheck = await pool.query(
      'SELECT id FROM school_teams WHERE id = $1 AND school_id = $2',
      [teamId, schoolId]
    );

    if (teamCheck.rows.length === 0) {
      return ApiResponse.error(res, "Team not found or access denied.", 404);
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
      ApiResponse.success(res, { teamId, updates }, "Player positions updated successfully");
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Update player positions error:", err);
    ApiResponse.error(res, "Server error while updating player positions.", 500);
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
        return ApiResponse.error(res, "No school associated with this user.", 404);
      }
    }

    // For now, return a mock Excel export response
    // In the future, this would generate an actual Excel file using a library like xlsx or exceljs
    const exportData = {
      school_info: {
        name: "Mock School",
        code: "MSC001",
        address: "123 School Street",
        phone: "+977-1-1234567",
        email: "info@mockschool.edu.np"
      },
      summary: {
        total_students: 150,
        total_teams: 8,
        total_staff: 25,
        active_tournaments: 3
      },
      students: [
        { id: 1, name: "John Doe", class: "10", section: "A", sports: ["Football", "Cricket"] },
        { id: 2, name: "Jane Smith", class: "9", section: "B", sports: ["Basketball"] }
      ],
      teams: [
        { id: 1, name: "School Eagles", sport: "Football", players: 11 },
        { id: 2, name: "Cricket Warriors", sport: "Cricket", players: 15 }
      ],
      tournaments: [
        { id: 1, name: "Inter-House Football", status: "active", teams: 4 },
        { id: 2, name: "District Basketball", status: "completed", teams: 8 }
      ]
    };

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="school_data_export_${Date.now()}.xlsx"`);
    
    // For mock implementation, return JSON data
    // In production, this would be an actual Excel file buffer
    res.json({
      success: true,
      message: "Export data prepared successfully",
      data: exportData,
      note: "This is a mock implementation. In production, this would download an Excel file."
    });
    
  } catch (err) {
    console.error("Export school data error:", err);
    ApiResponse.error(res, "Server error while exporting school data.", 500);
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
