// src/controllers/tournamentController.js

const pool = require("../config/db"); // ✅ correct path

// ========== Get all tournaments ==========
exports.getTournaments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tournaments ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
};

// ========== Get tournament by ID ==========
exports.getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tournaments WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching tournament by ID:", err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

// ========== Create a new tournament ==========
exports.createTournament = async (req, res) => {
  const {
    name,
    logo_url = null,       // ✅ fixed key
    description = "",
    level = "school",      // Optional default
    hosted_by = "admin",   // Optional default
    start_date,
    end_date,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO tournaments (name, logo_url, description, level, hosted_by, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, logo_url, description, level, hosted_by, start_date, end_date]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating tournament:", err);
    res.status(500).json({ message: "Failed to create tournament" });
  }
};
