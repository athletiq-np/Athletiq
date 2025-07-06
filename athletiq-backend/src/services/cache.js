// src/services/cache.js
const redis = require('redis');

/**
 * Cache service with Redis fallback to in-memory
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isRedisConnected = false;
    this.memoryCache = new Map();
    this.memoryTTL = new Map(); // Store TTL info for memory cache
  }
  
  /**
   * Initialize cache service
   */
  async initialize(config = {}) {
    try {
      // Try to connect to Redis if configuration is provided
      if (config.redis && (config.redis.url || config.redis.host)) {
        console.log('🔗 Attempting to connect to Redis...');
        
        this.client = redis.createClient({
          url: config.redis.url,
          socket: {
            host: config.redis.host,
            port: config.redis.port,
          },
          password: config.redis.password,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
        });
        
        this.client.on('error', (err) => {
          console.warn('⚠️ Redis connection error, falling back to memory cache:', err.message);
          this.isRedisConnected = false;
        });
        
        this.client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isRedisConnected = true;
        });
        
        this.client.on('ready', () => {
          console.log('🚀 Redis ready for use');
          this.isRedisConnected = true;
        });
        
        await this.client.connect();
      } else {
        console.log('💾 Using in-memory cache (Redis not configured)');
      }
    } catch (error) {
      console.warn('⚠️ Failed to connect to Redis, using memory cache:', error.message);
      this.isRedisConnected = false;
    }
    
    // Start memory cache cleanup interval
    this.startMemoryCacheCleanup();
  }
  
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isRedisConnected && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.getFromMemory(key);
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Set value in cache
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        this.setInMemory(key, value, ttlSeconds);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
        this.memoryTTL.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      if (this.isRedisConnected && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        return this.memoryCache.has(key) && !this.isMemoryKeyExpired(key);
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }
  
  /**
   * Increment counter in cache
   */
  async incr(key, ttlSeconds = 3600) {
    try {
      if (this.isRedisConnected && this.client) {
        const result = await this.client.incr(key);
        if (result === 1) { // First increment, set TTL
          await this.client.expire(key, ttlSeconds);
        }
        return result;
      } else {
        const current = this.getFromMemory(key) || 0;
        const newValue = current + 1;
        this.setInMemory(key, newValue, ttlSeconds);
        return newValue;
      }
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }
  
  /**
   * Get multiple keys
   */
  async mget(keys) {
    try {
      if (this.isRedisConnected && this.client) {
        const values = await this.client.mGet(keys);
        return values.map(value => value ? JSON.parse(value) : null);
      } else {
        return keys.map(key => this.getFromMemory(key));
      }
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }
  
  /**
   * Set multiple keys
   */
  async mset(keyValuePairs, ttlSeconds = 3600) {
    try {
      if (this.isRedisConnected && this.client) {
        const pipeline = this.client.multi();
        for (const [key, value] of keyValuePairs) {
          pipeline.setEx(key, ttlSeconds, JSON.stringify(value));
        }
        await pipeline.exec();
      } else {
        for (const [key, value] of keyValuePairs) {
          this.setInMemory(key, value, ttlSeconds);
        }
      }
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }
  
  /**
   * Clear all cache
   */
  async flush() {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.flushDb();
      } else {
        this.memoryCache.clear();
        this.memoryTTL.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
  
  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    if (this.isMemoryKeyExpired(key)) {
      this.memoryCache.delete(key);
      this.memoryTTL.delete(key);
      return null;
    }
    return this.memoryCache.get(key);
  }
  
  /**
   * Set in memory cache
   */
  setInMemory(key, value, ttlSeconds) {
    this.memoryCache.set(key, value);
    this.memoryTTL.set(key, Date.now() + (ttlSeconds * 1000));
  }
  
  /**
   * Check if memory cache key is expired
   */
  isMemoryKeyExpired(key) {
    const expiry = this.memoryTTL.get(key);
    return expiry && Date.now() > expiry;
  }
  
  /**
   * Start memory cache cleanup
   */
  startMemoryCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.memoryTTL.entries()) {
        if (now > expiry) {
          this.memoryCache.delete(key);
          this.memoryTTL.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      type: this.isRedisConnected ? 'redis' : 'memory',
      connected: this.isRedisConnected,
      memoryKeys: this.memoryCache.size,
    };
  }
  
  /**
   * Close cache connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

/**
 * Cache key generators
 */
const CacheKeys = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:profile:${userId}`,
  tournament: (tournamentId) => `tournament:${tournamentId}`,
  tournaments: (page = 1, limit = 10, filters = '') => `tournaments:${page}:${limit}:${filters}`,
  school: (schoolId) => `school:${schoolId}`,
  schools: (page = 1, limit = 10) => `schools:${page}:${limit}`,
  player: (playerId) => `player:${playerId}`,
  players: (schoolId, page = 1, limit = 10) => `players:${schoolId}:${page}:${limit}`,
  team: (teamId) => `team:${teamId}`,
  teams: (schoolId) => `teams:${schoolId}`,
  leaderboard: (tournamentId) => `leaderboard:${tournamentId}`,
  session: (sessionId) => `session:${sessionId}`,
  rateLimit: (ip, endpoint) => `ratelimit:${ip}:${endpoint}`,
  apiKey: (keyId) => `apikey:${keyId}`,
};

/**
 * Cache TTL constants (in seconds)
 */
const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  PERMANENT: 604800, // 7 days
};

// Singleton instance
const cacheService = new CacheService();

module.exports = {
  CacheService,
  cacheService,
  CacheKeys,
  CacheTTL,
};
