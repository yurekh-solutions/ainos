import { getRedis } from './redis';

/**
 * ASYNC JOB QUEUE (Phase 2 — kills 55s gateway timeouts / 502s).
 *
 * Render's free tier gives us no always-on worker, and the old list-based
 * queue.ts has no consumer, so a daemon model is unreliable here. Instead we
 * run the job DETACHED inside the live web process: the HTTP request returns a
 * jobId immediately (well under the 55s ceiling) and the actual AI/media work
 * continues in-process after the response is sent. Job STATUS + RESULT live in
 * Redis so any poll request — possibly on another warm instance — can read it.
 *
 * Additive: nothing here changes an existing endpoint until its route opts in
 * by calling submitJob() and registering a handler. A global semaphore keeps
 * multi-tenant load bounded, and an idempotency key prevents double-charging on
 * a replayed submit.
 */

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobRecord<P = unknown, R = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  companyId?: string;
  payload: P;
  result?: R;
  error?: string;
  retries: number;
  maxRetries: number;
}

/** Status shape safe to expose to a polling client (payload never leaves server). */
export interface JobView<R = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  companyId?: string;
  result?: R;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const JOB_PREFIX = 'ainos:job:';
const IDEM_PREFIX = 'ainos:idem:';
const JOB_TTL_SEC = 24 * 3600;
/** A job still 'processing' after this long is presumed lost on a restart. */
const STALE_MS = 5 * 60 * 1000;

type Handler<R, P> = (payload: P, job: JobRecord<P, R>) => Promise<R>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers = new Map<string, Handler<any, any>>();

export function registerJobHandler<R, P>(type: string, handler: Handler<R, P>): void {
  handlers.set(type, handler);
}

/** Bounded in-process concurrency, overridable per deployment. */
const MAX_CONCURRENT = Math.max(1, Number(process.env.AI_JOB_CONCURRENCY || 3));
let running = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  running++;
}

function releaseSlot(): void {
  running--;
  const next = waiters.shift();
  if (next) next();
}

function genId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persist(rec: JobRecord): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(JOB_PREFIX + rec.id, JSON.stringify(rec), 'EX', JOB_TTL_SEC);
  } catch {
    // status write is best-effort; execution continues regardless
  }
}

export interface SubmitOptions {
  companyId?: string;
  idempotencyKey?: string;
  maxRetries?: number;
}

export interface SubmitResult {
  jobId: string;
  status: JobStatus;
  reused: boolean;
}

/**
 * Enqueue a job and START it detached (fire-and-forget). Returns synchronously
 * with the id so the caller can respond <2s and let the client poll getJob().
 * When an idempotencyKey was already seen, returns the existing job without
 * running the work again (so a replay never double-charges credits).
 */
export async function submitJob<P = unknown>(
  type: string,
  payload: P,
  opts: SubmitOptions = {},
): Promise<SubmitResult> {
  const client = getRedis();

  if (client && opts.idempotencyKey) {
    const existing = await client.get(IDEM_PREFIX + opts.idempotencyKey).catch(() => null);
    if (existing) return { jobId: existing, status: 'queued', reused: true };
  }

  const rec: JobRecord<P> = {
    id: genId(),
    type,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    companyId: opts.companyId,
    payload,
    retries: 0,
    maxRetries: opts.maxRetries ?? 0,
  };

  await persist(rec as JobRecord);
  if (client && opts.idempotencyKey) {
    await client.set(IDEM_PREFIX + opts.idempotencyKey, rec.id, 'EX', JOB_TTL_SEC).catch(() => {});
  }

  // Detach: never await, so the HTTP handler can return immediately.
  void runJob(rec as JobRecord);
  return { jobId: rec.id, status: 'queued', reused: false };
}

async function runJob(rec: JobRecord): Promise<void> {
  const handler = handlers.get(rec.type);
  if (!handler) {
    rec.status = 'failed';
    rec.error = `No handler registered for job type "${rec.type}"`;
    rec.updatedAt = Date.now();
    await persist(rec);
    return;
  }

  await acquireSlot();
  try {
    rec.status = 'processing';
    rec.updatedAt = Date.now();
    await persist(rec);

    const result = await handler(rec.payload as never, rec);
    rec.status = 'completed';
    rec.result = result;
    rec.error = undefined;
    rec.updatedAt = Date.now();
    await persist(rec);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (rec.retries < rec.maxRetries) {
      rec.retries++;
      rec.status = 'queued';
      rec.error = `${message} (retry ${rec.retries}/${rec.maxRetries})`;
      rec.updatedAt = Date.now();
      await persist(rec);
      releaseSlot();
      // re-drive the same record in-process
      return runJob(rec);
    }
    rec.status = 'failed';
    rec.error = message;
    rec.updatedAt = Date.now();
    await persist(rec);
  } finally {
    // Only release when we did not recurse via the retry path above.
    if (rec.status === 'completed' || rec.status === 'failed') releaseSlot();
  }
}

/** Read a job's public status/result for the polling client. */
export async function getJob<R = unknown>(jobId: string): Promise<JobView<R> | null> {
  const client = getRedis();
  if (!client) return null;
  const raw = await client.get(JOB_PREFIX + jobId).catch(() => null);
  if (!raw) return null;
  const rec = JSON.parse(raw) as JobRecord<unknown, R>;

  // If a job is stuck 'processing' (e.g. the instance died mid-run), report it
  // as failed so the client stops polling a forever-pending job.
  if ((rec.status === 'processing' || rec.status === 'queued') && Date.now() - rec.updatedAt > STALE_MS) {
    rec.status = 'failed';
    rec.error = 'Job did not finish in time (worker restarted?). Please try again.';
  }

  const { payload: _payload, ...view } = rec;
  void _payload;
  return view as JobView<R>;
}
