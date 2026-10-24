'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreditPack {
  credits: number;
  price: number;
  label: string;
  popular?: boolean;
  amountInr?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) return resolve(true);
    const existing = document.querySelector('script[data-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const creditsRes = await fetch('/api/billing/credits');
    const creditsData = await creditsRes.json();
    setBalance(creditsData.balance || 0);
    setHistory(creditsData.history || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/billing/credits').then((r) => r.json()),
      fetch('/api/billing/checkout').then((r) => r.json()),
    ])
      .then(([creditsData, packsData]) => {
        if (!active) return;
        setBalance(creditsData.balance || 0);
        setHistory(creditsData.history || []);
        setPacks(Array.isArray(packsData) ? packsData : []);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleBuy = async (pack: CreditPack) => {
    setBuying(pack.credits);
    setNotice(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditPackId: pack.credits }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) throw new Error(data.error || 'Could not start checkout');
      if (!data.keyId) throw new Error('Payments are not configured yet. Please contact support.');

      const ready = await loadRazorpay();
      if (!ready) throw new Error('The payment window could not load. Check your connection and retry.');

      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      const checkout = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'AINOS',
        description: `${pack.credits.toLocaleString()} credits`,
        order_id: data.orderId,
        theme: { color: '#4c1d95' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || 'Payment could not be confirmed');
            setNotice({
              ok: true,
              text: `${(result.credits || pack.credits).toLocaleString()} credits added.${
                typeof result.balance === 'number' ? ` New balance: ${result.balance.toLocaleString()}.` : ''
              }`,
            });
            await refresh();
          } catch (error) {
            setNotice({ ok: false, text: error instanceof Error ? error.message : 'Payment could not be confirmed' });
          } finally {
            setBuying(null);
          }
        },
        modal: { ondismiss: () => setBuying(null) },
      });
      checkout.open();
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Checkout failed' });
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-48 animate-pulse" style={{ background: 'hsl(var(--secondary))', borderRadius: 'var(--radius)' }} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          Credits &amp; Billing
        </h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Manage your credits and purchase more for tool executions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-8"
        style={{ borderColor: 'hsl(var(--primary) / 0.3)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.12)' }}
          >
            <Coins className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Available Credits</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              {balance.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {notice && (
        <div
          className="mb-6 flex items-start gap-2 p-3 text-sm"
          style={{
            background: notice.ok ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--destructive) / 0.08)',
            border: `1px solid ${notice.ok ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--destructive) / 0.35)'}`,
            borderRadius: 'var(--radius)',
            color: notice.ok ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
          }}
        >
          {notice.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
          <span>{notice.text}</span>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Purchase Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {packs.map((pack, i) => (
          <motion.div
            key={pack.credits}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card relative p-5"
            style={pack.popular ? { borderColor: 'hsl(var(--primary))' } : undefined}
          >
            {pack.popular && (
              <span
                className="absolute -top-2 right-3 px-2 py-0.5 text-xs rounded-full"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Popular
              </span>
            )}
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pack.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>
              {pack.credits.toLocaleString()} <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>credits</span>
            </p>
            <p className="font-semibold mt-2" style={{ color: 'hsl(var(--primary))' }}>${pack.price.toFixed(2)}</p>
            {typeof pack.amountInr === 'number' && (
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Charged as Rs.{pack.amountInr.toLocaleString('en-IN')}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleBuy(pack)}
              disabled={buying !== null}
              className="mt-3 w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {buying === pack.credits ? 'Opening checkout...' : 'Buy Now'}
            </button>
          </motion.div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Transaction History</h2>
      {history.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((tx) => (
            <div key={tx.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: tx.type === 'credit' ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--destructive) / 0.12)' }}
                >
                  {tx.type === 'credit' ? (
                    <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  ) : (
                    <CreditCard className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{tx.description || tx.type}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: tx.type === 'credit' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                  {tx.type === 'credit' ? '+' : ''}{tx.amount}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Balance: {tx.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
