// src/services/scorecardService.js

const pool = require('../config/db');

// Upload scorecard
exports.uploadScorecard = async (matchId, data, user) => {
  // data: { data: {}, file_url: '...' }
  const result = await pool.query(
    `INSERT INTO scorecards (match_id, data, uploaded_by, file_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [matchId, JSON.stringify(data.data || {}), user.id, data.file_url || null]
  );
  return result.rows[0];
};

// List all scorecards for a match
exports.getScorecardsForMatch = async (matchId, user) => {
  const result = await pool.query(
    `SELECT * FROM scorecards WHERE match_id = $1 ORDER BY created_at ASC`,
    [matchId]
  );
  return result.rows;
};
