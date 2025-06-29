//
// 🧠 ATHLETIQ - Tournament Controller
//
// This file contains the core logic for managing tournaments. It handles creating,
// retrieving, updating, and deleting tournament records in the database.
//

// --- MODULE IMPORTS ---
const pool = require("../config/db");
// We will create this utility file in a later step if it doesn't exist.
// For now, we will assume it exists and provides a function to generate unique codes.
const { generateShortCode } = require('../utils/codeGenerator');

// --- CONTROLLER FUNCTIONS ---

/**
 * @desc    Get all tournaments from the database.
 * @route   GET /api/tournaments
 * @access  Public
 */
const getTournaments = async (req, res) => {
  try {
    // Select all tournaments, ordering by the newest first.
    const { rows } = await pool.query(
      "SELECT id, name, level, start_date, end_date, logo_url, status FROM tournaments ORDER BY start_date DESC"
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

/**
 * @desc    Get a single tournament by its unique ID.
 * @route   GET /api/tournaments/:id
 * @access  Public
 */
const getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    // Select the tournament that matches the provided ID.
    const { rows } = await pool.query(
      "SELECT * FROM tournaments WHERE id = $1",
      [id]
    );

    // If no tournament is found, return a 404 Not Found error.
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(`Error fetching tournament with ID ${id}:`, err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

/**
 * @desc    Create a new tournament. This is a protected route.
 * @route   POST /api/tournaments
 * @access  Private
 */
const createTournament = async (req, res) => {
  // 1. Destructure all expected data from the frontend form.
  const {
    name,
    description = "",
    level, 
    hosted_by, 
    start_date, 
    end_date,
    logo_url = null,
    sports_config = []
  } = req.body;

  // 2. The 'authMiddleware' has already run and placed the user's data on req.user.
  const created_by_user_id = req.user.id;

  // 3. Validate that essential data has been provided.
  if (!name) {
    return res.status(400).json({ message: "Tournament name is required." });
  }

  try {
    // 4. Generate a unique, human-readable code for the tournament.
    // FIXED: Pass an asynchronous existsFn callback to generateShortCode.
    // This function will check if the generated code already exists in the 'tournaments' table.
    const tournament_code = await generateShortCode('TRN', async (code) => {
        const { rowCount } = await pool.query(
            "SELECT 1 FROM tournaments WHERE tournament_code = $1",
            [code]
        );
        return rowCount > 0; // Returns true if code exists, false otherwise
    });

    // 5. Prepare the SQL query to insert the new tournament into the database.
    const newTournamentQuery = `
      INSERT INTO tournaments 
        (name, description, level, hosted_by, start_date, end_date, logo_url, sports_config, tournament_code, created_by, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *;
    `;

    // 6. Execute the query with the provided data.
    const { rows } = await pool.query(newTournamentQuery, [
      name,
      description,
      level || null,       
      hosted_by || null,   
      start_date || null,  
      end_date || null,    
      logo_url,
      sports_config,
      tournament_code,
      created_by_user_id
    ]);

    // 7. Send a 201 Created response with the data of the newly created tournament.
    res.status(201).json(rows[0]);

  } catch (err) {
    console.error("Error creating tournament:", err);
    res.status(500).json({ message: "Failed to create tournament due to a server error." });
  }
};


// --- MODULE EXPORTS ---
// Export all functions to be used in tournamentRoutes.js
module.exports = {
  getTournaments,
  getTournamentById,
  createTournament,
};
