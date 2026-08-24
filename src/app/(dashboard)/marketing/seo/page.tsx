'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, TrendingUp, Users, BarChart3, Zap, Target,
  CheckCircle, AlertCircle, Loader2, Sparkles, ChevronRight,
  MapPin, Linkedin, FileText, Clock, RefreshCw, Copy, Check,
  ExternalLink, Shield, Megaphone, Lightbulb
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'audit', label: 'Site Audit', icon: Shield },
  { id: 'keywords', label: 'Keyword Research', icon: Search },
  { id: 'competitors', label: 'Competitor Analysis', icon: Users },
  { id: 'content', label: 'Content Ideas', icon: Lightbulb },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'local', label: 'Local SEO', icon: MapPin },
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
      else showToast('Audit failed', 'error');
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
      else showToast('Keyword research failed', 'error');
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
      else showToast('Competitor analysis failed', 'error');
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
      else showToast('Content ideas failed', 'error');
    } catch (e) { console.error(e); showToast('Content ideas failed', 'error'); }
    finally { setLoading(false); }
  };

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
              <p className="text-sm mt-0.5 text-gray-600 dark:text-gray-400">Site audits, keyword research, competitor analysis, content ideas & LinkedIn scheduling.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l: 'Site Health Score', v: result?.siteHealth || '—', i: Shield, c: 'text-emerald-600' },
                    { l: 'Tracked Keywords', v: result?.trackedKeywords || '0', i: Target, c: 'text-blue-600' },
                    { l: 'Competitors', v: result?.competitors || '0', i: Users, c: 'text-violet-600' },
                    { l: 'Content Ideas', v: result?.contentIdeas || '0', i: Lightbulb, c: 'text-amber-600' },
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
                      { label: 'Schedule LinkedIn', desc: 'Plan LinkedIn posts', icon: Linkedin, action: () => setActiveTab('linkedin') },
                      { label: 'Local SEO', desc: 'Google Business Profile', icon: MapPin, action: () => setActiveTab('local') },
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
                {Array.isArray(result?.checks) && (
                  <div className="space-y-3">
                    {(result.checks as Array<{ name: string; status: string; message: string }>).map((check, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        {check.status === 'ok' ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{check.name}</p>
                          <p className="text-xs text-gray-500">{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!Array.isArray(result?.checks) && !loading && (
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
                    {(result.keywords as Array<{ keyword: string; difficulty: string; volume: string; intent: string }>).map((k, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{k.keyword}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            k.difficulty === 'Low' ? 'bg-emerald-100 text-emerald-700' : k.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>{k.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Vol: {k.volume}</span>
                          <span>Intent: {k.intent}</span>
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
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.analysis as string}</p>
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
                    {(result.ideas as Array<{ title: string; type: string; keywords: string[]; outline: string[] }>).map((idea, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{idea.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{idea.type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{idea.keywords.join(', ')}</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          {idea.outline.map((o, j) => <li key={j}>• {o}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LINKEDIN */}
            {activeTab === 'linkedin' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Linkedin className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">LinkedIn Composer & Scheduler</h3>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 text-center">
                  <Megaphone className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Coming Next</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">LinkedIn auto-scheduling with AI audience intelligence is being integrated. You can currently use the Social Media Caption Generator for LinkedIn posts.</p>
                </div>
              </div>
            )}

            {/* LOCAL SEO */}
            {activeTab === 'local' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Local SEO & Google Business Profile</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { l: 'Google Business Profile Integration', s: 'Coming soon' },
                    { l: 'Listing Tracking', s: 'Coming soon' },
                    { l: 'Review Analysis', s: 'Coming soon' },
                    { l: 'AI-Drafted Review Replies', s: 'Coming soon' },
                    { l: 'Geo-Grid Rank Tracking', s: 'Coming soon' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{f.l}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{f.s}</span>
                    </div>
                  ))}
                </div>
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
