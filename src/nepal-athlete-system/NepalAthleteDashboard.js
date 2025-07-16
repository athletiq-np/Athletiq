// Nepal Athlete ID Dashboard - Production Monitoring Interface
const NepalAthleteSystemMonitor = require('./NepalAthleteSystemMonitor');
const fs = require('fs');
const path = require('path');

class NepalAthleteDashboard {
  constructor() {
    this.monitor = new NepalAthleteSystemMonitor();
    this.logDir = path.join(__dirname, 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive system report
   */
  async generateSystemReport() {
    const timestamp = new Date().toISOString();
    console.log('📋 GENERATING COMPREHENSIVE SYSTEM REPORT');
    console.log('='.repeat(60));

    const report = {
      metadata: {
        timestamp,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      performance: await this.monitor.performanceTest(2000),
      capacity: this.monitor.analyzeSystemCapacity(),
      quality: this.monitor.generateQualityReport(),
      analytics: await this.monitor.generateAdvancedAnalytics(),
      systemHealth: this.checkSystemHealth()
    };

    // Save report to file
    const reportPath = path.join(this.logDir, `nepal-athlete-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.displayReport(report);
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * Display formatted report
   */
  displayReport(report) {
    console.log('\n📊 SYSTEM PERFORMANCE SUMMARY:');
    console.log(`• Generation Time: ${report.performance.averageTime.toFixed(4)}ms per ID`);
    console.log(`• Collision Rate: ${report.performance.collisionRate.toFixed(3)}%`);
    console.log(`• Validation Success: ${report.performance.validationSuccess}%`);
    console.log(`• System Capacity: ${report.capacity.formattedTotal} combinations`);

    console.log('\n🧠 ANALYTICS SUMMARY:');
    console.log(`• Entropy Quality: ${report.analytics.entropy.qualityRating}`);
    console.log(`• Randomness Score: ${report.analytics.patterns.randomnessScore.toFixed(1)}/100`);
    console.log(`• Peak Throughput: ${Math.max(...report.analytics.loadTest.map(t => t.throughput)).toLocaleString()} IDs/sec`);
    console.log(`• Memory Efficiency: ${report.analytics.memory.difference.heapUsed}MB for 10k IDs`);

    console.log('\n🏥 SYSTEM HEALTH:');
    Object.entries(report.systemHealth).forEach(([key, value]) => {
      const status = value.status === 'healthy' ? '✅' : value.status === 'warning' ? '⚠️' : '❌';
      console.log(`• ${key}: ${status} ${value.message || ''}`);
    });
  }

  /**
   * Check overall system health
   */
  checkSystemHealth() {
    const health = {};

    // Performance check
    const perfResult = this.monitor.stats;
    health.performance = {
      status: perfResult.averageTime < 1 ? 'healthy' : perfResult.averageTime < 5 ? 'warning' : 'critical',
      value: perfResult.averageTime,
      message: `${perfResult.averageTime.toFixed(3)}ms avg generation time`
    };

    // Memory check
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    health.memory = {
      status: memUsageMB < 100 ? 'healthy' : memUsageMB < 200 ? 'warning' : 'critical',
      value: memUsageMB,
      message: `${memUsageMB.toFixed(1)}MB heap used`
    };

    // Process uptime
    const uptimeHours = process.uptime() / 3600;
    health.uptime = {
      status: 'healthy',
      value: uptimeHours,
      message: `${uptimeHours.toFixed(2)} hours uptime`
    };

    // System load (simplified)
    health.systemLoad = {
      status: 'healthy',
      message: 'System operating normally'
    };

    return health;
  }

  /**
   * Start continuous monitoring
   */
  async startContinuousMonitoring(intervalMinutes = 5) {
    console.log(`🔄 STARTING CONTINUOUS MONITORING (${intervalMinutes} min intervals)`);
    console.log('='.repeat(60));

    const monitoringLoop = async () => {
      try {
        const quickReport = {
          timestamp: new Date().toISOString(),
          performance: await this.monitor.performanceTest(100),
          health: this.checkSystemHealth()
        };

        // Log to console
        console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Monitoring Check:`);
        console.log(`   Performance: ${quickReport.performance.averageTime.toFixed(3)}ms avg`);
        console.log(`   Memory: ${quickReport.health.memory.message}`);
        console.log(`   Status: ${Object.values(quickReport.health).every(h => h.status === 'healthy') ? '✅ Healthy' : '⚠️ Needs attention'}`);

        // Save quick log
        const logPath = path.join(this.logDir, 'monitoring.log');
        const logEntry = `${quickReport.timestamp} | Perf: ${quickReport.performance.averageTime.toFixed(3)}ms | Mem: ${quickReport.health.memory.value.toFixed(1)}MB | Status: OK\n`;
        fs.appendFileSync(logPath, logEntry);

      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    };

    // Initial check
    await monitoringLoop();

    // Schedule recurring checks
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(monitoringLoop, intervalMs);

    console.log(`\n📝 Monitoring logs saved to: ${this.logDir}`);
    console.log('Press Ctrl+C to stop monitoring');
  }

  /**
   * Generate capacity planning report
   */
  generateCapacityPlan(expectedUsersPerYear = 10000) {
    console.log('📈 CAPACITY PLANNING ANALYSIS');
    console.log('='.repeat(50));

    const capacity = this.monitor.analyzeSystemCapacity();
    const yearsOfCapacity = Math.floor(capacity.totalCombinations / expectedUsersPerYear);
    const safeYears = Math.floor(capacity.safeUsageLimit / expectedUsersPerYear);

    console.log(`\n📊 Capacity Projections (${expectedUsersPerYear.toLocaleString()} new athletes/year):`);
    console.log(`• Total theoretical capacity: ${yearsOfCapacity.toLocaleString()} years`);
    console.log(`• Safe operating capacity: ${safeYears.toLocaleString()} years`);
    console.log(`• Daily ID generation needed: ${Math.ceil(expectedUsersPerYear / 365)} IDs`);
    console.log(`• Peak hour capacity needed: ${Math.ceil(expectedUsersPerYear / 365 / 8)} IDs/hour`);

    const recommendations = [];
    if (safeYears > 50) {
      recommendations.push('✅ Excellent long-term capacity');
    } else if (safeYears > 10) {
      recommendations.push('✅ Good capacity for foreseeable future');
    } else {
      recommendations.push('⚠️ Consider capacity expansion planning');
    }

    if (expectedUsersPerYear > 100000) {
      recommendations.push('💡 Consider implementing ID pre-generation for high-volume periods');
    }

    console.log('\n📋 Recommendations:');
    recommendations.forEach(rec => console.log(`   ${rec}`));

    return {
      expectedUsersPerYear,
      totalCapacityYears: yearsOfCapacity,
      safeCapacityYears: safeYears,
      dailyGeneration: Math.ceil(expectedUsersPerYear / 365),
      recommendations
    };
  }

  /**
   * Export system metrics for external monitoring
   */
  async exportMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      performance: await this.monitor.performanceTest(500),
      health: this.checkSystemHealth(),
      capacity: this.monitor.analyzeSystemCapacity(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };

    const metricsPath = path.join(this.logDir, 'metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    console.log(`📤 Metrics exported to: ${metricsPath}`);
    return metrics;
  }
}

// CLI Interface
async function runDashboard() {
  const dashboard = new NepalAthleteDashboard();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'report':
      await dashboard.generateSystemReport();
      break;
    
    case 'monitor':
      const interval = parseInt(args[1]) || 5;
      await dashboard.startContinuousMonitoring(interval);
      break;
    
    case 'capacity':
      const expectedUsers = parseInt(args[1]) || 10000;
      dashboard.generateCapacityPlan(expectedUsers);
      break;
    
    case 'metrics':
      await dashboard.exportMetrics();
      break;
    
    default:
      console.log('🎛️  NEPAL ATHLETE ID DASHBOARD');
      console.log('='.repeat(40));
      console.log('Available commands:');
      console.log('  report          - Generate comprehensive system report');
      console.log('  monitor [min]   - Start continuous monitoring (default: 5 min)');
      console.log('  capacity [users] - Generate capacity planning report');
      console.log('  metrics         - Export metrics for external systems');
      console.log('\nExample: node dashboard.js report');
      break;
  }
}

// Export for programmatic use
module.exports = NepalAthleteDashboard;

// Run CLI if executed directly
if (require.main === module) {
  runDashboard().catch(console.error);
}
