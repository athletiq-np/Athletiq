// src/routes/schoolBulkImport.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/schools/bulk-import
router.post('/bulk-import', authMiddleware, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access only.' });
  }

  const schools = req.body.schools; // expects an array

  if (!Array.isArray(schools) || schools.length === 0) {
    return res.status(400).json({ message: 'No data provided.' });
  }

  let results = [];
  for (const data of schools) {
    try {
      // 1. Check for required fields
      const {
        name, address, country, province, district, city,
        phone, email, type, registration_no,
        principal_name, principal_phone,
        admin_name, admin_email, password
      } = data;

      if (!name || !address || !admin_name || !admin_email || !password) {
        results.push({ admin_email, success: false, reason: 'Missing required fields' });
        continue;
      }

      // 2. Check for duplicate admin email or school
      const adminExists = await pool.query('SELECT 1 FROM users WHERE email=$1', [admin_email]);
      if (adminExists.rows.length) {
        results.push({ admin_email, success: false, reason: 'Admin email exists' });
        continue;
      }
      const schoolExists = await pool.query(
        'SELECT 1 FROM schools WHERE LOWER(name)=LOWER($1) AND address=$2',
        [name, address]
      );
      if (schoolExists.rows.length) {
        results.push({ admin_email, success: false, reason: 'School exists' });
        continue;
      }

      // 3. Create school admin
      const hashed = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        'INSERT INTO users (full_name, email, password, role, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id',
        [admin_name, admin_email, hashed, 'school_admin']
      );
      const user_id = userRes.rows[0].id;

      // 4. Generate school code (e.g., EDU + random string)
      const school_code = `EDU${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // 5. Create school
      const schoolRes = await pool.query(
        `INSERT INTO schools
          (school_code, name, address, country, province, district, city, phone, email, type,
           registration_no, principal_name, principal_phone, admin_email, created_by, onboarding_status, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                 $11,$12,$13,$14,$15,'pending',TRUE,NOW(),NOW())
         RETURNING id`,
        [
          school_code, name, address, country, province, district, city, phone, email, type,
          registration_no, principal_name, principal_phone, admin_email, user_id
        ]
      );
      const school_id = schoolRes.rows[0].id;

      // 6. Update user's school_id
      await pool.query('UPDATE users SET school_id=$1 WHERE id=$2', [school_id, user_id]);

      results.push({ admin_email, success: true, school_id });
    } catch (err) {
      results.push({ admin_email: data.admin_email, success: false, reason: err.message });
    }
  }

  res.json({ results });
});

module.exports = router;
