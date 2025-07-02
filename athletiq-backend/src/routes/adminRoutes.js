//
// 🧠 ATHLETIQ - Admin Routes (Corrected & Refactored)
//
const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  registerSuperAdmin,
  getDashboardStats,
  changeSchoolPassword
} = require('../controllers/adminController');

// Correctly import the 'protect' and 'checkRole' middleware
const { protect, checkRole } = require('../middlewares/authMiddleware');

// Define a constant for the required role to keep the code clean
const SUPER_ADMIN_ONLY = checkRole(['SuperAdmin']);

// --- Route Definitions ---

// @route  POST /api/admin/register-superadmin
router.post('/register-superadmin', protect, SUPER_ADMIN_ONLY, registerSuperAdmin);

// @route  GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, SUPER_ADMIN_ONLY, getDashboardStats);

// @route  PUT /api/admin/schools/:id/change-password
router.put('/schools/:id/change-password', protect, SUPER_ADMIN_ONLY, changeSchoolPassword);

module.exports = router;