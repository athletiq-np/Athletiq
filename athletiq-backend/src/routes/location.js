// src/routes/location.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const locationFilePath = path.join(__dirname, '../data/nepal_location.json');

// GET /api/location/nepal
router.get('/nepal', (req, res) => {
  fs.readFile(locationFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'File read error' });
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

module.exports = router;
