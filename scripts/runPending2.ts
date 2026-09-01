import { PrismaClient } from '@prisma/client';
import { generateScheduleNow } from '../src/lib/schedule-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL);
  console.log('GEMINI_API_KEYS count:', (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean).length);

  const args = process.argv.slice(2);
  const max = parseInt(args[0] || '999', 10);
  const offset = parseInt(args[1] || '0', 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pending = await prisma.blogSchedule.findMany({
    where: {
      OR: [
        { status: 'pending', scheduledDate: { lt: tomorrow } },
        { status: 'failed' },
      ],
    },
    orderBy: { scheduledDate: 'asc' },
    take: max,
    skip: offset,
  });

  console.log(`Found ${pending.length} pending schedules to process (max=${max}, offset=${offset})`);

  let success = 0, failed = 0, skipped = 0;

  for (let i = 0; i < pending.length; i++) {
    const sched = pending[i];
    const start = Date.now();
    process.stdout.write(`[${i + 1}/${pending.length}] ${sched.id.slice(0, 8)} "${sched.topic?.slice(0, 50)}..." `);
    try {
      const result = await generateScheduleNow(sched.id);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (result.status === 'published') { success++; console.log(`OK ${elapsed}s`); }
      else if (result.status === 'failed') { failed++; console.log(`FAIL: ${result.reason?.slice(0, 80)} (${elapsed}s)`); }
      else { skipped++; console.log(`SKIP ${result.status} (${elapsed}s)`); }
    } catch (e) {
      failed++;
      console.log(`ERR: ${(e as Error).message?.slice(0, 80)}`);
    }
  }

  console.log(`\nSuccess=${success} Failed=${failed} Skipped=${skipped} Total=${pending.length}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
