const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { generateShortCode } = require('../utils/codeGenerator');
const COUNTRY_CODE = process.env.COUNTRY_CODE || 'NP';

// ========== Multer Setup ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

const csvUpload = multer({ dest: 'uploads/' });

// Helper: Validate date string (YYYY-MM-DD)
function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// 1. Register New Player
router.post("/register", authMiddleware, upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "birth_cert", maxCount: 1 }
]), async (req, res) => {
  console.log('Received player registration request...');
  try {
    const { full_name, dob, school_id } = req.body;

    const missingFields = [];
    if (!full_name || full_name.trim() === "") missingFields.push("full_name");
    if (!dob || !dob.trim() || !isValidDate(dob)) missingFields.push("dob (format YYYY-MM-DD)");
    if (!school_id || school_id.trim() === "") missingFields.push("school_id");

    if (missingFields.length) {
      return res.status(400).json({
        message: `Required or invalid fields: ${missingFields.join(", ")}`
      });
    }

    // Check if school exists
    console.log(`Checking if school ID: ${school_id} exists...`);
    const schoolCheck = await pool.query(
      "SELECT id FROM schools WHERE id=$1",
      [school_id]
    );
    if (schoolCheck.rows.length === 0) {
      return res.status(400).json({ message: "Invalid school_id, school not found." });
    }

    // Check if player already exists
    console.log('Checking if player already exists...');
    const exists = await pool.query(
      "SELECT 1 FROM players WHERE LOWER(full_name)=LOWER($1) AND dob=$2 AND school_id=$3",
      [full_name.trim(), dob, school_id]
    );
    if (exists.rows.length) {
      return res.status(409).json({ message: "Player already registered." });
    }

    // File handling
    const photo_url = req.files?.photo?.[0]?.filename || null;
    const birth_cert_url = req.files?.birth_cert?.[0]?.filename || null;

    // Generate unique player code
    const existsFn = async (code) => {
      const r = await pool.query("SELECT 1 FROM players WHERE player_code=$1", [code]);
      return r.rows.length > 0;
    };
    const player_code = await generateShortCode(COUNTRY_CODE, 7, existsFn);

    console.log('Inserting player data...');
    const insertParams = [
      player_code, full_name.trim(), dob, school_id, photo_url, birth_cert_url, req.user.id
    ];

    const result = await pool.query(
      `INSERT INTO players (
        player_code, full_name, dob, school_id,
        profile_photo_url, birth_cert_url, is_active, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7)
      RETURNING id, player_code, full_name, dob, school_id, profile_photo_url, birth_cert_url
      `,
      insertParams
    );

    console.log(`Player registered successfully: ${result.rows[0].player_code}`);
    res.status(201).json({
      message: "Player registered successfully.",
      player: result.rows[0]
    });
  } catch (err) {
    console.error("Player registration error:", err);
    res.status(500).json({ message: "Server error during player registration." });
  }
});

// List Players (GET /api/players)
router.get('/', authMiddleware, async (req, res) => {
  console.log('Fetching players...');
  try {
    const user = req.user;
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 50;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";
    const filterSchoolId = req.query.school_id || null;

    let query = `
      SELECT p.*, s.name AS school_name, s.school_code
      FROM players p
      LEFT JOIN schools s ON p.school_id = s.id
    `;
    const conditions = [];
    const values = [];

    if (user.role === 'school_admin') {
      conditions.push("p.school_id = $1");
      values.push(user.school_id);
    } else if (filterSchoolId) {
      conditions.push(`p.school_id = $${values.length + 1}`);
      values.push(filterSchoolId);
    }

    if (search) {
      conditions.push(`p.full_name ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY p.created_at DESC ";
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    values.push(limit, offset);

    let countQuery = "SELECT COUNT(*) FROM players p ";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }

    const [playersRes, countRes] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, values.length - 2))
    ]);

    console.log(`Fetched ${playersRes.rows.length} players.`);
    res.json({
      players: playersRes.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countRes.rows[0].count, 10),
        totalPages: Math.ceil(countRes.rows[0].count / limit)
      }
    });
  } catch (err) {
    console.error("Fetch players error:", err);
    res.status(500).json({ message: "Server error fetching players." });
  }
});

module.exports = router;
