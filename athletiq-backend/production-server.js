require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');

console.log('✅ Starting Athletiq Backend Server...');

const app = express();

// CORS must be first for preflight requests
app.use(cors(corsOptions));

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

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));

// Load routes with error handling
try {
  console.log('Loading auth routes...');
  app.use('/api/auth', require('./src/routes/authRoutes'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  console.log('Loading admin routes...');
  app.use('/api/admin', require('./src/routes/adminRoutes'));
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Error loading admin routes:', error.message);
}

try {
  console.log('Loading certificate routes...');
  app.use('/api/certificates', require('./src/routes/certificateRoutes'));
  console.log('✅ Certificate routes loaded');
} catch (error) {
  console.error('❌ Error loading certificate routes:', error.message);
}

try {
  console.log('Loading PDF routes...');
  app.use('/api/pdf', require('./src/routes/pdfRoutes'));
  console.log('✅ PDF routes loaded');
} catch (error) {
  console.error('❌ Error loading PDF routes:', error.message);
}

try {
  console.log('Loading scoresheet routes...');
  app.use('/api/scoresheets', require('./src/routes/scoresheetRoutes'));
  console.log('✅ Scoresheet routes loaded');
} catch (error) {
  console.error('❌ Error loading scoresheet routes:', error.message);
}

// Load school routes last as they might be problematic
try {
  console.log('Loading school routes...');
  app.use('/api/schools', require('./src/routes/schoolRoutes'));
  console.log('✅ School routes loaded');
} catch (error) {
  console.error('❌ Error loading school routes:', error.message);
}

try {
  console.log('Loading tournament routes...');
  app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
  console.log('✅ Tournament routes loaded');
} catch (error) {
  console.error('❌ Error loading tournament routes:', error.message);
}

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Error sanitization before error handler
app.use(sanitizeError);

// --- Error Handling Middleware ---
app.use(errorHandler);

const PORT = 5000;
console.log('Starting server...');
app.listen(PORT, () => {
  console.log(`🚀 Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});
