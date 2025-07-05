const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');

// Helper function to generate and set the cookie
const sendTokenResponse = (user, statusCode, res) => {
  const payload = {
    user: { id: user.id, role: user.role, school_id: user.school_id },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  delete user.password_hash;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json(apiResponse.success(user, 'Authentication successful'));
};

// @desc    Register a new SchoolAdmin and their School
exports.register = async (req, res, next) => {
  const { adminFullName, adminEmail, password, schoolName, schoolCode, schoolAddress } = req.body;

  if (!adminFullName || !adminEmail || !password || !schoolName || !schoolCode) {
    const error = new Error('Required fields are missing.');
    error.statusCode = 400;
    return next(error);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userExists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (userExists.rowCount > 0) {
      const error = new Error('Admin email already exists.');
      error.statusCode = 409;
      throw error;
    }
    
    const schoolExists = await client.query('SELECT id FROM schools WHERE school_code = $1', [schoolCode]);
    if (schoolExists.rowCount > 0) {
      const error = new Error('School code already exists.');
      error.statusCode = 409;
      throw error;
    }

    const schoolQuery = `
      INSERT INTO schools (school_code, name, address, admin_email, is_active)
      VALUES ($1, $2, $3, $4, true) RETURNING id;
    `;
    const schoolResult = await client.query(schoolQuery, [schoolCode, schoolName, schoolAddress, adminEmail]);
    const newSchoolId = schoolResult.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserQuery = `
      INSERT INTO users (full_name, email, password_hash, role, school_id)
      VALUES ($1, $2, $3, 'SchoolAdmin', $4) RETURNING *;
    `;
    const userResult = await client.query(newUserQuery, [adminFullName, adminEmail, passwordHash, newSchoolId]);
    const newUser = userResult.rows[0];

    await client.query('COMMIT');
    sendTokenResponse(newUser, 201, res);

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Authenticate an existing user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please provide email and password.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      return next(error);
    }
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
exports.getMe = async (req, res, next) => {
  // The 'protect' middleware already fetched the user and attached it to req.user
  res.status(200).json(apiResponse.success(req.user, 'User profile retrieved successfully'));
};

// @desc    Log user out / clear cookie
exports.logout = (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json(apiResponse.success(null, 'Logged out successfully'));
};