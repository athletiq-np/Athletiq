// src/middlewares/authorizeRoles.js

/**
 * Middleware for role-based authorization.
 * Usage: authorizeRoles(['admin', 'coach'])
 * - Checks req.user.role (populated by authMiddleware)
 * - Returns 403 if user's role not allowed
 */
module.exports = function authorizeRoles(roles = []) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
