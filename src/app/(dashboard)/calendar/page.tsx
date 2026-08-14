'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar as CalIcon, Search, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

interface CalendarEvent { _id: string; title: string; type: string; startDate: string; endDate?: string; allDay: boolean; location?: string; attendees?: string[]; color: string; description?: string; createdAt: string; }

const typeColors: Record<string, string> = { meeting: '#0984e3', task: '#6c5ce7', reminder: '#fdcb6e', event: '#00b894', holiday: '#d63031' };

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', type: 'meeting', startDate: '', endDate: '', allDay: true, location: '', attendees: '', color: '#6c5ce7', description: '' });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
      const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
      if (res.ok) setEvents(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const attendees = form.attendees.split(',').map(a => a.trim()).filter(Boolean);
      const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, attendees }) });
      if (res.ok) { setForm({ title: '', type: 'meeting', startDate: '', endDate: '', allDay: true, location: '', attendees: '', color: '#6c5ce7', description: '' }); setShowForm(false); fetchEvents(); }
    } catch (e) { console.error(e); }
  };

  const deleteEvent = async (id: string) => {
    try { await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' }); fetchEvents(); } catch (e) { console.error(e); }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, -firstDay + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.startDate?.startsWith(dateStr) || e.endDate?.startsWith(dateStr));
  };

  const today = new Date().toISOString().split('T')[0];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const stats = {
    today: getEventsForDate(new Date()).length,
    upcoming: events.filter(e => new Date(e.startDate) > new Date()).length,
    meetings: events.filter(e => e.type === 'meeting').length,
    tasks: events.filter(e => e.type === 'task').length,
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(new Date(selectedDate)) : [];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Calendar</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Schedule events, meetings & tasks</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> New Event
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Events", value: stats.today, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Upcoming', value: stats.upcoming, gradient: 'from-blue-500 to-cyan-600' },
            { label: 'Meetings', value: stats.meetings, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Tasks', value: stats.tasks, gradient: 'from-emerald-500 to-teal-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 rounded-xl hover:opacity-70" style={{ background: 'hsl(var(--muted))' }}>
              <ChevronLeft className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
            </button>
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 rounded-xl hover:opacity-70" style={{ background: 'hsl(var(--muted))' }}>
              <ChevronRight className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{d}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dateStr = day.date.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(day.date);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className="relative p-2 rounded-xl min-h-[70px] text-left transition-all"
                  style={{
                    background: isSelected ? 'hsl(var(--primary) / 0.15)' : isToday ? 'hsl(var(--primary) / 0.06)' : 'transparent',
                    border: isToday ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid transparent',
                    opacity: day.isCurrentMonth ? 1 : 0.4,
                  }}>
                  <span className={`text-xs font-semibold ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center text-white' : ''}`}
                    style={isToday ? { background: 'hsl(var(--primary))' } : { color: 'hsl(var(--foreground))' }}>
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev._id} className="text-[9px] font-medium px-1.5 py-0.5 rounded truncate text-white" style={{ background: typeColors[ev.type] || ev.color || '#6c5ce7' }}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>+{dayEvents.length - 2} more</div>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                Events on {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No events on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map(ev => (
                    <div key={ev._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.5)', border: '1px solid hsl(var(--border) / 0.3)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: typeColors[ev.type] || ev.color }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{ev.title}</p>
                          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span className="capitalize px-1.5 py-0.5 rounded-full" style={{ background: `${typeColors[ev.type]}20`, color: typeColors[ev.type] }}>{ev.type}</span>
                            {ev.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{ev.location}</span>}
                            {!ev.allDay && ev.startDate && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(ev.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(ev._id)} className="text-[10px] px-2 py-1 rounded-lg hover:opacity-70" style={{ color: '#d63031', background: 'hsl(0 70% 55% / 0.1)' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Event Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Event</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Event Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, color: typeColors[e.target.value] || '#6c5ce7' })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="meeting">Meeting</option><option value="task">Task</option><option value="reminder">Reminder</option><option value="event">Event</option><option value="holiday">Holiday</option>
                    </select>
                    <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Start</label>
                      <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>End</label>
                      <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.allDay} onChange={e => setForm({ ...form, allDay: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>All Day Event</span>
                  </label>
                  <input placeholder="Attendees (comma separated emails)" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" rows={2} />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Event</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
