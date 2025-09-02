const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResponse } = require('../utils/response');
const { logInfo, logWarn, logError } = require('../utils/logger');

// Helper function to generate and set the cookie
const sendTokenResponse = (user, statusCode, res) => {
  const payload = {
    user: { id: user.id, role: user.role, school_id: user.school_id },
  };

  logInfo('JWT_SECRET check', { present: !!process.env.JWT_SECRET, length: process.env.JWT_SECRET?.length || 0 });
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  delete user.password_hash;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message: 'Authentication successful',
      data: user,
      token // expose token for SPA header auth
    });
};

// @desc    Register a new SchoolAdmin and their School
exports.register = async (req, res, next) => {
  const { adminFullName, adminEmail, password, schoolName, schoolCode, schoolAddress } = req.body;

  const validationErrors = [];
  if (!adminFullName) validationErrors.push('adminFullName is required');
  if (!adminEmail) validationErrors.push('adminEmail is required');
  if (!password) validationErrors.push('password is required');
  if (!schoolName) validationErrors.push('schoolName is required');
  if (!schoolCode) validationErrors.push('schoolCode is required');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (adminEmail && !emailRegex.test(adminEmail)) validationErrors.push('adminEmail must be a valid email');
  if (password && password.length < 8) validationErrors.push('password must be at least 8 characters');

  if (validationErrors.length) {
    const error = new Error('Validation failed: ' + validationErrors.join(', '));
    error.statusCode = 400;
    return next(error);
  }

  let activePool = pool;
  if (process.env.NODE_ENV === 'test') {
    try { const { testPool } = require('../../tests/testDb'); if (testPool) activePool = testPool; } catch (e) { void e; }
  }

  const client = await activePool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicates
    const dupUser = await client.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [adminEmail]);
    if (dupUser.rowCount) {
      await client.query('ROLLBACK');
      const err = new Error('A user with this email already exists.');
      err.statusCode = 409; return next(err);
    }
    const dupSchool = await client.query('SELECT 1 FROM schools WHERE school_code = $1 LIMIT 1', [schoolCode]);
    if (dupSchool.rowCount) {
      await client.query('ROLLBACK');
      const err = new Error('A school with this code already exists.');
      err.statusCode = 409; return next(err);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // School insert attempts (minimal then email then admin_email)
    const attempts = [
      { sql: 'INSERT INTO schools (name, school_code, address) VALUES ($1, $2, $3) RETURNING id', params: [schoolName, schoolCode, schoolAddress || null] },
      { sql: 'INSERT INTO schools (name, school_code, address, email) VALUES ($1, $2, $3, $4) RETURNING id', params: [schoolName, schoolCode, schoolAddress || null, adminEmail] },
      { sql: 'INSERT INTO schools (name, school_code, address, admin_email) VALUES ($1, $2, $3, $4) RETURNING id', params: [schoolName, schoolCode, schoolAddress || null, adminEmail] }
    ];
    let schoolId = null; let lastErr;
    for (const a of attempts) {
      try { const r = await client.query(a.sql, a.params); schoolId = r.rows[0].id; break; } catch(e){ lastErr = e; }
    }
    if (!schoolId) { await client.query('ROLLBACK'); lastErr = lastErr || new Error('Unknown school insert failure'); return next(Object.assign(new Error('Failed to create school record'), { statusCode: 500 })); }

    const userInsert = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, school_id)
       VALUES ($1, $2, $3, 'SchoolAdmin', $4)
       RETURNING id, full_name, email, role, school_id`,
      [adminFullName, adminEmail, passwordHash, schoolId]
    );
    const newUser = userInsert.rows[0];

    await client.query('COMMIT');
    return sendTokenResponse(newUser, 201, res);
  } catch(err) {
    try { await client.query('ROLLBACK'); } catch (e) { void e; }
    if (!err.statusCode) err.statusCode = 500;
    return next(err);
  } finally {
    client.release();
  }
};

// @desc    Authenticate an existing user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const validationErrors = [];
  if (!email) validationErrors.push('email is required');
  if (!password) validationErrors.push('password is required');

  // Basic email format check to satisfy test when invalid email provided
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    validationErrors.push('email must be a valid email');
  }

  if (validationErrors.length) {
    const error = new Error('Validation failed: ' + validationErrors.join(', '));
    error.statusCode = 400;
    return next(error);
  }

  try {
  logInfo('Login attempt', { email });
    // In test environment ensure we use the test pool so seeded users are found
    let dbPool = pool;
    if (process.env.NODE_ENV === 'test') {
      try {
          const { testPool } = require('../../tests/testDb');
          if (testPool) dbPool = testPool;
        } catch (e) { void e; }
    }
    const userResult = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      logWarn('Invalid credentials', { email });
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      return next(error);
    }
    
    logInfo('User authenticated successfully', { email: user.email });
    sendTokenResponse(user, 200, res);
  } catch (error) {
  logError('Login error', error, { message: error.message });
    next(error);
  }
};

// @desc    Get current logged in user
exports.getMe = async (req, res, next) => {
  return sendResponse(res, { data: req.user, message: 'User profile retrieved successfully' });
};

// @desc    Log user out / clear cookie
exports.logout = (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return sendResponse(res, { message: 'Logged out successfully', data: null });
};

// @desc    Unified login for any account type (users table first, then guardians)
// @route   POST /api/auth/unified-login
// @access  Public
exports.loginUnified = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.statusCode = 400; return next(err);
  }
  try {
  logInfo('Unified login attempt', { email });
    let dbPool = pool;
    if (process.env.NODE_ENV === 'test') {
      try { const { testPool } = require('../../tests/testDb'); if (testPool) dbPool = testPool; } catch (e) { void e; }
    }

    // 1. Try primary users table
    const userResult = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
    const userRow = userResult.rows[0];
    if (userRow && await bcrypt.compare(password, userRow.password_hash)) {
      logInfo('Unified login (users) success', { email });
      const payload = { user: { id: userRow.id, role: userRow.role, school_id: userRow.school_id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
      delete userRow.password_hash;
      return res.status(200).json({ success: true, message: 'Authentication successful', data: userRow, token, userType: 'user' });
    }

    // 2. Try guardians table
    const guardianResult = await dbPool.query('SELECT * FROM guardians WHERE email = $1', [email]);
    const guardianRow = guardianResult.rows[0];
    if (guardianRow && await bcrypt.compare(password, guardianRow.password_hash)) {
  logInfo('Unified login (guardian) success', { email });
      const payload = { user: { id: guardianRow.id, role: 'Guardian' } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
      delete guardianRow.password_hash;
      return res.status(200).json({ success: true, message: 'Authentication successful', data: { ...guardianRow, role: 'Guardian' }, token, userType: 'guardian' });
    }

  logWarn('Unified login failed (no match)', { email });
    const error = new Error('Invalid credentials.');
    error.statusCode = 401; return next(error);
  } catch (err) {
  logError('Unified login error', err, { message: err.message });
    return next(err);
  }
};