import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Check PostgreSQL (via Prisma)
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgresql = { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    checks.postgresql = { status: 'unhealthy' };
  }

  // Check Redis
  try {
    const redis = getRedis();
    if (redis) {
      const start = Date.now();
      await redis.ping();
      checks.redis = { status: 'healthy', latency: Date.now() - start };
    } else {
      checks.redis = { status: 'not_configured' };
    }
  } catch (error) {
    checks.redis = { status: 'unhealthy' };
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === 'healthy' || c.status === 'not_configured'
  );

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
