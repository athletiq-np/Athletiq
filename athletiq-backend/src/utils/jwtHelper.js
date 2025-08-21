// src/utils/jwtHelper.js
// JWT sign and verify helpers

const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: Missing JWT_SECRET environment variable. Exiting to avoid weak/default secret.');
  // Fail fast to prevent using a hard-coded or weak secret
  process.exit(1);
}

const SECRET = process.env.JWT_SECRET;

const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
