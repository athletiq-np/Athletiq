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
exports.bulkCreateMatches = async (matches, user) => {
  const client = await pool.connect();
  const created = [];
  try {
    await client.query('BEGIN');
    for (const match of matches) {
      const code = await generateShortCode('MTCH', 8, matchCodeExists);
      const { rows } = await client.query(
        `INSERT INTO matches
          (home_team_id, away_team_id, sport_id, tournament_id, scheduled_at, venue, code, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          match.home_team_id,
          match.away_team_id,
          match.sport_id || null,
          match.tournament_id,
          match.scheduled_at || null,
          match.venue || null,
          code,
          match.status || 'scheduled',
          user?.id || null
        ]
      );
      created.push(rows[0]);
    }
    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get matches involving an athlete. Placeholder implementation:
 * Assumes an association table athlete_team_memberships (athlete_id, team_id) OR athlete participates via team.
 * This will attempt to find matches where either home_team_id or away_team_id maps to a team containing the athlete.
 * Adjust the JOIN logic if actual schema differs.
 */
exports.getMatchesForAthlete = async (athleteId, user, { page=1, limit=25, status, from, to } = {}) => {
  page = parseInt(page, 10); limit = parseInt(limit, 10);
  const offset = (page - 1) * limit;
  const params = [athleteId];
  let where = 'WHERE (tm_home.athlete_id = $1 OR tm_away.athlete_id = $1)';
  let paramIndex = 2;
  if (status) { where += ` AND m.status = $${paramIndex++}`; params.push(status); }
  if (from) { where += ` AND m.scheduled_at >= $${paramIndex++}`; params.push(from); }
  if (to) { where += ` AND m.scheduled_at <= $${paramIndex++}`; params.push(to); }
  const baseSelect = `FROM matches m
      LEFT JOIN team_members tm_home ON tm_home.team_id = m.home_team_id AND tm_home.athlete_id = $1
      LEFT JOIN team_members tm_away ON tm_away.team_id = m.away_team_id AND tm_away.athlete_id = $1
      LEFT JOIN sports s ON s.id = m.sport_id
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      ${where}`;
  try {
    const countRes = await pool.query(`SELECT COUNT(*) AS total ${baseSelect}`, params);
    const total = parseInt(countRes.rows[0].total, 10) || 0;
    const { rows } = await pool.query(`SELECT m.*, s.name AS sport_name, c.name AS category_name, ht.name AS home_team_name, at.name AS away_team_name ${baseSelect}
      ORDER BY m.scheduled_at NULLS LAST, m.id DESC
      LIMIT ${limit} OFFSET ${offset}` , params);
    return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (err) {
    const { logWarn } = require('../utils/logger');
    logWarn('getMatchesForAthlete enhanced query failed', { athleteId, error: err.message });
    return { data: [], meta: { page, limit, total:0, totalPages:0 } };
  }
};

// Grouped matches by tournament
exports.getGroupedMatchesForTournament = async (tournamentId, user, { page=1, limit=50, status, from, to } = {}) => {
  // We paginate the flattened list but still return grouped subset (page subset grouped) and meta for full set.
  page = parseInt(page,10); limit = parseInt(limit,10); const offset = (page-1)*limit;
  const params = [tournamentId];
  let where = 'WHERE tournament_id = $1'; let idx=2;
  if (status) { where += ` AND status = $${idx++}`; params.push(status); }
  if (from) { where += ` AND scheduled_at >= $${idx++}`; params.push(from); }
  if (to) { where += ` AND scheduled_at <= $${idx++}`; params.push(to); }
  const countRes = await pool.query(`SELECT COUNT(*) AS total FROM matches ${where}`, params);
  const total = parseInt(countRes.rows[0].total,10)||0;
  const { rows } = await pool.query(`SELECT * FROM matches ${where} ORDER BY category_id, round, id LIMIT ${limit} OFFSET ${offset}`, params);
  const grouped = {};
  for (const m of rows) {
    if (!grouped[m.category_id || 'uncategorized']) grouped[m.category_id || 'uncategorized'] = [];
    grouped[m.category_id || 'uncategorized'].push(m);
  }
  return { grouped, meta: { page, limit, total, totalPages: Math.ceil(total/limit) } };
};
