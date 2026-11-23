'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle, CheckCircle2, MessageCircle, IndianRupee, Filter, QrCode, Loader2, X } from 'lucide-react';

interface Reminder {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  whatsappLink: string | null;
}

// A payer has said "I sent it through UPI" on one of our collect links. The
// money is not real to the books until the owner confirms it here.
interface Claim {
  id: string;
  amount: number;
  label: string | null;
  claimedAt: string | null;
  payerName: string | null;
  payerUpiId: string | null;
  payerRef: string | null;
  invoiceNumber: string | null;
  customerName: string | null;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimBusy, setClaimBusy] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-links');
      const data = await res.json().catch(() => ({}));
      if (res.ok) setClaims(Array.isArray(data.claims) ? data.claims : []);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/payment-reminders${params}`);
      if (res.ok) setReminders(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Both effects exist to read server state the moment the screen opens: the
  // overdue list and, above it, the UPI claims waiting on this owner.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const totalPending = reminders.reduce((s, r) => s + r.pendingAmount, 0);
  const overdueCount = reminders.filter(r => r.isOverdue).length;

  const resolveClaim = async (claim: Claim, action: 'confirm' | 'reject') => {
    setClaimBusy(claim.id);
    setClaimError(null);
    try {
      const res = await fetch('/api/payment-links/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: claim.id, action, bankReference: claim.payerRef }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not update this payment.');
      await Promise.all([fetchClaims(), fetchData()]);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Could not update this payment.');
    } finally {
      setClaimBusy(null);
    }
  };

  const handleMarkPaid = async (id: string, totalAmount: number) => {
    try {
      await fetch('/api/payment-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paidAmount: totalAmount }),
      });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
              <Bell className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            Payment Reminders
          </h1>
          <p className="text-sm mt-1 ml-[52px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Track overdue payments and send reminders
          </p>
        </div>

        {/* Claims queue: the one place a UPI link payment becomes real. */}
        {claims.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Waiting for your confirmation
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
              >
                {claims.length}
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
              These customers say they paid by UPI. Match the reference in your bank statement, then confirm. Only a
              confirmed payment moves the invoice to paid.
            </p>

            <div className="mt-4 space-y-3">
              {claims.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      ₹{c.amount.toLocaleString('en-IN')}
                      <span className="font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {c.invoiceNumber ? ` · Invoice ${c.invoiceNumber}` : ''}
                      </span>
                    </p>
                    <p className="text-xs mt-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {c.payerName || c.customerName || 'Payer'}
                      {c.claimedAt ? ` · claimed ${new Date(c.claimedAt).toLocaleDateString('en-IN')}` : ''}
                    </p>
                    <p className="text-xs mt-0.5 font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Ref {c.payerRef || 'not given'}{c.payerUpiId ? ` · ${c.payerUpiId}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => resolveClaim(c, 'confirm')}
                      disabled={claimBusy === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                      style={{ background: 'hsl(142 76% 36% / 0.12)', color: 'hsl(142 76% 30%)' }}
                    >
                      {claimBusy === c.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Money received
                    </button>
                    <button
                      onClick={() => resolveClaim(c, 'reject')}
                      disabled={claimBusy === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                      style={{ background: 'hsl(0 72% 51% / 0.1)', color: 'hsl(0 72% 45%)' }}
                    >
                      <X className="w-3.5 h-3.5" /> Not received
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {claimError && (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: 'hsl(0 72% 45%)' }} role="alert">
                {claimError}
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <IndianRupee className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Pending</p>
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(0 72% 51% / 0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'hsl(0 72% 51%)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Overdue</p>
                <p className="text-lg font-bold text-red-500">{overdueCount}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Clock className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Invoices</p>
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{reminders.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="glass-card p-4 flex items-center gap-3">
          <Filter className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          {(['all', 'overdue', 'upcoming'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                filter === f ? 'text-white' : ''
              }`}
              style={filter === f
                ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }
                : { background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
              }>
              {f}
            </button>
          ))}
        </div>

        {/* Reminders List */}
        <div className="space-y-3">
          {loading ? (
            <div className="glass-card p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
            </div>
          ) : reminders.length > 0 ? (
            reminders.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 ${r.isOverdue ? 'border-l-4' : ''}`}
                style={r.isOverdue ? { borderLeftColor: 'hsl(0 72% 51%)' } : {}}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{r.customerName}</span>
                      {r.isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-500 border border-red-500/30">
                          {r.daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Invoice {r.invoiceNumber} | Due: {new Date(r.dueDate).toLocaleDateString('en-IN')}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                        ₹{r.pendingAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        of ₹{r.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.whatsappLink && (
                      <a href={r.whatsappLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)' }}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                    <button onClick={() => handleMarkPaid(r.id, r.totalAmount)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>All clear!</h3>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No pending payments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
