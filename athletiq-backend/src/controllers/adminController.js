//
// 🧠 ATHLETIQ - Admin Controller (Upgraded with Security & Standards)
//
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { ApiResponse, getPaginationInfo } = require('../utils/apiResponse');
const { logInfo, logError, logSecurityEvent } = require('../utils/logger');

/**
 * @desc    Register a new super admin
 * @route   POST /api/admin/register-superadmin
 */
exports.registerSuperAdmin = async (req, res, next) => {
  const { full_name, email, password } = req.body;
  
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      logSecurityEvent('Duplicate super admin registration attempt', { email, ip: req.ip });
      return ApiResponse.conflict(res, 'Email already in use');
    }
    
    const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for admin
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'SuperAdmin') RETURNING id, full_name, email, role`,
      [full_name, email, hashedPassword]
    );

    logSecurityEvent('Super admin created', { adminId: result.rows[0].id, email, createdBy: req.user?.id });
    logInfo('Super admin registered successfully', { email, adminId: result.rows[0].id });
    
    return ApiResponse.created(res, result.rows[0], 'Super admin created successfully');
  } catch (err) {
    logError('Super admin registration failed', err, { email });
    next(err);
  }
};


/**
 * @desc    Get all data for the SuperAdmin dashboard
 * @route   GET /api/admin/dashboard-stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [schoolResult, playerResult, tournamentResult, userResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE is_active = true) as active_count FROM schools'),
      pool.query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE is_active = true) as active_count FROM players'),
      pool.query('SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = \'ongoing\') as active_count FROM tournaments'),
      pool.query('SELECT COUNT(*) as count, role FROM users GROUP BY role')
    ]);

    const stats = {
      schools: {
        total: parseInt(schoolResult.rows[0].count),
        active: parseInt(schoolResult.rows[0].active_count)
      },
      players: {
        total: parseInt(playerResult.rows[0].count),
        active: parseInt(playerResult.rows[0].active_count)
      },
      tournaments: {
        total: parseInt(tournamentResult.rows[0].count),
        active: parseInt(tournamentResult.rows[0].active_count)
      },
      users: userResult.rows.reduce((acc, row) => {
        acc[row.role.toLowerCase()] = parseInt(row.count);
        return acc;
      }, {}),
      // Legacy fields for compatibility
      schoolCount: parseInt(schoolResult.rows[0].count),
      playerCount: parseInt(playerResult.rows[0].count),
      tournamentCount: parseInt(tournamentResult.rows[0].count)
    };

    logInfo('Dashboard stats retrieved', { userId: req.user.id });
    return ApiResponse.success(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    logError('Failed to get dashboard stats', error, { userId: req.user.id });
    next(error);
  }
};


/**
 * @desc    Admin changes the password for a school's admin user
 * @route   PUT /api/admin/schools/:id/change-password
 */
exports.changeSchoolPassword = async (req, res, next) => {
  const { id } = req.params; // School ID
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    return next(error);
  }

  const client = await pool.connect();
  try {
    const schoolResult = await client.query('SELECT admin_user_id FROM schools WHERE id = $1', [id]);

    if (schoolResult.rows.length === 0) {
      const error = new Error('School not found.');
      error.statusCode = 404;
      throw error;
    }

    const adminUserId = schoolResult.rows[0].admin_user_id;
    if (!adminUserId) {
      const error = new Error('This school does not have an assigned admin user.');
      error.statusCode = 404;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, adminUserId]
    );
    
    res.status(200).json({ success: true, message: 'School admin password updated successfully.' });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};


/**
 * @desc    Get all players with pagination and filtering
 * @route   GET /api/admin/players
 */
exports.getAllPlayers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, schoolId, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, s.name as school_name, s.school_code
      FROM players p 
      LEFT JOIN schools s ON p.school_id = s.id
    `;
    let params = [];
    let whereConditions = [];
    
    // Add school filter
    if (schoolId) {
      whereConditions.push(`p.school_id = $${params.length + 1}`);
      params.push(schoolId);
    }
    
    // Add search filter
    if (search) {
      whereConditions.push(`(p.full_name ILIKE $${params.length + 1} OR s.name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM players p LEFT JOIN schools s ON p.school_id = s.id`;
    let countParams = [];
    
    if (schoolId) {
      countQuery += ` WHERE p.school_id = $1`;
      countParams.push(schoolId);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all schools with pagination and filtering
 * @route   GET /api/admin/schools
 */
exports.getAllSchools = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, 
        COUNT(p.id) as player_count,
        COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_player_count
      FROM schools s 
      LEFT JOIN players p ON s.id = p.school_id
    `;
    let params = [];
    
    // Add search filter
    if (search) {
      query += ` WHERE s.name ILIKE $1 OR s.school_code ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY s.id ORDER BY s.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM schools`;
    let countParams = [];
    
    if (search) {
      countQuery += ` WHERE name ILIKE $1 OR school_code ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tournaments with pagination and filtering
 * @route   GET /api/admin/tournaments
 */
exports.getAllTournaments = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM tournaments
    `;
    let params = [];
    
    // Add search filter
    if (search) {
      query += ` WHERE name ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM tournaments`;
    let countParams = [];
    
    if (search) {
      countQuery += ` WHERE name ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};