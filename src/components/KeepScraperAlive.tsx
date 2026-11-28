'use client';

// Compatibility export for stale local build graphs that still reference the
// old dashboard-only warmer. The real implementation is mounted once at the
// root layout; this alias keeps those graphs buildable without a second timer.
export { KeepAppAlive as KeepScraperAlive } from './KeepAppAlive';
