// src/services/tournamentService.js

const pool = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');

/**
 * Tournament Service
 * ONLY super_admin can create/view/edit/delete tournaments for now.
 */

// --- Helper: Checks if code already exists in tournaments table
async function tournamentCodeExists(code) {
  const { rows } = await pool.query(
    'SELECT 1 FROM tournaments WHERE tournament_code = $1',
    [code]
  );
  return rows.length > 0;
}

// --- Create a new tournament (MINIMUM FIELDS as discussed)
exports.createTournament = async (data, user) => {
  const { name, logo_url, organizer_id } = data;

  if (user.role !== 'super_admin') {
    throw new Error("Only super admin can create tournaments at this time.");
  }
  if (!name) throw new Error("Tournament name is required.");

  // Generate a unique short alphanumeric tournament code (e.g. TMT38GH9)
  const tournament_code = await generateShortCode(
    "TMT",
    8,
    tournamentCodeExists
  );

  // Insert tournament into DB, other fields set to null/default
  const result = await pool.query(
    `INSERT INTO tournaments 
      (name, tournament_code, logo_url, created_by, organizer_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
    [
      name,
      tournament_code,
      logo_url || null,
      user.id,
      organizer_id || null // null if not provided by super_admin
    ]
  );
  return result.rows[0];
};

// --- Get all tournaments (super admin: all, others: none for now)
exports.getTournaments = async (_query, user) => {
  if (user.role !== 'super_admin') {
    return [];
  }
  const result = await pool.query(
    `SELECT * FROM tournaments ORDER BY created_at DESC`
  );
  return result.rows;
};

// --- Get tournament by ID (super admin only)
exports.getTournamentById = async (id, user) => {
  if (user.role !== 'super_admin') {
    throw new Error("Not authorized.");
  }
  const result = await pool.query(
    `SELECT * FROM tournaments WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

// --- Update a tournament (super admin only for now)
exports.updateTournament = async (id, data, user) => {
  if (user.role !== 'super_admin') {
    throw new Error("Not authorized.");
  }

  // Only allow updating allowed fields
  const allowedFields = ["name", "logo_url", "organizer_id"];
  const fields = [];
  const values = [];
  let i = 1;

  for (let key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }
  values.push(id);

  const sql = `UPDATE tournaments SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;

  const result = await pool.query(sql, values);
  return result.rows[0];
};

// --- Soft delete a tournament (super admin only for now)
exports.deleteTournament = async (id, user) => {
  if (user.role !== 'super_admin') {
    throw new Error("Not authorized.");
  }
  await pool.query(
    `UPDATE tournaments SET status = 'archived' WHERE id = $1`,
    [id]
  );
};
