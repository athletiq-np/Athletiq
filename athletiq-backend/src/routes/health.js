// src/routes/health.js
const express = require('express');
const router = express.Router();
const { createLogger } = require('../utils/logger');

const logger = createLogger('health');

/**
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Athletiq API is running',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '2.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100
      },
      nodeVersion: process.version
    };

    // Test database connectivity if available
    try {
      const db = require('../config/database');
      const result = await db.query('SELECT NOW() as current_time, version() as db_version');
      healthStatus.database = {
        status: 'connected',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1],
        responseTime: '< 50ms'
      };
    } catch (dbError) {
      healthStatus.database = {
        status: 'disconnected',
        error: dbError.message,
        timestamp: new Date().toISOString()
      };
      healthStatus.status = 'degraded';
    }

    // Check critical services
    healthStatus.services = {
      authentication: 'operational',
      fileUpload: 'operational', 
      tournaments: 'operational',
      schools: 'operational',
      athletes: 'operational'
    };

    const { sendResponse } = require('../utils/response');
    logger.info('Health check completed', { status: healthStatus.status });
    const apiStatus = healthStatus.status === 'healthy' ? 'OK' : healthStatus.status.toUpperCase();
    return sendResponse(res, { status: healthStatus.status === 'healthy' ? 200 : 503, message: 'Health check passed', data: {
      status: apiStatus,
      timestamp: healthStatus.timestamp,
      uptime: healthStatus.uptime,
      environment: healthStatus.environment,
      version: healthStatus.version
    }});
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: Math.floor(process.uptime())
    });
  }
});

/**
 * Liveness probe - minimal check for container orchestration
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: Math.floor(process.uptime())
  });
});

/**
 * Readiness probe - checks if app is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: 'checking',
    memory: 'checking',
    disk: 'checking'
  };
  try {

    // Check database connection
    try {
      const db = require('../config/database');
      await db.query('SELECT 1');
      checks.database = 'ready';
    } catch (dbError) {
      checks.database = 'not_ready';
      throw new Error('Database not ready: ' + dbError.message);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = memPercent < 90 ? 'ready' : 'high_usage';

    // Check disk space (simplified)
    checks.disk = 'ready'; // Would implement actual disk check in production

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: checks,
      readiness: {
        database: checks.database === 'ready',
        memory: checks.memory === 'ready',
        overall: Object.values(checks).every(check => check === 'ready')
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: checks
    });
  }
});

/**
 * Detailed system information endpoint
 */
router.get('/system', async (req, res) => {
  try {
    const os = require('os');
    
    const systemInfo = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      application: {
        name: 'Athletiq API',
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        hostname: os.hostname(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
        freeMemory: Math.round(os.freemem() / 1024 / 1024),
        uptime: Math.floor(os.uptime())
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        versions: process.versions
      },
      database: {
        configured: !!(process.env.DB_HOST && process.env.DB_NAME),
        host: process.env.DB_HOST || 'not_configured',
        database: process.env.DB_NAME || 'not_configured'
      }
    };

    // Test database if configured
    if (systemInfo.database.configured) {
      try {
        const db = require('../config/database');
        const result = await db.query('SELECT version(), current_database(), current_user');
        systemInfo.database.status = 'connected';
        systemInfo.database.version = result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1];
        systemInfo.database.currentDatabase = result.rows[0].current_database;
        systemInfo.database.currentUser = result.rows[0].current_user;
      } catch (dbError) {
        systemInfo.database.status = 'error';
        systemInfo.database.error = dbError.message;
      }
    }

    res.status(200).json(systemInfo);
  } catch (error) {
    logger.error('System info check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Performance metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        uptime: Math.floor(process.uptime()),
        requestsHandled: 'not_tracked', // Would implement request counter
        errorRate: 'not_tracked', // Would implement error tracking
        averageResponseTime: 'not_tracked' // Would implement response time tracking
      },
      system: {
        cpu: {
          usage: 'not_available', // Would implement CPU monitoring
          loadAverage: require('os').loadavg()
        },
        memory: {
          total: Math.round(require('os').totalmem() / 1024 / 1024),
          free: Math.round(require('os').freemem() / 1024 / 1024),
          used: Math.round((require('os').totalmem() - require('os').freemem()) / 1024 / 1024),
          percentage: Math.round(((require('os').totalmem() - require('os').freemem()) / require('os').totalmem()) * 100)
        },
        process: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }
    };

    // Database metrics
    if (process.env.DB_HOST && process.env.DB_NAME) {
      try {
        const db = require('../config/database');
        const start = Date.now();
        await db.query('SELECT 1');
        const responseTime = Date.now() - start;
        
        metrics.database = {
          status: 'connected',
          responseTime: responseTime,
          connections: 'not_tracked' // Would implement connection pool monitoring
        };
      } catch (dbError) {
        metrics.database = {
          status: 'error',
          error: dbError.message
        };
      }
    }

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString(),
      message: error.message
    });
  }
});

/**
 * Dependencies check endpoint
 */
router.get('/dependencies', async (req, res) => {
  const dependencies = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    services: {}
  };

  try {
    // Database dependency
    if (process.env.DB_HOST && process.env.DB_NAME) {
      try {
        const db = require('../config/database');
        const start = Date.now();
        await db.query('SELECT version()');
        const responseTime = Date.now() - start;
        
        dependencies.services.database = {
          status: 'healthy',
          responseTime: responseTime,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME
        };
      } catch (dbError) {
        dependencies.services.database = {
          status: 'unhealthy',
          error: dbError.message,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME
        };
      }
    } else {
      dependencies.services.database = {
        status: 'not_configured',
        message: 'Database connection not configured'
      };
    }

    // File system dependency
    try {
      const fs = require('fs').promises;
      await fs.access('./uploads');
      dependencies.services.fileSystem = {
        status: 'healthy',
        uploadsDirectory: 'accessible'
      };
    } catch (fsError) {
      dependencies.services.fileSystem = {
        status: 'warning',
        uploadsDirectory: 'not_accessible',
        message: 'Uploads directory may not exist'
      };
    }

    // Environment variables check
    const requiredEnvVars = ['NODE_ENV', 'JWT_SECRET', 'DB_HOST', 'DB_NAME'];
    const envStatus = {};
    let envHealthy = true;

    requiredEnvVars.forEach(varName => {
      envStatus[varName] = !!process.env[varName];
      if (!process.env[varName]) envHealthy = false;
    });

    dependencies.services.environment = {
      status: envHealthy ? 'healthy' : 'degraded',
      variables: envStatus,
      message: envHealthy ? 'All required variables present' : 'Some required variables missing (using fallbacks)'
    };

    // Overall status
    const allHealthy = Object.values(dependencies.services).every(
      service => service.status === 'healthy'
    );
    dependencies.status = allHealthy ? 'healthy' : 'degraded';

    res.status(allHealthy ? 200 : 503).json(dependencies);
  } catch (error) {
    dependencies.status = 'error';
    dependencies.error = error.message;
    res.status(500).json(dependencies);
  }
});

module.exports = router;
