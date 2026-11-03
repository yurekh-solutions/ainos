import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit tests target PURE server logic (entitlement engine, pricing) — no DB or
// network is touched. Modules under test transitively `import { prisma }`, whose
// client constructs without connecting, so we just supply a syntactically valid
// DATABASE_URL and never run a query.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgresql://vitest:vitest@127.0.0.1:5432/vitest',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
