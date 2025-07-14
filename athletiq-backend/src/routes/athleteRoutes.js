const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { generateShortCode } = require('../utils/codeGenerator');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { validateAthleteRegistration } = require('../middlewares/validation');
const { generalLimiter } = require('../middlewares/rateLimiter');
const apiResponse = require('../utils/apiResponse');

// --- Multer Setup for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/athletes/'), // Use a dedicated subfolder
  filename: (req, file, cb) =>
    cb(null, `athlete-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});
const upload = multer({ storage });

// Helper to validate YYYY-MM-DD date format
function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}


// ========== 1. Register a New Athlete ==========
// This route is protected, meaning only a logged-in user (like a SchoolAdmin) can register an athlete.
router.post(
  '/register', 
  generalLimiter,
  protect, 
  upload.fields([
    { name: "profile_photo_url", maxCount: 1 },
    { name: "birth_cert_url", maxCount: 1 }
  ]), 
  validateAthleteRegistration,
  async (req, res, next) => {
    try {
      const { full_name, date_of_birth, school_id } = req.body;
      const created_by = req.user.id; // The logged-in user is the creator

      // --- Robust Validation ---
      if (!full_name || !date_of_birth || !school_id) {
        const error = new Error('Full name, date of birth, and school ID are required.');
        error.statusCode = 400;
        throw error;
      }
      if (!isValidDate(date_of_birth)) {
        const error = new Error('Date of birth must be in YYYY-MM-DD format.');
        error.statusCode = 400;
        throw error;
      }

      // Check if athlete already exists with the same details for that school
      const exists = await pool.query(
        "SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3",
        [full_name.trim(), date_of_birth, school_id]
      );
      if (exists.rowCount > 0) {
        const error = new Error('An athlete with this name and date of birth is already registered for this school.');
        error.statusCode = 409; // 409 Conflict
        throw error;
      }

      // Generate both player_code and athlete_id
      const player_code = await generateShortCode('PL', 8);

      const photo_url = req.files?.profile_photo_url?.[0]?.filename || null;
      const birth_cert_url = req.files?.birth_cert_url?.[0]?.filename || null;

      const insertQuery = `
        INSERT INTO players (
          player_code, athlete_id, full_name, date_of_birth, school_id, 
          profile_photo_url, birth_cert_url, created_by, is_active
        ) VALUES ($1, generate_athlete_id(), $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *;
      `;
      const values = [player_code, full_name.trim(), date_of_birth, school_id, photo_url, birth_cert_url, created_by];
      
      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        success: true,
        message: "Athlete registered successfully.",
        player: result.rows[0]
      });

    } catch (err) {
      // Pass any errors to our central error handler
      next(err);
    }
  }
);


// ========== 2. Get a Paginated List of Athletes ==========
router.get('/', protect, async (req, res, next) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 25;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const filterSchoolId = req.query.school_id || null;

    let baseQuery = `
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
    `;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // If the user is a SchoolAdmin, they can only see their own athletes
    if (user.role === 'SchoolAdmin') {
      conditions.push(`p.school_id = $${paramIndex++}`);
      values.push(user.school_id);
    } else if (user.role === 'SuperAdmin' && filterSchoolId) {
      // If SuperAdmin is filtering by a specific school
      conditions.push(`p.school_id = $${paramIndex++}`);
      values.push(filterSchoolId);
    }

    // Add search condition
    if (search) {
      conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.player_code ILIKE $${paramIndex} OR p.athlete_id ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    // 1. Get the total count of records that match the filter
    const totalResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, values);
    const totalAthletes = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalAthletes / limit);

    // 2. Get the paginated list of athletes
    const athletesQuery = `
      SELECT p.*, s.name AS school_name, s.school_code
      ${baseQuery}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const athletesResult = await pool.query(athletesQuery, [...values, limit, offset]);

    // 3. Send the complete response
    res.status(200).json({
      success: true,
      count: athletesResult.rowCount,
      total: totalAthletes,
      pagination: {
        currentPage: page,
        totalPages: totalPages
      },
      athletes: athletesResult.rows
    });

  } catch (err) {
    // Pass any errors to our central error handler
    next(err);
  }
});


// ========== 3. Get a Single Athlete by ID ==========
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const athleteQuery = `
      SELECT p.*, s.name AS school_name, s.school_code, u.full_name AS created_by_name
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;

    const result = await pool.query(athleteQuery, [id]);

    if (result.rowCount === 0) {
      const error = new Error('Athlete not found.');
      error.statusCode = 404;
      throw error;
    }

    const athlete = result.rows[0];

    // Check if user has permission to view this athlete
    if (user.role === 'SchoolAdmin' && athlete.school_id !== user.school_id) {
      const error = new Error('You do not have permission to view this athlete.');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      athlete: athlete
    });

  } catch (err) {
    next(err);
  }
});

// ========== 4. Get Current Athlete Profile (for athlete role) ==========
router.get('/me', protect, checkRole(['Athlete']), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find athlete record linked to this user
    const athleteQuery = `
      SELECT p.*, s.name AS school_name, s.school_code
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
      WHERE p.user_id = $1 OR p.created_by = $1
      LIMIT 1
    `;

    const result = await pool.query(athleteQuery, [userId]);

    if (result.rowCount === 0) {
      const error = new Error('Athlete profile not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      athlete: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
});

// We can add other routes like updateAthlete, deleteAthlete here later.


module.exports = router;