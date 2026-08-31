'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Users, BarChart3, Zap,
  CheckCircle, AlertCircle, Loader2, Sparkles,
  FileText, Clock, Copy,
  Shield, Lightbulb
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'audit', label: 'Site Audit', icon: Shield },
  { id: 'keywords', label: 'Keyword Research', icon: Search },
  { id: 'competitors', label: 'Competitor Analysis', icon: Users },
  { id: 'content', label: 'Content Ideas', icon: Lightbulb },
];

export default function SEODashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [niche, setNiche] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const switchTab = (id: string) => { setActiveTab(id); setResult(null); };

  const showError = async (res: Response, fallback: string) => {
    const err = await res.json().catch(() => null);
    showToast((err && typeof err.error === 'string' && err.error) || fallback, 'error');
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo/overview');
      if (res.ok) setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'overview') fetchOverview(); }, [activeTab, fetchOverview]);

  const runAudit = async () => {
    if (!websiteUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo/site-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      if (res.ok) setResult(await res.json());
      else await showError(res, 'Audit failed');
    } catch (e) { console.error(e); showToast('Audit failed', 'error'); }
    finally { setLoading(false); }
  };

  const researchKeywords = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, niche }),
      });
      if (res.ok) setResult(await res.json());
      else await showError(res, 'Keyword research failed');
    } catch (e) { console.error(e); showToast('Keyword research failed', 'error'); }
    finally { setLoading(false); }
  };

  const analyzeCompetitor = async () => {
    if (!competitor.trim() || !websiteUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorUrl: competitor, yourUrl: websiteUrl }),
      });
      if (res.ok) setResult(await res.json());
      else await showError(res, 'Competitor analysis failed');
    } catch (e) { console.error(e); showToast('Competitor analysis failed', 'error'); }
    finally { setLoading(false); }
  };

  const generateContentIdeas = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, keyword }),
      });
      if (res.ok) setResult(await res.json());
      else await showError(res, 'Content ideas failed');
    } catch (e) { console.error(e); showToast('Content ideas failed', 'error'); }
    finally { setLoading(false); }
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      showToast('Copied to clipboard');
    } catch { showToast('Copy failed', 'error'); }
  };

  const auditChecks = Array.isArray(result?.checks)
    ? (result?.checks as Array<{ name: string; status: string; message: string; fix?: string }>)
    : null;
  const auditScore = typeof result?.score === 'number' ? result.score : null;
  const auditAI = (result?.aiSummary ?? null) as { summary?: string; priorities?: Array<{ title: string; why: string; how: string }> } | null;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">SEO & Content Marketing Platform</h1>
              <p className="text-sm mt-0.5 text-gray-600 dark:text-gray-400">Site audits, keyword research, competitor analysis & AI content ideas.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-purple-300'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { l: 'Connected Websites', v: result?.websites ?? '0', i: Globe, c: 'text-emerald-600' },
                    { l: 'Blog Posts', v: result?.posts ?? '0', i: FileText, c: 'text-blue-600' },
                    { l: 'Scheduled Posts', v: result?.schedules ?? '0', i: Clock, c: 'text-violet-600' },
                  ].map((s, i) => {
                    const Icon = s.i;
                    return (
                      <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${s.c}`} />
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{s.l}</p>
                        </div>
                        <p className={`text-2xl font-bold ${s.c}`}>{String(s.v)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { label: 'Run Site Audit', desc: 'Analyze on-page SEO issues', icon: Shield, action: () => setActiveTab('audit') },
                      { label: 'Research Keywords', desc: 'Find high-value keywords', icon: Search, action: () => setActiveTab('keywords') },
                      { label: 'Analyze Competitor', desc: 'Compare with competitors', icon: Users, action: () => setActiveTab('competitors') },
                      { label: 'Get Content Ideas', desc: 'AI-generated blog topics', icon: Lightbulb, action: () => setActiveTab('content') },
                    ].map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button key={i} onClick={a.action}
                          className="text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-800 transition-all">
                          <Icon className="w-5 h-5 text-purple-500 mb-2" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.label}</p>
                          <p className="text-xs text-gray-500">{a.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SITE AUDIT */}
            {activeTab === 'audit' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Site Audit</h3>
                <div className="flex gap-2 mb-6">
                  <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com"
                    className="flex-1 px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                  <button onClick={runAudit} disabled={loading || !websiteUrl.trim()}
                    className="px-5 py-3 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Run Audit
                  </button>
                </div>
                {auditChecks && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center">
                        <p className={`text-5xl font-extrabold ${auditScore !== null && auditScore >= 80 ? 'text-emerald-600' : auditScore !== null && auditScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{auditScore ?? '—'}</p>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">SEO Health Score</p>
                        <p className="text-[11px] text-gray-500 mt-1">{String(result?.techStack ?? '')} • {String(result?.wordCount ?? 0)} words</p>
                      </div>
                      <div className="lg:col-span-2 p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4" /> AINOS AI — What to fix first
                        </h4>
                        {auditAI ? (
                          <>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">{auditAI.summary}</p>
                            <div className="space-y-2">
                              {(auditAI.priorities ?? []).map((p, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">{i + 1}. {p.title}</p>
                                  <p className="text-[11px] text-gray-500">Why: {p.why}</p>
                                  <p className="text-[11px] text-purple-700 dark:text-purple-300">How: {p.how}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">AINOS AI summary unavailable right now — see the checks below.</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {auditChecks.map((check, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          {check.status === 'ok'
                            ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            : <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${check.status === 'error' ? 'text-red-500' : 'text-amber-500'}`} />}
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{check.name}</p>
                            <p className="text-xs text-gray-500">{check.message}</p>
                            {check.status !== 'ok' && check.fix && (
                              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1"><span className="font-semibold">Fix:</span> {check.fix}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!auditChecks && !loading && (
                  <p className="text-sm text-gray-500 text-center py-8">Enter your website URL to run a comprehensive SEO audit.</p>
                )}
              </div>
            )}

            {/* KEYWORDS */}
            {activeTab === 'keywords' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Keyword Research</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter seed keyword e.g. digital marketing"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                  <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche e.g. SaaS, Fashion, Healthcare"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                </div>
                <button onClick={researchKeywords} disabled={loading || !keyword.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Find High-Value Keywords
                </button>
                {Array.isArray(result?.keywords) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(result.keywords as Array<{ keyword: string; difficulty: string; volume: string; intent: string; cpc?: string; trend?: string }>).map((k, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{k.keyword}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            k.difficulty === 'Low' ? 'bg-emerald-100 text-emerald-700' : k.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{k.difficulty}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>Vol: {k.volume}</span>
                          <span>Intent: {k.intent}</span>
                          {k.cpc && <span>CPC: {k.cpc}</span>}
                          {k.trend && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              k.trend === 'trending' ? 'bg-emerald-100 text-emerald-700' : k.trend === 'seasonal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}>{k.trend}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COMPETITORS */}
            {activeTab === 'competitors' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Competitor Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Your website URL"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                  <input value={competitor} onChange={e => setCompetitor(e.target.value)} placeholder="Competitor website URL"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                </div>
                <button onClick={analyzeCompetitor} disabled={loading || !competitor.trim() || !websiteUrl.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Analyze Competitor
                </button>
                {typeof result?.analysis === 'string' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.analysis as string}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {([
                        { title: 'Competitor Strengths', items: result?.strengths, color: 'text-red-600' },
                        { title: 'Their Weaknesses', items: result?.weaknesses, color: 'text-emerald-600' },
                        { title: 'Your Opportunities', items: result?.opportunities, color: 'text-blue-600' },
                        { title: 'Keywords They Likely Rank For', items: result?.keywordsTheyRankFor, color: 'text-violet-600' },
                        { title: 'Content Gaps to Exploit', items: result?.contentGaps, color: 'text-amber-600' },
                        { title: 'Your Action Plan', items: result?.actionPlan, color: 'text-purple-600' },
                      ] as Array<{ title: string; items: unknown; color: string }>)
                        .filter(s => Array.isArray(s.items) && (s.items as unknown[]).length > 0)
                        .map((s, i) => (
                          <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${s.color}`}>{s.title}</p>
                            <ul className="space-y-1">
                              {(s.items as string[]).map((item, j) => <li key={j} className="text-xs text-gray-600 dark:text-gray-400">• {item}</li>)}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTENT IDEAS */}
            {activeTab === 'content' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">AI Content Ideas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                  <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Target keyword (optional)"
                    className="px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white" />
                </div>
                <button onClick={generateContentIdeas} disabled={loading || !niche.trim()}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  Generate Content Ideas
                </button>
                {Array.isArray(result?.ideas) && (
                  <div className="grid grid-cols-1 gap-3">
                    {(result.ideas as Array<{ title: string; type: string; keywords?: string[]; outline?: string[]; searchIntent?: string; estimatedReadTime?: string }>).map((idea, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{idea.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{idea.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{(idea.keywords ?? []).join(', ')}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {idea.searchIntent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{idea.searchIntent}</span>}
                          {idea.estimatedReadTime && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{idea.estimatedReadTime}</span>}
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {(idea.outline ?? []).map((o, j) => <li key={j}>• {o}</li>)}
                        </ul>
                        <button onClick={() => copyText(`${idea.title}\n\nTarget keywords: ${(idea.keywords ?? []).join(', ')}\n\nOutline:\n${(idea.outline ?? []).map(o => `- ${o}`).join('\n')}`)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700">
                          <Copy className="w-3 h-3" /> Copy idea brief
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
            style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
