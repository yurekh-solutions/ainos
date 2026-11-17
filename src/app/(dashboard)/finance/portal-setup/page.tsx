'use client';

// Government portals — one-time setup of the taxpayer's own API credentials.
// AINOS calls the government e-way bill API with THESE credentials, so there
// is no middleman and no per-call billing. Registration steps are shown inline.

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, CheckCircle2, XCircle, Trash2, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';
import { PageHeader, WidgetHeader } from '@/components/dashboard/kit';

interface CredentialRow {
  id: string;
  portal: string;
  gstin: string;
  username: string;
  clientId: string | null;
  verified: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestMessage: string | null;
}

const emptyForm = { gstin: '', username: '', password: '', clientId: '', clientSecret: '' };

export default function PortalSetupPage() {
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/finance/portal-credentials');
    const json = await res.json();
    setRows(json.credentials || []);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (test: boolean) => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/finance/portal-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, portal: 'EWB', action: test ? 'test' : 'save' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice({ ok: false, text: json.error || 'Could not save credentials' });
      } else {
        setNotice({ ok: true, text: test && json.testResult ? json.testResult.message : 'Credentials saved' });
        if (test && json.testResult && !json.testResult.ok) setNotice({ ok: false, text: json.testResult.message });
        setForm({ ...emptyForm });
        setShowForm(false);
        await load();
      }
    } catch {
      setNotice({ ok: false, text: 'Network error while saving' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/finance/portal-credentials?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <PageHeader
        title="Government portals"
        subtitle="Connect your own e-way bill API account — bills generate directly, no middleman."
      />

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <WidgetHeader
          title="How the one-time setup works"
          subtitle="About five minutes, once per GSTIN"
        />
        <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-1.5">
          <li>Open <span className="font-medium text-gray-900">ewaybillgst.gov.in</span> → Registration → <span className="font-medium text-gray-900">API</span>, and register with your GSTIN.</li>
          <li>The portal gives you a <span className="font-medium text-gray-900">username, password, client-id and client-secret</span>.</li>
          <li>Paste them below and press <span className="font-medium text-gray-900">Save &amp; test</span> — we verify them with the portal right away.</li>
          <li>From then on, delivery challans can generate real e-way bills in one click.</li>
        </ol>
        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Credentials are stored for your company only and are never shown again after saving.
        </p>
      </section>

      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {notice.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <WidgetHeader
          title="Connected accounts"
          subtitle={loaded ? (rows.length ? `${rows.length} connected` : 'None connected yet') : 'Loading…'}
        />
        {loaded && rows.length === 0 && (
          <div className="py-8 text-center">
            <KeyRound className="w-8 h-8 mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-700">No portal accounts connected</p>
            <p className="mt-1 text-xs text-gray-500">Add your e-way bill API credentials to generate bills directly from AINOS.</p>
          </div>
        )}
        {rows.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{r.gstin}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.portal}</span>
                    {r.verified ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Not verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">User: {r.username} · client-id: {r.clientId || '—'}</p>
                  {r.lastTestMessage && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.lastTestMessage}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                  aria-label={`Remove ${r.gstin}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showForm ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <WidgetHeader title="Add E-Way Bill credentials" subtitle="Exactly what the portal gave you at Registration → API" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['gstin', 'GSTIN (15 characters)'],
              ['username', 'Portal username'],
              ['password', 'Portal password'],
              ['clientId', 'Client ID'],
              ['clientSecret', 'Client Secret'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold text-gray-600">{label}</span>
                <input
                  type={key === 'password' || key === 'clientSecret' ? 'password' : 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c4b0f0] focus:border-transparent"
                  placeholder={key === 'gstin' ? '27AAACS1234A1Z5' : ''}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => save(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4c1d95] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5b21b6] transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Save &amp; test
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => save(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Save only
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ ...emptyForm }); }}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-semibold text-[#4c1d95] hover:bg-[#f3ecfe] hover:border-[#c4b0f0] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Add E-Way Bill credentials
        </button>
      )}
    </div>
  );
}
