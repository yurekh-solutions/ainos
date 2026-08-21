import { NextResponse } from 'next/server';

// Lightweight ping endpoint for keep-alive monitoring
// Returns 200 OK immediately without any database/Redis calls
export async function GET() {
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
