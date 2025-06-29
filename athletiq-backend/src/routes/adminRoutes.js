// File: src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * 1. Register a new super admin
 *    POST /api/admin/register-superadmin
 *    Protected: only existing super_admin via JWT
 */
router.post(
  '/register-superadmin',
  authMiddleware,
  async (req, res) => {
    // Only super_admin can create another
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required.' });
    }

    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email & password are required.' });
    }

    try {
      // Check for existing email
      const existing = await pool.query(
        'SELECT 1 FROM users WHERE email = $1',
        [email]
      );
      if (existing.rows.length) {
        return res.status(409).json({ message: 'Email already in use.' });
      }

      // Hash password and insert super_admin
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (full_name, email, password, role, created_at)
         VALUES ($1, $2, $3, 'super_admin', NOW())`,
        [full_name, email, hashed]
      );

      return res.status(201).json({ message: 'Super admin created.' });
    } catch (err) {
      console.error('Error in register-superadmin:', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  }
);

/**
 * 2. Get all users
 *    GET /api/admin/all-users
 *    Protected: only super_admin
 */
router.get(
  '/all-users',
  authMiddleware,
  async (req, res) => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required.' });
    }

    try {
      const result = await pool.query(
        'SELECT id, full_name, email, role, created_at FROM users ORDER BY id'
      );
      return res.json({ users: result.rows });
    } catch (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  }
);

module.exports = router;
