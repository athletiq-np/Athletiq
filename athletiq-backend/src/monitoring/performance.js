// src/monitoring/performance.js
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

/**
 * Performance monitoring and metrics collection
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        responseTimes: [],
      },
      system: {
        cpuUsage: [],
        memoryUsage: [],
        uptime: 0,
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionCount: 0,
        errors: 0,
      },
    };
    
    this.startTime = Date.now();
    this.metricsInterval = null;
  }
  
  /**
   * Start monitoring
   */
  start(intervalMs = 60000) { // Default: collect metrics every minute
    console.log('🔍 Performance monitoring started');
    
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.cleanupOldMetrics();
    }, intervalMs);
    
    // Collect initial metrics
    this.collectSystemMetrics();
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      console.log('🔍 Performance monitoring stopped');
    }
  }
  
  /**
   * Record HTTP request metrics
   */
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;
    this.metrics.requests.responseTimes.push({
      timestamp: Date.now(),
      duration: responseTime,
      method: req.method,
      path: req.route?.path || req.path,
      statusCode: res.statusCode,
    });
    
    if (res.statusCode >= 400) {
      this.metrics.requests.errors++;
    }
  }
  
  /**
   * Record database query metrics
   */
  recordDatabaseQuery(query, duration, error = null) {
    this.metrics.database.queries++;
    
    if (error) {
      this.metrics.database.errors++;
    }
    
    // Consider queries over 1 second as slow
    if (duration > 1000) {
      this.metrics.database.slowQueries++;
      console.warn(`🐌 Slow query detected (${duration}ms): ${query.substring(0, 100)}...`);
    }
  }
  
  /**
   * Update database connection count
   */
  updateDatabaseConnections(count) {
    this.metrics.database.connectionCount = count;
  }
  
  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();
    
    this.metrics.system.cpuUsage.push({
      timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system,
    });
    
    this.metrics.system.memoryUsage.push({
      timestamp,
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    });
    
    this.metrics.system.uptime = process.uptime();
  }
  
  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Keep only last hour of response times
    this.metrics.requests.responseTimes = this.metrics.requests.responseTimes
      .filter(metric => metric.timestamp > oneHourAgo);
    
    // Keep only last hour of system metrics
    this.metrics.system.cpuUsage = this.metrics.system.cpuUsage
      .filter(metric => metric.timestamp > oneHourAgo);
    
    this.metrics.system.memoryUsage = this.metrics.system.memoryUsage
      .filter(metric => metric.timestamp > oneHourAgo);
  }
  
  /**
   * Get current metrics summary
   */
  getMetrics() {
    const now = Date.now();
    const recentResponses = this.metrics.requests.responseTimes
      .filter(rt => rt.timestamp > now - (15 * 60 * 1000)); // Last 15 minutes
    
    const avgResponseTime = recentResponses.length > 0
      ? recentResponses.reduce((sum, rt) => sum + rt.duration, 0) / recentResponses.length
      : 0;
    
    const latestMemory = this.metrics.system.memoryUsage.slice(-1)[0];
    
    return {
      timestamp: now,
      uptime: this.metrics.system.uptime,
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        errorRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.errors / this.metrics.requests.total) * 100 
          : 0,
        averageResponseTime: Math.round(avgResponseTime),
        recent: recentResponses.length,
      },
      database: {
        queries: this.metrics.database.queries,
        slowQueries: this.metrics.database.slowQueries,
        errorRate: this.metrics.database.queries > 0
          ? (this.metrics.database.errors / this.metrics.database.queries) * 100
          : 0,
        connections: this.metrics.database.connectionCount,
      },
      memory: latestMemory ? {
        used: Math.round(latestMemory.heapUsed / 1024 / 1024), // MB
        total: Math.round(latestMemory.heapTotal / 1024 / 1024), // MB
        percentage: Math.round(latestMemory.percentage),
      } : null,
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        pid: process.pid,
      },
    };
  }
  
  /**
   * Get health status based on metrics
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const issues = [];
    
    // Check error rates
    if (metrics.requests.errorRate > 5) {
      issues.push(`High error rate: ${metrics.requests.errorRate.toFixed(1)}%`);
    }
    
    if (metrics.database.errorRate > 1) {
      issues.push(`Database error rate: ${metrics.database.errorRate.toFixed(1)}%`);
    }
    
    // Check response time
    if (metrics.requests.averageResponseTime > 2000) {
      issues.push(`Slow response time: ${metrics.requests.averageResponseTime}ms`);
    }
    
    // Check memory usage
    if (metrics.memory && metrics.memory.percentage > 90) {
      issues.push(`High memory usage: ${metrics.memory.percentage}%`);
    }
    
    // Check slow queries
    if (metrics.database.slowQueries > 0) {
      issues.push(`${metrics.database.slowQueries} slow database queries`);
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics,
    };
  }
  
  /**
   * Export metrics to file for external monitoring
   */
  async exportMetrics(filePath = './logs/metrics.json') {
    try {
      const metrics = this.getMetrics();
      await fs.writeFile(filePath, JSON.stringify(metrics, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export metrics:', error);
      return false;
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Express middleware for performance monitoring
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    performanceMonitor.recordRequest(req, res, responseTime);
  });
  
  next();
};

module.exports = {
  PerformanceMonitor,
  performanceMonitor,
  performanceMiddleware,
};
