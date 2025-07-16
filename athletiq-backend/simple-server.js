require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Simple CORS setup for localhost
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.json({ message: 'Athletiq API is running...' }));

// Load auth routes with error handling
try {
  app.use('/api/auth', require('./src/routes/authRoutes'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

// Load tournament routes with error handling
try {
  app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
  console.log('✅ Tournament routes loaded');
} catch (error) {
  console.error('❌ Error loading tournament routes:', error.message);
}

// Load school routes with error handling
try {
  app.use('/api/schools', require('./src/routes/schoolRoutes'));
  console.log('✅ School routes loaded');
} catch (error) {
  console.error('❌ Error loading school routes:', error.message);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started successfully on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
});
