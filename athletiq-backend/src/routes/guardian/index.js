// Guardian Routes Index
// Consolidates all guardian-related routes
const express = require('express');
const path = require('path');
const router = express.Router();

// Import individual route modules using absolute paths
const authRoutes = require(path.join(__dirname, 'authRoutes'));
const claimRoutes = require(path.join(__dirname, 'claimRoutes'));
const mainRoutes = require(path.join(__dirname, 'mainRoutes'));

// Mount routes with appropriate prefixes
router.use('/auth', authRoutes);
router.use('/claim', claimRoutes);
router.use('/', mainRoutes);

module.exports = router;
