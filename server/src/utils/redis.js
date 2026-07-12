const Redis = require('ioredis');

let redis = null;

/**
 * Initialize the Redis client.
 * Call this once at server startup.
 * 
 * Uses REDIS_URL from environment (defaults to localhost:6379).
 * Supports both local Redis and managed services (Render Redis, Upstash).
 */
function connectRedis() {
  if (redis) {
    console.warn('⚠️ Redis client already initialized. Ignoring duplicate connect.');
    return redis;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) {
        console.error('❌ Redis: Max reconnection attempts reached. Giving up.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${times})...`);
      return delay;
    },
    // Render Redis uses TLS on the external URL; ioredis auto-detects from rediss:// scheme
    lazyConnect: false,
  });

  redis.on('connect', () => {
    console.log('✅ Redis: Connected successfully');
  });

  redis.on('ready', () => {
    console.log('✅ Redis: Ready to accept commands');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  redis.on('close', () => {
    console.log('🔌 Redis: Connection closed');
  });

  return redis;
}

/**
 * Get the Redis client instance.
 * Throws if Redis hasn't been initialized via connectRedis().
 * 
 * @returns {import('ioredis').Redis}
 */
function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
}

/**
 * Gracefully disconnect Redis.
 * Call this on server shutdown (SIGTERM/SIGINT).
 */
async function disconnectRedis() {
  if (redis) {
    console.log('🔌 Redis: Disconnecting...');
    await redis.quit();
    redis = null;
    console.log('✅ Redis: Disconnected');
  }
}

module.exports = {
  connectRedis,
  getRedis,
  disconnectRedis,
};
