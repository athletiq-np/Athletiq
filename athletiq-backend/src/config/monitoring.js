// src/config/monitoring.js
const { performanceMonitor } = require('../monitoring/performance');
const queryOptimizer = require('../services/queryOptimizer');

/**
 * Initialize all monitoring systems
 */
function initializeMonitoring() {
  // Initialize performance monitoring
  performanceMonitor.start();
  
  // Initialize query monitoring if available
  if (queryOptimizer.startQueryMonitoring) {
    queryOptimizer.startQueryMonitoring();
  }
  
  console.log('✅ Monitoring systems initialized');
}

/**
 * Get performance metrics
 */
function getPerformanceMetrics() {
  const metrics = performanceMonitor.getMetrics();
  
  return {
    ...metrics,
    queries: queryOptimizer.getSlowQueries ? queryOptimizer.getSlowQueries() : [],
    healthStatus: performanceMonitor.getHealthStatus()
  };
}

/**
 * Health check for monitoring systems
 */
function healthCheck() {
  const metrics = getPerformanceMetrics();
  
  return {
    status: metrics.healthStatus.status,
    timestamp: new Date().toISOString(),
    uptime: metrics.uptime,
    monitoring: {
      performance: true,
      queryOptimization: true,
      caching: process.env.REDIS_URL ? true : 'redis not configured'
    },
    metrics: {
      requests: metrics.requests,
      database: metrics.database,
      memory: metrics.memory,
      system: metrics.system
    }
  };
}

module.exports = {
  initializeMonitoring,
  getPerformanceMetrics,
  healthCheck
};
