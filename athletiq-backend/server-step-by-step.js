// server-step-by-step.js - Debug server startup step by step
require('dotenv').config();

console.log('🔍 Step-by-step server startup debugging...');
console.log('Step 1: Loading modules...');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
console.log('✅ Step 1: Basic modules loaded');

console.log('Step 2: Loading middleware modules...');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { securityMiddleware, corsOptions, requestLogger, sanitizeError } = require('./src/middlewares/security');
const { generalLimiter } = require('./src/middlewares/rateLimiter');
const { sanitizeInput } = require('./src/middlewares/validation');
const { specs, swaggerUi } = require('./src/config/swagger');
console.log('✅ Step 2: Middleware modules loaded');

console.log('Step 3: Creating Express app...');
const app = express();
console.log('✅ Step 3: Express app created');

console.log('Step 4: Applying security middleware...');
app.use(securityMiddleware);
app.use(requestLogger);
app.use(generalLimiter);
console.log('✅ Step 4: Security middleware applied');

console.log('Step 5: Applying CORS...');
app.use(cors(corsOptions));
console.log('✅ Step 5: CORS applied');

console.log('Step 6: Applying body parsing...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
console.log('✅ Step 6: Body parsing applied');

console.log('Step 7: Applying input sanitization...');
app.use(sanitizeInput);
console.log('✅ Step 7: Input sanitization applied');

console.log('Step 8: Adding root route...');
app.get('/', (req, res) => res.send('Athletiq API is running...'));
console.log('✅ Step 8: Root route added');

console.log('Step 9: Adding auth routes...');
app.use('/api/auth', require('./src/routes/authRoutes'));
console.log('✅ Step 9: Auth routes added');

console.log('Step 10: Adding core routes...');
app.use('/api/schools', require('./src/routes/schoolRoutes'));
console.log('✅ Step 10a: School routes added');

app.use('/api/players', require('./src/routes/playerRoutes'));
console.log('✅ Step 10b: Player routes added');

app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
console.log('✅ Step 10c: Tournament routes added');

app.use('/api/admin', require('./src/routes/adminRoutes'));
console.log('✅ Step 10d: Admin routes added');

app.use('/api/teams', require('./src/routes/teamRoutes'));
console.log('✅ Step 10e: Team routes added');

app.use('/api/registrations', require('./src/routes/registrationRoutes'));
console.log('✅ Step 10f: Registration routes added');

console.log('Step 11: Adding AI and Document routes...');
app.use('/api/documents', require('./src/routes/documentRoutes'));
console.log('✅ Step 11a: Document routes added');

app.use('/api/ai', require('./src/routes/aiRoutes'));
console.log('✅ Step 11b: AI routes added');

console.log('Step 12: Adding health and utility routes...');
app.use('/api/health', require('./src/routes/health'));
console.log('✅ Step 12a: Health routes added');

app.use('/api/upload', require('./src/routes/uploadRoutes'));
console.log('✅ Step 12b: Upload routes added');

app.use('/api/ocr', require('./src/routes/ocr'));
console.log('✅ Step 12c: OCR routes added');

console.log('Step 13: Adding Swagger documentation...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Athletiq API Documentation'
}));
console.log('✅ Step 13: Swagger documentation added');

console.log('Step 14: Adding static files...');
app.use('/uploads', express.static('uploads'));
console.log('✅ Step 14: Static files added');

console.log('Step 15: Adding error handling...');
app.use(sanitizeError);
app.use(errorHandler);
console.log('✅ Step 15: Error handling added');

console.log('Step 16: Starting server...');
const PORT = 5003;
const server = app.listen(PORT, () => {
  console.log(`🚀 Step 16: Server started successfully on port ${PORT}`);
  console.log('✅ ALL STEPS COMPLETED SUCCESSFULLY!');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

// Add timeout to detect hanging
setTimeout(() => {
  console.log('⚠️  Server startup taking longer than expected...');
  console.log('This indicates the server is hanging somewhere in the process');
}, 15000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔧 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
