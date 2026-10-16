'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Zap, Coins, Play, Loader2, CheckCircle, AlertCircle,
  Copy, Check, Download, Plus, Trash2, FileText, Mail, Users, BarChart3, Share2, PenLine, Table2,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: number;
}

interface InvoiceItem {
  description: string;
  quantity: string;
  price: string;
}

interface ToolOutput {
  content?: string;
  wordCount?: number;
  topic?: string;
  posts?: { platform: string; content: string }[];
  scored?: number;
  leads?: { id: string; name: string; company: string; score: number; priority: string }[];
  message?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  viewUrl?: string;
  sent?: number;
  failed?: number;
  failures?: string[];
  hint?: string;
  dataset?: string;
  recordCount?: number;
  filename?: string;
  mime?: string;
}

interface ToolResult {
  success: boolean;
  output?: ToolOutput | null;
  error?: string;
  newBalance?: number;
}

const SLUG_ICONS: Record<string, typeof Zap> = {
  'ai-content-writer': PenLine,
  'social-media-generator': Share2,
  'lead-scoring-ai': BarChart3,
  'invoice-generator': FileText,
  'email-campaign-sender': Mail,
  'data-export': Table2,
};

const inputCls =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function ToolExecutePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // generic fields
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  // invoice fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: '1', price: '' }]);
  // email fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // export fields
  const [dataset, setDataset] = useState('customers');
  const [format, setFormat] = useState('csv');

  useEffect(() => {
    fetch(`/api/tools?slug=${slug}`)
      .then(res => res.json())
      .then(data => { setTool(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const buildInput = (): Record<string, unknown> => {
    switch (slug) {
      case 'invoice-generator':
        return {
          customerName,
          customerEmail,
          taxRate: Number(taxRate) || 18,
          items: items.map(it => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
          })),
        };
      case 'email-campaign-sender':
        return { subject, body: message };
      case 'data-export':
        return { dataset, format };
      case 'lead-scoring-ai':
        return {};
      default:
        return { topic, details };
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    setCopied(null);
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: slug, input: buildInput() })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadResult = () => {
    if (!result?.success || !result.output?.content) return;
    const blob = new Blob([result.output.content], { type: result.output.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.output.filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6"><div className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse" /></div>;
  }

  if (!tool) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Tool not found</h2>
        <button onClick={() => router.push('/tools')} className="mt-4 text-purple-600 hover:underline font-medium">Back to tools</button>
      </div>
    );
  }

  const Icon = SLUG_ICONS[slug] || Zap;
  const out = result?.output;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/tools')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>

      {/* Tool header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{tool.name}</h1>
            <p className="text-gray-500 text-sm">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Coins className="w-4 h-4 text-yellow-500" />
          Cost: <span className="font-semibold text-gray-700">{tool.creditCost} credits</span> per run
        </div>
      </motion.div>

      {/* Input form — per tool */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
        {(slug === 'ai-content-writer' || slug === 'social-media-generator' || (!SLUG_ICONS[slug])) && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Topic</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={slug === 'social-media-generator' ? 'e.g. Diwali sale for my clothing store' : 'e.g. Benefits of GST compliance for small businesses'}
                className={inputCls} />
            </div>
            {slug === 'ai-content-writer' && (
              <div>
                <label className={labelCls}>Additional details <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                  placeholder="Tone, audience, key points to cover..."
                  className={inputCls + ' resize-none'} />
              </div>
            )}
          </div>
        )}

        {slug === 'invoice-generator' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Reliance Retail Ltd" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Customer email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="billing@customer.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Items</label>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={it.description} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                      placeholder="Item description" className={inputCls + ' flex-1'} />
                    <div className="flex gap-2">
                      <input type="number" min="1" value={it.quantity} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                        placeholder="Qty" className={inputCls + ' w-20'} />
                      <input type="number" min="0" value={it.price} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                        placeholder="Price ₹" className={inputCls + ' w-28'} />
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-30" aria-label="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setItems([...items, { description: '', quantity: '1', price: '' }])}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                <Plus className="w-4 h-4" /> Add item
              </button>
            </div>
            <div className="w-full sm:w-40">
              <label className={labelCls}>GST rate %</label>
              <input type="number" min="0" max="28" value={taxRate} onChange={e => setTaxRate(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {slug === 'email-campaign-sender' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-700 flex items-start gap-2">
              <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
              This sends a real email to every customer in your CRM that has an email address.
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Domain verification required for full delivery</p>
                <p className="text-xs text-amber-700 mb-2">Without a verified domain, emails only deliver to your own account. Verify your domain at <a href="https://resend.com/domains" target="_blank" rel="noopener" className="underline font-medium">resend.com/domains</a> (5 min setup).</p>
                <ol className="text-xs text-amber-700 list-decimal list-inside space-y-1">
                  <li>Go to resend.com/domains → Add Domain</li>
                  <li>Add the DNS records shown (SPF, DKIM, DMARC)</li>
                  <li>Wait 5-10 minutes for verification</li>
                  <li>Set RESEND_FROM in your .env to your verified email</li>
                </ol>
              </div>
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New collection is live!" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Message *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
                placeholder="Write your email. It will be wrapped in a clean branded template." className={inputCls + ' resize-none'} />
            </div>
          </div>
        )}

        {slug === 'lead-scoring-ai' && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600 flex items-start gap-2">
            <BarChart3 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
            Scores all your CRM leads using source, status, contact info and recency — and saves the score on each lead. One click, no input needed.
          </div>
        )}

        {slug === 'data-export' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dataset</label>
              <select value={dataset} onChange={e => setDataset(e.target.value)} className={inputCls}>
                <option value="customers">Customers</option>
                <option value="leads">Leads</option>
                <option value="invoices">Invoices</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className={inputCls}>
                <option value="csv">CSV (Excel / Google Sheets)</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={executing}
          className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {executing ? 'Working...' : slug === 'lead-scoring-ai' ? 'Score My Leads' : 'Run Tool'}
        </button>
      </motion.div>

      {/* Result — human readable per tool */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border ${result.success ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <h3 className="font-semibold text-gray-900">{result.success ? 'Done' : 'Error'}</h3>
            {typeof result.newBalance === 'number' && (
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500" /> Balance: {result.newBalance}
              </span>
            )}
          </div>

          {result.error && <p className="text-red-600 text-sm">{result.error}</p>}

          {/* Content writer */}
          {result.success && slug === 'ai-content-writer' && out?.content && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{out.wordCount} words generated</span>
                <button onClick={() => copyText('article', out.content || '')} className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700">
                  {copied === 'article' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'article' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">{out.content}</div>
            </div>
          )}

          {/* Social generator */}
          {result.success && slug === 'social-media-generator' && Array.isArray(out?.posts) && (
            <div className="space-y-4">
              {out.posts.map((p: { platform: string; content: string }) => (
                <div key={p.platform} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">{p.platform}</span>
                    <button onClick={() => copyText(p.platform, p.content)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-600">
                      {copied === p.platform ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === p.platform ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Lead scoring */}
          {result.success && slug === 'lead-scoring-ai' && (
            out?.scored ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">{out.scored} leads scored and saved to CRM.</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(out.leads || []).map((l: { id: string; name: string; company: string; score: number; priority: string }) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        l.priority === 'High' ? 'bg-green-100 text-green-700' : l.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {l.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.name}</p>
                        {l.company && <p className="text-xs text-gray-500 truncate">{l.company}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        l.priority === 'High' ? 'bg-green-100 text-green-700' : l.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                      }`}>{l.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{out?.message}</p>
            )
          )}

          {/* Invoice */}
          {result.success && slug === 'invoice-generator' && out?.invoiceNumber && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-sm text-gray-600">Invoice created</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{out.invoiceNumber}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-gray-500">Subtotal</p><p className="font-semibold text-gray-900">₹{Number(out.subtotal).toLocaleString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">GST</p><p className="font-semibold text-gray-900">₹{Number(out.tax).toLocaleString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold text-green-700">₹{Number(out.total).toLocaleString('en-IN')}</p></div>
              </div>
              <button onClick={() => router.push(out.viewUrl || '/invoices')}
                className="mt-4 w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
                View in Invoices
              </button>
            </div>
          )}

          {/* Email campaign */}
          {result.success && slug === 'email-campaign-sender' && out && (
            <div>
              {out.message ? (
                <p className="text-sm text-gray-600">{out.message}</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Recipients</p><p className="font-bold text-gray-900">{out.total}</p></div>
                  <div className="p-3 bg-green-50 rounded-xl"><p className="text-xs text-green-600">Sent</p><p className="font-bold text-green-700">{out.sent}</p></div>
                  <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-600">Failed</p><p className="font-bold text-red-600">{out.failed}</p></div>
                </div>
              )}
              {out.hint && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">{out.hint}</p>}
              {Array.isArray(out.failures) && out.failures.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Failures:</p>
                  {out.failures.map((f: string, i: number) => <p key={i} className="text-xs text-red-500">{f}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Data export */}
          {result.success && slug === 'data-export' && out && (
            out.recordCount ? (
              <div className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-gray-900">{out.recordCount} {out.dataset} records ready</p>
                  <p className="text-xs text-gray-500">{out.filename}</p>
                </div>
                <button onClick={downloadResult}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{out.message}</p>
            )
          )}

          {/* Fallback for unstyled tools */}
          {result.success && !SLUG_ICONS[slug] && out != null && (
            <pre className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 overflow-auto max-h-64 whitespace-pre-wrap">
              {typeof out === 'string' ? out : JSON.stringify(out, null, 2)}
            </pre>
          )}
        </motion.div>
      )}
    </div>
  );
}
