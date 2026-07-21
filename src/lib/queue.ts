import { getRedis } from './redis';

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  processedAt?: number;
  error?: string;
  retries: number;
  maxRetries: number;
}

const QUEUE_KEY = 'ainos:queue';
const PROCESSING_KEY = 'ainos:processing';
const RESULTS_KEY = 'ainos:results';

// Add a job to the queue
export async function enqueueJob<T>(
  type: string,
  payload: T,
  maxRetries = 3
): Promise<string> {
  const client = getRedis();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: Job<T> = {
    id: jobId,
    type,
    payload,
    status: 'pending',
    createdAt: Date.now(),
    retries: 0,
    maxRetries,
  };

  if (client) {
    await client.lpush(QUEUE_KEY, JSON.stringify(job));
  }

  return jobId;
}

// Process next job from queue
export async function processNextJob<T = unknown>(): Promise<Job<T> | null> {
  const client = getRedis();
  if (!client) return null;

  const raw = await client.rpoplpush(QUEUE_KEY, PROCESSING_KEY);
  if (!raw) return null;

  const job: Job<T> = JSON.parse(raw);
  job.status = 'processing';
  job.processedAt = Date.now();

  await client.lset(PROCESSING_KEY, 0, JSON.stringify(job));

  return job;
}

// Mark job as completed
export async function completeJob(jobId: string, result?: unknown): Promise<void> {
  const client = getRedis();
  if (!client) return;

  const raw = await client.lrem(PROCESSING_KEY, 1, '');
  // Find and remove the job from processing
  const jobs = await client.lrange(PROCESSING_KEY, 0, -1);
  for (const rawJob of jobs) {
    const job: Job = JSON.parse(rawJob);
    if (job.id === jobId) {
      await client.lrem(PROCESSING_KEY, 1, rawJob);
      job.status = 'completed';
      if (result) {
        await client.set(`${RESULTS_KEY}:${jobId}`, JSON.stringify(result), 'EX', 3600);
      }
      break;
    }
  }
}

// Mark job as failed and retry
export async function failJob(jobId: string, error: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  const jobs = await client.lrange(PROCESSING_KEY, 0, -1);
  for (const rawJob of jobs) {
    const job: Job = JSON.parse(rawJob);
    if (job.id === jobId) {
      await client.lrem(PROCESSING_KEY, 1, rawJob);

      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = 'pending';
        job.error = error;
        await client.lpush(QUEUE_KEY, JSON.stringify(job));
        return true; // Will retry
      } else {
        job.status = 'failed';
        job.error = error;
        await client.set(`${RESULTS_KEY}:${jobId}`, JSON.stringify(job), 'EX', 86400);
        return false; // Max retries reached
      }
    }
  }
  return false;
}

// Get job result
export async function getJobResult<T>(jobId: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  const raw = await client.get(`${RESULTS_KEY}:${jobId}`);
  return raw ? JSON.parse(raw) : null;
}

// Get queue stats
export async function getQueueStats() {
  const client = getRedis();
  if (!client) {
    return { pending: 0, processing: 0, failed: 0 };
  }

  const [pending, processing] = await Promise.all([
    client.llen(QUEUE_KEY),
    client.llen(PROCESSING_KEY),
  ]);

  return { pending, processing };
}

// Job types for AINOS
export type AinosJobType =
  | 'send_email'
  | 'generate_invoice_pdf'
  | 'sync_inventory'
  | 'process_payroll'
  | 'send_notification'
  | 'generate_report'
  | 'ai_media_generate'
  | 'backup_data';
