const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Using bcryptjs is common in Node.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Ensure this path is correct

/**
 * 1. Register a new SchoolAdmin and their associated School
 * POST /api/auth/register
 * Body: { adminFullName, adminEmail, password, schoolName, schoolCode, schoolAddress, schoolEmail }
 */
router.post('/register', async (req, res) => {
  const {
    adminFullName,
    adminEmail,
    password,
    schoolName,
    schoolCode,
    schoolAddress,
    schoolEmail,
  } = req.body;

  // Validate input
  if (!adminFullName || !adminEmail || !password || !schoolName || !schoolCode) {
    return res.status(400).json({ message: 'Admin name, email, password, and school name & code are required.' });
  }

  const client = await pool.connect();

  try {
    // Check if email already exists
    const { rows: existingUser } = await client.query(
      'SELECT 1 FROM users WHERE email = $1',
      [adminEmail]
    );
    if (existingUser.length) {
      return res.status(409).json({ message: 'This administrator email is already in use.' });
    }
    
    // Check if school code already exists
    const { rows: existingSchool } = await client.query(
      'SELECT 1 FROM schools WHERE school_code = $1',
      [schoolCode]
    );
    if (existingSchool.length) {
      return res.status(409).json({ message: 'This school code is already registered.' });
    }

    // --- Start Transaction ---
    await client.query('BEGIN');

    // 1. Create the School
    const schoolQuery = `
      INSERT INTO schools (school_code, name, address, email, admin_email, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, name, school_code;
    `;
    const schoolResult = await client.query(schoolQuery, [schoolCode, schoolName, schoolAddress, schoolEmail || adminEmail, adminEmail]);
    const newSchool = schoolResult.rows[0];

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create the User, linking them to the new school
    const userQuery = `
      INSERT INTO users (full_name, email, password_hash, role, school_id)
      VALUES ($1, $2, $3, 'SchoolAdmin', $4)
      RETURNING id, full_name, email, role;
    `;
    const userResult = await client.query(userQuery, [adminFullName, adminEmail, passwordHash, newSchool.id]);
    const newUser = userResult.rows[0];

    // --- Commit Transaction ---
    await client.query('COMMIT');

    // 4. Sign JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, school_id: newSchool.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user & token
    return res.status(201).json({
      user: newUser,
      school: newSchool,
      token,
    });

  } catch (err) {
    await client.query('ROLLBACK'); // If anything fails, undo all changes
    console.error('Auth register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  } finally {
    client.release(); // Important to release the client back to the pool
  }
});


/**
 * 2. Login existing user
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email & password required.' });
    }

    // Find user by email
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // More secure to be generic
    }

    // Verify password against the stored hash
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // More secure to be generic
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Omit password hash in the response
    delete user.password_hash;

    return res.json({ user, token });

  } catch (err) {
    console.error('Auth login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;