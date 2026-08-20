'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Eye, Calendar, Sparkles, Wand2, Tag, Search, TrendingUp, Clock, Trash2, Edit3, CheckCircle, Send } from 'lucide-react';

interface BlogPost { id: string; title: string; slug: string; content: string; excerpt: string | null; status: string; author: string | null; publishedAt: string | null; tags: string[] | null; views?: number; createdAt: string; }
interface GeneratedPost { title: string; slug: string; excerpt: string; content: string; tags: string[]; }

const tones = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Technical', 'Conversational'];
const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Marketing', 'Manufacturing', 'SaaS', 'General Business'];
const lengths = [{ value: 'short', label: 'Short (400-500 words)' }, { value: 'medium', label: 'Medium (700-900 words)' }, { value: 'long', label: 'Long (1200-1500 words)' }];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showPreview, setShowPreview] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPost | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // AI Agent form
  const [aiForm, setAiForm] = useState({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/blog-posts?${params}`);
      if (res.ok) setPosts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]); // eslint-disable-line

  // AI Blog Generation
  const handleGenerate = async () => {
    if (!aiForm.topic.trim()) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch('/api/blog-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });
      if (res.ok) {
        const data = await res.json();
        setGenerated(data);
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  // Save generated post as draft
  const handleSaveDraft = async () => {
    if (!generated) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...generated, status: 'draft' }),
      });
      if (res.ok) {
        setGenerated(null);
        setShowAI(false);
        setAiForm({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  // Publish directly
  const handlePublish = async () => {
    if (!generated) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...generated, status: 'published', publishedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        setGenerated(null);
        setShowAI(false);
        setAiForm({ topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business' });
        fetchPosts();
      }
    } catch (e) { console.error(e); }
  };

  // Update post status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const data = status === 'published' ? { status, publishedAt: new Date().toISOString() } : { status };
      const res = await fetch(`/api/blog-posts?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  // Delete post
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`/api/blog-posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
    } catch (e) { console.error(e); }
  };

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const statusColors: Record<string, string> = { draft: 'bg-gray-400', published: 'bg-emerald-500', scheduled: 'bg-violet-500' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI Blog Agent</h1>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Generate SEO-optimized blog posts with AI & grow organic traffic</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowAI(true); setGenerated(null); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-colors">
              <Wand2 className="w-4 h-4" /> AI Generate Post
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total Posts', v: posts.length.toString(), c: 'text-purple-600 dark:text-purple-400', icon: FileText },
            { l: 'Published', v: posts.filter(p => p.status === 'published').length.toString(), c: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
            { l: 'Drafts', v: posts.filter(p => p.status === 'draft').length.toString(), c: 'text-amber-600 dark:text-amber-400', icon: Edit3 },
            { l: 'Total Views', v: totalViews.toLocaleString(), c: 'text-blue-600 dark:text-blue-400', icon: Eye },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.c}`} />
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.l}</p>
              </div>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Blog Posts Grid */}
        {loading ? <div className="text-center py-20 text-gray-500">Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300 dark:text-purple-700" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No blog posts yet</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Use AI to generate your first SEO-optimized blog post</p>
              <button onClick={() => { setShowAI(true); setGenerated(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors">
                Generate with AI
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold line-clamp-2 text-gray-900 dark:text-white pr-2">{post.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize flex-shrink-0 ${statusColors[post.status] || 'bg-gray-400'}`}>{post.status}</span>
                  </div>
                  {post.excerpt && <p className="text-xs line-clamp-2 mb-3 text-gray-500 dark:text-gray-400">{post.excerpt}</p>}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">{tag}</span>
                      ))}
                      {post.tags.length > 3 && <span className="text-[10px] text-gray-400">+{post.tags.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      {post.publishedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.max(1, Math.ceil((post.content || '').split(' ').length / 200))} min read</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setShowPreview(post)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Preview"><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
                      {post.status === 'draft' && (
                        <button onClick={() => handleUpdateStatus(post.id, 'published')} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Publish"><Send className="w-3.5 h-3.5 text-emerald-500" /></button>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {/* AI Blog Agent Modal */}
        <AnimatePresence>
          {showAI && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAI(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Blog Agent</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SEO-optimized content in seconds</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAI(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {!generated ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Blog Topic *</label>
                        <input value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                          placeholder="e.g., How AI is Transforming Small Business Operations"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SEO Keywords</label>
                        <input value={aiForm.keywords} onChange={e => setAiForm({ ...aiForm, keywords: e.target.value })}
                          placeholder="e.g., AI for business, small business automation, business tools"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tone</label>
                          <select value={aiForm.tone} onChange={e => setAiForm({ ...aiForm, tone: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
                            {tones.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Length</label>
                          <select value={aiForm.length} onChange={e => setAiForm({ ...aiForm, length: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
                            {lengths.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Industry</label>
                          <select value={aiForm.industry} onChange={e => setAiForm({ ...aiForm, industry: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500">
                            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                          </select>
                        </div>
                      </div>

                      <button onClick={handleGenerate} disabled={!aiForm.topic.trim() || generating}
                        className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4">
                        {generating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            AI is writing your blog post...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Generate SEO Blog Post
                          </>
                        )}
                      </button>

                      {generating && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">AI Blog Agent is working...</p>
                          </div>
                          <div className="space-y-1 text-[11px] text-purple-600/70 dark:text-purple-400/70">
                            <p>• Researching topic & keywords...</p>
                            <p>• Writing SEO-optimized content...</p>
                            <p>• Generating meta description & tags...</p>
                            <p>• Structuring with proper headings...</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Blog post generated successfully!</p>
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Review the content below and publish or save as draft</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
                        <input value={generated.title} onChange={e => setGenerated({ ...generated, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SEO Slug</label>
                        <input value={generated.slug} onChange={e => setGenerated({ ...generated, slug: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 font-mono focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Meta Description (SEO)</label>
                        <textarea value={generated.excerpt} onChange={e => setGenerated({ ...generated, excerpt: e.target.value })} rows={2}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none" />
                        <p className="text-[10px] text-gray-400 mt-1">{generated.excerpt.length}/160 characters</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Content (Markdown)</label>
                        <textarea value={generated.content} onChange={e => setGenerated({ ...generated, content: e.target.value })} rows={12}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 resize-y" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {generated.tags.map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Tag className="w-3 h-3" />{tag}
                              <button onClick={() => setGenerated({ ...generated, tags: generated.tags.filter((_, j) => j !== i) })} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                        <input placeholder="Add tag..." onKeyDown={e => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            e.preventDefault();
                            setGenerated({ ...generated, tags: [...generated.tags, (e.target as HTMLInputElement).value.trim()] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <button onClick={handleSaveDraft}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          Save as Draft
                        </button>
                        <button onClick={handlePublish}
                          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                          <Send className="w-4 h-4" /> Publish Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(null)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{showPreview.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white capitalize ${statusColors[showPreview.status]}`}>{showPreview.status}</span>
                        {showPreview.publishedAt && <span>{new Date(showPreview.publishedAt).toLocaleDateString()}</span>}
                        <span>{Math.max(1, Math.ceil((showPreview.content || '').split(' ').length / 200))} min read</span>
                      </div>
                    </div>
                    <button onClick={() => setShowPreview(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                </div>
                <div className="p-6">
                  {showPreview.excerpt && <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 italic border-l-4 border-purple-500 pl-4">{showPreview.excerpt}</p>}
                  <div className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {showPreview.content}
                  </div>
                  {showPreview.tags && Array.isArray(showPreview.tags) && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                      {showPreview.tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
