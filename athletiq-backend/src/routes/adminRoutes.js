const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware'); // We will just use the main middleware

/**
 * @desc    Register a new super admin
 * @route   POST /api/admin/register-superadmin
 * @access  Protected: only existing super_admin
 */
router.post('/register-superadmin', authMiddleware, async (req, res) => {
    // FIX: Check for the correct lowercase role from the user token
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Permission denied. Super admin access required.' });
    }

    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email & password are required.' });
    }
    try {
      const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'super_admin')`,
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
 * @desc    Get all data for the SuperAdmin dashboard
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (super_admin only)
 */
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    // FIX: Check for the correct lowercase role
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    }

    try {
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
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
});

module.exports = router;