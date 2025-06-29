// src/middlewares/authMiddleware.js

// 🧠 ATHLETIQ - Authentication Middleware
// This middleware is responsible for:
// 1. Extracting the JWT (JSON Web Token) from the request headers.
// 2. Verifying the token's authenticity and expiration.
// 3. Attaching the decoded user payload (including user ID, role, school_id) to the `req.user` object.
// 4. Protecting routes by denying access if no valid token is provided.

// --- MODULE IMPORTS ---
const jwt = require('jsonwebtoken'); // For token verification

// --- MIDDLEWARE FUNCTION ---
/**
 * Express middleware to protect routes by verifying JWT.
 * If the token is valid, it attaches the decoded user payload to `req.user`.
 * Otherwise, it sends a 401 Unauthorized response.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 */
module.exports = function (req, res, next) {
  // 1. Get token from the 'Authorization' header
  // Tokens are usually sent as "Bearer <TOKEN>"
  const authHeader = req.header('Authorization');

  // Check if Authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Middleware: No token or invalid format.');
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // Extract the token part (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  // 2. Verify token
  try {
    // Verify the token using the secret from environment variables
    // The payload received is directly { id, email, role, school_id, ... }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- DEBUGGING LOG (Keep for now to confirm new structure) ---
    console.log('Auth Middleware: Decoded token payload:', decoded);
    // --- END DEBUGGING ---

    // IMPORTANT FIX:
    // Attach the entire decoded payload directly to req.user
    // This is because your current JWTs are signed with id, email, role directly at the root,
    // NOT nested under a 'user' property.
    req.user = decoded; // Now req.user will directly contain { id, email, role, school_id, ... }

    // Removed the 'if (!decoded || !decoded.user)' check as 'decoded.user' is not expected.
    // The previous check would incorrectly fail if the 'user' property was not nested.

    console.log(`Auth Middleware: User authenticated successfully. Role: ${req.user.role}, ID: ${req.user.id}`);

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // Handle specific JWT errors (e.g., token expired, invalid signature)
    if (err.name === 'TokenExpiredError') {
      console.log('Auth Middleware: Token expired.');
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    } else if (err.name === 'JsonWebTokenError') {
      console.log('Auth Middleware: Invalid token signature/format.');
      return res.status(401).json({ message: 'Token is not valid.' });
    } else {
      // Catch any other unexpected errors during verification
      console.error('Auth Middleware: Verification error:', err.message);
      return res.status(500).json({ message: 'Server error during authentication.' });
    }
  }
};
