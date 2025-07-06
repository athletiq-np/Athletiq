//
// 🧠 ATHLETIQ - Tournament Controller (Upgraded with Error Handling)
//
// This file contains the logic for creating and fetching tournaments.
// It now uses the centralized error handler for cleaner, more consistent error management.
//

const pool = require("../config/db");
const { generateShortCode } = require("../utils/codeGenerator");
const { ApiResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all tournaments
 * @route   GET /api/tournaments
 * @access  Public
 */
const getTournaments = async (req, res, next) => {
  try {
    // This query fetches a summary of all tournaments for a public listing.
    const { rows } = await pool.query(
      "SELECT id, name, tournament_type, start_date, end_date, status FROM tournaments ORDER BY start_date DESC"
    );
    return ApiResponse.success(res, rows, 'Tournaments retrieved successfully');
  } catch (err) {
    // Pass any database errors to the central error handler
    next(err);
  }
};

/**
 * @desc    Get a single tournament by its ID
 * @route   GET /api/tournaments/:id
 * @access  Public
 */
const getTournamentById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM tournaments WHERE id = $1", [id]);
    
    if (rows.length === 0) {
      const error = new Error("Tournament not found");
      error.statusCode = 404;
      return next(error);
    }
    
    return ApiResponse.success(res, rows[0], 'Tournament retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new tournament
 * @route   POST /api/tournaments
 * @access  Private (requires login)
 */
const createTournament = async (req, res, next) => {
  try {
    const {
      name,
      description = "",
      tournament_type = null,
      format = null,
      location = null,
      start_date = null,
      end_date = null,
      logo_url = null,
      sports_config = [],
    } = req.body;

    // The user's ID is attached to req.user by our 'protect' middleware
    const created_by_user_id = req.user.id;

    if (!name) {
      const error = new Error("Tournament name is required.");
      error.statusCode = 400;
      return next(error);
    }

    // Generate a unique code for the tournament
    const tournament_code = await generateShortCode("TRN", async (code) => {
      const { rowCount } = await pool.query("SELECT 1 FROM tournaments WHERE tournament_code = $1", [code]);
      return rowCount > 0;
    });

    // Extract sport from sports_config if available
    const sport = sports_config.length > 0 ? sports_config[0].sport : 'general';

    const insertQuery = `
      INSERT INTO tournaments 
        (name, description, sport, tournament_type, format, location, start_date, end_date, tournament_code, created_by, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [
      name,
      description,
      sport,
      tournament_type,
      format,
      location,
      start_date || null,
      end_date || null,
      tournament_code,
      created_by_user_id,
    ]);

    return ApiResponse.success(res, rows[0], 'Tournament created successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTournaments,
  getTournamentById,
  createTournament,
};