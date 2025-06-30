const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const { generateShortCode } = require("../utils/codeGenerator");

// Multer setup for logo/registration_doc uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// Generate school code
async function generateSchoolCode() {
  const existsFn = async (code) => {
    const result = await pool.query('SELECT 1 FROM schools WHERE school_code=$1', [code]);
    return result.rows.length > 0;
  };
  return await generateShortCode("EDU", 7, existsFn);
}

// 1. Register school and admin
router.post('/register', async (req, res) => {
  try {
    const {
      name, address, country, province, district, state, city, postal_code, ward,
      phone, mobile, landline, email, website, facebook_url,
      type, registration_no, pan_number, estd_year, association,
      principal_name, principal_phone, principal_email,
      admin_name, admin_email, password,
      location_lat, location_lng, place_id
    } = req.body;

    if (!name || !address || !email || !admin_name || !admin_email || !password) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const userExists = await pool.query('SELECT 1 FROM users WHERE email=$1', [admin_email]);
    if (userExists.rows.length)
      return res.status(409).json({ message: 'Admin email already registered.' });

    const schoolExists = await pool.query(
      'SELECT 1 FROM schools WHERE LOWER(name)=LOWER($1) AND address=$2',
      [typeof name === 'string' ? name : name.en, address]
    );
    if (schoolExists.rows.length)
      return res.status(409).json({ message: 'School already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      'INSERT INTO users (full_name, email, password, role, phone, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [admin_name, admin_email, hashed, 'school_admin', principal_phone]
    );
    const user_id = userRes.rows[0].id;

    const school_code = await generateSchoolCode();
    const schoolRes = await pool.query(
      `INSERT INTO schools
        (school_code, name, name_en, name_ne, address, country, province, district, state, city, postal_code, ward,
         phone, mobile, landline, email, website, facebook_url, type, registration_no, pan_number, estd_year, association,
         principal_name, principal_phone, principal_email, admin_email,
         logo_url, registration_doc_url, location_lat, location_lng, place_id,
         created_by, onboarding_status, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
               $24,$25,$26,$27,
               NULL,NULL,$28,$29,$30,
               $31,'pending',TRUE,NOW(),NOW())
       RETURNING id`,
      [
        school_code,
        typeof name === 'string' ? name : name.en,
        typeof name === 'object' ? name.en : null,
        typeof name === 'object' ? name.ne : null,
        address, country, province, district, state, city, postal_code, ward,
        phone, mobile, landline, email, website, facebook_url,
        type, registration_no, pan_number, estd_year, association,
        principal_name, principal_phone, principal_email, admin_email,
        location_lat, location_lng, place_id,
        user_id
      ]
    );

    const school_id = schoolRes.rows[0].id;
    await pool.query('UPDATE users SET school_id=$1 WHERE id=$2', [school_id, user_id]);

    res.status(201).json({ message: "School admin registered!", school_id, school_code });
  } catch (err) {
    console.error("Register school admin error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// 2. Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    const userRes = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND role=$2',
      [email, 'school_admin']
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password.' });

    const schoolRes = await pool.query(
      'SELECT id FROM schools WHERE admin_email = $1 OR created_by = $2 LIMIT 1',
      [user.email, user.id]
    );
    const school_id = schoolRes.rows[0]?.id || null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name, school_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, school_id }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 3. Get all schools (Super Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.phone AS admin_phone
      FROM schools s
      LEFT JOIN users u ON s.admin_email = u.email
      ORDER BY s.id DESC
    `);
    res.json({ schools: result.rows });
  } catch (err) {
    console.error('Fetch schools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Get my school (School Admin)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'school_admin') return res.status(403).json({ message: 'Access denied' });

    const result = await pool.query(`
      SELECT s.*, u.phone AS admin_phone
      FROM schools s
      LEFT JOIN users u ON s.admin_email = u.email
      WHERE s.id = $1
    `, [req.user.school_id]);

    if (!result.rows.length) return res.status(404).json({ message: 'School not found' });

    res.json({ school: result.rows[0] });
  } catch (err) {
    console.error('Fetch school error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. Super Admin: Change School Admin Password
router.put('/:id/admin-password', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only super admin can change admin passwords.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    const schoolRes = await pool.query(
      'SELECT admin_email FROM schools WHERE id = $1',
      [id]
    );

    if (schoolRes.rows.length === 0) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const adminEmail = schoolRes.rows[0].admin_email;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateRes = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
      [hashedPassword, adminEmail, 'school_admin']
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ message: 'Admin user not found.' });
    }

    res.status(200).json({ message: 'Admin password updated successfully.' });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
});

module.exports = router;
