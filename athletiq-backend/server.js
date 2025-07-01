const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();

// === Middleware Setup ===

// CORS: Allow requests from frontend
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.options('*', cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === File Upload Setup ===
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage });

// Upload API (Frontend should send form-data with `file`)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: req.file.filename }); // Frontend builds full URL
});

// === Route Imports ===

// Static file serving (e.g. uploaded logos)
app.use('/uploads', express.static(uploadDir));

// Route Groups
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/players', require('./src/routes/playerRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));
app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentSportsRoutes'));
app.use('/api/matches', require('./src/routes/matchRoutes'));
app.use('/api/brackets', require('./src/routes/bracketRoutes'));
app.use('/api/ocr', require('./src/routes/ocr'));
app.use('/api/location', require('./src/routes/location'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
// Future route (if needed)
// app.use('/api/scorecards', require('./src/routes/scorecardRoutes'));

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.status === 400) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Something went wrong. Please try again later.' });
});

// === Server Start ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ ATHLETIQ backend running on port ${PORT}`);
});
