import { NextResponse } from 'next/server';
import { TEMPLATES, CATEGORIES } from '@/data/invitations/templates';

// Public catalog stats for the dashboard. Template data is static per
// build, so this route can be prerendered and cached.
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    count: TEMPLATES.length,
    categories: CATEGORIES.length,
  });
}
