const pool = require("../config/db");
const { generateShortCode } = require("../utils/codeGenerator");

/**
 * @desc    Get all tournaments
 * @route   GET /api/tournaments
 */
const getTournaments = async (req, res) => {
  try {
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
 * @desc    Get a single tournament
 * @route   GET /api/tournaments/:id
 */
const getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM tournaments WHERE id = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Tournament not found" });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(`Error fetching tournament ${id}:`, err);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
};

/**
 * @desc    Create a new tournament
 * @route   POST /api/tournaments
 */
const createTournament = async (req, res) => {
  const {
    name,
    description = "",
    level = null,
    hosted_by = null,
    start_date = null,
    end_date = null,
    logo_url = null,
    sports_config = [],
  } = req.body;

  const created_by_user_id = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Tournament name is required." });
  }

  const normalizedStartDate = !start_date || start_date.trim() === "" ? null : start_date;
  const normalizedEndDate = !end_date || end_date.trim() === "" ? null : end_date;

  try {
    const tournament_code = await generateShortCode("TRN", async (code) => {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM tournaments WHERE tournament_code = $1",
        [code]
      );
      return rowCount > 0;
    });

    const insertQuery = `
      INSERT INTO tournaments 
        (name, description, level, hosted_by, start_date, end_date, logo_url, sports_config, tournament_code, created_by, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [
      name,
      description,
      level,
      hosted_by,
      normalizedStartDate,
      normalizedEndDate,
      logo_url,
      JSON.stringify(sports_config), // ✅ ensure correct format
      tournament_code,
      created_by_user_id,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating tournament:", err);
    res.status(500).json({ message: "Failed to create tournament." });
  }
};

// ✅ Export everything properly
module.exports = {
  getTournaments,
  getTournamentById,
  createTournament,
};
