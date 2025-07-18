const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { protect } = require('../../middlewares/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../../middlewares/rateLimiter');
const { validateUserLogin, validateUserRegistration } = require('../../middlewares/validation');

// @route   POST /api/auth/register
// @desc    Register a new School Admin and their School
// @access  Public
router.post('/register', authLimiter, validateUserRegistration, authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate a user and set a secure cookie
// @access  Public
router.post('/login', authLimiter, validateUserLogin, authController.login);

// @route   GET /api/auth/logout
// @desc    Log user out by clearing the authentication cookie
// @access  Private (must be logged in to log out)
router.get('/logout', protect, authController.logout);

// @route   GET /api/auth/me
// @desc    Get the profile of the currently logged-in user
// @access  Private
router.get('/me', protect, authController.getMe);

// Add this temporary line for testing
router.get('/test', (req, res) => res.send('Auth route is working!'));

// Development-only endpoint to clear rate limit for an IP
if (process.env.NODE_ENV === 'development') {
  router.post('/clear-rate-limit', (req, res) => {
    // This will clear the rate limit store for the current IP
    const { authLimiter } = require('../middlewares/rateLimiter');
    try {
      // Clear rate limit for the requesting IP
      const key = `${req.ip}:${req.route.path}`;
      if (authLimiter.store && authLimiter.store.resetKey) {
        authLimiter.store.resetKey(key);
      }
      res.json({ success: true, message: 'Rate limit cleared for this IP' });
    } catch (error) {
      res.json({ success: false, message: 'Unable to clear rate limit', error: error.message });
    }
  });
}

module.exports = router;