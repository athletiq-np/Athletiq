//
// 🧠 ATHLETIQ - Authentication Middleware (Upgraded for Secure Cookies)
//
// This middleware now reads the JWT from a secure, HttpOnly cookie
// instead of the Authorization header. It also fetches the user from the
// database on each request to ensure data is always fresh.
//

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * @desc    Protect routes by verifying the token from the cookie.
 * If valid, it attaches the full user object to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Read the token from the 'token' cookie sent by the browser
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Make sure a token exists
  if (!token) {
    // Using next() with an error allows our central errorHandler to handle it
    const error = new Error('Not authorized, no token provided.');
    error.statusCode = 401;
    return next(error);
  }

  try {
    // 3. Verify the token's signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch the user from the database using the ID from the token.
    // This ensures the user data is always current and prevents issues
    // with outdated roles or permissions stored in an old token.
    const userResult = await pool.query(
      'SELECT id, full_name, email, role, school_id FROM users WHERE id = $1',
      [decoded.user.id]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('User not found, authorization denied.');
      error.statusCode = 401;
      return next(error);
    }

    // 5. Attach the user object to the request for use in subsequent routes
    req.user = userResult.rows[0];
    
    next(); // Proceed to the next middleware or controller
  } catch (error) {
    const authError = new Error('Not authorized, token failed verification.');
    authError.statusCode = 401;
    next(authError);
  }
};

/**
 * @desc    Middleware to check if the logged-in user has one of the required roles.
 * @param   {Array<string>} roles - An array of roles that are allowed to access the route.
 */
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    const error = new Error(`Forbidden. User role '${req.user.role}' is not authorized for this route.`);
    error.statusCode = 403;
    return next(error);
  }
  next();
};

// Export both functions for use in our route files
module.exports = { protect, checkRole };