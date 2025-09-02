/**
 * Enhanced Logging Utility for Athletiq Frontend
 * Provides structured logging with levels, timestamps, and development/production modes
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_LEVEL_NAMES = {
  [LOG_LEVELS.ERROR]: 'ERROR',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.TRACE]: 'TRACE'
};

const LOG_COLORS = {
  [LOG_LEVELS.ERROR]: '#ff4757',
  [LOG_LEVELS.WARN]: '#ffa502',
  [LOG_LEVELS.INFO]: '#5352ed',
  [LOG_LEVELS.DEBUG]: '#70a1ff',
  [LOG_LEVELS.TRACE]: '#a4b0be'
};

class Logger {
  constructor() {
    this.currentLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enableConsoleOutput = this.isDevelopment || process.env.REACT_APP_ENABLE_LOGGING === 'true';
    this.logBuffer = [];
    this.maxBufferSize = 1000;
  }

  getLogLevel() {
    const envLevel = process.env.REACT_APP_LOG_LEVEL || 'INFO';
    return LOG_LEVELS[envLevel.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return level <= this.currentLevel;
  }

  formatMessage(level, component, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      component,
      message,
      data,
      url: window.location.pathname
    };

    // Add to buffer for potential remote logging
    this.addToBuffer(logEntry);

    return {
      formatted: `[${timestamp}] ${levelName} [${component}]: ${message}`,
      entry: logEntry
    };
  }

  addToBuffer(entry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  log(level, component, message, data = null) {
    if (!this.shouldLog(level)) return;

    const { formatted, entry } = this.formatMessage(level, component, message, data);

    if (this.enableConsoleOutput) {
      const color = LOG_COLORS[level];
      const method = this.getConsoleMethod(level);
      
      if (data) {
        method(`%c${formatted}`, `color: ${color}; font-weight: bold`, data);
      } else {
        method(`%c${formatted}`, `color: ${color}; font-weight: bold`);
      }
    }

    // Send to remote logging service in production
    if (!this.isDevelopment && level <= LOG_LEVELS.WARN) {
      this.sendToRemoteLogger(entry);
    }

    return entry;
  }

  getConsoleMethod(level) {
    switch (level) {
      case LOG_LEVELS.ERROR: return console.error;
      case LOG_LEVELS.WARN: return console.warn;
      case LOG_LEVELS.INFO: return console.info;
      case LOG_LEVELS.DEBUG: return console.debug;
      case LOG_LEVELS.TRACE: return console.trace;
      default: return console.log;
    }
  }

  async sendToRemoteLogger(entry) {
    try {
      // In production, send critical logs to a logging service
      if (window.navigator.sendBeacon) {
        const data = JSON.stringify(entry);
        window.navigator.sendBeacon('/api/logs', data);
      }
    } catch (error) {
      // Silently fail to avoid infinite loops
    }
  }

  // Convenience methods
  error(component, message, data) {
    return this.log(LOG_LEVELS.ERROR, component, message, data);
  }

  warn(component, message, data) {
    return this.log(LOG_LEVELS.WARN, component, message, data);
  }

  info(component, message, data) {
    return this.log(LOG_LEVELS.INFO, component, message, data);
  }

  debug(component, message, data) {
    return this.log(LOG_LEVELS.DEBUG, component, message, data);
  }

  trace(component, message, data) {
    return this.log(LOG_LEVELS.TRACE, component, message, data);
  }

  // API specific logging
  apiRequest(method, url, data = null) {
    return this.debug('API', `${method.toUpperCase()} ${url}`, data);
  }

  apiResponse(method, url, status, data = null) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    return this.log(level, 'API', `${method.toUpperCase()} ${url} → ${status}`, data);
  }

  apiError(method, url, error) {
    return this.error('API', `${method.toUpperCase()} ${url} failed`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }

  // Authentication logging
  authSuccess(action, user = null) {
    return this.info('AUTH', `${action} successful`, user ? { userId: user.id, role: user.role } : null);
  }

  authFailure(action, reason) {
    return this.warn('AUTH', `${action} failed: ${reason}`);
  }

  authError(action, error) {
    return this.error('AUTH', `${action} error`, {
      message: error.message,
      code: error.code
    });
  }

  // Component lifecycle logging
  componentMount(componentName, props = null) {
    return this.debug('COMPONENT', `${componentName} mounted`, props);
  }

  componentUnmount(componentName) {
    return this.debug('COMPONENT', `${componentName} unmounted`);
  }

  componentError(componentName, error, errorInfo = null) {
    return this.error('COMPONENT', `${componentName} error`, {
      message: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  // Performance logging
  performanceStart(operation) {
    const startTime = performance.now();
    return {
      operation,
      startTime,
      end: () => {
        const duration = performance.now() - startTime;
        this.info('PERFORMANCE', `${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }

  // User interaction logging
  userAction(action, details = null) {
    return this.info('USER', action, details);
  }

  // Get logs for debugging
  getLogs(level = null, component = null, limit = 100) {
    let logs = [...this.logBuffer];

    if (level !== null) {
      const levelNumber = typeof level === 'string' ? LOG_LEVELS[level.toUpperCase()] : level;
      logs = logs.filter(log => LOG_LEVELS[log.level] === levelNumber);
    }

    if (component) {
      logs = logs.filter(log => log.component === component);
    }

    return logs.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logBuffer = [];
    this.info('LOGGER', 'Log buffer cleared');
  }

  // Export logs for debugging
  exportLogs() {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `athletiq-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.info('LOGGER', 'Logs exported');
  }
}

// Create singleton instance
const logger = new Logger();

// Development helpers
if (logger.isDevelopment) {
  window.athletiqLogger = logger;
  window.exportLogs = () => logger.exportLogs();
  window.clearLogs = () => logger.clearLogs();
}

export default logger;

// Named exports for convenience
export const {
  error,
  warn,
  info,
  debug,
  trace,
  apiRequest,
  apiResponse,
  apiError,
  authSuccess,
  authFailure,
  authError,
  componentMount,
  componentUnmount,
  componentError,
  performanceStart,
  userAction
} = logger;
