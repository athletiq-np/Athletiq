const jwt = require('jsonwebtoken');

const authenticateGuardian = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // For simple tokens (guardian_ID_timestamp format)
    if (token.startsWith('guardian_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length === 3) {
        const guardianId = parseInt(tokenParts[1]);
        if (!isNaN(guardianId)) {
          req.guardian = { id: guardianId };
          return next();
        }
      }
    }

    // For JWT tokens
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'athletiq_super_secure_jwt_secret_key_2025_9x8y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1g0f');
      req.guardian = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

module.exports = authenticateGuardian;
