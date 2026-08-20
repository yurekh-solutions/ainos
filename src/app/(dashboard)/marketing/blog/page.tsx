'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Eye, Calendar, Sparkles, Wand2, Search,
  Clock, Trash2, Edit3, CheckCircle, Send, ArrowLeft,
  BookOpen, Layers
} from 'lucide-react';

interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  status: string; author: string | null; featuredImage: string | null;
  category: string | null; publishedAt: string | null;
  tags: string[] | null; views?: number; createdAt: string;
}
interface GeneratedPost {
  title: string; slug: string; excerpt: string; content: string;
  tags: string[]; category: string; featuredImage: string;
}

const tones = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Technical', 'Conversational'];
const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Real Estate', 'Marketing', 'Manufacturing', 'SaaS', 'General Business'];
const lengths = [
  { value: 'short', label: 'Short (400-500 words)' },
  { value: 'medium', label: 'Medium (700-900 words)' },
  { value: 'long', label: 'Long (1200-1500 words)' }
];

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900 dark:text-white">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-white">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-gray-700 dark:text-gray-300">• $1</li>')
    .replace(/^(?!<)(.*$)/gm, '<p class="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>')
    .replace(/<p class="mb-3.*?><\/p>/g, '');
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showReader, setShowReader] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPost | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');

  const [aiForm, setAiForm] = useState({
    topic: '', keywords: '', tone: 'Professional', length: 'medium', industry: 'General Business'
  });

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (activeCategory !== 'All') params.set('category', activeCategory);
      const res = await fetch(`/api/blog-posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setCategories(data.categories || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, activeCategory]);

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

  // Save as draft
  const handleSaveDraft = async () => {
    if (!generated) return;
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...generated, status: 'draft' }),
      });
      if (res.ok) {
        setGenerated(null); setShowAI(false);
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
        setGenerated(null); setShowAI(false);
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
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
      || (p.excerpt || '').toLowerCase().includes(search.toLowerCase())
      || (p.category || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  // All categories for tabs
  const allCategories = ['All', ...categories];

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 dark:from-purple-900 dark:via-violet-900 dark:to-indigo-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative px-6 py-10 md:px-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white/80">AI Blog Agent</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                AI SEO Insights & Growth Strategies
              </h1>
              <p className="text-base text-white/70 max-w-xl">
                Generate SEO-optimized blog posts with AI, publish them with beautiful featured images, and drive organic traffic.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowAI(true); setGenerated(null); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 transition-all shadow-lg">
                <Wand2 className="w-4 h-4" /> Generate with AI
              </motion.button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Total Posts', value: posts.length, icon: FileText },
              { label: 'Published', value: publishedCount, icon: CheckCircle },
              { label: 'Drafts', value: draftCount, icon: Edit3 },
              { label: 'Total Views', value: totalViews, icon: Eye },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-xs text-white/60">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 md:px-10 max-w-[1400px] mx-auto">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm">
            <option value="">All Status</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-purple-300 hover:text-purple-600'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No articles found</p>
            <p className="text-sm text-gray-500 mb-6">Try adjusting your search or generate your first AI blog post</p>
            <button onClick={() => { setShowAI(true); setGenerated(null); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.article key={post.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 cursor-pointer"
                onClick={() => setShowReader(post)}>
                {/* Featured Image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20">
                  {post.featuredImage ? (
                    <img src={post.featuredImage} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-purple-300 dark:text-purple-700" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide ${
                      post.status === 'published' ? 'bg-emerald-500' : post.status === 'draft' ? 'bg-amber-500' : 'bg-violet-500'
                    }`}>{post.status}</span>
                  </div>
                  {/* Category Badge */}
                  {post.category && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-gray-900/90 text-purple-700 dark:text-purple-300 backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
                  )}
                  {/* Tags */}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 3).map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-md text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{Math.max(1, Math.ceil((post.content || '').split(' ').length / 200))} min
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {post.status === 'draft' && (
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(post.id, 'published'); }}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Publish">
                          <Send className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !generating && setShowAI(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Blog Agent</h2>
                      <p className="text-xs text-gray-500">Research, write & publish SEO-optimized content</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAI(false)} disabled={generating}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {!generated ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Blog Topic *</label>
                      <input value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                        placeholder="e.g., How AI is Transforming Small Business Operations in 2025"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">SEO Keywords</label>
                      <input value={aiForm.keywords} onChange={e => setAiForm({ ...aiForm, keywords: e.target.value })}
                        placeholder="e.g., AI for business, small business automation, business tools"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tone</label>
                        <select value={aiForm.tone} onChange={e => setAiForm({ ...aiForm, tone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Length</label>
                        <select value={aiForm.length} onChange={e => setAiForm({ ...aiForm, length: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {lengths.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Industry</label>
                        <select value={aiForm.industry} onChange={e => setAiForm({ ...aiForm, industry: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                      </div>
                    </div>

                    <button onClick={handleGenerate} disabled={!aiForm.topic.trim() || generating}
                      className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20 mt-2">
                      {generating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          AI is researching & writing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Generate SEO Blog Post
                        </>
                      )}
                    </button>

                    {generating && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Blog Agent is working...</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-purple-600/70 dark:text-purple-400/70">
                          <p>• Researching topic & analyzing keywords...</p>
                          <p>• Writing SEO-optimized content with headings...</p>
                          <p>• Generating featured image...</p>
                          <p>• Creating meta description & tags...</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Success banner */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Blog post generated successfully!</p>
                      </div>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Review and edit below, then publish or save as draft</p>
                    </div>

                    {/* Featured Image Preview */}
                    {generated.featuredImage && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Featured Image</label>
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img src={generated.featuredImage} alt="Generated" className="w-full aspect-[16/9] object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                      <input value={generated.title} onChange={e => setGenerated({ ...generated, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
                        <input value={generated.slug} onChange={e => setGenerated({ ...generated, slug: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                        <input value={generated.category || ''} onChange={e => setGenerated({ ...generated, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meta Description (SEO)</label>
                      <textarea value={generated.excerpt} onChange={e => setGenerated({ ...generated, excerpt: e.target.value })} rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none" />
                      <p className="text-[10px] text-gray-400 mt-1">{generated.excerpt.length}/160 characters</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Content (Markdown)</label>
                      <textarea value={generated.content} onChange={e => setGenerated({ ...generated, content: e.target.value })} rows={10}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-y" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {generated.tags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            #{tag}
                            <button onClick={() => setGenerated({ ...generated, tags: generated.tags.filter((_, j) => j !== i) })}
                              className="hover:text-red-500"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input placeholder="Add tag and press Enter..." onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          e.preventDefault();
                          setGenerated({ ...generated, tags: [...generated.tags, (e.target as HTMLInputElement).value.trim()] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }} className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <button onClick={handleSaveDraft}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Save as Draft
                      </button>
                      <button onClick={handlePublish}
                        className="flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
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

      {/* Blog Reader Modal (Article View) */}
      <AnimatePresence>
        {showReader && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto"
            onClick={() => setShowReader(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 w-full max-w-4xl my-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden mx-4">
            {/* Article Header Image */}
            {showReader.featuredImage && (
              <div className="relative aspect-[21/9] overflow-hidden">
                <img src={showReader.featuredImage} alt={showReader.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { const el = e.target as HTMLImageElement; if (el.parentElement) el.parentElement.style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    {showReader.category && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                        {showReader.category}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      showReader.status === 'published' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                    }`}>{showReader.status}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Article Content */}
            <div className="p-8">
              {/* Title & Meta */}
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{showReader.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {showReader.publishedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(showReader.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {Math.max(1, Math.ceil((showReader.content || '').split(' ').length / 200))} min read
                  </span>
                  {showReader.category && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />{showReader.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              {showReader.excerpt && (
                <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border-l-4 border-purple-500">
                  <p className="text-sm text-purple-800 dark:text-purple-200 italic leading-relaxed">{showReader.excerpt}</p>
                </div>
              )}

              {/* Body */}
              <div className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(showReader.content || '') }} />

              {/* Tags */}
              {showReader.tags && Array.isArray(showReader.tags) && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                  {showReader.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button onClick={() => setShowReader(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to articles
                </button>
                <div className="flex items-center gap-2">
                  {showReader.status === 'draft' && (
                    <button onClick={() => { handleUpdateStatus(showReader.id, 'published'); setShowReader(null); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                  <button onClick={() => { handleDelete(showReader.id); setShowReader(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
