require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

console.log('🚀 Starting Athletiq Backend Server (Simplified)...');
console.log('📍 Environment loaded');
console.log('✅ JWT_SECRET configured:', !!process.env.JWT_SECRET);

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
console.log('✅ CORS configured for localhost with credentials');

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Add basic request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body ? Object.keys(req.body) : '');
  next();
});

// Basic route
app.get('/', (req, res) => res.send('Athletiq API is running...'));

// Load all essential routes
try {
  app.use('/api/auth', require('./src/routes/authRoutes'));
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  app.use('/api/schools', require('./src/routes/schoolRoutes'));
  console.log('✅ School routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading school routes:', error.message);
}

try {
  app.use('/api/athletes', require('./src/routes/athleteRoutes'));
  console.log('✅ Athlete routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading athlete routes:', error.message);
}

try {
  app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
  console.log('✅ Tournament routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading tournament routes:', error.message);
}

try {
  app.use('/api/players', require('./src/routes/playerRoutes'));
  console.log('✅ Player routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading player routes:', error.message);
}

try {
  app.use('/api/certificates', require('./src/routes/certificateRoutes'));
  console.log('✅ Certificate routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading certificate routes:', error.message);
}

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));
console.log('✅ Static file serving enabled for uploads');

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Server running at: http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
});
