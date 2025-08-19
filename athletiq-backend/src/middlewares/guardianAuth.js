const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('guardian-auth-middleware');

const authenticateGuardian = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies.auth_token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await pool.query(
      `SELECT id, email, phone, full_name, auth_provider, is_verified
       FROM guardians WHERE id = $1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
    
    // Attach user to request
    req.user = result.rows[0];
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }
    
    logger.error('Guardian authentication error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = {
  authenticateGuardian
};
