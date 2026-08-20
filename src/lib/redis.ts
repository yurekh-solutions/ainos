import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const REDIS_URL = process.env.REDIS_URL;
  const REDIS_TOKEN = process.env.REDIS_TOKEN;
  
  if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn('REDIS_URL or REDIS_TOKEN not set, caching disabled');
    return null;
  }

  // Upstash provides a REST URL (https://...) but ioredis needs rediss://...
  // Extract hostname from REST URL and build proper Redis connection string
  let hostname: string;
  try {
    const url = new URL(REDIS_URL);
    hostname = url.hostname;
  } catch {
    hostname = REDIS_URL.replace('https://', '').replace('http://', '');
  }

  const connectionString = `rediss://default:${REDIS_TOKEN}@${hostname}:6379`;

  // Only disable cert verification in development/sandbox environments
  // Production (Render) should use proper TLS verification
  const isProduction = process.env.NODE_ENV === 'production';

  redis = new Redis(connectionString, {
    tls: isProduction ? {} : { rejectUnauthorized: false },
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableAutoPipelining: true,
    maxLoadingRetryTime: 5000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });

  return redis;
}

// Cache helper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail - cache is optional
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch {
    // Silently fail
  }
}

// Cache pattern for API responses
export async function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await cacheGet<T>(cacheKey);
  if (cached) return cached;

  const data = await fetcher();
  await cacheSet(cacheKey, data, ttlSeconds);
  return data;
}
