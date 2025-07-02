//
// 🧠 ATHLETIQ - Admin Controller
//
// This file contains all the logic for SuperAdmin-only actions,
// such as creating other admins and viewing platform-wide stats.
//

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new super admin
 * @route   POST /api/admin/register-superadmin
 * @access  Private (SuperAdmin)
 */
exports.registerSuperAdmin = async (req, res, next) => {
  const { full_name, email, password } = req.body;
  
  if (!full_name || !email || !password) {
    const error = new Error('full_name, email & password are required.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const { rows: existing } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.length) {
      const error = new Error('Email already in use.');
      error.statusCode = 409;
      return next(error);
    }
    
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'SuperAdmin')`,
      [full_name, email, hashed]
    );

    res.status(201).json({ success: true, message: 'Super admin created successfully.' });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get all data for the SuperAdmin dashboard
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (SuperAdmin)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Run all database queries in parallel for efficiency
    const [schoolResult, playerResult, tournamentResult] = await Promise.all([
      pool.query('SELECT * FROM schools ORDER BY created_at DESC'),
      pool.query('SELECT * FROM players ORDER BY created_at DESC'),
      pool.query('SELECT * FROM tournaments ORDER BY start_date DESC')
    ]);

    const stats = {
      schools: schoolResult.rows,
      players: playerResult.rows,
      tournaments: tournamentResult.rows,
      schoolCount: schoolResult.rowCount,
      playerCount: playerResult.rowCount,
      tournamentCount: tournamentResult.rowCount
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};


/**
 * @desc    Admin changes the password for a school's primary admin user
 * @route   PUT /api/admin/schools/:schoolId/change-password
 * @access  Private (SuperAdmin)
 */
exports.changeSchoolPassword = async (req, res, next) => {
  const { schoolId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    return next(error);
  }

  const client = await pool.connect();
  try {
    const schoolResult = await client.query('SELECT admin_user_id FROM schools WHERE id = $1', [schoolId]);

    if (schoolResult.rows.length === 0) {
      const error = new Error('School not found.');
      error.statusCode = 404;
      throw error;
    }

    const adminUserId = schoolResult.rows[0].admin_user_id;
    if (!adminUserId) {
      const error = new Error('This school does not have an assigned admin user to update.');
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