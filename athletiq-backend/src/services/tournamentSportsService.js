const pool = require('../config/db');

// Add sport to a tournament
exports.addSport = async (tournament_id, data) => {
  const { sport_name, team_size, max_teams, rules_url, config } = data;
  const result = await pool.query(
    `INSERT INTO tournament_sports 
      (tournament_id, sport_name, team_size, max_teams, rules_url, config)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tournament_id, sport_name, team_size, max_teams, rules_url, config ? JSON.stringify(config) : null]
  );
  return result.rows[0];
};

// Get all sports for a tournament
exports.getSports = async (tournament_id) => {
  const result = await pool.query(
    `SELECT * FROM tournament_sports WHERE tournament_id = $1 ORDER BY id ASC`,
    [tournament_id]
  );
  return result.rows;
};

// Edit a sport entry
exports.editSport = async (id, data) => {
  const fields = [];
  const values = [];
  let i = 1;
  for (let key in data) {
    fields.push(`${key} = $${i++}`);
    values.push(key === "config" ? JSON.stringify(data[key]) : data[key]);
  }
  values.push(id);

  const sql = `UPDATE tournament_sports SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// Delete a sport
exports.deleteSport = async (id) => {
  await pool.query(`DELETE FROM tournament_sports WHERE id = $1`, [id]);
};
