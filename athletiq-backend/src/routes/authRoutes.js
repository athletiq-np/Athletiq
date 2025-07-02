const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new School Admin and their School
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate a user and set a secure cookie
// @access  Public
router.post('/login', authController.login);

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

module.exports = router;