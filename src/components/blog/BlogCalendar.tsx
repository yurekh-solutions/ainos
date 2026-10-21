'use client';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export interface CalendarPost {
  id: string;
  title: string;
  status: string;
  featuredImage: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  isSchedule?: boolean;
}

type Stage = 'live' | 'ready' | 'queued';

const STAGES: Record<Stage, { label: string; dot: string; chip: string }> = {
  live: { label: 'Live', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  ready: { label: 'Ready', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-100' },
  queued: { label: 'Queued', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-100' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// When a post shows on the client's site: the go-live time for written posts,
// the planned date for queued ones
function placement(p: CalendarPost): { date: Date; stage: Stage } | null {
  if (p.isSchedule) {
    return p.scheduledAt ? { date: new Date(p.scheduledAt), stage: 'queued' } : null;
  }
  if (p.status !== 'published') return null;
  const at = p.publishedAt || p.scheduledAt || p.createdAt;
  const date = new Date(at);
  return { date, stage: date.getTime() > Date.now() ? 'ready' : 'live' };
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <FileText className="w-3 h-3 text-white/70" />
      )}
    </span>
  );
}

export default function BlogCalendar<T extends CalendarPost>({ posts, onOpen }: { posts: T[]; onOpen: (post: T) => void }) {
  const placed = useMemo(() => posts
    .map(p => ({ post: p, ...placement(p) }))
    .filter((x): x is { post: T; date: Date; stage: Stage } => !!x.date && !!x.stage)
    .sort((a, b) => a.date.getTime() - b.date.getTime()), [posts]);

  // Open on the month of the next upcoming blog (or this month)
  const [cursor, setCursor] = useState(() => {
    const next = placed.find(x => x.date.getTime() >= Date.now());
    const d = next ? next.date : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map: Record<string, typeof placed> = {};
    for (const x of placed) (map[dayKey(x.date)] ||= []).push(x);
    return map;
  }, [placed]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const monthItems = placed.filter(x => x.date.getFullYear() === year && x.date.getMonth() === month);
  const agenda = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
    .map(d => ({ d, items: byDay[dayKey(d)] || [] }))
    .filter(g => g.items.length > 0);
  const todayKey = dayKey(new Date());
  const counts = monthItems.reduce((acc, x) => { acc[x.stage]++; return acc; }, { live: 0, ready: 0, queued: 0 } as Record<Stage, number>);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month"
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <p className="text-sm font-bold text-gray-900 min-w-[120px] text-center">
            {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month"
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
          {(Object.keys(STAGES) as Stage[]).map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STAGES[s].dot}`} />
              {STAGES[s].label} <span className="font-semibold text-gray-700">{counts[s]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Desktop / tablet: month grid */}
      <div className="hidden sm:block p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map(d => (
            <p key={d} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} className="min-h-[92px] rounded-lg bg-gray-50/50" />;
            const items = byDay[dayKey(d)] || [];
            const isToday = dayKey(d) === todayKey;
            return (
              <div key={dayKey(d)}
                className={`min-h-[92px] rounded-lg border p-1.5 flex flex-col gap-1 min-w-0 ${isToday ? 'border-purple-300 bg-purple-50/40' : 'border-gray-100'}`}>
                <span className={`text-[11px] font-semibold ${isToday ? 'text-purple-700' : 'text-gray-500'}`}>{d.getDate()}</span>
                {items.slice(0, 2).map(({ post, stage }) => (
                  <button key={post.id} onClick={() => onOpen(post)} title={`${STAGES[stage].label}: ${post.title}`}
                    className={`flex items-center gap-1.5 rounded-md border px-1 py-1 text-left min-w-0 hover:shadow-sm transition-shadow ${STAGES[stage].chip}`}>
                    <Thumb src={post.featuredImage} />
                    <span className="text-[10px] font-medium leading-tight line-clamp-2 break-words min-w-0">{post.title}</span>
                  </button>
                ))}
                {items.length > 2 && (
                  <span className="text-[10px] font-semibold text-gray-500 px-1">+{items.length - 2} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: agenda list */}
      <div className="sm:hidden p-3">
        {agenda.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">No blogs planned this month.</p>
        ) : (
          <div className="space-y-3">
            {agenda.map(({ d, items }) => (
              <div key={dayKey(d)} className="flex gap-3">
                <div className={`w-11 flex-shrink-0 text-center rounded-lg py-1.5 ${dayKey(d) === todayKey ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                  <p className="text-[9px] font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-base font-bold leading-tight">{d.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {items.map(({ post, stage, date }) => (
                    <button key={post.id} onClick={() => onOpen(post)}
                      className="w-full flex items-center gap-2 rounded-lg border border-gray-100 p-2 text-left hover:bg-gray-50">
                      <Thumb src={post.featuredImage} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium text-gray-900 line-clamp-2 break-words">{post.title}</span>
                        <span className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${STAGES[stage].dot}`} />
                          {STAGES[stage].label} · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
