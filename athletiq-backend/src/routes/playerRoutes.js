const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { generateShortCode } = require('../utils/codeGenerator');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { validatePlayerRegistration } = require('../middlewares/validation');
const { generalLimiter } = require('../middlewares/rateLimiter');
const apiResponse = require('../utils/apiResponse');

// --- Multer Setup for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/players/'), // Use a dedicated subfolder
  filename: (req, file, cb) =>
    cb(null, `player-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});
const upload = multer({ storage });

// Helper to validate YYYY-MM-DD date format
function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}


// ========== 1. Register a New Player ==========
// This route is protected, meaning only a logged-in user (like a SchoolAdmin) can register a player.
router.post(
  '/register', 
  generalLimiter,
  protect, 
  upload.fields([
    { name: "profile_photo_url", maxCount: 1 },
    { name: "birth_cert_url", maxCount: 1 }
  ]), 
  validatePlayerRegistration,
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

      // Check if player already exists with the same details for that school
      const exists = await pool.query(
        "SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3",
        [full_name.trim(), date_of_birth, school_id]
      );
      if (exists.rowCount > 0) {
        const error = new Error('A player with this name and date of birth is already registered for this school.');
        error.statusCode = 409; // 409 Conflict
        throw error;
      }

      // Generate a unique player code
      const player_code = await generateShortCode('PL', 8);

      const photo_url = req.files?.profile_photo_url?.[0]?.filename || null;
      const birth_cert_url = req.files?.birth_cert_url?.[0]?.filename || null;

      const insertQuery = `
        INSERT INTO players (
          player_code, full_name, date_of_birth, school_id, 
          profile_photo_url, birth_cert_url, created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *;
      `;
      const values = [player_code, full_name.trim(), date_of_birth, school_id, photo_url, birth_cert_url, created_by];
      
      const result = await pool.query(insertQuery, values);

      res.status(201).json({
        success: true,
        message: "Player registered successfully.",
        player: result.rows[0]
      });

    } catch (err) {
      // Pass any errors to our central error handler
      next(err);
    }
  }
);


// ========== 2. Get a Paginated List of Players ==========
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

    // If the user is a SchoolAdmin, they can only see their own players
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
      conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.player_code ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    // --- This is where the original code was cut off ---

    // 1. Get the total count of records that match the filter
    const totalResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, values);
    const totalPlayers = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalPlayers / limit);

    // 2. Get the paginated list of players
    const playersQuery = `
      SELECT p.*, s.name AS school_name, s.school_code
      ${baseQuery}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const playersResult = await pool.query(playersQuery, [...values, limit, offset]);

    // 3. Send the complete response
    res.status(200).json({
      success: true,
      count: playersResult.rowCount,
      total: totalPlayers,
      pagination: {
        currentPage: page,
        totalPages: totalPages
      },
      players: playersResult.rows
    });

  } catch (err) {
    // Pass any errors to our central error handler
    next(err);
  }
});


// We can add other routes like getPlayerById, updatePlayer, deletePlayer here later.


// --- This was also missing ---
module.exports = router;