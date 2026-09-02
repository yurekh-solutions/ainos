import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// Seasonal Content Calendar - suggests blogs based on upcoming events/holidays
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche') || 'all';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Seasonal events database (can be extended)
    const SEASONAL_EVENTS = [
      // Indian festivals
      { date: `${today.getFullYear()}-01-26`, event: 'Republic Day', niche: 'all' },
      { date: `${today.getFullYear()}-08-15`, event: 'Independence Day', niche: 'all' },
      { date: `${today.getFullYear()}-10-02`, event: 'Gandhi Jayanti', niche: 'all' },
      { date: `${today.getFullYear()}-11-01`, event: 'Diwali', niche: 'all' },
      { date: `${today.getFullYear()}-11-12`, event: 'Diwali Marketing', niche: 'ecommerce' },
      { date: `${today.getFullYear()}-12-25`, event: 'Christmas', niche: 'all' },
      
      // Global events
      { date: `${today.getFullYear()}-02-14`, event: 'Valentine\'s Day', niche: 'lifestyle' },
      { date: `${today.getFullYear()}-03-08`, event: 'Women\'s Day', niche: 'all' },
      { date: `${today.getFullYear()}-04-22`, event: 'Earth Day', niche: 'sustainability' },
      { date: `${today.getFullYear()}-05-01`, event: 'Labour Day', niche: 'business' },
      { date: `${today.getFullYear()}-06-05`, event: 'World Environment Day', niche: 'sustainability' },
      { date: `${today.getFullYear()}-07-01`, event: 'Financial Year Start', niche: 'finance' },
      { date: `${today.getFullYear()}-09-05`, event: 'Teacher\'s Day', niche: 'education' },
      { date: `${today.getFullYear()}-10-31`, event: 'Halloween', niche: 'lifestyle' },
      { date: `${today.getFullYear()}-11-29`, event: 'Black Friday', niche: 'ecommerce' },
      { date: `${today.getFullYear()}-12-01`, event: 'Cyber Monday', niche: 'ecommerce' },
      { date: `${today.getFullYear()}-12-31`, event: 'New Year\'s Eve', niche: 'all' },
      
      // Business events
      { date: `${today.getFullYear()}-01-01`, event: 'New Year Planning', niche: 'business' },
      { date: `${today.getFullYear()}-03-31`, event: 'Q1 End Review', niche: 'business' },
      { date: `${today.getFullYear()}-06-30`, event: 'Mid-Year Review', niche: 'business' },
      { date: `${today.getFullYear()}-09-30`, event: 'Q3 End Review', niche: 'business' },
      { date: `${today.getFullYear()}-12-31`, event: 'Year-End Review', niche: 'business' },
    ];

    const upcoming = SEASONAL_EVENTS
      .filter(e => e.niche === 'all' || e.niche === niche)
      .map(e => {
        const eventDate = new Date(e.date);
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...e,
          daysUntil,
          shouldSchedule: daysUntil <= 30 && daysUntil >= 0
        };
      })
      .filter(e => e.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10);

    // Generate topic suggestions
    const suggestions = upcoming.map(event => ({
      event: event.event,
      date: event.date,
      daysUntil: event.daysUntil,
      suggestedTopic: `Best ${event.event} Strategies for ${niche === 'all' ? 'Your Business' : niche}`,
      alternativeTopic: `${event.event} ${niche} Guide: Tips & Ideas`,
      shouldSchedule: event.shouldSchedule,
      urgency: event.daysUntil <= 7 ? 'high' : event.daysUntil <= 14 ? 'medium' : 'low'
    }));

    return NextResponse.json({ events: suggestions });
  } catch (error) {
    console.error('Seasonal calendar error:', error);
    return NextResponse.json({ error: 'Failed to load seasonal calendar' }, { status: 500 });
  }
}
