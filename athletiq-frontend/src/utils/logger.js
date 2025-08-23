/**
 * Stable console logger utility
 * Provides consistent logging across the application with log levels and environment awareness
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default log level based on environment
const DEFAULT_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.ERROR 
  : LOG_LEVELS.DEBUG;

class Logger {
  constructor(level = DEFAULT_LEVEL) {
    this.level = level;
    this.prefix = '[Athletiq]';
  }

  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()] || DEFAULT_LEVEL;
    } else {
      this.level = level;
    }
  }

  debug(...args) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(this.prefix, '🐛 DEBUG:', ...args);
    }
  }

  log(...args) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this.prefix, 'ℹ️ INFO:', ...args);
    }
  }

  info(...args) {
    this.log(...args);
  }

  warn(...args) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this.prefix, '⚠️ WARN:', ...args);
    }
  }

  error(...args) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this.prefix, '❌ ERROR:', ...args);
      // Log errors to your error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        // Example: logToService('error', ...args);
      }
    }
  }

  // Group related logs together
  group(label, callback) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.groupCollapsed(`${this.prefix} ${label}`);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    }
  }

  // Time operations
  time(label) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  timeEnd(label) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }
}

// Create a singleton instance
export const logger = new Logger();

// Export for direct usage
export const debug = (...args) => logger.debug(...args);
export const log = (...args) => logger.log(...args);
export const info = (...args) => logger.info(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const time = (label) => logger.time(label);
export const timeEnd = (label) => logger.timeEnd(label);

export default logger;
