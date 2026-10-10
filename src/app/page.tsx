'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Users, Bot,
  ScrollText, Contact2, Megaphone,
  Package, Scale,
  Shield, Zap, Headphones,
  BarChart3, CheckCircle2, TrendingUp, Building2, Layers,
  UserPlus, LayoutGrid, FileSpreadsheet, Rocket,
  Loader2, ArrowDownRight, Quote,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';

const MODULES = [
  {
    icon: ScrollText,
    title: 'Finance & Billing',
    desc: 'GST-compliant invoicing, quotations and expense tracking.',
    bg: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
    points: ['GST invoices & quotations', 'CGST/SGST/IGST tax split', 'Tally import & export', 'Delivery challans & barcodes'],
  },
  {
    icon: Contact2,
    title: 'CRM & Sales',
    desc: 'Leads, contacts and deals in one clear sales pipeline.',
    bg: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/30',
    points: ['Lead & contact management', 'Visual sales pipeline', 'Deal stage automation', 'Activity timelines'],
  },
  {
    icon: Megaphone,
    title: 'Marketing Suite',
    desc: 'AI content, email campaigns and social media together.',
    bg: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-500/30',
    points: ['AI blogs, captions & creatives', 'Email campaign management', 'Social media management', 'AI Media Studio'],
  },
  {
    icon: Users,
    title: 'HR & Payroll',
    desc: 'People, attendance, leave and payroll without spreadsheets.',
    bg: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/30',
    points: ['Employee records', 'Attendance tracking', 'Leave management', 'Payroll processing'],
  },
  {
    icon: Package,
    title: 'Inventory Control',
    desc: 'Real-time stock across warehouses, barcode ready.',
    bg: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    points: ['Live stock levels', 'Warehouse transfers', 'Purchase orders', 'Barcode scanning'],
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    desc: 'Smart automation and AI help across every module.',
    bg: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/30',
    points: ['AI writing & analysis', 'Predictive insights', 'Workflow automation', 'AI concierge chat'],
  },
  {
    icon: Scale,
    title: 'Legal Operations',
    desc: 'Contracts, compliance and legal workflows organised.',
    bg: 'from-rose-500 to-red-600',
    shadow: 'shadow-rose-500/30',
    points: ['Contract management', 'Compliance tracking', 'Document vault', 'Legal workflow tracking'],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Live dashboards and reports behind every module.',
    bg: 'from-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/30',
    points: ['Real-time dashboards', 'Sales & revenue reports', 'Custom date ranges', 'One-click export'],
  },
];

const WORKFLOWS = [
  { title: 'Invoice in under a minute', desc: 'Raise a GST invoice with automatic CGST/SGST/IGST split and share it with your customer the same moment.' },
  { title: 'Bring your Tally data along', desc: 'Import customers, ledgers and stock from Tally — no retyping, no lost history.' },
  { title: 'Watch cash flow live', desc: 'Revenue, invoices, clients and tasks update in real time on one dashboard.' },
  { title: 'Put AI to work', desc: 'Blogs, captions, creatives and insights generated from a single brief in the AI Media Studio.' },
  { title: 'Payroll without the mess', desc: 'Attendance, leave and salary processing connected end to end for your whole team.' },
  { title: 'Stock that stays accurate', desc: 'Every sale, purchase and transfer updates inventory instantly, across every warehouse.' },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your business account',
    desc: 'Register your company in minutes with tax, contact and document details — one time only.',
  },
  {
    icon: LayoutGrid,
    title: 'Set up your modules',
    desc: 'Turn on Finance, CRM, Inventory, HR and more — only the modules your business needs.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Bring your data in',
    desc: 'Import customers, products and ledgers from Excel or your existing accounting tool — without retyping anything.',
  },
  {
    icon: Rocket,
    title: 'Run and grow daily',
    desc: 'Invoice, sell, manage your team and let the AI assistant take care of the busywork.',
  },
];

const ABOUT_CATS = ['All', 'Finance', 'Sales', 'Operations', 'Intelligence'];

const MODULE_CATS: Record<string, string> = {
  'Finance & Billing': 'Finance',
  'CRM & Sales': 'Sales',
  'Marketing Suite': 'Sales',
  'HR & Payroll': 'Operations',
  'Inventory Control': 'Operations',
  'Legal Operations': 'Operations',
  'AI Assistant': 'Intelligence',
  'Analytics': 'Intelligence',
};

const TESTIMONIALS = [
  {
    quote: 'We replaced four different apps with AINOS. Invoicing, CRM, inventory and payroll — finally in one place.',
    name: 'Priya Sharma',
    role: 'Founder, Acme Industries',
    initials: 'PS',
  },
  {
    quote: 'The AI assistant drafts our weekly reports in minutes. What used to take hours now happens automatically.',
    name: 'Rahul Mehta',
    role: 'CFO, Northwind Trading',
    initials: 'RM',
  },
  {
    quote: 'Onboarding took two minutes. Within a week our entire warehouse team was running stock from AINOS.',
    name: 'Meera Iyer',
    role: 'Head of Ops, Atlas Retail',
    initials: 'MI',
  },
  {
    quote: 'GST compliance used to take days. Now it is automated and our CA just reviews the final output.',
    name: 'Arjun Patel',
    role: 'Director, Patel & Co.',
    initials: 'AP',
  },
  {
    quote: 'Our sales team closed thirty percent more deals after switching to AINOS CRM. The pipeline view is a game changer.',
    name: 'Sneha Reddy',
    role: 'VP Sales, Zenith Solutions',
    initials: 'SR',
  },
  {
    quote: 'The inventory module saved us from stockouts during peak season. Real-time updates across warehouses is exactly what we needed.',
    name: 'Vikram Singh',
    role: 'COO, Singh Enterprises',
    initials: 'VS',
  },
];

const FAQS = [
  {
    q: 'What is AINOS?',
    a: 'AINOS is a business operating suite from Yurekh. It brings invoicing, CRM, inventory, HR, payroll and AI assistance into one platform — so you do not need five different apps.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most businesses are up and running in under two minutes. Register your company, turn on the modules you need, and start invoicing immediately.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. AINOS uses bank-level encryption, role-based access control and secure cloud infrastructure. Your data is never shared with third parties.',
  },
  {
    q: 'Can I import data from Tally or Excel?',
    a: 'Yes. Import customers, products, ledgers and opening stock from Tally or Excel without retyping. History stays intact.',
  },
  {
    q: 'Do you support GST compliance?',
    a: 'Yes. AINOS is GST-native with automatic CGST/SGST/IGST split on every invoice, GST-ready reports and Tally-compatible export for your CA.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'All plans include email support. Growth and Enterprise plans get priority support with a dedicated account manager.',
  },
];

export default function AinosLandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const router = useRouter();
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const scrollSlider = (dir: number) => {
    sliderRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    setMenuOpen(false);
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [activeStep, setActiveStep] = React.useState(0);
  const [aboutCat, setAboutCat] = React.useState('All');
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // Auto-rotate the four-step walkthrough every 5s
  React.useEffect(() => {
    const t = setTimeout(() => setActiveStep((s) => (s + 1) % STEPS.length), 5000);
    return () => clearTimeout(t);
  }, [activeStep]);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80">
        <div className="flex items-center justify-between w-full px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32 py-4">
          <Link href="/" className="flex  items-center gap-[2px]">
            <Image src="/ainos-wordmark.png" alt="AINOS" width={100} height={34} className="h-8 w-auto object-contain" />
          </Link>

          {/* Desktop links */}
          <div className={`max-md:fixed max-md:inset-0 max-md:bg-white/80 max-md:overflow-hidden max-md:transition-[width] max-md:duration-300 max-md:top-0 max-md:left-0 max-md:flex-col max-md:justify-center max-md:text-lg max-md:backdrop-blur-xl flex items-center gap-8 ${menuOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>
            <a href="#how" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors" onClick={(e) => handleNavClick(e, '#how')}>How it works</a>
            <a href="#modules" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors" onClick={(e) => handleNavClick(e, '#modules')}>Modules</a>
            <a href="#workflow" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors" onClick={(e) => handleNavClick(e, '#workflow')}>Why AINOS</a>
            <a href="#about" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors" onClick={(e) => handleNavClick(e, '#about')}>About</a>
            <div className="md:hidden flex flex-col items-center gap-5 mt-6">
                          <Link href="/auth/register" className="px-8 py-3 bg-[#5b21b6] hover:bg-[#4c1d95] active:scale-95 rounded-full text-white text-base font-semibold transition-all shadow-lg shadow-purple-900/25">Get Started</Link>
                          <Link href="/auth/signin" className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
                        </div>
            <button aria-label="close menu" className="size-6 md:hidden" onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="max-md:hidden text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Sign In</Link>
            <Link href="/auth/register" className="max-md:hidden px-5 py-2.5 bg-[#5b21b6] hover:bg-[#4c1d95] active:scale-95 rounded-full text-white text-sm font-semibold transition-all">Get Started</Link>
            <button aria-label="menu" className="size-6 md:hidden" onClick={() => setMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 18h18M3 6h18" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden pt-28 md:pt-32 pb-12 px-4">
        {/* Background — subtle dot grid + soft purple glows (self-contained) */}
        <div className="absolute inset-0 bg-[radial-gradient(#e9e4f5_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-32 -right-24 w-[440px] h-[440px] rounded-full bg-purple-200/50 blur-3xl" />
        <div className="absolute top-48 -left-28 w-[360px] h-[360px] rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative w-full md:px-12 lg:px-20 xl:px-28 mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-8 py-10 md:py-14">
          {/* Left */}
          <div className="flex flex-col items-start max-w-xl">
            <Link href="https://yurekh.com/" className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full p-1 pr-4 text-sm hover:bg-purple-100 transition-colors mx-auto md:mx-0">
              <span className="bg-[#5b21b6] text-white text-xs px-3 py-1 rounded-full font-semibold">YUREKH</span>
              <span className="flex items-center gap-2 text-purple-700">
                <span className="text-sm font-medium">Introducing AINOS OS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-center md:text-left text-neutral-900 text-4xl md:text-5xl lg:text-[52px] leading-[1.15] font-bold max-w-[610px] mt-5 tracking-tight"
            >
              One platform to run your{' '}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">entire business</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center md:text-left text-base sm:text-lg text-neutral-600 max-w-md mt-4 mx-auto md:mx-0 font-light leading-relaxed"
            >
              CRM, Finance, HR, Inventory, Marketing and AI — unified in a single dashboard. Compliance-ready, built to scale worldwide.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = email.trim();
                router.push(trimmed ? `/auth/register?email=${encodeURIComponent(trimmed)}` : '/auth/register');
              }}
              className="flex items-center border gap-2 border-neutral-200 h-13 max-w-[440px] w-full rounded-full overflow-hidden mt-6 mx-auto md:mx-0 bg-white shadow-sm focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100/60 transition-all"
            >
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your work email" className="w-full h-full pl-6 outline-none text-sm bg-transparent text-neutral-600" />
              <button type="submit" className="bg-[#5b21b6] hover:bg-[#4c1d95] active:scale-95 w-44 h-10 rounded-full text-sm text-white font-semibold flex items-center justify-center mr-1.5 transition-all shrink-0 shadow-md shadow-purple-900/20 cursor-pointer">
                Create Account <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.form>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap items-center gap-x-7 gap-y-4 mt-8 mx-auto md:mx-0"
            >
              {[
                { icon: Shield, title: 'Secure & Reliable', desc: 'Your data, our priority' },
                { icon: Zap, title: 'Quick Setup', desc: 'Get started in minutes' },
                { icon: Headphones, title: 'Dedicated Support', desc: 'We\'re here to help' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-[18px] h-[18px] text-[#5b21b6]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Orbital Design (every icon sits exactly on a ring) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] flex-shrink-0 mx-auto md:mx-0"
          >
            <div className="relative aspect-square w-full">
              {/* Orbital rings — perfect circles, viewBox matches container */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="16" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="28" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="40" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="48" stroke="#e5e0f0" strokeWidth="0.4" />
              </svg>

              {/* Center — AINOS logo, upscaled */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white shadow-2xl shadow-purple-500/20 ring-1 ring-gray-100 overflow-hidden flex items-center justify-center p-4">
                  <Image src="/ainos-wordmark.png" alt="AINOS" width={220} height={80} className="w-full h-auto object-contain" priority />
                </div>
              </motion.div>

              {/* Small decorative dots filling the empty ring paths */}
              {[
                { r: 16, a: 90 }, { r: 16, a: 250 },
                { r: 28, a: 90 }, { r: 28, a: 320 },
                { r: 40, a: 90 }, { r: 40, a: 250 }, { r: 40, a: 20 },
                { r: 48, a: 130 }, { r: 48, a: 200 }, { r: 48, a: 340 },
              ].map((dot, i) => {
                const rad = (dot.a * Math.PI) / 180;
                return (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-purple-300/60"
                    style={{
                      left: `${50 + dot.r * Math.cos(rad)}%`,
                      top: `${50 + dot.r * Math.sin(rad)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}

              {/* Satellites — evenly distributed, no overlaps */}
              {[
                { icon: Scale, label: 'Legal', r: 40, a: 280, bg: 'from-rose-500 to-red-600' },
                { icon: ScrollText, label: 'Finance', r: 40, a: 320, bg: 'from-violet-500 to-purple-600' },
                { icon: Package, label: 'Inventory', r: 40, a: 10, bg: 'from-amber-500 to-orange-600' },
                { icon: Contact2, label: 'CRM', r: 40, a: 60, bg: 'from-blue-500 to-indigo-600' },
                { icon: Users, label: 'HR', r: 40, a: 120, bg: 'from-emerald-500 to-teal-600' },
                { icon: Megaphone, label: 'Marketing', r: 40, a: 180, bg: 'from-pink-500 to-rose-600' },
                { icon: Bot, label: 'AI', r: 40, a: 230, bg: 'from-indigo-500 to-violet-600' },
              ].map((sat, i) => {
                const rad = (sat.a * Math.PI) / 180;
                return (
                  <motion.div
                    key={sat.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 200 }}
                    className="absolute z-10"
                    style={{
                      left: `${50 + sat.r * Math.cos(rad)}%`,
                      top: `${50 + sat.r * Math.sin(rad)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {/* White circle with soft shadow */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-lg shadow-purple-900/10 ring-1 ring-gray-100 flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-default">
                        {/* Colored icon background */}
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${sat.bg} flex items-center justify-center`}>
                          <sat.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{sat.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── MARQUEE STRIP ───────────────────────────────────────── */}
      <section className="border-y border-purple-100/80 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/70 py-5 overflow-hidden">
        <div className="animate-[ainos-marquee_30s_linear_infinite] flex w-max items-center gap-10 whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-10" aria-hidden={dup === 1}>
              {['GST Invoicing', 'CRM & Sales', 'HR & Payroll', 'Inventory', 'AI Assistant', 'Marketing Suite', 'Legal Ops', 'Analytics', 'Tally Import', 'Bookings'].map((t) => (
                <span key={t} className="flex items-center gap-10 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-purple-900/50">
                  {t}
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes ainos-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </section>

      {/* ─── HOW IT WORKS — FOUR STEPS ───────────────────────────── */}
      <section id="how" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4">
              <Rocket className="w-3.5 h-3.5" /> How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Run your entire business in four steps
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              AINOS takes you from signup to daily operations — quickly and efficiently.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Left — step list */}
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-start gap-5 rounded-2xl p-5 text-left transition-all duration-300 ${
                    activeStep === i
                      ? 'bg-purple-50/80 ring-1 ring-purple-200 shadow-sm'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    activeStep === i
                      ? 'bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white shadow-lg shadow-purple-900/20'
                      : 'bg-white text-purple-700 ring-1 ring-gray-200'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-lg font-semibold mb-1 transition-colors duration-300 ${activeStep === i ? 'text-[#4c1d95]' : 'text-gray-900'}`}>
                      {s.title}
                    </span>
                    <span className="block text-sm text-gray-600 leading-relaxed">{s.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Right — sticky visual panel */}
            <div className="lg:sticky lg:top-24">
              <div className="relative h-[380px] sm:h-[420px] rounded-3xl bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 p-5 sm:p-7 overflow-hidden">
                <div className="h-full rounded-2xl bg-white border border-gray-100 shadow-xl p-6 sm:p-7 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      {activeStep === 0 && (
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white flex items-center justify-center text-sm font-semibold shadow-md shadow-purple-900/20 flex-shrink-0">AT</span>
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Business profile</p>
                                <p className="text-base font-semibold text-gray-900 truncate">Aurelia Trading Co.</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 ring-1 ring-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          </div>
                          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {[
                              ['Tax ID', 'VAT 8842-0116'],
                              ['Owner email', 'ops@aurelia.com'],
                              ['Entities', '3 connected'],
                              ['Base country', 'United Kingdom'],
                            ].map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                                <span className="text-xs text-gray-500">{k}</span>
                                <span className="text-sm font-medium text-gray-900 truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            Setup complete — account ready in 2 minutes
                          </div>
                        </div>
                      )}

                      {activeStep === 1 && (
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Module manager</p>
                              <p className="text-base font-semibold text-gray-900">Enabled modules</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">4 of 12 active</span>
                          </div>
                          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {[
                              { icon: ScrollText, name: 'Finance & Billing', sub: 'Invoices, expenses, taxes' },
                              { icon: Contact2, name: 'CRM & Sales', sub: 'Leads, deals, pipeline' },
                              { icon: Package, name: 'Inventory Control', sub: 'Stock, warehouses, transfers' },
                              { icon: Users, name: 'HR & Payroll', sub: 'People, attendance, payroll' },
                            ].map((m) => (
                              <div key={m.name} className="flex items-center justify-between gap-4 px-4 py-3">
                                <span className="flex items-center gap-3 min-w-0">
                                  <span className="w-9 h-9 rounded-lg bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center flex-shrink-0">
                                    <m.icon className="w-4 h-4 text-purple-600" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-gray-900 truncate">{m.name}</span>
                                    <span className="block text-xs text-gray-400 truncate">{m.sub}</span>
                                  </span>
                                </span>
                                <span className="w-9 h-5 rounded-full bg-purple-600 flex items-center justify-end px-0.5 flex-shrink-0">
                                  <span className="w-4 h-4 rounded-full bg-white shadow" />
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-auto pt-4 border-t border-gray-100 text-xs text-gray-500">Enable or disable modules anytime — no downtime.</p>
                        </div>
                      )}

                      {activeStep === 2 && (
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Data import</p>
                              <p className="text-base font-semibold text-gray-900">Import from Tally</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 ring-1 ring-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700 flex-shrink-0">
                              <Loader2 className="w-3 h-3 animate-spin" /> 92%
                            </span>
                          </div>
                          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {[
                              { label: 'Customers', rows: '248 rows', pct: 100, state: 'done' },
                              { label: 'Products & stock', rows: '1,120 rows', pct: 96, state: 'run' },
                              { label: 'Opening ledgers', rows: '36 rows', pct: 0, state: 'queue' },
                            ].map((r) => (
                              <div key={r.label} className="px-4 py-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-gray-800">{r.label}</span>
                                  <span className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{r.rows}</span>
                                    {r.state === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                    {r.state === 'run' && <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />}
                                    {r.state === 'queue' && <span className="text-[11px] text-gray-400">Queued</span>}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${r.pct === 100 ? 'bg-green-500' : 'bg-purple-600'}`}
                                    style={{ width: `${r.pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="mt-auto pt-4 border-t border-gray-100 text-xs text-gray-500">Excel and Tally formats supported — history stays intact.</p>
                        </div>
                      )}

                      {activeStep === 3 && (
                        <div className="flex h-full flex-col">
                          <div className="flex items-start justify-between mb-5">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Business overview</p>
                              <p className="text-base font-semibold text-gray-900">Revenue this quarter</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 ring-1 ring-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                              { label: 'Revenue', value: '$32.4k', delta: '+32%', up: true },
                              { label: 'Invoices', value: '142', delta: '+18%', up: true },
                              { label: 'Outstanding', value: '$6.1k', delta: '-9%', up: false },
                            ].map((kpi) => (
                              <div key={kpi.label} className="rounded-xl border border-gray-200 p-3">
                                <p className="text-[11px] text-gray-400 mb-1">{kpi.label}</p>
                                <p className="text-lg font-semibold text-gray-900 leading-none mb-1.5">{kpi.value}</p>
                                <p className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {kpi.delta}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto">
                            <div className="flex items-end gap-2 h-28 mb-2">
                              {[42, 55, 48, 66, 74, 92].map((h, i) => (
                                <div key={i} className="flex-1 h-full flex flex-col justify-end">
                                  <div
                                    className={`w-full rounded-t-md ${i === 5 ? 'bg-gradient-to-t from-[#4c1d95] to-[#7c3aed]' : 'bg-purple-200'}`}
                                    style={{ height: `${h}%` }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex text-[10px] text-gray-400">
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((mo) => (
                                <span key={mo} className="flex-1 text-center">{mo}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULES — FLIP CARDS ────────────────────────────────── */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4 shadow-sm">
              <Layers className="w-3.5 h-3.5" /> Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              One suite. Every department.
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Eight modules, one login, one database. Hover or tap a card to look inside.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="h-72 [perspective:1200px]"
              >
                <div
                  tabIndex={0}
                  className="group relative h-full w-full cursor-pointer rounded-2xl outline-none [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateY(180deg)] focus-within:[transform:rotateY(180deg)]"
                >
                  {/* Front */}
                  <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-white p-6 ring-1 ring-gray-100 shadow-sm [backface-visibility:hidden]">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center shadow-lg ${m.shadow}`}>
                      <m.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{m.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      Flip for details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Back */}
                  <div className={`absolute inset-0 flex flex-col rounded-2xl bg-gradient-to-br ${m.bg} p-6 text-white shadow-xl ${m.shadow} [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <m.icon className="w-4 h-4" /> {m.title}
                    </h3>
                    <ul className="space-y-2.5">
                      {m.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[13px] leading-snug text-white/90">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/80" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY AINOS — SCROLLABLE SLIDER ───────────────────────── */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> Why AINOS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
                Built around the way your business actually works
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Small moments that save hours every week — swipe through them.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button type="button" onClick={() => scrollSlider(-1)} aria-label="Scroll left" className="w-11 h-11 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-gray-600 hover:text-purple-700 hover:ring-purple-300 transition-all active:scale-95 cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => scrollSlider(1)} aria-label="Scroll right" className="w-11 h-11 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center text-gray-600 hover:text-purple-700 hover:ring-purple-300 transition-all active:scale-95 cursor-pointer">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
          >
            {WORKFLOWS.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="snap-start shrink-0 w-[85vw] sm:w-[400px] rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-purple-200"
              >
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2.5">{w.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
                <span className="mt-auto pt-6 block h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT — MAGNIFIC-STYLE BENTO ────────────────────────── */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header — heading left, CTA right */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-5 shadow-sm">
                <Building2 className="w-3.5 h-3.5" /> About AINOS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Start simple.<br className="hidden sm:block" /> Scale when you&rsquo;re ready
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                From a single module to a complete business operating suite — at your own pace.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition-colors hover:bg-[#3b0f78]">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Tall card — every module, ready to go */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 rounded-3xl bg-purple-50/70 ring-1 ring-purple-100 p-7 sm:p-8 flex flex-col"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Every module, ready to go</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Finance, CRM, inventory, HR, marketing and more — twelve modules, zero setup. Turn on only what your business needs today.
              </p>
              <div className="inline-flex flex-wrap gap-1 rounded-full bg-white border border-purple-100 p-1 mb-6 w-fit">
                {ABOUT_CATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAboutCat(c)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${aboutCat === c ? 'bg-[#4c1d95] text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MODULES.filter((m) => aboutCat === 'All' || MODULE_CATS[m.title] === aboutCat).map((m) => (
                  <div key={m.title} className="flex items-center gap-3 rounded-2xl bg-white border border-purple-100/70 p-4">
                    <span className="w-9 h-9 rounded-lg bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center flex-shrink-0">
                      <m.icon className="w-4 h-4 text-purple-600" />
                    </span>
                    <span className="text-sm font-medium text-gray-800">{m.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Large card — entire business on one dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#3b0f78] via-[#4c1d95] to-[#6d28d9] p-7 sm:p-8 text-white relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 h-full">
                <div className="max-w-sm">
                  <h3 className="text-2xl font-bold mb-3">Your entire business on one dashboard</h3>
                  <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
                    Customers, invoices, stock, payroll and campaigns — connected in one workspace. Every module reads the same data, so nothing is ever out of sync.
                  </p>
                </div>
                {/* Mini dashboard visual */}
                <div className="w-full lg:w-72 flex-shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/15 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-white/50">Dashboard</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg bg-white/15 px-3 py-2">
                      <p className="text-[10px] text-white/60 mb-0.5">Revenue</p>
                      <p className="text-sm font-semibold">$32.4k</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-3 py-2">
                      <p className="text-[10px] text-white/60 mb-0.5">Invoices</p>
                      <p className="text-sm font-semibold">142</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 55, 45, 70, 85, 62, 92].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t ${i === 6 ? 'bg-white' : 'bg-white/25'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom left card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="lg:col-span-5 rounded-3xl bg-[#5b21b6] p-7 sm:p-8 text-white relative overflow-hidden"
            >
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <h3 className="text-2xl font-bold mb-3">One platform, whole team</h3>
                <p className="text-sm sm:text-base text-purple-100/85 leading-relaxed">
                  Owner, sales, accounts and warehouse — everyone works from the same live data, with role-based access so each person sees exactly what they need.
                </p>
                <div className="mt-7 flex items-center gap-4">
                  <div className="flex -space-x-2.5">
                    {['OW', 'SL', 'AC', 'WH'].map((ini) => (
                      <span key={ini} className="w-9 h-9 rounded-full ring-2 ring-[#5b21b6] bg-gradient-to-br from-purple-300 to-indigo-400 flex items-center justify-center text-[10px] font-bold text-white">
                        {ini}
                      </span>
                    ))}
                    <span className="w-9 h-9 rounded-full ring-2 ring-[#5b21b6] bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                      +9
                    </span>
                  </div>
                  <span className="text-xs text-purple-100/75 leading-snug">Every role,<br />one shared workspace</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom right card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] p-7 sm:p-8 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_80%_at_85%_15%,black,transparent)]" />
              <div className="relative">
                <h3 className="text-2xl font-bold mb-3">AI across every module</h3>
                <p className="text-sm sm:text-base text-purple-100/85 leading-relaxed max-w-2xl">
                  Draft invoices, summarize reports and spot trends earlier with the built-in AI assistant — right inside the tools your team already uses.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {['Invoice drafting', 'Report summaries', 'Trend alerts', 'Content generation'].map((chip) => (
                    <span key={chip} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 ring-1 ring-white/20 px-3.5 py-1.5 text-xs font-medium text-white/90">
                      <Bot className="w-3 h-3" /> {chip}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─ TESTIMONIALS — BIDIRECTIONAL MARQUEE ────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4">
              <Quote className="w-3.5 h-3.5" /> Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Loved by growing teams
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Real stories from businesses running on AINOS.
            </p>
          </div>

          {/* Row 1 — scrolls left */}
          <div className="mb-5">
            <div className="flex gap-5 w-max animate-[scroll-left_50s_linear_infinite] hover:[animation-play-state:paused]">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={`r1-${i}-${t.name}`} className="w-[340px] sm:w-[380px] flex-shrink-0 rounded-3xl bg-white border border-gray-100 p-7 shadow-sm transition-colors hover:border-purple-200">
                  <Quote className="w-6 h-6 text-purple-200 mb-4" />
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white flex items-center justify-center text-xs font-semibold">{t.initials}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div>
            <div className="flex gap-5 w-max animate-[scroll-right_50s_linear_infinite] hover:[animation-play-state:paused]">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div key={`r2-${i}-${t.name}`} className="w-[340px] sm:w-[380px] flex-shrink-0 rounded-3xl bg-white border border-gray-100 p-7 shadow-sm transition-colors hover:border-purple-200">
                  <Quote className="w-6 h-6 text-purple-200 mb-4" />
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white flex items-center justify-center text-xs font-semibold">{t.initials}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes scroll-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes scroll-right {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </section>

      {/* ─ FAQ ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4 shadow-sm">
              <Headphones className="w-3.5 h-3.5" /> FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Everything you need to know about AINOS.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? 'bg-white border-purple-200 shadow-lg shadow-purple-100/50'
                      : 'bg-white border-gray-100 hover:border-purple-100 hover:shadow-md'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 px-6 py-5 text-left"
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors duration-300 ${
                      isOpen
                        ? 'bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={`flex-1 text-sm sm:text-base font-semibold transition-colors duration-300 ${
                      isOpen ? 'text-[#4c1d95]' : 'text-gray-900'
                    }`}>
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      isOpen ? 'rotate-180 text-[#4c1d95]' : 'text-gray-400'
                    }`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pl-[4.25rem]">
                          <div className="border-l-2 border-purple-300 pl-4">
                            <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-10 sm:p-14 lg:p-16 rounded-3xl bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] shadow-2xl shadow-purple-900/30 overflow-hidden"
          >
            {/* Decorative glow blobs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_50%,black,transparent)]" />

            <div className="relative text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-purple-100 mb-6">
                <Zap className="w-3.5 h-3.5" /> Get started today
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                Ready to transform your business?
              </h2>
              <p className="text-base sm:text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses using AINOS to streamline operations and boost growth.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-purple-50 active:scale-95 text-[#4c1d95] font-semibold transition-all shadow-lg shadow-purple-900/40"
              >
                Start Your Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-sm text-purple-200/80">
                No credit card required • Setup in 2 minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50/40">
        <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-5">
              <Image src="/ainos-wordmark.png" alt="AINOS" width={100} height={34} className="h-7 w-auto object-contain" />
              <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-xs">
                The business operating suite — finance, CRM, HR, inventory and AI in one platform.
              </p>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Product</p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li><a href="#modules" onClick={(e) => handleNavClick(e, '#modules')} className="hover:text-[#4c1d95] transition-colors">Modules</a></li>
                <li><a href="#how" onClick={(e) => handleNavClick(e, '#how')} className="hover:text-[#4c1d95] transition-colors">How it works</a></li>
                <li><a href="#workflow" onClick={(e) => handleNavClick(e, '#workflow')} className="hover:text-[#4c1d95] transition-colors">Why AINOS</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Company</p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="hover:text-[#4c1d95] transition-colors">About</a></li>
                <li><Link href="https://yurekh.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#4c1d95] transition-colors">Yurekh</Link></li>
                <li><Link href="/auth/signin" className="hover:text-[#4c1d95] transition-colors">Sign In</Link></li>
              </ul>
            </div>

            {/* Get started */}
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Get started</p>
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/20 transition-colors hover:bg-[#3b0f78]">
                Create account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} AINOS. All rights reserved.</p>
            <Link href="https://yurekh.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#4c1d95] transition-colors">Built by Yurekh</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
