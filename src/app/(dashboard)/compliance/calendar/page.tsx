'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface ComplianceTask { _id: string; title: string; category: string; dueDate: string; status: string; description?: string; }

export default function ComplianceCalendarPage() {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'tax', dueDate: '', description: '' });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/compliance');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data?.tasks) ? data.tasks : (Array.isArray(data?.items) ? data.items : []));
        setTasks(items);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'pending' }),
      });
      if (res.ok) { setForm({ title: '', category: 'tax', dueDate: '', description: '' }); setShowForm(false); fetchTasks(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { pending: '#a78bfa', completed: '#34d399', overdue: '#94a3b8' };
  const overdueCount = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Compliance Calendar</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Legal & regulatory deadlines</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Task
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total Tasks', v: tasks.length, c: 'hsl(252 60% 55%)' },
            { l: 'Overdue', v: overdueCount, c: '#94a3b8' },
            { l: 'Completed', v: tasks.filter(t => t.status === 'completed').length, c: '#34d399' },
            { l: 'Pending', v: tasks.filter(t => t.status === 'pending').length, c: '#a78bfa' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : tasks.length === 0 ? (
            <div className="text-center py-20"><Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No compliance tasks</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task, i) => {
                const isOverdue = task.status === 'pending' && new Date(task.dueDate) < new Date();
                return (
                  <motion.div key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="glass-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{task.title}</h3>
                      {isOverdue ? <AlertTriangle className="w-5 h-5 text-[#94a3b8]" /> : task.status === 'completed' ? <CheckCircle className="w-5 h-5 text-[#34d399]" /> : null}
                    </div>
                    <p className="text-xs capitalize mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{task.category}</p>
                    {task.description && <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{task.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: isOverdue ? '#94a3b8' : statusColors[task.status] }}>{isOverdue ? 'overdue' : task.status}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Compliance Task</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Task title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="tax">Tax</option><option value="legal">Legal</option><option value="license">License</option><option value="audit">Audit</option><option value="other">Other</option>
                </select>
                <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Add Task</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
