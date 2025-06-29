const pool = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');

/**
 * Helper: Check if a match code already exists (for uniqueness)
 */
async function matchCodeExists(code) {
  const { rows } = await pool.query(
    'SELECT 1 FROM matches WHERE code = $1',
    [code]
  );
  return rows.length > 0;
}

/**
 * Bulk create matches with auto-generated short codes.
 * Each match in the input array should contain:
 *   - home_team_id
 *   - away_team_id
 *   - sport_id
 *   - tournament_id
 *   - scheduled_at
 *   - venue
 *   - status (optional, defaults to 'scheduled')
 */
exports.bulkCreateMatches = async (matches) => {
  const createdMatches = [];

  for (const match of matches) {
    // Generate unique alphanumeric code, e.g. MTCH3D9J
    const code = await generateShortCode("MTCH", 8, matchCodeExists);

    const result = await pool.query(
      `INSERT INTO matches
        (home_team_id, away_team_id, sport_id, tournament_id, scheduled_at, venue, code, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        match.home_team_id,
        match.away_team_id,
        match.sport_id,
        match.tournament_id,
        match.scheduled_at,
        match.venue,
        code,
        match.status || 'scheduled'
      ]
    );
    createdMatches.push(result.rows[0]);
  }
  return createdMatches;
};
