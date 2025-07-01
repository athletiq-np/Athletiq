const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateSchoolCode } = require('../utils/codeGenerator'); // Assuming you have this utility

/**
 * @desc    Register a new school and its primary admin user
 * @route   POST /api/schools/register
 * @access  Public
 */
exports.registerSchool = async (req, res) => {
  const {
    name, address, country, province, district, city, ward,
    phone, email: schoolEmail, website,
    principal_name,
    admin_name, admin_email, password
  } = req.body;

  // Basic validation
  if (!name || !address || !admin_name || !admin_email || !password) {
    return res.status(400).json({ message: 'Missing required fields for school and admin.' });
  }

  const client = await pool.connect();

  try {
    // --- Start Transaction ---
    await client.query('BEGIN');

    // Check for duplicate admin email
    const userExists = await client.query('SELECT 1 FROM users WHERE email=$1', [admin_email]);
    if (userExists.rows.length) {
      throw new Error('This administrator email is already registered.');
    }

    // Check for duplicate school name
    const schoolExists = await client.query('SELECT 1 FROM schools WHERE LOWER(name)=LOWER($1)', [name]);
    if (schoolExists.rows.length) {
      throw new Error('A school with this name is already registered.');
    }

    // 1. Create the admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, 'SchoolAdmin') RETURNING user_id`,
      [admin_name, admin_email, passwordHash]
    );
    const adminUserId = userRes.rows[0].user_id;

    // 2. Generate a unique school code
    const school_code = await generateSchoolCode();

    // 3. Create the school, linking the new admin user to it
    const schoolRes = await client.query(
      `INSERT INTO schools (school_code, name, address, country, province, district, city, ward, phone, email, website, principal_name, admin_user_id, onboarding_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending') 
       RETURNING school_id, school_code`,
      [school_code, name, address, country, province, district, city, ward, phone, schoolEmail, website, principal_name, adminUserId]
    );
    const { school_id, school_code: new_school_code } = schoolRes.rows[0];
    
    // --- Commit Transaction ---
    await client.query('COMMIT');

    res.status(201).json({ 
      message: "School and admin registered successfully!", 
      school_id: school_id, 
      school_code: new_school_code 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Register school error:", err);
    res.status(500).json({ message: err.message || "Server error during registration." });
  } finally {
    client.release();
  }
};


/**
 * @desc    Get a list of all schools (for SuperAdmin)
 * @route   GET /api/schools
 * @access  Private (SuperAdmin)
 */
exports.getAllSchools = async (req, res) => {
  // This check ensures only SuperAdmins can get the full list
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Access denied.' });
  }
  try {
    const result = await pool.query('SELECT * FROM schools ORDER BY created_at DESC');
    res.status(200).json({ schools: result.rows });
  } catch (error) {
    console.error('Error fetching all schools:', error);
    res.status(500).json({ message: 'Server error while fetching schools.' });
  }
};


/**
 * @desc    Get the profile for the currently logged-in admin's school
 * @route   GET /api/schools/me
 * @access  Private (SchoolAdmin)
 */
exports.getMySchoolProfile = async (req, res) => {
  try {
    // The school_id is securely taken from the user's token, not a URL parameter
    const schoolId = req.user.school_id;
    if (!schoolId) {
        return res.status(404).json({ message: "No school associated with this user." });
    }
    const { rows } = await pool.query("SELECT * FROM schools WHERE school_id=$1", [schoolId]);
    if (!rows.length) {
      return res.status(404).json({ message: "Associated school not found." });
    }
    res.status(200).json({ school: rows[0] });
  } catch (err) {
    console.error("Get my school error:", err);
    res.status(500).json({ message: "Server error while fetching school profile." });
  }
};