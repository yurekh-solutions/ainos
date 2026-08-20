'use client';
import { Calendar, Clock, ArrowLeft, Sparkles, BookOpen, Tag, Layers, ArrowRight, Share2 } from 'lucide-react';

interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  featuredImage: string | null; category: string | null; author: string | null;
  publishedAt: string | null; tags: string[] | null; createdAt: string;
}

interface RelatedPost {
  id: string; title: string; slug: string; excerpt: string | null;
  featuredImage: string | null; category: string | null;
  publishedAt: string | null; tags: string[] | null;
}

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-8 mb-3 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-10 mb-4 text-gray-900">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-10 mb-4 text-gray-900">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-purple-700">$1</code>')
    .replace(/^- (.*$)/gm, '<li class="ml-5 mb-2 text-gray-700 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-5 mb-2 text-gray-700 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed text-base">')
    .replace(/^(?!<[hluoc])(.*$)/gm, '<p class="mb-4 text-gray-700 leading-relaxed text-base">$1</p>')
    .replace(/<p class="mb-4[^"]*"><\/p>/g, '');
}

export default function BlogArticleClient({ post, relatedPosts }: { post: BlogPost; relatedPosts: RelatedPost[] }) {
  const wordCount = (post.content || '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.excerpt || '', url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/ainos/blog/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AINOS Blog</span>
            </a>
            <div className="flex items-center gap-4">
              <a href="/ainos/blog/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> All Articles
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Image */}
      {post.featuredImage && (
        <div className="relative w-full aspect-[21/9] max-h-[500px] overflow-hidden bg-gray-100">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 mb-3">
                {post.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                    {post.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Title & Meta */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-gray-500 leading-relaxed mb-6 border-l-4 border-purple-500 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readTime} min read
            </span>
            {post.category && (
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {post.category}
              </span>
            )}
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1.5 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </header>

        {/* Body */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || '') }}
        />

        {/* Tags */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-200">
            <Tag className="w-4 h-4 text-gray-400 mt-1" />
            {post.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author / CTA */}
        <div className="mt-10 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Powered by AINOS AI Blog Agent</h3>
              <p className="text-sm text-gray-600 mb-3">
                This article was generated and published using AINOS AI Blog Agent — the AI-powered content engine that researches, writes, and publishes SEO-optimized blog posts automatically.
              </p>
              <a
                href="/ainos/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Try AINOS Free <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <a
                key={rp.id}
                href={`/ainos/blog/${rp.slug}/`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                  {rp.featuredImage ? (
                    <img src={rp.featuredImage} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {rp.category && (
                    <span className="text-[10px] font-semibold text-purple-600 uppercase">{rp.category}</span>
                  )}
                  <h3 className="font-semibold text-sm text-gray-900 mt-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {rp.title}
                  </h3>
                  {rp.publishedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(rp.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">AINOS</span>
          </div>
          <p className="text-xs">AI-Powered Business Suite. Generate, publish & grow with SEO-optimized content.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="/ainos/blog/" className="text-xs hover:text-white transition-colors">Blog</a>
            <a href="/ainos/" className="text-xs hover:text-white transition-colors">Dashboard</a>
          </div>
          <p className="text-xs mt-4">&copy; {new Date().getFullYear()} AINOS Business Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
