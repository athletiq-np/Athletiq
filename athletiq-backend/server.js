require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
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

// Temporarily disable most routes for debugging - essential routes enabled
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/certificates', require('./src/routes/certificateRoutes'));
app.use('/api/pdf', require('./src/routes/pdfRoutes'));
app.use('/api/scoresheets', require('./src/routes/scoresheetRoutes'));
console.log('✅ Auth, school, tournament, certificate, PDF, and scoresheet routes registered');
// app.use('/api/schools', require('./src/routes/schoolRoutes'));
// app.use('/api/players', require('./src/routes/playerRoutes'));
// app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
// app.use('/api/admin', require('./src/routes/adminRoutes'));
// app.use('/api/teams', require('./src/routes/teamRoutes'));
// app.use('/api/registrations', require('./src/routes/registrationRoutes'));

// Pre-Tournament Management Routes
// app.use('/api/pre-tournament', require('./src/routes/preTournamentRoutes'));
console.log('✅ Auth routes only for debugging');

// Enhanced AI and Document Processing Routes (temporarily disabled for debugging)
// app.use('/api/documents', require('./src/routes/documentRoutes'));
// app.use('/api/ai', require('./src/routes/aiRoutes'));
console.log('✅ AI and Document routes temporarily disabled for debugging');

// Health check and monitoring routes (temporarily simplified for debugging)
// app.use('/api/health', require('./src/routes/health'));
// app.use('/api/monitoring', require('./src/routes/monitoringRoutes'));
// app.use('/api/upload', require('./src/routes/uploadRoutes'));
// app.use('/api/ocr', require('./src/routes/ocr'));
console.log('✅ Essential routes registered, others temporarily disabled for debugging');

// API Documentation with Swagger (temporarily disabled for debugging)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
//   customCss: '.swagger-ui .topbar { display: none }',
//   customSiteTitle: 'Athletiq API Documentation'
// }));
console.log('✅ Swagger temporarily disabled for debugging');

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Error sanitization before error handler
app.use(sanitizeError);

// --- Error Handling Middleware ---
app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));