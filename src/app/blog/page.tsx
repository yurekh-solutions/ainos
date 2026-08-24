'use client';
import { useCallback, useEffect, useState } from 'react';
import { Search, Calendar, Clock, ArrowRight, Sparkles, BookOpen, Layers, ExternalLink, Rss } from 'lucide-react';

interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  featuredImage: string | null; category: string | null;
  publishedAt: string | null; tags: string[] | null; createdAt: string;
}

export default function PublicBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (search) params.set('search', search);
      const res = await fetch(`/api/blog-public?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setCategories(data.categories || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCategory, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]); // eslint-disable-line

  const allCategories = ['All', ...categories];
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/blog/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AINOS Blog</span>
            </a>
            <div className="flex items-center gap-4">
              <a href="/api/blog-rss" className="text-sm text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1" title="RSS Feed">
                <Rss className="w-4 h-4" /> RSS
              </a>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to AINOS
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              AI SEO Insights & Growth Strategies
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Expert guides on AI-powered SEO, content automation, and organic growth — written for businesses serious about search visibility.
            </p>
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setLoading(true); }}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-semibold text-gray-900 mb-1">No articles found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or browse all posts.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && !search && activeCategory === 'All' && (
              <a
                href={`/blog/${featured.slug}/`}
                className="group block mb-10 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-gray-100">
                    {featured.featuredImage ? (
                      <img
                        src={featured.featuredImage}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[250px]">
                        <BookOpen className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      {featured.category && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {featured.category}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Featured
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {featured.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.max(1, Math.ceil((featured.content || '').split(' ').length / 200))} min read
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:gap-2 transition-all">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(search || activeCategory !== 'All' ? posts : rest).map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}/`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[160px]">
                        <BookOpen className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    {post.category && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-600 mb-2">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    {/* Tags */}
                    {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Meta */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.max(1, Math.ceil((post.content || '').split(' ').length / 200))} min
                        </span>
                      </div>
                      <span className="text-xs font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Automate Your Content?
          </h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Generate SEO-optimized blog posts with AI, publish them with beautiful featured images, and drive organic traffic automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-white text-purple-700 hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/marketing/blog/"
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Open Blog Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AINOS</span>
          </div>
          <p className="text-xs">AI-Powered Business Suite. Generate, publish & grow with SEO-optimized content.</p>
          <p className="text-xs mt-2">&copy; {new Date().getFullYear()} AINOS Business Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
