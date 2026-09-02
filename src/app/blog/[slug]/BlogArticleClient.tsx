'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Calendar, Clock, ArrowLeft, Sparkles, BookOpen, Tag, Layers, ArrowRight, Share2, Linkedin, Twitter, Facebook, Copy, Check, List, ChevronRight, Mail, X, Volume2, VolumeX } from 'lucide-react';

interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  featuredImage: string | null; category: string | null; author: string | null;
  authorName: string | null; authorBio: string | null; authorImage: string | null;
  publishedAt: string | null; tags: string[] | null; createdAt: string;
}

interface RelatedPost {
  id: string; title: string; slug: string; excerpt: string | null;
  featuredImage: string | null; category: string | null;
  publishedAt: string | null; tags: string[] | null;
}

// Enhanced markdown to HTML converter with images, blockquotes, HR, code blocks
function renderMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm my-6"><code>$2</code></pre>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="w-full rounded-xl my-6 shadow-md" loading="lazy" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50 rounded-r-lg text-gray-700 italic">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    .replace(/^### (.*$)/gm, '<h3 id="$1" class="text-lg font-bold mt-8 mb-3 text-gray-900">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 id="$1" class="text-xl font-bold mt-10 mb-4 text-gray-900 scroll-mt-20">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-10 mb-4 text-gray-900">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-purple-700">$1</code>')
    .replace(/^- (.*$)/gm, '<li class="ml-5 mb-2 text-gray-700 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-5 mb-2 text-gray-700 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed text-base">')
    .replace(/^(?!<[hluocbipr])(.*$)/gm, '<p class="mb-4 text-gray-700 leading-relaxed text-base">$1</p>')
    .replace(/<p class="mb-4[^"]*"><\/p>/g, '');
}

// Extract H2 headings for Table of Contents
function extractTOC(md: string): { id: string; text: string }[] {
  const matches = md.match(/^## (.+)$/gm);
  if (!matches) return [];
  return matches.map(m => {
    const text = m.replace(/^## /, '').trim();
    const id = text;
    return { id, text };
  }).filter(t => t.text.length > 0 && !/^(table of contents|faq|frequently asked)/i.test(t.text));
}

// Inject mid-content CTA after 3rd H2 heading
function injectCTAs(md: string, websiteName?: string): string {
  const cta = `\n\n> **Need help with this?** Let our AI handle it for you. [Get started with AINOS](/) and automate your content, SEO, and social media — all in one platform.\n\n`;
  const parts = md.split(/^(## .+)$/gm);
  let h2Count = 0;
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i]);
    if (/^## /.test(parts[i])) {
      h2Count++;
      if (h2Count === 3) {
        result.push(cta);
      }
    }
  }
  return result.join('');
}

// Generate social share URLs
function getShareUrls(title: string, url: string): Record<string, string> {
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title.substring(0, 120));
  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    whatsapp: `https://wa.me/?text=${text}%20${encoded}`,
  };
}

export default function BlogArticleClient({ post, relatedPosts }: { post: BlogPost; relatedPosts: RelatedPost[] }) {
  const wordCount = (post.content || '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toc = useMemo(() => extractTOC(post.content || ''), [post.content]);
  const contentWithCTAs = useMemo(() => injectCTAs(post.content || ''), [post.content]);
  const shareUrls = useMemo(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return getShareUrls(post.title, url);
  }, [post.title]);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post.title, text: post.excerpt || '', url: window.location.href });
    } else {
      await handleCopyLink();
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      // In production: POST /api/newsletter/subscribe
      console.log('[Newsletter] Subscribe:', email);
    }
  };

  // AI Audio Blog - Text-to-Speech using browser SpeechSynthesis
  const toggleAudio = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Strip markdown for clean audio
    const plainText = post.content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/`{1,3}.*?`{1,3}/g, '')
      .replace(/\n{2,}/g, '. ')
      .substring(0, 5000); // Limit for performance

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to get a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Woman') || v.name.includes('Samantha'))
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [isPlaying, post.content]);

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-1 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/blog/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AINOS Blog</span>
            </a>
            <div className="flex items-center gap-3">
              {/* Audio Player */}
              <button
                onClick={toggleAudio}
                className={`text-sm transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full ${
                  isPlaying 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
                aria-label={isPlaying ? 'Stop audio' : 'Listen to article'}
              >
                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isPlaying ? 'Stop' : 'Listen'}</span>
              </button>
              {/* TOC Toggle */}
              {toc.length > 3 && (
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors flex items-center gap-1"
                  aria-label="Table of contents"
                >
                  <List className="w-4 h-4" /> <span className="hidden sm:inline">Contents</span>
                </button>
              )}
              <a href="/blog/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> All Articles
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Table of Contents Dropdown */}
      {showToc && toc.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl mx-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-5 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <List className="w-4 h-4 text-purple-600" /> Table of Contents
              </h3>
              <button onClick={() => setShowToc(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <ol className="space-y-1.5">
              {toc.map((item, i) => (
                <li key={i}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setShowToc(false)}
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors flex items-start gap-2 py-1"
                  >
                    <span className="text-purple-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

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
          {/* Social Share Buttons */}
          <div className="flex items-center gap-2">
            <a href={shareUrls.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" aria-label="Share on LinkedIn"><Linkedin className="w-4 h-4" /></a>
            <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors" aria-label="Share on Twitter"><Twitter className="w-4 h-4" /></a>
            <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors" aria-label="Share on Facebook"><Facebook className="w-4 h-4" /></a>
            <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors" aria-label="Share on WhatsApp"><Share2 className="w-4 h-4" /></a>
            <button onClick={handleCopyLink} className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Copy link">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          </div>
        </header>

        {/* Body */}
        <div
          ref={articleRef}
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(contentWithCTAs) }}
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

        {/* Newsletter Signup */}
        {showNewsletter && (
          <div className="mt-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-center relative">
            <button onClick={() => setShowNewsletter(false)} className="absolute top-3 right-3 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
            <Mail className="w-8 h-8 text-white/80 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Get weekly SEO & growth tips</h3>
            <p className="text-sm text-white/70 mb-4">Join 5,000+ business owners getting actionable insights every Thursday.</p>
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-white font-semibold">
                <Check className="w-5 h-5 text-green-300" /> You&apos;re in! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-white text-purple-700 text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </form>
            )}
          </div>
        )}

        {/* Author Bio */}
        {post.authorName && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              {post.authorImage ? (
                <img src={post.authorImage} alt={post.authorName} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{post.authorName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{post.authorName}</h3>
                {post.authorBio && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{post.authorBio}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readTime} min read
                  </span>
                </div>
              </div>
            </div>
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
                href="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Get Started with AINOS <ArrowRight className="w-4 h-4" />
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
                href={`/blog/${rp.slug}/`}
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
            <a href="/blog/" className="text-xs hover:text-white transition-colors">Blog</a>
            <a href="/" className="text-xs hover:text-white transition-colors">Dashboard</a>
          </div>
          <p className="text-xs mt-4">&copy; {new Date().getFullYear()} AINOS Business Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
