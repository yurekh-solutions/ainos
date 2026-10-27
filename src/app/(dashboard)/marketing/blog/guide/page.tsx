'use client';
import { useState } from 'react';
import { ArrowLeft, Copy, Check, Code, Store, Workflow, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    id: 'connect',
    num: 1,
    title: 'Add Your Website',
    icon: Store,
    content: `Open your AINOS dashboard and go to Marketing \u2192 Blog & Content.

Click the \u201cConnect Website\u201d button at the top right.

Type in your website\u2019s full web address \u2014 the one that starts with https:// (for example: https://yourbusiness.com).

Click \u201cConnect\u201d. AINOS takes a quick look at your website to understand what your business is about. This takes about 10\u201315 seconds.

When it\u2019s done, your website shows up as a card on the page.

Good to know: each AINOS account works with one website at a time. To use a different website, click \u201cDisconnect\u201d on your current one first.`,
  },
  {
    id: 'embed',
    num: 2,
    title: 'Add the Small Piece of Code',
    icon: Code,
    content: `Your website card shows a short piece of code. Click \u201cCopy Code\u201d to copy it.

Now add this code to your website. If you know how to edit your website, paste it near the bottom of your page, just before the closing </body> tag.

If you\u2019re not comfortable editing your website, just send the code to the person who set it up for you and ask them to add it there.

Not sure where to put it? Pick your website type below for simple step-by-step help.`,
    code: `<script src="https://ainos-ywu0.onrender.com/embed.js"></script>
<div id="ainos-blog" data-limit="6" data-site="YOUR_WEBSITE_URL"></div>`,
    platforms: [
      {
        name: 'WordPress',
        steps: [
          'Go to Appearance \u2192 Theme File Editor',
          'Open the footer file',
          'Paste the code just before </body>',
          'Click Update File',
        ],
      },
      {
        name: 'Shopify',
        steps: [
          'Go to Online Store \u2192 Themes',
          'Click Actions \u2192 Edit Code',
          'Open the layout file',
          'Paste the code just before </body>',
          'Click Save',
        ],
      },
      {
        name: 'A plain HTML website',
        steps: [
          'Open your main page file (index.html)',
          'Find the closing </body> tag',
          'Paste the code just before it',
          'Save and upload the file',
        ],
      },
      {
        name: 'Wix',
        steps: [
          'Go to Settings \u2192 Advanced \u2192 Custom Code',
          'Click Add Custom Code',
          'Paste the code in the body area',
          'Choose "Before </body>" for where it goes',
          'Click Apply',
        ],
      },
      {
        name: 'Squarespace',
        steps: [
          'Go to Settings \u2192 Advanced \u2192 Code Injection',
          'Paste the code in the Footer box',
          'Click Save',
        ],
      },
      {
        name: 'React / Next.js',
        steps: [
          'Open your main layout file',
          'Add the code near the bottom of the page',
          'Save and publish your site',
        ],
      },
    ],
  },
  {
    id: 'verify',
    num: 3,
    title: 'We Know When It\u2019s Ready',
    icon: Workflow,
    content: `Once the code is on your website, open your website in your browser.

AINOS notices right away and marks your website as live. Go back to your dashboard and refresh the Blog page \u2014 you\u2019ll see a green \u201cLive\u201d badge on your website card.

That means everything is set up and your blogs will start appearing.

If it still shows \u201cNot connected\u201d:
  \u2022 Check that the code was added correctly (copy it fresh from your dashboard)
  \u2022 Make sure the web address in the code matches your real website
  \u2022 Wait a minute or two, then refresh the dashboard`,
  },
  {
    id: 'blogs',
    num: 4,
    title: 'Blogs Start Coming Automatically',
    icon: CheckCircle,
    content: `After setup, you don\u2019t need to do anything. AINOS writes a new blog for your business every day and puts it on your website on its own.

  \u2022 One fresh blog appears each day
  \u2022 Each blog gets its own web address on your site (like yourbusiness.com/blog/article-title)
  \u2022 Blogs are written in your business\u2019s style and about what you do
  \u2022 Every blog comes with a picture and is easy for people to read
  \u2022 Older blogs get replaced with newer ones, so your website always looks fresh

You can see all your blogs anytime under Marketing \u2192 Blog & Content.

Once it\u2019s set up, AINOS handles the writing, the pictures and the publishing \u2014 all on its own.`,
  },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-violet-100 ring-1 ring-violet-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ainos-alpha.png" alt="AINOS" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Blog Setup Guide</h1>
            <p className="text-xs text-gray-500">Get fresh blogs on your website \u2014 in 4 easy steps</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Quick Summary Banner */}
        <div className="bg-[#5b21b6] rounded-2xl p-6 text-white shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold mb-2">How AINOS Blogs Work</h2>
          <p className="text-sm text-purple-100 leading-relaxed mb-5">
            AINOS writes and publishes new blog posts on your website automatically \u2014 one every day. You don\u2019t write anything and you don\u2019t post anything. Just follow these 4 simple steps to get started.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {['Add Website', 'Add Code', 'It\u2019s Live', 'Blogs Appear'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                <span className="text-[10px] sm:text-xs text-purple-100 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What You Need */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Before You Start</h2>
            <p className="text-xs text-gray-500 mt-1">Here\u2019s all you need to set things up.</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { need: 'Your website address', detail: 'The full web link, like https://yourbusiness.com' },
                { need: 'Access to your website', detail: 'You, or the person who looks after your website' },
                { need: 'Your AINOS account', detail: 'You\u2019re already signed in \u2014 you\u2019re all set' },
                { need: 'About 5 minutes', detail: 'That\u2019s all it takes to finish everything' },
              ].map((item) => (
                <div key={item.need} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <CheckCircle className="w-5 h-5 text-[#5b21b6] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.need}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
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
            <div key={step.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Step Header */}
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5b21b6] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{step.num}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#5b21b6] hidden sm:block" /> {step.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Step {step.num} of 4</p>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-5 sm:p-6">
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{step.content}</p>

                {/* Code Block */}
                {step.code && (
                  <div className="mt-4 relative">
                    <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs sm:text-sm text-green-400 font-mono whitespace-pre">{step.code}</pre>
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Help for your website type:</p>
                    {step.platforms.map((platform) => (
                      <div key={platform.name} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenPlatform(openPlatform === platform.name ? null : platform.name)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-semibold text-gray-900">{platform.name}</span>
                          {openPlatform === platform.name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {openPlatform === platform.name && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <ol className="mt-3 space-y-2">
                              {platform.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="w-5 h-5 rounded-full bg-violet-100 text-[#5b21b6] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
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

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Common Questions</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            {[
              { q: 'Where do I put the code?', a: 'Near the bottom of your website\u2019s code, just before the closing </body> tag. If you\u2019re not sure, send the code to the person who looks after your website and they\u2019ll add it for you.' },
              { q: 'Will this make my website slow?', a: 'No. It\u2019s very small and works quietly in the background. Your website will feel exactly the same.' },
              { q: 'I already have a blog section. What happens?', a: 'AINOS shows its blogs in place of your old blog section. The rest of your website stays just as it is.' },
              { q: 'How many blogs show up?', a: 'Six at a time by default. You can ask for more or fewer.' },
              { q: 'Do these blogs help people find me on Google?', a: 'Yes. Each blog is written so people can find you when they search for things related to your business.' },
              { q: 'What happens to older blogs?', a: 'Blogs older than 7 days are swapped out for newer ones, so your website always shows fresh content.' },
              { q: 'Can I use it on more than one website?', a: 'Each AINOS account works with one website at a time. To switch, disconnect your current website and add a new one.' },
            ].map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-900">{faq.q}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Need Help CTA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Need a hand?</h3>
          <p className="text-sm text-gray-500 mb-4">Our team is happy to help you get AINOS blogs running on your website.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push('/marketing/blog')} className="px-5 py-2.5 rounded-xl bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-semibold transition-colors">
              Go to Blog Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
