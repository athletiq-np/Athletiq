const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const { generateShortCode } = require("../utils/codeGenerator");
const COUNTRY_CODE = process.env.COUNTRY_CODE || 'NP';

// Multer setup for logo/registration_doc uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// Utility: Generate short unique school code (e.g., EDUxxxx)
async function generateSchoolCode() {
  const existsFn = async (code) => {
    const result = await pool.query('SELECT 1 FROM schools WHERE school_code=$1', [code]);
    return result.rows.length > 0;
  };
  // EDU + 4 random alphanumeric (global, collision-resistant, 7 chars)
  return await generateShortCode("EDU", 7, existsFn);
}

// 1. School + Admin Registration (POST /api/school/register)
router.post('/register', async (req, res) => {
  console.log("Registering new school...");
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

    // Check duplicate admin email
    const userExists = await pool.query('SELECT 1 FROM users WHERE email=$1', [admin_email]);
    if (userExists.rows.length)
      return res.status(409).json({ message: 'Admin email already registered.' });

    // Check duplicate school (by name + address)
    const schoolExists = await pool.query(
      'SELECT 1 FROM schools WHERE LOWER(name)=LOWER($1) AND address=$2',
      [typeof name === 'string' ? name : name.en, address]
    );
    if (schoolExists.rows.length)
      return res.status(409).json({ message: 'School name/address already registered.' });

    // 1. Create admin user (school_id to be set after school is created)
    const hashed = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      'INSERT INTO users (full_name, email, password, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [admin_name, admin_email, hashed, 'school_admin']
    );
    const user_id = userRes.rows[0].id;

    // 2. Generate modern school code (EDUxxxx)
    const school_code = await generateSchoolCode();

    // 3. Create school
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
        typeof name === 'string' ? name : name.en,       // name
        typeof name === 'object' ? name.en : null,       // name_en
        typeof name === 'object' ? name.ne : null,       // name_ne
        address, country, province, district, state, city, postal_code, ward,
        phone, mobile, landline, email, website, facebook_url,
        type, registration_no, pan_number, estd_year, association,
        principal_name, principal_phone, principal_email, admin_email,
        location_lat, location_lng, place_id,
        user_id
      ]
    );
    const school_id = schoolRes.rows[0].id;

    // 4. Update the user’s school_id to point to the new school
    await pool.query(
      'UPDATE users SET school_id=$1 WHERE id=$2',
      [school_id, user_id]
    );

    console.log("School registration successful, school_id:", school_id);
    res.status(201).json({ message: "School admin registered!", school_id, school_code });
  } catch (err) {
    console.error("Register school admin error:", err);
    res.status(500).json({ message: "Server error during school admin registration." });
  }
});

// 2. School Admin Login (POST /api/school/login)
router.post('/login', async (req, res) => {
  console.log("School admin login...");
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

    // Find the school for this admin (by created_by or admin_email)
    const schoolRes = await pool.query(
      'SELECT id FROM schools WHERE admin_email = $1 OR created_by = $2 LIMIT 1',
      [user.email, user.id]
    );
    const school_id = schoolRes.rows[0]?.id || null;

    // Generate JWT with school_id
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        school_id // Include school_id in JWT payload!
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log("Login successful, token generated.");
    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        school_id
      }
    });
  } catch (err) {
    console.error("School admin login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 3. Super Admin: View all schools (GET /api/schools)
router.get('/', authMiddleware, async (req, res) => {
  console.log("Fetching all schools...");
  try {
    console.log("Before DB query");
    const result = await pool.query('SELECT * FROM schools ORDER BY id DESC');
    console.log("After DB query");
    res.json({ schools: result.rows });
  } catch (err) {
    console.error('Fetch schools error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/test', (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Test route working" });
});

// 4. School Admin: View my school (GET /api/schools/me)
router.get('/me', authMiddleware, async (req, res) => {
  console.log("Fetching school for admin...");
  if (req.user.role !== 'school_admin')
    return res.status(403).json({ message: 'Access denied' });

  let school;
  if (req.user.school_id) {
    const r = await pool.query('SELECT * FROM schools WHERE id=$1 LIMIT 1', [req.user.school_id]);
    school = r.rows[0];
  } else {
    const r = await pool.query('SELECT * FROM schools WHERE created_by=$1 LIMIT 1', [req.user.id]);
    school = r.rows[0];
  }
  if (!school)
    return res.status(404).json({ message: 'School not found' });

  console.log("School found:", school);
  res.json({ school });
});

module.exports = router;
