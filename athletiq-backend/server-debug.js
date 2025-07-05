// server-debug.js - Debug server startup with detailed logging
require('dotenv').config();

console.log('🔍 Starting server debug...');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

console.log('✅ Basic modules loaded');

// Load middleware
const { errorHandler } = require('./src/middlewares/errorHandler');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');
const { specs, swaggerUi } = require('./src/config/swagger');

console.log('✅ Middleware loaded');

const app = express();

// Security middleware
console.log('🔧 Applying security middleware...');
app.use(securityMiddleware);
app.use(requestLogger);
app.use(generalLimiter);
console.log('✅ Security middleware applied');

// CORS with security configuration
console.log('🔧 Applying CORS...');
app.use(cors(corsOptions));
console.log('✅ CORS applied');

// Body parsing middleware
console.log('🔧 Applying body parsing middleware...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
console.log('✅ Body parsing middleware applied');

// Input sanitization
console.log('🔧 Applying input sanitization...');
app.use(sanitizeInput);
console.log('✅ Input sanitization applied');

// --- API Routes ---
console.log('🔧 Adding basic routes...');
app.get('/', (req, res) => res.send('Athletiq API is running...'));

console.log('🔧 Adding auth routes...');
app.use('/api/auth', require('./src/routes/authRoutes'));
console.log('✅ Auth routes added');

console.log('🔧 Adding core routes...');
app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/players', require('./src/routes/playerRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/teams', require('./src/routes/teamRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));
console.log('✅ Core routes added');

console.log('🔧 Adding enhanced routes...');
try {
  console.log('Loading document routes...');
  const documentRoutes = require('./src/routes/documentRoutes');
  app.use('/api/documents', documentRoutes);
  console.log('✅ Document routes added');
  
  console.log('Loading AI routes...');
  const aiRoutes = require('./src/routes/aiRoutes');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes added');
} catch (error) {
  console.error('❌ Error adding enhanced routes:', error.message);
  console.error('Stack:', error.stack);
}

console.log('🔧 Adding remaining routes...');
app.use('/api/health', require('./src/routes/health'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/ocr', require('./src/routes/ocr'));
console.log('✅ Remaining routes added');

console.log('🔧 Adding documentation...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Athletiq API Documentation'
}));
console.log('✅ Documentation added');

console.log('🔧 Adding static files...');
app.use('/uploads', express.static('uploads'));
console.log('✅ Static files added');

console.log('🔧 Adding error handling...');
app.use(sanitizeError);
app.use(errorHandler);
console.log('✅ Error handling added');

console.log('🔧 Starting server...');
const PORT = 5002;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server started successfully on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

// Handle hanging
setTimeout(() => {
  console.log('⚠️  Server startup taking too long, this might indicate a hanging process...');
  console.log('🔧 Server is likely waiting for some async initialization...');
}, 10000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔧 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔧 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
