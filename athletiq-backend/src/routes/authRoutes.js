//
// 🧠 ATHLETIQ - Admin Routes (Upgraded with Clean Middleware)
//
// This file defines all API endpoints that are exclusive to the SuperAdmin role.
// It uses our 'protect' and 'checkRole' middleware for security.
//

const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  registerSuperAdmin,
  getDashboardStats,
  changeSchoolPassword
} = require('../controllers/adminController');

// Import our security middleware
const { protect, checkRole } = require('../middlewares/authMiddleware');

// Define a constant for the required role to keep the code clean
const SUPER_ADMIN_ONLY = checkRole(['SuperAdmin']);

// --- Route Definitions ---

// @route  POST /api/admin/register-superadmin
router.post('/register-superadmin', protect, SUPER_ADMIN_ONLY, registerSuperAdmin);

// @route  GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, SUPER_ADMIN_ONLY, getDashboardStats);

// @route  PUT /api/admin/schools/:schoolId/change-password
router.put('/schools/:schoolId/change-password', protect, SUPER_ADMIN_ONLY, changeSchoolPassword);

module.exports = router;