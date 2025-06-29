// src/routes/uploadRoutes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Set up upload directory (ensure './uploads' exists!)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Store files in ./uploads
  },
  filename: (req, file, cb) => {
    // Make filename unique
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return public URL or file path (adjust as needed)
  res.json({ url: req.file.filename });
});

module.exports = router;
