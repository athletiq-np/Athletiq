require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');
const { specs, swaggerUi } = require('./src/config/swagger');

const app = express();

// Security middleware
app.use(securityMiddleware);
app.use(requestLogger);
app.use(generalLimiter);

// CORS with security configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);
// Add this line right after your route registrations
console.log('✅ Auth routes registered at /api/auth');
app.use('/api/auth', require('./src/routes/authRoutes'));

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));

app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/players', require('./src/routes/playerRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

app.use('/api/teams', require('./src/routes/teamRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));

// Enhanced AI and Document Processing Routes
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
console.log('✅ AI and Document routes registered');

// Health check and legacy routes
app.use('/api/health', require('./src/routes/health'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/ocr', require('./src/routes/ocr'));

// API Documentation with Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Athletiq API Documentation'
}));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Error sanitization before error handler
app.use(sanitizeError);

// --- Error Handling Middleware ---
app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));