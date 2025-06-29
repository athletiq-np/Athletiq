const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { extractBirthCertificateData } = require('../controllers/playerController');

// Only school_admins can access OCR for now (adjust as needed)
router.post(
  '/',
  authMiddleware,
  authorizeRoles(['school_admin']), // Only allow school admins; add other roles as needed
  uploadMiddleware.fields([
    { name: 'certificate', maxCount: 1 }
  ]),
  extractBirthCertificateData
);

module.exports = router;
