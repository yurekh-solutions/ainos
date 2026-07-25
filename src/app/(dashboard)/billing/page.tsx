'use client';
// AINOS Studio — plans & billing. Razorpay checkout (one-time monthly orders),
// live usage meters and upgrade flow for the AI tool subscription business.
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap, Rocket, ShieldCheck, RefreshCw } from 'lucide-react';

interface PlanDef {
  id: 'free' | 'starter' | 'growth';
  name: string;
  priceInr: number;
  priceLabel: string;
  tagline: string;
  features: string[];
  limits: { toolRuns: number; websites: number };
  popular?: boolean;
}

interface BillingStatus {
  plan: 'free' | 'starter' | 'growth';
  periodEnd: string | null;
  usage: { toolRuns: number; websites: number };
  limits: { toolRuns: number; websites: number };
  plans: PlanDef[];
  paymentsEnabled: boolean;
  enforced: boolean;
  keyId: string | null;
}

interface RazorpayResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }

const PLAN_ICONS: Record<string, React.ElementType> = { free: Sparkles, starter: Zap, growth: Crown };

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/billing');
      if (res.ok) setStatus(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const upgrade = async (plan: PlanDef) => {
    if (!status || plan.id === 'free' || plan.id === status.plan) return;
    setMessage(null);
    setPaying(plan.id);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createOrder', plan: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Could not start checkout.' });
        return;
      }
      const ok = await loadRazorpayScript();
      if (!ok) { setMessage({ type: 'error', text: 'Could not load payment gateway. Check your connection.' }); return; }
      const Razorpay = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AINOS Studio by Yurekh',
        description: `${plan.name} plan — 1 month`,
        order_id: data.orderId,
        theme: { color: '#6d5df6' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/billing', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'verify', plan: plan.id, ...response }),
            });
            if (verifyRes.ok) {
              setMessage({ type: 'success', text: `You're on the ${plan.name} plan now. Enjoy!` });
              fetchStatus();
            } else {
              setMessage({ type: 'error', text: (await verifyRes.json()).error || 'Payment verification failed.' });
            }
          } catch { setMessage({ type: 'error', text: 'Payment verification failed. Contact support.' }); }
        },
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Something went wrong. Try again.' });
    } finally { setPaying(null); }
  };

  const meter = (label: string, used: number, limit: number) => {
    const unlimited = limit >= 100000;
    const pct = unlimited ? 8 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
      <div key={label}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{label}</span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{used} / {unlimited ? '∞' : limit} this month</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#f43f5e' : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }} />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Positioning header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white mb-4"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
            <Rocket className="w-3.5 h-3.5" /> AINOS STUDIO
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Your startup&apos;s marketing team, as software</h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Website, logo, brand kit, social content, SEO, emails and launch plans — generated in minutes by AINOS AI tools, not weeks by an agency.
          </p>
        </motion.div>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium text-center"
            style={message.type === 'success'
              ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
              : { background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>
            {message.text}
          </div>
        )}

        {/* Early-access banner — all tools free until billing is enforced */}
        {status && !status.enforced && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 px-5 py-4 rounded-2xl text-center"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <p className="text-sm font-bold" style={{ color: '#34d399' }}>🎉 Early access — every tool is fully free right now</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Unlimited AI tool runs and websites while we&apos;re in launch mode. The plans below show what pricing will look like when paid tiers go live.
            </p>
          </motion.div>
        )}

        {/* Current plan + usage */}
        {status && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Current plan</p>
                  <p className="font-bold capitalize" style={{ color: 'hsl(var(--foreground))' }}>{status.plan}
                    {status.periodEnd && <span className="text-xs font-normal ml-2" style={{ color: 'hsl(var(--muted-foreground))' }}>renews by {new Date(status.periodEnd).toLocaleDateString()}</span>}
                  </p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {meter('AI tool runs', status.usage.toolRuns, status.limits.toolRuns)}
                {meter('AI websites', status.usage.websites, status.limits.websites)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          </div>
        ) : status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {status.plans.map((plan, i) => {
              const Icon = PLAN_ICONS[plan.id] || Sparkles;
              const isCurrent = plan.id === status.plan;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-2xl p-6 relative flex flex-col"
                  style={plan.popular ? { border: '1px solid hsl(var(--primary) / 0.5)' } : undefined}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>MOST POPULAR</span>
                  )}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{plan.name}</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{plan.priceLabel}</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>{plan.tagline}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                        <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Current plan</div>
                  ) : plan.id === 'free' ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>Included forever</div>
                  ) : !status.enforced ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>Free during early access</div>
                  ) : (
                    <button onClick={() => upgrade(plan)} disabled={paying !== null}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                      {paying === plan.id ? 'Opening checkout…' : status.paymentsEnabled ? `Upgrade to ${plan.name}` : 'Contact team to upgrade'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Payments-not-live note */}
        {status && status.enforced && !status.paymentsEnabled && (
          <p className="text-xs text-center mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Online payments are being activated. To upgrade today, reach the Yurekh team via{' '}
            <a href="https://yurekh.com/contact" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'hsl(var(--primary))' }}>yurekh.com/contact</a> — your plan is enabled manually within hours.
          </p>
        )}

        {/* Value strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: '10 AI tools', body: 'Logo, brand kit, social, SEO, email, PR, launch plans, print creatives, QR & website builder.' },
            { title: 'Real deliverables', body: 'Download-ready copy, images, palettes and full websites — not just suggestions.' },
            { title: 'Humans on standby', body: 'One click hands any deliverable to the Yurekh team to take further.' },
          ].map((v) => (
            <div key={v.title} className="glass-card rounded-2xl p-5">
              <h4 className="text-sm font-bold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{v.title}</h4>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
