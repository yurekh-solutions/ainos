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

  // Upstash uses token as password in the connection URL
  const upstashUrl = REDIS_URL.replace('https://', 'rediss://default:').replace('.upstash.io', `.upstash.io:6379`) + `/${REDIS_TOKEN}`;
  // Fallback: construct proper Upstash URL
  const connectionString = `rediss://default:${REDIS_TOKEN}@${REDIS_URL.replace('https://', '')}:6379`;

  redis = new Redis(connectionString, {
    tls: {},  // Upstash requires TLS
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableAutoPipelining: true,
    maxLoadingRetryTime: 5000,
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
