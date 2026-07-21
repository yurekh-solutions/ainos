import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from './redis';

interface RateLimitConfig {
  maxRequests: number;  // Max requests per window
  windowMs: number;     // Time window in ms
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,     // 100 requests per minute per user
  windowMs: 60 * 1000,  // 1 minute window
};

export async function rateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { maxRequests, windowMs } = { ...defaultConfig, ...config };

  // Get client identifier (IP or user ID)
  const clientId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'unknown';
  const key = `ratelimit:${clientId}`;

  const client = getRedis();

  // If no Redis, allow all requests (graceful degradation)
  if (!client) {
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }

  try {
    const pipeline = client.pipeline();
    pipeline.incr(key);
    pipeline.pttl(key);
    const results = await pipeline.exec();

    const currentCount = (results?.[0]?.[1] as number) || 1;
    const ttl = (results?.[1]?.[1] as number) || windowMs;

    // Set expiry on first request
    if (currentCount === 1) {
      await client.pexpire(key, windowMs);
    }

    const remaining = Math.max(0, maxRequests - currentCount);
    const resetAt = Date.now() + ttl;

    return {
      allowed: currentCount <= maxRequests,
      remaining,
      resetAt,
    };
  } catch {
    // If Redis fails, allow the request
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

// Middleware helper for API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
) {
  return async (req: NextRequest) => {
    const limit = await rateLimit(req, config);

    const headers = new Headers({
      'X-RateLimit-Limit': String(config?.maxRequests || defaultConfig.maxRequests),
      'X-RateLimit-Remaining': String(limit.remaining),
      'X-RateLimit-Reset': String(limit.resetAt),
    });

    if (!limit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await handler(req);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
