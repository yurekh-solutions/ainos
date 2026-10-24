import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AuditEntity = 'rental' | 'approval' | 'shift' | 'survey' | 'event' | 'registration';

export type AuditActor = { id?: string | null; email?: string | null };

type AuditInput = {
  companyId: string;
  entity: AuditEntity;
  entityId: string;
  action: string;
  actor: AuditActor;
  summary?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
};

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  // Prisma Decimal instances stringify to their numeric value.
  if (typeof value === 'object' && value !== null && 'toFixed' in value) return Number(value);
  return value;
}

/**
 * Only records the fields that actually moved, so history stays readable instead
 * of dumping the whole row on every save.
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  keys: string[],
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of keys) {
    const from = normalize(before[key]);
    const to = normalize(after[key]);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  const client = prisma;
  try {
    await client.auditLog.create({
      data: {
        companyId: input.companyId,
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actor.id ?? null,
        actorEmail: input.actor.email ?? null,
        summary: input.summary ?? null,
        changes: (input.changes ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // History is important but must never roll back the business operation.
    console.error(`Audit write failed (${input.entity}/${input.action})`, error);
  }
}
