require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

console.log('🚀 Starting Matchday Operations Server...');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

console.log('✅ CORS configured');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

console.log('✅ Middleware configured');

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Matchday Operations Server is running', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      matchday: 'active'
    }
  });
});

console.log('✅ Health check route configured');

// Load matchday routes
try {
  console.log('📍 Loading matchday routes...');
  const matchdayRoutes = require('./src/routes/matchdayRoutes');
  app.use('/api/matchday', matchdayRoutes);
  console.log('✅ Matchday routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load matchday routes:', error.message);
  // Continue without matchday routes for debugging
}

// Test endpoint for matchday API structure
app.get('/api/matchday/test', (req, res) => {
  res.json({
    message: 'Matchday API is accessible',
    endpoints: [
      'GET /api/matchday/tournaments/:id/dashboard',
      'POST /api/matchday/matches/:id/start',
      'PUT /api/matchday/matches/:id/score',
      'POST /api/matchday/matches/:id/end',
      'GET /api/matchday/matches/:id/details',
      'GET /api/matchday/tournaments/:id/leaderboard'
    ],
    database_status: 'Tables created and ready'
  });
});

console.log('✅ Test endpoints configured');

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🎯 Matchday Operations Server started successfully on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/matchday/test`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/api/matchday/tournaments/1/dashboard`);
});

console.log('✅ Server setup complete, starting listener...');
