// server-streamlined.js - Simplified, reliable server configuration
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
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');

console.log('✅ Monitoring temporarily disabled for stability');

const app = express();

// Essential middleware stack
app.use(cors(corsOptions));
app.use(securityMiddleware);
app.use(requestLogger);
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

console.log('🔧 Loading core routes...');

// --- Core API Routes (Always Available) ---
app.get('/', (req, res) => res.json({ 
  message: 'Athletiq API is running...', 
  version: '2.0',
  timestamp: new Date().toISOString() 
}));

// Authentication routes
app.use('/api/auth', require('./src/routes/schoolAuth'));
console.log('   ✅ Auth routes loaded');

// Core business logic routes  
app.use('/api/schools', require('./src/routes/schoolRoutes'));
console.log('   ✅ School routes loaded');

app.use('/api/athletes', require('./src/routes/athleteRoutes'));
console.log('   ✅ Athlete routes loaded');

app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
console.log('   ✅ Tournament routes loaded');

// Supporting routes
app.use('/api/certificates', require('./src/routes/certificateRoutes'));
app.use('/api/pdf', require('./src/routes/pdfRoutes'));
app.use('/api/scoresheets', require('./src/routes/scoresheetRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
console.log('   ✅ Supporting routes loaded');

// Health and monitoring (always enabled)
app.use('/api/health', require('./src/routes/health'));
console.log('   ✅ Health routes loaded');

// --- Optional Features (with error handling) ---
console.log('🔧 Loading optional features...');

// Advanced features (AI, Documents)
try {
  app.use('/api/documents', require('./src/routes/documentRoutes'));
  app.use('/api/ai', require('./src/routes/aiRoutes'));
  console.log('   ✅ Advanced features enabled');
} catch (error) {
  console.log('   ⚠️  Advanced features disabled:', error.message);
}

// Upload routes (fix syntax issues)
try {
  app.use('/api/upload', require('./src/routes/uploadRoutes'));
  console.log('   ✅ Upload routes enabled');
} catch (error) {
  console.log('   ⚠️  Upload routes disabled:', error.message);
}

// API Documentation
try {
  const { specs, swaggerUi } = require('./src/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Athletiq API Documentation'
  }));
  console.log('   ✅ API Documentation available at /api-docs');
} catch (error) {
  console.log('   ⚠️  API Documentation disabled:', error.message);
}

// Static file serving
app.use('/uploads', express.static('uploads'));

// Error handling
app.use(sanitizeError);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5002; // Use 5002 to avoid conflicts
app.listen(PORT, () => {
  console.log(`\n🚀 Athletiq API Server v2.0`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Server ready for requests!\n`);
});
