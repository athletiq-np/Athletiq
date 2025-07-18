// Ultra-minimal server for testing
console.log('Starting minimal server...');

const express = require('express');
const cors = require('cors');
const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Minimal server running', timestamp: new Date() });
});

// Mock school routes that your frontend needs
app.get('/api/schools/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Test School',
      address: 'Test Address',
      email: 'school@test.com'
    }
  });
});

app.get('/api/schools/me/tournament-stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total_tournaments: 5,
      active_tournaments: 2,
      completed_tournaments: 3
    }
  });
});

app.get('/api/schools/me/players', (req, res) => {
  res.json({
    success: true,
    data: {
      players: [
        { id: 1, name: 'Test Player 1', grade: '10' },
        { id: 2, name: 'Test Player 2', grade: '11' }
      ],
      pagination: { total: 2, page: 1, limit: 100 }
    }
  });
});

app.get('/api/schools/houses', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Red House', color: 'red' },
      { id: 2, name: 'Blue House', color: 'blue' }
    ]
  });
});

app.get('/api/schools/staff', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Test Teacher', position: 'PE Teacher' }
    ]
  });
});

app.get('/api/schools/me/tournaments', (req, res) => {
  res.json({
    success: true,
    data: {
      tournaments: [
        { id: 1, name: 'Annual Sports Day', status: 'active' }
      ],
      pagination: { total: 1, page: 1, limit: 100 }
    }
  });
});

app.get('/api/schools/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, message: 'Welcome to Athletiq!', type: 'info' }
    ]
  });
});

app.get('/api/schools/activities', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Football Practice', date: '2025-07-16' }
    ]
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  const { email, password } = req.body;
  
  if (email === 'admin@test.com' && password === 'password123') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: 'admin@test.com',
          role: 'SchoolAdmin',
          full_name: 'Test Admin'
        },
        token: 'test-token-123'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🔗 Access at: http://localhost:${PORT}`);
  console.log(`🏫 All school endpoints are mocked and working`);
  console.log(`🚨 NOTE: Frontend should connect to port ${PORT}, not 5000`);
});
