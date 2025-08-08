// src/routes/schoolAuth.js
const express = require('express');
const router = express.Router();
const { login, register, logout, loginUnified, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validateUserLogin, validateUserRegistration } = require('../middlewares/validation');

// @route   POST /api/auth/register
// @desc    Register a new School Admin and their School
// @access  Public
router.post('/register', authLimiter, validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Authenticate a user and set a secure cookie
// @access  Public
router.post('/login', authLimiter, validateUserLogin, login);

// @route   POST /api/auth/unified-login
// @desc    Attempt user login (users table) then guardian login automatically
// @access  Public (rate limiter temporarily disabled for debugging)
router.post('/unified-login', (req,res,next)=>{ console.log('🔐 unified-login route hit for', req.body?.email); next(); }, loginUnified);

// @route   GET /api/auth/logout
// @desc    Log user out by clearing the authentication cookie
// @access  Private (must be logged in to log out)
router.get('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get the profile of the currently logged-in user
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
