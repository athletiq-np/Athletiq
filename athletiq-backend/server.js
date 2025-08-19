require('dotenv').config();

// Validate environment variables before starting server
const { validateAppEnvironment } = require('./src/config/validateEnv');
if (!validateAppEnvironment()) {
  console.error('❌ Environment validation failed. Server cannot start.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const requestId = require('./src/middlewares/requestId');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');
const { specs, swaggerUi } = require('./src/config/swagger');

// Initialize monitoring systems (temporarily disabled for debugging)
// const monitoring = require('./src/config/monitoring');
// if (process.env.NODE_ENV !== 'test') {
//   monitoring.initializeMonitoring();
// }
console.log('✅ Monitoring temporarily disabled for debugging');

const app = express();

// CORS must be first for preflight requests
app.use(cors(corsOptions));

// Request ID (traceability)
app.use(requestId);

// Security middleware
app.use(securityMiddleware);
app.use(requestLogger);
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// Static file serving for uploads
app.use('/uploads', express.static('uploads', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));

// Core routes - Always enabled
app.use('/api/auth', require('./src/routes/schoolAuth'));
app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/athletes', require('./src/routes/athleteRoutes'));
// Enhanced athlete management (modern unified responses)
try {
  app.use('/api/enhanced-athletes', require('./src/routes/enhancedAthleteRoutes'));
  console.log('✅ Enhanced athlete routes mounted at /api/enhanced-athletes');
} catch (e) {
  console.warn('⚠️  Enhanced athlete routes not available:', e.message);
}
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/certificates', require('./src/routes/certificateRoutes'));
app.use('/api/pdf', require('./src/routes/pdfRoutes'));
app.use('/api/scoresheets', require('./src/routes/scoresheetRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/meta', require('./src/routes/metaRoutes'));
// Matches (basic scheduling & fixtures)
try {
  app.use('/api/matches', require('./src/routes/matchRoutes'));
  console.log('✅ Match routes mounted at /api/matches');
} catch (e) {
  console.warn('⚠️  Match routes not available:', e.message);
}

// Debug route to test routing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});
console.log('✅ Test route added');

// Health routes - Always enabled (single registration)
console.log('🔧 Loading health routes...');
try {
  app.use('/api/health', require('./src/routes/health'));
  console.log('✅ Health routes loaded successfully');
} catch (error) {
  console.warn('⚠️  Health routes not available:', error.message);
}

// Additional routes - Conditionally enabled
if (process.env.ENABLE_ADVANCED_FEATURES !== 'false') {
  try {
    app.use('/api/documents', require('./src/routes/documentRoutes'));
    app.use('/api/ai', require('./src/routes/aiRoutes'));
    console.log('✅ Advanced features (AI, Documents) enabled');
  } catch (error) {
    console.warn('⚠️  Advanced features not available:', error.message);
  }
}

// Monitoring routes (separate from health)
if (process.env.ENABLE_MONITORING !== 'false') {
  try {
    // app.use('/api/monitoring', require('./src/routes/monitoringRoutes'));
    console.log('⚠️  Monitoring routes temporarily disabled for debugging');
  } catch (error) {
    console.warn('⚠️  Monitoring routes not available:', error.message);
  }
}

// Guardian portal routes
if (process.env.ENABLE_GUARDIAN_PORTAL !== 'false') {
  try {
    app.use('/api/guardian/auth', require('./src/routes/guardian/auth'));
    app.use('/api/guardian/athletes', require('./src/routes/guardian/athletes'));
    app.use('/api/guardian/schools', require('./src/routes/guardian/schools'));
    app.use('/api/guardian/documents', require('./src/routes/guardian/documents'));
    app.use('/api/guardian/profile', require('./src/routes/guardian/profile'));
    console.log('✅ Guardian Portal v2 routes enabled');
  } catch (error) {
    console.warn('⚠️  Guardian portal routes not available:', error.message);
    // Create a fallback test route to verify the API is accessible
    app.get('/api/guardian/status', (req, res) => {
      res.json({ 
        success: true, 
        message: 'Guardian Portal v2 API is ready',
        timestamp: new Date().toISOString(),
        routes: ['auth', 'athletes', 'schools', 'documents', 'profile']
      });
    });
    console.log('✅ Guardian Portal v2 fallback status route enabled');
  }
}

// File upload routes
if (process.env.ENABLE_UPLOADS !== 'false') {
  try {
    app.use('/api/upload', require('./src/routes/uploadRoutes'));
    app.use('/api/ocr', require('./src/routes/ocr'));
    console.log('✅ Upload and OCR routes enabled');
  } catch (error) {
    console.warn('⚠️  Upload routes not available:', error.message);
  }
}

console.log('✅ All available routes registered successfully');

// API Documentation with Swagger
if (process.env.ENABLE_SWAGGER !== 'false') {
  try {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Athletiq API Documentation'
    }));
    console.log('✅ API Documentation available at /api-docs');
  } catch (error) {
    console.warn('⚠️  Swagger documentation not available:', error.message);
  }
}

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Catch-all route for debugging
app.use('*', (req, res, next) => {
  console.log(`🔍 Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Error sanitization before error handler
app.use(sanitizeError);

// --- Error Handling Middleware ---
app.use(errorHandler);

// Export app for testing; only start server if not required as module
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
}

module.exports = app;