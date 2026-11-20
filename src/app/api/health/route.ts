import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

type Check = { status: string; latency?: number; reason?: string; code?: string };

// Reduce a connection failure to a machine-readable token so the health probe
// explains itself without exposing hosts, ports or credentials.
function describe(error: unknown): { reason: string; code?: string } {
  const message = error instanceof Error ? error.message : String(error);
  const raw = (error as { code?: unknown } | null)?.code;
  const code = typeof raw === 'string' ? raw : undefined;
  const text = message.toLowerCase();

  let reason = 'unknown';
  if (text.includes('environment variable not found')) reason = 'env_missing';
  else if (text.includes('authentication failed') || text.includes('password authentication')) reason = 'auth_failed';
  else if (text.includes('enotfound') || text.includes('getaddrinfo')) reason = 'host_not_found';
  else if (text.includes('econnrefused') || text.includes('connection refused')) reason = 'connection_refused';
  else if (text.includes('etimedout') || text.includes('timeout')) reason = 'timeout';
  else if (text.includes('certificate') || text.includes('ssl') || text.includes('tls')) reason = 'tls_error';
  else if (text.includes('does not exist') || text.includes('relation')) reason = 'schema_missing';

  return { reason, code };
}

export async function GET() {
  const checks: Record<string, Check> = {};

  // Check PostgreSQL (via Prisma)
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgresql = { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    checks.postgresql = { status: 'unhealthy', ...describe(error) };
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
    checks.redis = { status: 'unhealthy', ...describe(error) };
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
