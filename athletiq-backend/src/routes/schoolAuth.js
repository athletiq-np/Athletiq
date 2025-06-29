// src/routes/schoolAuth.js
const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/schoolAuthController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
