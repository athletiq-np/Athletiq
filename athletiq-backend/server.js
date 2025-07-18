require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import middleware - Re-enabled for enterprise stability
const { errorHandler } = require('./src/middlewares/errorHandler');
const { generalLimiter } = require('./src/middlewares/rateLimiter');

// Initialize monitoring systems (enabled for enterprise grade)
const monitoring = require('./src/config/monitoring');
if (process.env.NODE_ENV !== 'test') {
  try {
    monitoring.initializeMonitoring();
    console.log('✅ Monitoring system initialized');
  } catch (error) {
    console.warn('⚠️ Monitoring system failed to initialize:', error.message);
  }
} else {
  console.log('✅ Monitoring system disabled for testing');
}

const app = express();

// CORS configuration - Enterprise grade with security
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
console.log('✅ Enterprise CORS configured with origin validation');

// Enterprise middleware stack
app.use(generalLimiter);
console.log('✅ Rate limiting enabled');

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});
console.log('✅ Request logging enabled');

// Body parsing middleware with security limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, message: 'Invalid JSON' });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
console.log('✅ Body parsing configured with validation');

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));

// Load routes with error handling
try {
  app.use('/api/auth', require('./src/routes/authRoutes'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  app.use('/api/schools', require('./src/routes/schoolRoutes'));
  console.log('✅ School routes loaded');
} catch (error) {
  console.error('❌ School routes failed:', error.message);
}

try {
  app.use('/api/athletes', require('./src/routes/athleteRoutes'));
  console.log('✅ Athlete routes loaded');
} catch (error) {
  console.error('❌ Athlete routes failed:', error.message);
}

try {
  app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
  console.log('✅ Tournament routes loaded');
} catch (error) {
  console.error('❌ Tournament routes failed:', error.message);
}

try {
  app.use('/api/guardian', require('./src/routes/guardianRoutes'));
  console.log('✅ Guardian routes loaded');
} catch (error) {
  console.error('❌ Guardian routes failed:', error.message);
}

try {
  app.use('/api/guardian-simple', require('./src/routes/guardianSimpleRoutes'));
  console.log('✅ Guardian simple routes loaded');
} catch (error) {
  console.error('❌ Guardian simple routes failed:', error.message);
}

try {
  app.use('/api/guardian/auth', require('./src/routes/guardianAuthRoutes'));
  console.log('✅ Guardian auth routes loaded');
} catch (error) {
  console.error('❌ Guardian auth routes failed:', error.message);
}

try {
  app.use('/api/test', require('./src/routes/testRoutes'));
  console.log('✅ Test routes loaded');
} catch (error) {
  console.error('❌ Test routes failed:', error.message);
}

// Note: Matchday routes temporarily disabled due to middleware issue
// try {
//   app.use('/api/matchday', require('./src/routes/matchdayRoutes'));
//   console.log('✅ Matchday routes loaded');
// } catch (error) {
//   console.error('❌ Matchday routes failed:', error.message);
// }

try {
  app.use('/api/certificates', require('./src/routes/certificateRoutes'));
  console.log('✅ Certificate routes loaded');
} catch (error) {
  console.error('❌ Certificate routes failed:', error.message);
}

try {
  app.use('/api/pdf', require('./src/routes/pdfRoutes'));
  console.log('✅ PDF routes loaded');
} catch (error) {
  console.error('❌ PDF routes failed:', error.message);
}

try {
  app.use('/api/scoresheets', require('./src/routes/scoresheetRoutes'));
  console.log('✅ Scoresheet routes loaded');
} catch (error) {
  console.error('❌ Scoresheet routes failed:', error.message);
}

// Health check and core monitoring routes (enterprise grade)
try {
  app.use('/api/health', require('./src/routes/health'));
  console.log('✅ Health check routes loaded');
} catch (error) {
  console.error('❌ Health routes failed:', error.message);
}

// Enterprise Dashboard and Analytics Routes
try {
  app.use('/api/enterprise', require('./src/routes/enterprise'));
  console.log('✅ Enterprise dashboard routes loaded');
} catch (error) {
  console.error('❌ Enterprise routes failed:', error.message);
}

// Core API Documentation (re-enabled for enterprise)
try {
  const { specs, swaggerUi } = require('./src/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AthletiQ API Documentation'
  }));
  console.log('✅ API documentation enabled at /api-docs');
} catch (error) {
  console.warn('⚠️ Swagger documentation failed to load:', error.message);
}

// Enhanced AI and Document Processing Routes (gradually re-enabling)
try {
  app.use('/api/documents', require('./src/routes/documentRoutes'));
  console.log('✅ Document processing routes enabled');
} catch (error) {
  console.warn('⚠️ Document routes failed:', error.message);
}

// Serve static files (uploads) with security
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Enterprise error handling middleware
app.use(errorHandler);

// Global error handler for unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

console.log('✅ Enterprise error handling enabled');

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));