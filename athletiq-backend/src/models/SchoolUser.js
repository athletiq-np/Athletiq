// src/models/SchoolUser.js
// School login DB queries

const pool = require('../config/db');

// Find school admin by email
const findSchoolUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM school_users WHERE email = $1', [email]);
  return result.rows[0];
};

module.exports = {
  findSchoolUserByEmail
};
