// src/services/queryOptimizer.js
const { performanceMonitor } = require('../monitoring/performance');

/**
 * Database Query Optimization and Monitoring Service
 */
class QueryOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.connectionPool = null;
  }
  
  /**
   * Initialize with database pool
   */
  initialize(pool) {
    this.connectionPool = pool;
    
    // Monkey patch the pool query method to add monitoring
    const originalQuery = pool.query.bind(pool);
    
    pool.query = async (text, params) => {
      const startTime = process.hrtime.bigint();
      const queryId = this.generateQueryId(text);
      
      try {
        const result = await originalQuery(text, params);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        // Record query metrics
        this.recordQuery(queryId, text, duration, params);
        performanceMonitor.recordDatabaseQuery(text, duration);
        
        return result;
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        
        // Record failed query
        this.recordQuery(queryId, text, duration, params, error);
        performanceMonitor.recordDatabaseQuery(text, duration, error);
        
        throw error;
      }
    };
    
    console.log('🔍 Query optimization monitoring enabled');
  }
  
  /**
   * Generate a unique ID for similar queries
   */
  generateQueryId(query) {
    // Normalize query by removing parameter values
    const normalized = query
      .replace(/\$\d+/g, '$?')  // Replace $1, $2, etc. with $?
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
      .toLowerCase();
    
    return this.hashCode(normalized);
  }
  
  /**
   * Simple hash function for query ID
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Record query execution
   */
  recordQuery(queryId, originalQuery, duration, params = [], error = null) {
    if (!this.queryStats.has(queryId)) {
      this.queryStats.set(queryId, {
        query: originalQuery.substring(0, 200) + (originalQuery.length > 200 ? '...' : ''),
        executions: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0,
        lastExecuted: null,
        slowExecutions: 0,
      });
    }
    
    const stats = this.queryStats.get(queryId);
    stats.executions++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.executions;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.lastExecuted = new Date();
    
    if (error) {
      stats.errors++;
    }
    
    if (duration > this.slowQueryThreshold) {
      stats.slowExecutions++;
      console.warn(`🐌 Slow query detected (${duration.toFixed(2)}ms):`, {
        queryId,
        query: originalQuery.substring(0, 100) + '...',
        duration: `${duration.toFixed(2)}ms`,
        params: params?.length || 0,
      });
    }
  }
  
  /**
   * Get query statistics
   */
  getQueryStats(sortBy = 'avgDuration', limit = 20) {
    const stats = Array.from(this.queryStats.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
    
    // Sort by specified criteria
    stats.sort((a, b) => {
      switch (sortBy) {
        case 'executions':
          return b.executions - a.executions;
        case 'totalDuration':
          return b.totalDuration - a.totalDuration;
        case 'maxDuration':
          return b.maxDuration - a.maxDuration;
        case 'slowExecutions':
          return b.slowExecutions - a.slowExecutions;
        case 'errors':
          return b.errors - a.errors;
        default: // avgDuration
          return b.avgDuration - a.avgDuration;
      }
    });
    
    return stats.slice(0, limit);
  }
  
  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10) {
    return this.getQueryStats('avgDuration', limit)
      .filter(stat => stat.avgDuration > this.slowQueryThreshold);
  }
  
  /**
   * Get most frequently executed queries
   */
  getFrequentQueries(limit = 10) {
    return this.getQueryStats('executions', limit);
  }
  
  /**
   * Get queries with most errors
   */
  getProblematicQueries(limit = 10) {
    return this.getQueryStats('errors', limit)
      .filter(stat => stat.errors > 0);
  }
  
  /**
   * Generate optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const slowQueries = this.getSlowQueries();
    const frequentQueries = this.getFrequentQueries();
    const problematicQueries = this.getProblematicQueries();
    
    // Slow query recommendations
    slowQueries.forEach(query => {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        query: query.query,
        issue: `Slow average response time: ${query.avgDuration.toFixed(2)}ms`,
        suggestion: 'Consider adding indexes, optimizing WHERE clauses, or query restructuring',
        executions: query.executions,
        avgDuration: query.avgDuration,
      });
    });
    
    // Frequent query recommendations
    frequentQueries.slice(0, 5).forEach(query => {
      if (query.executions > 100) { // Only for very frequent queries
        recommendations.push({
          type: 'caching',
          priority: 'medium',
          query: query.query,
          issue: `High execution frequency: ${query.executions} times`,
          suggestion: 'Consider caching query results if data doesn\'t change frequently',
          executions: query.executions,
          avgDuration: query.avgDuration,
        });
      }
    });
    
    // Error-prone query recommendations
    problematicQueries.forEach(query => {
      const errorRate = (query.errors / query.executions) * 100;
      recommendations.push({
        type: 'reliability',
        priority: errorRate > 10 ? 'high' : 'medium',
        query: query.query,
        issue: `High error rate: ${errorRate.toFixed(1)}% (${query.errors}/${query.executions})`,
        suggestion: 'Review query logic, add proper error handling, or check data constraints',
        executions: query.executions,
        errors: query.errors,
        errorRate,
      });
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Generate database health report
   */
  getDatabaseHealthReport() {
    const totalQueries = Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.executions, 0);
    
    const totalErrors = Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.errors, 0);
    
    const slowQueries = this.getSlowQueries();
    const avgResponseTime = Array.from(this.queryStats.values())
      .reduce((sum, stats, _, arr) => sum + stats.avgDuration / arr.length, 0);
    
    const connectionStats = this.connectionPool ? {
      total: this.connectionPool.totalCount || 0,
      idle: this.connectionPool.idleCount || 0,
      waiting: this.connectionPool.waitingCount || 0,
    } : null;
    
    return {
      timestamp: new Date(),
      overview: {
        totalQueries,
        uniqueQueries: this.queryStats.size,
        totalErrors,
        errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0,
        avgResponseTime: avgResponseTime.toFixed(2),
        slowQueriesCount: slowQueries.length,
      },
      connections: connectionStats,
      recommendations: this.getOptimizationRecommendations(),
      topSlowQueries: slowQueries.slice(0, 5),
      topFrequentQueries: this.getFrequentQueries(5),
    };
  }
  
  /**
   * Clear old statistics (keep last 24 hours)
   */
  cleanupOldStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [queryId, stats] of this.queryStats.entries()) {
      if (stats.lastExecuted < oneDayAgo) {
        this.queryStats.delete(queryId);
      }
    }
  }
  
  /**
   * Export statistics to file
   */
  async exportStats(filePath = './logs/query-stats.json') {
    try {
      const fs = require('fs').promises;
      const report = this.getDatabaseHealthReport();
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to export query stats:', error);
      return false;
    }
  }
}

// Singleton instance
const queryOptimizer = new QueryOptimizer();

module.exports = {
  QueryOptimizer,
  queryOptimizer,
};
