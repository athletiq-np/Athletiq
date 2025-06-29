// File: src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * 1. Register a new user (default role: user)
 *    POST /api/auth/register
 *    Body: { full_name, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    // Validate input
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email & password are required.' });
    }
    // Check if email already exists
    const { rows: existing } = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Insert into DB
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, hashed, 'user']
    );
    const user = rows[0];
    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Return user & token
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Auth register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * 2. Login existing user
 *    POST /api/auth/login
 *    Body: { identifier, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier & password required.' });
    }
    // Use identifier as email for now
    const { rows } = await pool.query(
      'SELECT id, full_name, email, password, role FROM users WHERE email = $1',
      [identifier]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Omit password in response
    delete user.password;
    return res.json({ user, token });
  } catch (err) {
    console.error('Auth login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
