// tests/testApp.js - Test-specific Express app configuration
const path = require('path');
const dotenv = require('dotenv');
const { testPool } = require('./testDb');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('../src/middlewares/errorHandler');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('../src/middlewares/security');
const { sanitizeInput } = require('../src/middlewares/validation');

// Create test app without server startup
const createTestApp = () => {
  const app = express();

  // CORS must be first for preflight requests
  app.use(cors(corsOptions));

  // Security middleware
  app.use(securityMiddleware);
  app.use(requestLogger);
  // Skip rate limiting in tests
  // app.use(generalLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Input sanitization
  app.use(sanitizeInput);

  // Make test database pool available to routes
  app.locals.db = testPool;

  // Routes
  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/schools', require('../src/routes/schoolRoutes'));
  app.use('/api/players', require('../src/routes/playerRoutes'));
  app.use('/api/tournaments', require('../src/routes/tournamentRoutes'));
  app.use('/api/admin', require('../src/routes/adminRoutes'));
  app.use('/api/teams', require('../src/routes/teamRoutes'));
  app.use('/api/registrations', require('../src/routes/registrationRoutes'));
  app.use('/api/documents', require('../src/routes/documentRoutes'));
  
  // Only load AI routes if OpenAI key is available (skip in tests)
  if (process.env.OPENAI_API_KEY) {
    app.use('/api/ai', require('../src/routes/aiRoutes'));
    app.use('/api/ocr', require('../src/routes/ocr'));
  }
  
  app.use('/api/health', require('../src/routes/health'));
  app.use('/api/upload', require('../src/routes/uploadRoutes'));

  // Error sanitization before error handler
  app.use(sanitizeError);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

module.exports = createTestApp;
