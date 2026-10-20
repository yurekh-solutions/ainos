'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Notification { id: string; title: string; message: string; type: string; read: boolean; module?: string; createdAt: string; }

const typeIcons: Record<string, React.ElementType> = { info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle };
const typeColors: Record<string, string> = { info: '#0984e3', success: '#00b894', warning: '#fdcb6e', error: '#d63031' };

export function NotificationsBell() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try { const res = await fetch('/api/notifications'); if (res.ok) setNotifications(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    // Wait for NextAuth to confirm the session before hitting the API.
    if (status === 'authenticated') {
      void Promise.resolve().then(fetchNotifications);
    } else if (status === 'unauthenticated') {
      Promise.resolve().then(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id, read: true }) })));
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) });
      fetchNotifications();
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Notifications"
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold text-white flex items-center justify-center bg-[#5b21b6] ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="fixed left-4 right-4 top-[4.5rem] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 max-h-96 rounded-2xl overflow-hidden z-50 bg-white border border-neutral-200 shadow-lg shadow-neutral-900/5">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium flex items-center gap-1 text-[#5b21b6] hover:text-[#4c1d95]">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-72">
              {loading ? (
                <div className="p-6 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 20).map(n => {
                  const Icon = typeIcons[n.type] || Info;
                  return (
                    <button key={n.id} onClick={() => markRead(n.id)}
                      className="w-full text-left p-3 flex items-start gap-3 transition-colors hover:opacity-80"
                      style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)', background: n.read ? 'transparent' : 'hsl(var(--primary) / 0.04)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${typeColors[n.type] || '#0984e3'}15` }}>
                        <Icon className="w-4 h-4" style={{ color: typeColors[n.type] || '#0984e3' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{n.title}</p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{n.message}</p>
                        <p className="text-[9px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'hsl(var(--primary))' }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
