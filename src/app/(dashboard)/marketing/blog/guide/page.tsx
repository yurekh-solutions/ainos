'use client';
import { useState } from 'react';
import { ArrowLeft, Copy, Check, ExternalLink, Code, Globe, Zap, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    id: 'connect',
    num: 1,
    title: 'Connect Your Website',
    icon: Globe,
    content: `Open your AINOS dashboard and go to Marketing \u2192 Blog & Content.\n\nYou will see a \u201cConnect Website\u201d button at the top right. Click it.\n\nA popup appears asking for your Website URL. Enter the full URL including https:// (for example: https://yourbusiness.com).\n\nYou can also optionally fill in:\n  \u2022 Website Name \u2014 your brand or business name\n  \u2022 Description \u2014 a short line about your business\n  \u2022 Tech Stack \u2014 what platform your site is built on (WordPress, Shopify, etc.)\n  \u2022 Niche \u2014 your industry (e.g. Real Estate, Healthcare, E-commerce)\n  \u2022 Publish Method \u2014 how blogs will appear on your site (Embed is recommended)\n\nClick \u201cConnect\u201d. AINOS will crawl your website and automatically detect your industry, brand voice, and target audience. This takes 10\u201315 seconds.\n\nOnce done, your website card appears showing your niche, total blogs, and subscription info.\n\nImportant: One website per AINOS account. To switch websites, disconnect the current one first by clicking the \u201cDisconnect\u201d button on the website card.`,
  },
  {
    id: 'embed',
    num: 2,
    title: 'Add the Embed Code',
    icon: Code,
    content: `After connecting, you will see an embed code box on your website card in the dashboard. Click \u201cCopy Code\u201d to copy it.\n\nNow paste this code on your website just before the closing </body> tag. The code has two lines:\n\n  Line 1: <script> tag \u2014 loads the AINOS blog engine\n  Line 2: <div> tag \u2014 tells AINOS where to show blogs on your page\n\nReplace YOUR_WEBSITE_URL in the code with your actual website URL (the same one you connected in Step 1).\n\nChoose your platform below for exact instructions:`,
    code: `<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog" data-limit="6" data-site="YOUR_WEBSITE_URL"></div>`,
    platforms: [
      {
        name: 'WordPress',
        steps: [
          'Go to Appearance → Theme File Editor',
          'Open footer.php (or theme.liquid)',
          'Paste the code just before </body>',
          'Click Update File',
        ],
      },
      {
        name: 'Shopify',
        steps: [
          'Go to Online Store → Themes',
          'Click Actions → Edit Code',
          'Open theme.liquid under Layout',
          'Paste the code just before </body>',
          'Click Save',
        ],
      },
      {
        name: 'Custom HTML Website',
        steps: [
          'Open your main HTML file (index.html)',
          'Find the closing </body> tag',
          'Paste the code just before it',
          'Save and upload the file',
        ],
      },
      {
        name: 'Wix',
        steps: [
          'Go to Settings → Advanced → Custom Code',
          'Click Add Custom Code',
          'Paste the code in the body section',
          'Set placement to "Before </body>"',
          'Click Apply',
        ],
      },
      {
        name: 'Squarespace',
        steps: [
          'Go to Settings → Advanced → Code Injection',
          'Paste the code in the Footer section',
          'Click Save',
        ],
      },
      {
        name: 'React / Next.js',
        steps: [
          'Open your layout file (layout.tsx or App.jsx)',
          'Add the script tag in the <head> or before </body>',
          'Add the <div id="ainos-blog"> where you want blogs to appear',
          'Save and deploy',
        ],
      },
    ],
  },
  {
    id: 'verify',
    num: 3,
    title: 'AINOS Detects Your Integration',
    icon: Zap,
    content: `Once the embed code is live on your website, visit your website in a browser. The moment the page loads, the embed script sends a signal to AINOS.\n\nGo back to your AINOS dashboard and refresh the Blog page. You will see a green \u201cWidget Live\u201d badge on your website card.\n\nThis means:\n  \u2705 AINOS knows your website is ready\n  \u2705 Blog generation starts automatically\n  \u2705 New blogs will appear on your site within minutes\n\nIf you still see \u201cWidget Not Integrated\u201d (amber badge):\n  \u2022 Make sure the embed code is pasted correctly (copy it fresh from the dashboard)\n  \u2022 Make sure you replaced YOUR_WEBSITE_URL with your actual URL\n  \u2022 Clear your browser cache and reload your website\n  \u2022 Wait 1\u20132 minutes and refresh the AINOS dashboard`,
  },
  {
    id: 'blogs',
    num: 4,
    title: 'Blogs Start Appearing',
    icon: CheckCircle,
    content: `Once integration is confirmed, AINOS starts generating blogs automatically. Here\u2019s what happens:\n\n  \u2022 1 fresh, SEO-optimized blog article is created every day\n  \u2022 Each blog gets its own page URL on your website:\n      yourbusiness.com/blog/article-title\n  \u2022 Blogs are written in your brand voice, matching your niche\n  \u2022 Each blog includes a featured image, headings, FAQ section, and call-to-action\n  \u2022 JSON-LD schema is added automatically so Google can find and rank your blogs\n\nYou can see all blogs (pending, generating, published) in your AINOS dashboard under Marketing \u2192 Blog & Content.\n\nAuto Cleanup: Blogs older than 7 days are automatically removed from your website. This ensures your site always shows fresh, relevant content. New blogs keep coming every day.\n\nYou don\u2019t need to do anything after setup. AINOS handles everything \u2014 writing, publishing, images, SEO, and cleanup.`,
  },
];

const CUSTOMIZATION = [
  { attr: 'data-limit', default: '6', desc: 'Number of blogs to show (3, 6, 9, 12)' },
  { attr: 'data-style', default: 'grid', desc: 'Layout: "grid" (cards) or "list" (rows)' },
  { attr: 'data-routing', default: 'hash', desc: '"hash" (works everywhere) or "path" (needs server rewrite rule for /blog/* URLs)' },
  { attr: 'data-path', default: 'blog', desc: 'URL prefix for blog pages (e.g., "articles" \u2192 /#/articles/slug)' },
  { attr: 'data-site', default: 'auto', desc: 'Your website URL for tenant isolation' },
  { attr: 'data-color', default: 'auto', desc: 'Accent color hex code (e.g., #7c3aed)' },
  { attr: 'data-theme', default: 'auto', desc: '"light" or "dark" \u2014 auto-detected from your site' },
  { attr: 'data-card-radius', default: '16', desc: 'Card corner roundness in px (0, 8, 12, 16, 24)' },
  { attr: 'data-show-tags', default: 'true', desc: 'Show/hide blog tags' },
  { attr: 'data-show-category', default: 'true', desc: 'Show/hide category badge' },
];

export default function BlogIntegrationGuide() {
  const router = useRouter();
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog" data-limit="6" data-site="https://yourbusiness.com"></div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Blog Integration Guide</h1>
            <p className="text-xs text-gray-500">Set up AINOS blogs on your website in 4 steps</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Summary Banner */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20">
          <h2 className="text-xl font-bold mb-2">Get AINOS Blogs on Your Website</h2>
          <p className="text-sm text-purple-100 leading-relaxed mb-4">
            AINOS writes and publishes SEO-optimized blog articles on your website automatically. Every day, one fresh blog post appears. No writing, no posting, no work from your side. Just 4 simple steps below.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {['Connect', 'Embed', 'Verify', 'Blogs Live'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                <span className="text-[10px] text-purple-200 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What You Need */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Before You Start
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { need: 'Your website URL', detail: 'The full link including https:// (e.g. https://yourbusiness.com)' },
                { need: 'Access to edit your website', detail: 'You or your developer should be able to paste code on your site' },
                { need: 'An active AINOS account', detail: 'You\u2019re already logged in — you\u2019re good to go!' },
                { need: '5 minutes of time', detail: 'That\u2019s all it takes to set up everything' },
              ].map((item) => (
                <div key={item.need} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.need}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              {/* Step Header */}
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                    <span className="text-white font-bold text-lg">{step.num}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Step {step.num} of 4</p>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-5 sm:p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{step.content}</p>

                {/* Code Block */}
                {step.code && (
                  <div className="mt-4 relative">
                    <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre">{step.code}</pre>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium transition-colors"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
                    </button>
                  </div>
                )}

                {/* Platform Instructions */}
                {step.platforms && (
                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform-specific instructions:</p>
                    {step.platforms.map((platform) => (
                      <div key={platform.name} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenPlatform(openPlatform === platform.name ? null : platform.name)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{platform.name}</span>
                          {openPlatform === platform.name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {openPlatform === platform.name && (
                          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                            <ol className="mt-3 space-y-2">
                              {platform.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                  {s}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Customization Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-600" /> Embed Code Options
            </h2>
            <p className="text-xs text-gray-500 mt-1">Customize the blog widget with these data attributes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Attribute</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Default</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {CUSTOMIZATION.map((item) => (
                  <tr key={item.attr} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="px-5 py-3">
                      <code className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs font-mono">{item.attr}</code>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-gray-500 text-xs font-mono">{item.default}</code>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Example: Fully Customized</h2>
          </div>
          <div className="p-5 sm:p-6">
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre">{`<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog"
     data-limit="6"
     data-style="grid"
     data-routing="hash"
     data-path="blog"
     data-site="https://yourbusiness.com"
     data-color="#7c3aed"
     data-theme="light"
     data-card-radius="16"
     data-show-tags="true"
     data-show-category="true">
</div>`}</pre>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              Replace <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">https://yourbusiness.com</code> with your actual website URL.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick FAQ</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {[
              { q: 'Where exactly do I paste the code?', a: 'Just before the closing </body> tag in your website\'s HTML. This ensures the blog widget loads after all your content.' },
              { q: 'Will this slow down my website?', a: 'No. The embed script is lightweight (~15KB) and loads asynchronously. It won\'t affect your page speed.' },
              { q: 'What if I already have a blog section?', a: 'AINOS automatically detects existing blog sections and replaces them with its own powered section. Your old content stays safe.' },
              { q: 'How many blogs will show?', a: 'By default 6. Change data-limit to show more or fewer (3, 6, 9, 12, etc.).' },
              { q: 'Do blog pages help with SEO?', a: 'Yes! Each blog gets its own URL (yourbusiness.com/blog/slug) with JSON-LD schema, meta tags, and proper headings — all Google-friendly.' },
              { q: 'What happens to old blogs?', a: 'Blogs older than 7 days are automatically removed. This keeps your website always fresh with new content.' },
              { q: 'Can I use this on multiple websites?', a: 'Each AINOS account supports one website. To switch, disconnect the current one and connect a new one.' },
            ].map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{faq.q}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Need Help CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-center shadow-lg">
          <h3 className="text-lg font-bold text-white mb-2">Need Help Setting Up?</h3>
          <p className="text-sm text-gray-400 mb-4">Our team is here to help you get AINOS blogs running on your website.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push('/marketing/blog')} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors">
              Go to Blog Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
