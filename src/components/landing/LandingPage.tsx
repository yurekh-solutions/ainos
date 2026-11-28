'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/marketing/SiteHeader';
import { HOME_FAQS } from '@/lib/faqs';
import {
  ArrowRight, Users, MessageSquareText, ScrollText, Contact2, Megaphone, Package, Scale, Shield, Headphones, BarChart3, CheckCircle2, TrendingUp, Building2, Layers, UserPlus, LayoutGrid, FileSpreadsheet, Rocket, Loader2, ArrowDownRight, ChevronDown, Palette, Search, PenLine, Presentation, MessageSquare, Wallet, UserCog, Boxes, LineChart, SlidersHorizontal, Workflow, LayoutDashboard, Blocks, Gauge, Clock } from 'lucide-react';

const MODULES = [
  {
    icon: Wallet,
    title: 'Finance & Billing',
    desc: 'GST-compliant invoicing, quotations and expense tracking.',
    points: ['GST invoices & quotations', 'CGST/SGST/IGST tax split', 'Tally import & export', 'Delivery challans & barcodes'],
  },
  {
    icon: Contact2,
    title: 'CRM & Sales',
    desc: 'Leads, contacts and deals in one clear sales pipeline.',
    points: ['Lead & contact management', 'Visual sales pipeline', 'Deal stage automation', 'Activity timelines'],
  },
  {
    icon: Megaphone,
    title: 'Marketing Suite',
    desc: 'AI content, email campaigns and social media together.',
    points: ['AI blogs, captions & creatives', 'Email campaign management', 'Social media management', 'AI Media Studio'],
  },
  {
    icon: UserCog,
    title: 'HR & Payroll',
    desc: 'People, attendance, leave and payroll without spreadsheets.',
    points: ['Employee records', 'Attendance tracking', 'Leave management', 'Payroll processing'],
  },
  {
    icon: Boxes,
    title: 'Inventory Control',
    desc: 'Real-time stock across warehouses, barcode ready.',
    points: ['Live stock levels', 'Warehouse transfers', 'Purchase orders', 'Barcode scanning'],
  },
  {
    icon: MessageSquareText,
    title: 'AI Assistant',
    desc: 'Smart automation and AI help across every module.',
    points: ['AI writing & analysis', 'Predictive insights', 'Workflow automation', 'AI concierge chat'],
  },
  {
    icon: Scale,
    title: 'Legal Operations',
    desc: 'Contracts, compliance and legal workflows organised.',
    points: ['Contract management', 'Compliance tracking', 'Document vault', 'Legal workflow tracking'],
  },
  {
    icon: LineChart,
    title: 'Analytics',
    desc: 'Live dashboards and reports behind every module.',
    points: ['Real-time dashboards', 'Sales & revenue reports', 'Custom date ranges', 'One-click export'],
  },
];

const AI_TOOLS = [
  { icon: Palette, name: 'Logo Generator' },
  { icon: Layers, name: 'Brand Kit' },
  { icon: Search, name: 'SEO Audit' },
  { icon: PenLine, name: 'Content Writer' },
  { icon: Presentation, name: 'Pitch Deck' },
  { icon: MessageSquare, name: 'AI Chatbot' },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your business account',
    desc: 'Register the company once with tax, contact and document details that every app reuses.',
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

const TEAM_ROLES = [
  {
    icon: Building2,
    role: 'Founder / owner',
    title: 'One view of the business',
    desc: 'Revenue, receivables, stock and team activity in one dashboard instead of five separate status updates.',
    href: '/features/workspace',
  },
  {
    icon: BarChart3,
    role: 'Accounts',
    title: 'Books that close without retyping',
    desc: 'GST invoices, payments and reports stay connected to the sales records they came from.',
    href: '/features/accounting',
  },
  {
    icon: Contact2,
    role: 'Sales',
    title: 'A pipeline connected to delivery',
    desc: 'A closed deal reaches accounts with the customer, quote and scope already in place.',
    href: '/features/crm',
  },
  {
    icon: Boxes,
    role: 'Operations',
    title: 'Stock and orders in one picture',
    desc: 'Products, purchase orders, warehouses and fulfilment share the catalogue sales uses.',
    href: '/features/supply-chain',
  },
  {
    icon: Users,
    role: 'People',
    title: 'Team records finance can use',
    desc: 'Employees, attendance, leave and payroll live in the same workspace as the rest of the company.',
    href: '/features/people',
  },
  {
    icon: Megaphone,
    role: 'Marketing',
    title: 'Campaigns built on real context',
    desc: 'Plan content and campaigns from the same customer and product data the business already runs on.',
    href: '/features/marketing',
  },
];

// Enterprise layer: announced, not shipped. Nothing here is billed or claimable yet.
const ENTERPRISE_PILLARS = [
  {
    icon: SlidersHorizontal,
    title: 'Greater flexibility',
    body: 'Configurable fields, documents and approval chains per entity, without a separate deployment.',
  },
  {
    icon: Workflow,
    title: 'Smart automations',
    body: 'AI-assisted routing, reminders and document handling across modules.',
  },
  {
    icon: LayoutDashboard,
    title: 'Unified oversight',
    body: 'Group-level dashboards with per-entity drill-down and a shared audit trail.',
  },
  {
    icon: Blocks,
    title: 'Integrated workflows',
    body: 'Tally, e-invoicing and payment tools in one controlled flow.',
  },
  {
    icon: Gauge,
    title: 'Streamlined operations',
    body: 'GST billing, invoicing, payroll, inventory and reporting under one policy.',
  },
];

const GROWTH_POINTS = [
  {
    step: '01',
    title: 'Set the company up once',
    body: 'GSTIN, place of supply, document series and bank details sit in the company profile, and every app reads them.',
  },
  {
    step: '02',
    title: 'Let AI prepare, keep the approval',
    body: 'AI Studio drafts, extracts and summarises. A person signs off before anything leaves the workspace.',
  },
  {
    step: '03',
    title: 'Add a branch, not a migration',
    body: 'A new warehouse, department or team joins the same workspace with its own role access.',
  },
];

const MANUAL_WORK = [
  { label: 'GST returns', body: 'Reports built from the invoices already raised.' },
  { label: 'Expense records', body: 'Receipts and scanned business cards filed against the right customer.' },
  { label: 'Payroll', body: 'PF, ESI and professional tax configured once, then applied monthly.' },
];



export default function AinosLandingPage() {
  const [email, setEmail] = React.useState('');
  const router = useRouter();

  const [activeStep, setActiveStep] = React.useState(0);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // Auto-rotate the four-step walkthrough every 5s
  React.useEffect(() => {
    const t = setTimeout(() => setActiveStep((s) => (s + 1) % STEPS.length), 5000);
    return () => clearTimeout(t);
  }, [activeStep]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section id="main-content" className="relative w-full overflow-hidden pb-10 pt-16 md:pt-12">
        {/* Background — subtle dot grid + soft purple glows (self-contained) */}
        <div className="absolute inset-0 bg-[radial-gradient(#e9e4f5_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-32 -right-24 w-[440px] h-[440px] rounded-full bg-purple-200/50 blur-3xl" />
        <div className="absolute top-48 -left-28 w-[360px] h-[360px] rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 py-8 md:py-10 lg:flex-row lg:gap-14 lg:pb-16 lg:pt-[72px] px-4 sm:px-6 lg:px-12">
          {/* Left */}
          <div className="flex flex-col items-center lg:items-start max-w-xl w-full lg:w-auto lg:flex-1 lg:min-w-0">
            <Link href="/auth/register" className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 text-sm hover:bg-purple-100 transition-colors">
              <span className="flex items-center gap-2 text-purple-700">
                <span className="text-sm font-medium">Introducing AINOS SUITE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-center lg:text-left text-neutral-900 text-[28px] sm:text-[32px] md:text-[35px] lg:text-[44px] xl:text-[52px] leading-[1.2] font-semibold lg:font-bold max-w-[610px] mt-5 tracking-tight text-balance"
            >
              One platform to run your{' '}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">entire business</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center lg:text-left text-base sm:text-lg text-neutral-600 max-w-md mt-4 font-light leading-relaxed"
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
              className="flex items-center border gap-2 border-neutral-200 h-13 max-w-[440px] w-full rounded-full overflow-hidden mt-6 bg-white shadow-sm focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100/60 transition-all"
            >
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your work email" aria-label="Work email" className="w-full min-w-0 h-full pl-5 sm:pl-6 outline-none text-sm bg-transparent text-neutral-600" />
              <button type="submit" className="bg-[#5b21b6] hover:bg-[#4c1d95] active:scale-95 w-auto px-4 sm:w-44 sm:px-0 h-10 rounded-full text-sm text-white font-semibold flex items-center justify-center mr-1.5 transition-all shrink-0 shadow-md shadow-purple-900/20 cursor-pointer">
                Create Account <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </motion.form>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 w-full"
            >
              {/* Mobile + tablet: stacked cards - full width */}
              <div className="flex xl:hidden flex-col gap-3 w-full">
                {[
                  { icon: Shield, title: 'Secure & Reliable', desc: 'Your data, our priority' },
                  { icon: Clock, title: 'Quick Setup', desc: 'Get started in minutes' },
                  { icon: Headphones, title: 'Dedicated Support', desc: "We're here to help" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 w-full">
                    <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <item.icon className="w-[18px] h-[18px] text-[#5b21b6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: inline row */}
              <div className="hidden xl:flex flex-nowrap items-center gap-x-7 gap-y-4">
                {[
                  { icon: Shield, title: 'Secure & Reliable', desc: 'Your data, our priority' },
                  { icon: Clock, title: 'Quick Setup', desc: 'Get started in minutes' },
                  { icon: Headphones, title: 'Dedicated Support', desc: "We're here to help" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-[18px] h-[18px] text-[#5b21b6]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 leading-tight">{item.title}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Orbital Design (every icon sits exactly on a ring) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[460px] xl:max-w-[520px] flex-shrink-0 mx-auto lg:mx-0"
          >
            <div className="relative aspect-square w-full">
              {/* Orbital rings — perfect circles, viewBox matches container */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="16" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="28" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="40" stroke="#e5e0f0" strokeWidth="0.4" />
                <circle cx="50" cy="50" r="48" stroke="#e5e0f0" strokeWidth="0.4" />
              </svg>

              {/* Center — AINOS logo, upscaled.
                  Framer owns the inline transform here, so the centering comes
                  from the flex overlay instead of translate(-50%,-50%). */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="absolute inset-0 z-10 flex items-center justify-center"
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
                { icon: MessageSquareText, label: 'AI', r: 40, a: 230, bg: 'from-indigo-500 to-violet-600' },
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
                    <div className="flex flex-col items-center gap-1.5 -translate-x-1/2 -translate-y-1/2">
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
      <section id="how" className="py-12 sm:py-14 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              <Rocket className="h-3.5 w-3.5" /> How it works
            </p>
            <h2 className="mt-3 text-[25px] font-semibold tracking-tight text-gray-900 text-balance sm:text-[30px]">
              Run your entire business in four steps
            </h2>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Sign up, finish onboarding, switch on the modules you need, then run the day from one console.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — step list */}
            <div className="space-y-3 min-w-0">
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
            <div className="lg:sticky lg:top-24 min-w-0">
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
                              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-white flex items-center justify-center text-sm font-semibold shadow-md shadow-purple-900/20 flex-shrink-0">ST</span>
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5">Business profile</p>
                                <p className="text-base font-semibold text-gray-900 truncate">Sundaram Traders</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 ring-1 ring-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          </div>
                          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                            {[
                              ['GSTIN', '27AABCS1429B1ZP'],
                              ['Owner email', 'ops@sundaramtraders.in'],
                              ['Entities', '3 connected'],
                              ['State of supply', 'Maharashtra'],
                            ].map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                                <span className="text-xs text-gray-500">{k}</span>
                                <span className="text-sm font-medium text-gray-900 truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            Company profile saved — review it any time in settings
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
                              { label: 'Revenue', value: '₹12.6L', delta: '+32%', up: true },
                              { label: 'Invoices', value: '142', delta: '+18%', up: true },
                              { label: 'Outstanding', value: '₹2.4L', delta: '-9%', up: false },
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
      <section
        id="modules"
        className="relative overflow-hidden border-t border-purple-100/70 bg-gradient-to-b from-[#fbfaff] via-white to-white py-12 sm:py-14 scroll-mt-20"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(109,40,217,0.06),transparent_72%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Slim rail instead of a headline: label on the left, count on the right. */}
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-purple-100 pb-4">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              <Layers className="h-3.5 w-3.5" /> Modules
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] tabular-nums text-gray-400">
              {String(MODULES.length).padStart(2, '0')} modules
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="h-64 [perspective:1200px]"
              >
                <div
                  tabIndex={0}
                  className="group relative h-full w-full cursor-pointer rounded-2xl outline-none [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateY(180deg)] focus-within:[transform:rotateY(180deg)]"
                >
                  {/* Front */}
                  <div className="absolute inset-0 flex flex-col rounded-2xl bg-white p-5 ring-1 ring-gray-200/80 shadow-[0_1px_2px_rgba(23,16,33,0.04)] transition-shadow duration-300 [backface-visibility:hidden] group-hover:shadow-lg">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 ring-1 ring-purple-100">
                        <m.icon className="h-5 w-5 text-[#5b21b6]" />
                      </span>
                      <span className="pt-1 text-[11px] font-semibold tabular-nums tracking-[0.16em] text-gray-300">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold tracking-tight text-gray-900">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{m.desc}</p>
                    <span className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-purple-700">
                      Flip for details
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 flex flex-col rounded-2xl ainos-surface-dots p-5 text-white ring-1 ring-white/10 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <m.icon className="h-4 w-4 text-purple-200" /> {m.title}
                      </h3>
                      <span className="text-[11px] font-semibold tabular-nums tracking-[0.16em] text-white/30">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {m.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[13px] leading-snug text-white/85">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-purple-300" />
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

      {/* ─── COVERAGE — POINTS TO THE DEDICATED PAGE ─────────────── */}
      <section id="coverage" className="py-12 sm:py-14 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-3xl bg-[#fbfaff] p-6 ring-1 ring-purple-100 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
                <ScrollText className="w-3.5 h-3.5" /> Coverage
              </span>
              <h2 className="mt-3 text-[22px] sm:text-[26px] font-semibold tracking-tight text-gray-900 text-balance">
                Twelve areas of the business, listed one by one.
              </h2>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-600">
                GST invoicing, payment links, payroll, dispatch and the compliance calendar — with the boundaries
                stated next to them.
              </p>
            </div>
            <Link
              href="/coverage"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#4c1d95] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-purple-900/20 transition-colors hover:bg-[#3b0f78]"
            >
              See what is covered <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GROWTH — FIRST INVOICE TO MANY BRANCHES ─────────────── */}
      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-4 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" /> From first invoice to many branches
            </span>
            <h2 className="text-[25px] sm:text-[30px] font-semibold tracking-tight text-gray-900 mb-3 text-balance">
              Built to be added to, not replaced.
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Three things stay constant as the business grows.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {GROWTH_POINTS.map((point) => (
              <div key={point.step} className="rounded-3xl bg-white p-6 ring-1 ring-gray-100 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-700">
                  {point.step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{point.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl ainos-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-200">What stops being manual</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {MANUAL_WORK.map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-purple-200/80">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT — MAGNIFIC-STYLE BENTO ────────────────────────── */}
      <section id="about" className="bg-gray-50/60 py-12 sm:py-14 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header — heading left, CTA right */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-purple-100 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700 mb-5 shadow-sm">
                <Building2 className="w-3.5 h-3.5" /> About AINOS
              </span>
              <h2 className="text-[26px] sm:text-[30px] md:text-[33px] font-semibold tracking-tight text-gray-900 mb-4 text-balance">
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
                Ready Now<ArrowRight className="w-4 h-4" />
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
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-balance">Every module, ready to go</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Eight modules, each with its own screens and permissions. Enable the ones your team uses; the rest stay dormant.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((m) => (
                  <div key={m.title} className="flex items-center gap-2.5 rounded-2xl bg-white border border-purple-100/70 p-3 sm:p-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100/70 ring-1 ring-purple-200/70 sm:h-10 sm:w-10">
                      <m.icon className="h-4 w-4 text-[#4c1d95] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-800 leading-snug min-w-0">{m.title}</span>
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
              className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#3b0f78] via-[#4c1d95] to-[#6d28d9] p-7 sm:p-8 text-white relative overflow-hidden flex flex-col justify-center"
            >
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-8">
                <div className="max-w-sm">
                  <h3 className="text-2xl font-bold mb-3">The morning check, before the calls start</h3>
                  <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
                    Overdue invoices, low stock, open payroll runs and today&rsquo;s follow-ups, each read from the record it belongs to.
                  </p>
                </div>
                {/* Mini dashboard visual */}
                <div className="w-full md:w-64 xl:w-72 flex-shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/15 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="w-2 h-2 rounded-full bg-white/30" />
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-white/50">Dashboard</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg bg-white/15 px-3 py-2">
                      <p className="text-[10px] text-white/60 mb-0.5">Revenue</p>
                      <p className="text-sm font-semibold">₹12.6L</p>
                    </div>
                    <div className="rounded-lg bg-white/15 px-3 py-2">
                      <p className="text-[10px] text-white/60 mb-0.5">Invoices</p>
                      <p className="text-sm font-semibold">142</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 lg:h-20">
                    {[40, 55, 45, 70, 85, 62, 92].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t ${i === 6 ? 'bg-white' : 'bg-white/25'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Built-in AI tools */}
              <div className="relative mt-8 pt-6 border-t border-white/15">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-200/80 mb-4">15 AI tools built in</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AI_TOOLS.map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="flex items-center gap-2.5 rounded-xl bg-white/10 ring-1 ring-white/15 px-3 py-2.5 transition-colors hover:bg-white/15"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/25 to-white/10 ring-1 ring-white/20 flex items-center justify-center flex-shrink-0">
                        <t.icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                      </span>
                      <span className="text-xs sm:text-sm font-medium truncate">{t.name}</span>
                    </motion.div>
                  ))}
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
                <h3 className="text-2xl font-bold mb-3">Access, split by desk</h3>
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
                  <span className="text-xs text-purple-100/75 leading-snug">Owner, sales,<br />accounts, warehouse</span>
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
                      <MessageSquareText className="w-3 h-3" /> {chip}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─ ENTERPRISE LAYER — COMING SOON ──────────────────────── */}
      <section className="border-y border-purple-100/70 bg-[#fbfaff] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              <Clock className="h-3.5 w-3.5" /> Coming soon · Enterprise
            </p>
            <h2 className="mt-3 text-balance text-[25px] font-semibold leading-[1.22] tracking-tight text-gray-900 sm:text-[30px]">
              Whether you are a start-up, a global enterprise, or everyone in between, find solutions that empower you.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-gray-600 sm:text-lg">
              A configurable layer above the suite: group reporting, per-entity workspaces and controlled automation. It is in
              build — the workspace you can sign up for today is the foundation it runs on.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4c1d95] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/15 transition-colors hover:bg-[#3b0f78]"
            >
              Register interest <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3.5 text-[11px] leading-relaxed text-gray-500">
              Illustrative interface and card mock-up. AINOS ONE is not an issued product yet.
            </p>
          </div>

          {/* Showcase stage — product composite on deep violet */}
          <div className="relative mt-10 overflow-hidden rounded-[2rem] ainos-surface px-4 pb-12 pt-9 text-white shadow-xl shadow-purple-950/25 sm:px-8 sm:pb-14 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_75%_95%_at_50%_30%,black,transparent)]" />
            <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#c4b5fd]/20 blur-3xl" />

            <div className="relative mx-auto max-w-6xl">
              {/* Product window — the AINOS dashboard */}
              <div className="relative z-10 mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white text-gray-900 shadow-[0_40px_90px_-30px_rgba(10,2,20,0.75)] ring-1 ring-white/20">
                <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f2eefb] px-3 py-1.5">
                  <span className="flex shrink-0 gap-1" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                  </span>
                  <span className="ml-1 min-w-0 flex-1 truncate rounded bg-white px-2 py-0.5 text-center text-[9px] text-gray-400 ring-1 ring-gray-200/80">
                    ainossuite.com/dashboard
                  </span>
                  <span className="hidden shrink-0 rounded bg-white px-1.5 py-0.5 text-[8px] font-semibold text-[#4c1d95] ring-1 ring-gray-200/80 sm:block">
                    Business Suite
                  </span>
                </div>

                <div className="flex">
                  {/* Product sidebar */}
                  <aside className="hidden w-[7.25rem] shrink-0 flex-col justify-between bg-[#1d1036] px-1.5 py-2.5 sm:flex">
                    <div>
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold leading-none text-[#4c1d95]">
                          α
                        </span>
                        <span className="min-w-0">
                          <Image
                            src="/ainos-wordmark.png"
                            alt=""
                            width={56}
                            height={18}
                            className="h-2 w-auto object-contain brightness-0 invert"
                          />
                          <span className="mt-0.5 block truncate text-[5.5px] font-medium uppercase tracking-[0.16em] text-purple-200/70">
                            Business Suite
                          </span>
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-[2px]">
                        {[
                          { label: 'Dashboard', Icon: LayoutDashboard },
                          { label: 'CRM', Icon: Contact2 },
                          { label: 'Supply Chain', Icon: Boxes },
                          { label: 'People', Icon: Users },
                          { label: 'Support', Icon: Headphones },
                          { label: 'Workspace', Icon: LayoutGrid },
                          { label: 'Finance', Icon: Wallet },
                          { label: 'Accounting', Icon: FileSpreadsheet },
                          { label: 'Marketing', Icon: Megaphone },
                          { label: 'eCommerce', Icon: Package },
                        ].map(({ label, Icon }, navIndex) => (
                          <div
                            key={label}
                            className={`flex items-center gap-1.5 rounded-[5px] px-1.5 py-[3px] ${
                              navIndex === 0
                                ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white'
                                : 'text-purple-100/70'
                            }`}
                          >
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className="min-w-0 flex-1 truncate text-[7.5px] font-medium">{label}</span>
                            <ChevronDown className="h-2 w-2 shrink-0 opacity-40" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-white/[0.08] px-1.5 py-1">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] text-[7px] font-semibold text-white">
                        A
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[7px] font-semibold text-white">Admin</span>
                        <span className="block truncate text-[6px] text-purple-200/60">Owner</span>
                      </span>
                    </div>
                  </aside>

                  {/* Product main */}
                  <div className="min-w-0 flex-1 bg-[#fcfbff] p-2.5 sm:p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-gray-200/80">
                        <Search className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                        <span className="truncate text-[8px] text-gray-400">Search anything…</span>
                      </div>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] text-[7px] font-semibold text-white">
                        A
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-[#4c1d95] to-[#7c3aed] px-2.5 py-1.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[8px] font-semibold text-white">
                          AINOS Trial · Unlock the workspaces your team needs
                        </span>
                        <span className="mt-0.5 block truncate text-[7px] text-purple-200">
                          Every module, one login, one bill.
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[7px] font-semibold text-[#4c1d95]">
                        View plans <ArrowRight className="h-2 w-2" />
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold tracking-tight text-gray-900">Your Workspaces</p>
                        <p className="truncate text-[7.5px] text-gray-500">Open the tools your team uses each day</p>
                      </div>
                      <span className="hidden shrink-0 text-[7px] font-semibold text-[#5b21b6] sm:block">
                        View all →
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-3">
                      {[
                        {
                          name: 'AINOS CRM',
                          body: 'Manage leads, customers and follow-ups.',
                          Icon: Contact2,
                          tools: ['Leads', 'Pipeline'],
                          count: 4,
                        },
                        {
                          name: 'AINOS Supply Chain',
                          body: 'Track stock, orders and vendors.',
                          Icon: Boxes,
                          tools: ['Stock', 'Orders'],
                          count: 4,
                        },
                        {
                          name: 'AINOS People',
                          body: 'Manage staff, attendance and salary.',
                          Icon: Users,
                          tools: ['Staff', 'Payroll'],
                          count: 3,
                        },
                        {
                          name: 'AINOS Support',
                          body: 'Handle customer questions and issues.',
                          Icon: Headphones,
                          tools: ['Tickets', 'Inbox'],
                          count: 3,
                        },
                        {
                          name: 'AINOS Workspace',
                          body: 'Projects, tasks, approvals and reports.',
                          Icon: LayoutGrid,
                          tools: ['Tasks', 'Approvals'],
                          count: 5,
                        },
                        {
                          name: 'AINOS Finance',
                          body: 'Invoices, bills, expenses and GST.',
                          Icon: Wallet,
                          tools: ['Invoices', 'GST'],
                          count: 4,
                        },
                      ].map((card) => (
                        <div key={card.name} className="rounded-lg border border-gray-200/70 bg-white p-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-purple-50 text-[#5b21b6] ring-1 ring-purple-100">
                            <card.Icon className="h-2.5 w-2.5" />
                          </span>
                          <p className="mt-1.5 truncate text-[8.5px] font-semibold text-gray-900">{card.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-[7.5px] leading-[1.35] text-gray-500">{card.body}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {card.tools.map((tool) => (
                              <span
                                key={tool}
                                className="rounded bg-gray-50 px-1 py-0.5 text-[6.5px] font-medium text-gray-500 ring-1 ring-gray-100"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1">
                            <span className="text-[7px] text-gray-400">{card.count} tools</span>
                            <span className="flex items-center gap-0.5 text-[7px] font-semibold text-[#5b21b6]">
                              Open <ArrowRight className="h-1.5 w-1.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating status pills */}
              <div className="absolute left-0 top-14 z-20 hidden w-44 items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-xl shadow-black/30 xl:flex">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold text-gray-800">Invoice approved</span>
                  <span className="block text-[9px] text-gray-400">Finance workspace</span>
                </span>
              </div>
              <div className="absolute left-4 top-36 z-20 hidden w-40 items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-xl shadow-black/30 xl:flex">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50">
                  <Contact2 className="h-3.5 w-3.5 text-[#5b21b6]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold text-gray-800">New lead added</span>
                  <span className="block text-[9px] text-gray-400">AINOS CRM</span>
                </span>
              </div>

              {/* AINOS ONE entity card — stacked under the product window below xl, overlaid on it at xl */}
              <div className="relative z-20 mx-auto mt-6 w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a1150] via-[#1c0a33] to-[#341463] p-5 text-white shadow-xl shadow-black/50 ring-1 ring-white/20 sm:mt-8 xl:absolute xl:-bottom-6 xl:-left-1 xl:mt-0 xl:w-72 xl:max-w-none xl:p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_85%_85%_at_25%_20%,black,transparent)]" />

                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold leading-none text-[#4c1d95] xl:text-[10px]">
                      α
                    </span>
                    <Image
                      src="/ainos-wordmark.png"
                      alt="AINOS"
                      width={76}
                      height={24}
                      className="h-4 w-auto object-contain brightness-0 invert xl:h-3.5"
                    />
                  </div>
                  <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-purple-100 ring-1 ring-white/25 xl:text-[7.5px]">
                    Preview
                  </span>
                </div>

                <div className="relative mt-6 flex items-center gap-2.5">
                  <span
                    className="h-6 w-8 shrink-0 rounded-[4px] bg-gradient-to-br from-[#f1ecfa] to-[#b3a6cc] ring-1 ring-white/40"
                    aria-hidden
                  />
                  <span className="text-[11px] tracking-[0.3em] text-white/45 xl:text-[10px]">•••• ••••</span>
                  <span className="text-[11px] tracking-[0.24em] text-white/85 xl:text-[10px]">0000</span>
                </div>

                <div className="relative mt-6 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-purple-200/70 xl:text-[7.5px]">
                      Entity card
                    </p>
                    <p className="mt-1 truncate text-[15px] font-semibold tracking-[0.1em] xl:text-[13px]">AINOS ONE</p>
                  </div>
                  <span className="shrink-0 text-[8px] font-medium uppercase tracking-[0.16em] text-white/45 xl:text-[7px]">
                    Coming soon
                  </span>
                </div>
              </div>

              {/* Mobile app */}
              <div className="absolute -bottom-6 right-2 z-20 hidden w-40 rounded-[1.9rem] bg-[#150a22] p-1.5 shadow-2xl shadow-black/50 ring-1 ring-white/25 xl:right-0 xl:block xl:w-44">
                <div className="overflow-hidden rounded-[1.55rem] bg-white text-gray-900">
                  <div className="flex items-center justify-between px-3 pb-1 pt-2">
                    <span className="text-[7px] font-semibold text-gray-400">9:41</span>
                    <span className="flex items-center gap-1" aria-hidden>
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                      <span className="h-1 w-3 rounded-sm bg-gray-200" />
                    </span>
                  </div>

                  <div className="space-y-2 px-2.5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white text-[8px] font-semibold leading-none text-[#4c1d95] ring-1 ring-gray-200">
                        α
                      </span>
                      <span className="truncate text-[8px] font-semibold tracking-tight text-gray-900">Business Suite</span>
                      <span className="ml-auto h-4 w-4 shrink-0 rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9]" />
                    </div>

                    <div className="rounded-lg bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] p-2 text-white">
                      <p className="text-[6.5px] uppercase tracking-[0.14em] text-purple-200">AINOS Trial</p>
                      <p className="mt-0.5 text-[9px] font-semibold leading-tight">Unlock every workspace</p>
                      <p className="mt-0.5 text-[6.5px] text-purple-200">View plans →</p>
                    </div>

                    <p className="text-[7px] font-semibold text-gray-900">Your workspaces</p>

                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { name: 'CRM', Icon: Contact2 },
                        { name: 'Finance', Icon: Wallet },
                        { name: 'People', Icon: Users },
                        { name: 'Supply', Icon: Boxes },
                      ].map((tile) => (
                        <div key={tile.name} className="rounded-md border border-gray-100 bg-white p-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-purple-50 text-[#5b21b6]">
                            <tile.Icon className="h-2.5 w-2.5" />
                          </span>
                          <p className="mt-1 truncate text-[7px] font-semibold text-gray-900">{tile.name}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-md border border-gray-100 p-1.5">
                      <p className="text-[6.5px] font-semibold text-gray-500">Today</p>
                      {[
                        { label: 'Invoice created', meta: 'Finance' },
                        { label: 'Lead added', meta: 'CRM' },
                      ].map((row) => (
                        <div key={row.label} className="mt-1 flex items-center justify-between gap-1">
                          <span className="truncate text-[7px] text-gray-700">{row.label}</span>
                          <span className="shrink-0 text-[6px] text-gray-400">{row.meta}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-around border-t border-gray-100 py-1.5">
                    {[LayoutDashboard, Contact2, Wallet, LayoutGrid].map((Icon, iconIndex) => (
                      <Icon key={iconIndex} className={`h-2.5 w-2.5 ${iconIndex === 0 ? 'text-[#4c1d95]' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {ENTERPRISE_PILLARS.map((pillar) => (
              <div key={pillar.title} className="min-w-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 ring-1 ring-purple-100">
                  <pillar.icon className="h-[18px] w-[18px] text-[#5b21b6]" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-gray-950">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ ROLES — BIDIRECTIONAL MARQUEE ───────────────────────── */}
      <section className="overflow-hidden py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              <Layers className="h-3.5 w-3.5" /> Every role
            </p>
            <h2 className="mt-3 text-[25px] font-semibold tracking-tight text-gray-900 sm:text-[30px]">
              Built for the people who run the business
            </h2>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Each team works in the same system instead of passing spreadsheets and screenshots around.
            </p>
          </div>

          {/* Row 1 — scrolls left */}
          <div className="mb-5">
            <div className="flex gap-5 w-max animate-[scroll-left_50s_linear_infinite] hover:[animation-play-state:paused]">
              {[...TEAM_ROLES, ...TEAM_ROLES].map((t, i) => (
                <Link
                  key={`r1-${i}-${t.role}`}
                  href={t.href}
                  className="group w-[min(320px,84vw)] sm:w-[380px] flex-shrink-0 rounded-3xl bg-white border border-gray-100 p-7 shadow-sm transition-colors hover:border-purple-200"
                >
                  <span className="w-11 h-11 rounded-2xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center text-[#5b21b6]">
                    <t.icon className="w-5 h-5" />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">{t.role}</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{t.title}</p>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6]">
                    See how it works <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div>
            <div className="flex gap-5 w-max animate-[scroll-right_50s_linear_infinite] hover:[animation-play-state:paused]">
              {[...TEAM_ROLES, ...TEAM_ROLES].map((t, i) => (
                <Link
                  key={`r2-${i}-${t.role}`}
                  href={t.href}
                  className="group w-[min(320px,84vw)] sm:w-[380px] flex-shrink-0 rounded-3xl bg-white border border-gray-100 p-7 shadow-sm transition-colors hover:border-purple-200"
                >
                  <span className="w-11 h-11 rounded-2xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center text-[#5b21b6]">
                    <t.icon className="w-5 h-5" />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">{t.role}</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{t.title}</p>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6]">
                    See how it works <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
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
      <section className="bg-gray-50/60 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c1d95]">
              <Headphones className="h-3.5 w-3.5" /> FAQ
            </p>
            <h2 className="mt-3 text-[25px] font-semibold tracking-tight text-gray-900 sm:text-[30px]">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Anything not answered here can be asked directly on the contact page.
            </p>
          </div>

          <div className="max-w-4xl space-y-4">
            {HOME_FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={faq.question}
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
                      {faq.question}
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
                            <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            <div className="mt-8 text-center">
              <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b21b6] hover:text-[#4c1d95] transition-colors">
                Read all questions and answers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
