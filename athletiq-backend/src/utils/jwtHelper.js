// src/utils/jwtHelper.js
// JWT sign and verify helpers

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'athletiq_secret_key';

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
