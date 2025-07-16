/**
 * Simple Authentication Middleware for Matchday Operations
 * Temporary implementation for testing purposes
 */

// Simple test auth middleware
const auth = (req, res, next) => {
  // For testing purposes, allow all requests
  // In production, this would validate JWT tokens
  req.user = {
    id: 1,
    role: 'superadmin',
    name: 'Test User',
    email: 'test@athletiq.com'
  };
  next();
};

// Alias for protect function
const protect = auth;

// Role-based auth middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  auth,
  protect,
  authorize
};
