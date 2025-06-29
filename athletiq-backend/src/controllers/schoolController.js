const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Register a new school admin + school, return school_id
exports.registerSchoolAdmin = async (req, res) => {
  try {
    const { email, password, school_name } = req.body;
    if (!email || !password || !school_name)
      return res.status(400).json({ message: 'Email, password, and school name required.' });

    // Duplicate check (user)
    const userExists = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userExists.rows.length)
      return res.status(409).json({ message: 'Email already registered.' });

    // Duplicate check (school)
    const schoolExists = await pool.query('SELECT * FROM schools WHERE LOWER(name)=LOWER($1)', [school_name]);
    if (schoolExists.rows.length)
      return res.status(409).json({ message: 'School name already registered.' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user (role: school_admin)
    const userRes = await pool.query(
      'INSERT INTO users (email, password, role, is_active, created_at) VALUES ($1, $2, $3, TRUE, NOW()) RETURNING id',
      [email, hashed, 'school_admin']
    );
    const user_id = userRes.rows[0].id;

    // Create school, set created_by=user_id
    const schoolRes = await pool.query(
      "INSERT INTO schools (name, created_by, onboarding_status, is_active, created_at, updated_at) VALUES ($1, $2, 'pending', TRUE, NOW(), NOW()) RETURNING id",
      [school_name, user_id]
    );
    const school_id = schoolRes.rows[0].id;

    // Return school_id for onboarding
    res.status(201).json({ message: "School admin registered!", school_id });
  } catch (err) {
    console.error("Register school admin error:", err);
    res.status(500).json({ message: "Server error during school admin registration." });
  }
};

// PATCH /api/schools/:id — update onboarding info
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get current school data
    const { rows } = await pool.query("SELECT * FROM schools WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).json({ message: "School not found." });
    const school = rows[0];

    // Only creator or super_admin can update
    if (user.role !== "super_admin" && school.created_by !== user.id)
      return res.status(403).json({ message: "Not authorized." });

    // Prepare updatable fields
    const updatable = [
      "name", "address", "province", "district", "municipality", "ward",
      "phone", "email", "location_lat", "location_lng", "onboarding_status", "is_active"
    ];
    const fields = [];
    const values = [];
    let idx = 1;

    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        fields.push(`${field}=$${idx++}`);
        values.push(req.body[field]);
      }
    });

    // Handle logo and registration_doc uploads
    let logo_url = school.logo_url;
    let registration_doc_url = school.registration_doc_url;
    if (req.files && req.files.logo) logo_url = req.files.logo[0].filename;
    if (req.files && req.files.registration_doc) registration_doc_url = req.files.registration_doc[0].filename;

    if (logo_url !== school.logo_url) {
      fields.push(`logo_url=$${idx++}`);
      values.push(logo_url);
    }
    if (registration_doc_url !== school.registration_doc_url) {
      fields.push(`registration_doc_url=$${idx++}`);
      values.push(registration_doc_url);
    }

    // Always update updated_at
    fields.push(`updated_at=NOW()`);

    if (!fields.length)
      return res.status(400).json({ message: "No fields provided to update." });

    const query = `
      UPDATE schools SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *`;
    values.push(id);

    const updated = await pool.query(query, values);
    res.json({ message: "School updated", school: updated.rows[0] });
  } catch (err) {
    console.error("Update school error:", err);
    res.status(500).json({ message: "Server error during school update." });
  }
};

// GET /api/schools/:id — fetch onboarding/profile
exports.getSchoolProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM schools WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).json({ message: "School not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get school error:", err);
    res.status(500).json({ message: "Server error during school fetch." });
  }
};
