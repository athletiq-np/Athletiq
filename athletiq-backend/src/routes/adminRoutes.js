//
// 🧠 ATHLETIQ - Admin Routes (Corrected & Refactored)
//
const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  registerSuperAdmin,
  getDashboardStats,
  changeSchoolPassword,
  getAllPlayers,
  getAllSchools,
  getAllTournaments,
  getNotifications,
  getActivities
} = require('../controllers/adminController');

// Correctly import the 'protect' and 'checkRole' middleware
const { protect, checkRole } = require('../middlewares/authMiddleware');

// Define a constant for the required roles to keep the code clean
const ADMIN_ROLES = checkRole(['SuperAdmin', 'admin']);

// --- Route Definitions ---

// @route  POST /api/admin/register-superadmin
router.post('/register-superadmin', protect, ADMIN_ROLES, registerSuperAdmin);

// @route  GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, ADMIN_ROLES, getDashboardStats);

// @route  GET /api/admin/players
router.get('/players', protect, ADMIN_ROLES, getAllPlayers);

// @route  GET /api/admin/schools
router.get('/schools', protect, ADMIN_ROLES, getAllSchools);

// @route  GET /api/admin/tournaments
router.get('/tournaments', protect, ADMIN_ROLES, getAllTournaments);

// @route  GET /api/admin/notifications
router.get('/notifications', protect, ADMIN_ROLES, getNotifications);

// @route  GET /api/admin/activities
router.get('/activities', protect, ADMIN_ROLES, getActivities);

// @route  PUT /api/admin/schools/:id/change-password
router.put('/schools/:id/change-password', protect, ADMIN_ROLES, changeSchoolPassword);

module.exports = router;