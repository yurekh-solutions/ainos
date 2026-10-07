'use client';

import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Caveat } from 'next/font/google';
import {
  FileText, Sparkles, ArrowRight, ArrowLeft,
  Check, Loader2, AlertCircle,
  Eye, EyeOff, Building2, FolderCheck, Upload,
  Phone, MapPin, Mail, Lock, User, Briefcase,
  Zap, BarChart3, Users, ShieldCheck
} from 'lucide-react';
import { useState, type ChangeEvent, type ElementType } from 'react';
import Link from 'next/link';

const caveat = Caveat({ subsets: ['latin'], weight: ['600'], display: 'swap' });

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* Dark-violet "A" triangle mark, recreated in SVG (no image asset) */
const LogoMark = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path d="M12 3.5 21 20.5 H3 Z" fill="#2a0e5c" />
    <path d="M12 10.2 15.4 17 H8.6 Z" fill="#ffffff" />
  </svg>
);

const COMPANY_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship', icon: User },
  { value: 'partnership', label: 'Partnership', icon: Users },
  { value: 'llp', label: 'LLP', icon: Building2 },
  { value: 'pvt_ltd', label: 'Pvt Ltd', icon: Briefcase },
  { value: 'public_ltd', label: 'Public Ltd', icon: BarChart3 },
  { value: 'opc', label: 'OPC', icon: Zap },
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Singapore', 'UAE', 'Germany', 'France', 'Japan', 'China', 'Brazil',
  'South Africa', 'Nigeria', 'Indonesia', 'Mexico', 'Other'
];

const DOCUMENT_REQUIREMENTS: Record<string, { name: string; optional?: boolean }[]> = {
  proprietorship: [
    { name: 'PAN Card' },
    { name: 'Aadhaar Card' },
    { name: 'Address Proof (Utility Bill / Rent Agreement)' },
    { name: 'Business Registration Certificate', optional: true },
  ],
  partnership: [
    { name: 'Partnership Deed' },
    { name: 'PAN Card of Firm' },
    { name: 'PAN Card of All Partners' },
    { name: 'Address Proof of Firm' },
  ],
  llp: [
    { name: 'Certificate of Incorporation' },
    { name: 'LLP Agreement' },
    { name: 'PAN Card of LLP' },
    { name: 'Address Proof of Registered Office' },
    { name: 'Director ID Proof (All Partners)', optional: true },
  ],
  pvt_ltd: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)' },
    { name: 'PAN Card of Company' },
    { name: 'Director ID Proof (All Directors)' },
    { name: 'Registered Office Address Proof' },
  ],
  public_ltd: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)' },
    { name: 'PAN Card of Company' },
    { name: 'Director ID Proof (All Directors)' },
    { name: 'Share Capital Details' },
    { name: 'Registered Office Address Proof' },
  ],
  opc: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)' },
    { name: 'PAN Card of Company' },
    { name: 'Nominee Details & Consent' },
    { name: 'Director ID Proof' },
  ],
};

const HERO_FEATURES = [
  { icon: Zap, line1: 'Automate', line2: 'Your Workflows' },
  { icon: BarChart3, line1: 'Track', line2: 'Your Growth' },
  { icon: ShieldCheck, line1: 'Secure', line2: 'Reliable' },
  { icon: Users, line1: 'Multiple', line2: 'Users' },
];

const PILL_CHIPS = [
  { icon: Zap, text: 'AI Automation' },
  { icon: BarChart3, text: 'Analytics' },
  { icon: FileText, text: 'GST Billing' },
  { icon: Users, text: 'Multi-User' },
];

const dotGrid = (color: string) => ({
  backgroundImage: `radial-gradient(circle, ${color} 1.2px, transparent 1.2px)`,
  backgroundSize: '11px 11px',
});

const inputBase =
  'w-full h-11 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 ' +
  'placeholder:text-gray-400 outline-none transition ' +
  'focus:border-violet-500 focus:ring-2 focus:ring-violet-100';

const gradientBtn =
  'rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c4fef] hover:to-[#6d28d9] ' +
  'text-white text-sm font-semibold shadow-lg shadow-violet-600/25 transition-all ' +
  'flex items-center justify-center gap-2';

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, className = '', ...rest }: {
  icon?: ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  [k: string]: unknown;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputBase} ${Icon ? 'pl-10' : 'pl-3'} pr-3`}
          {...rest}
        />
      </div>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const items = ['Account', 'Company', 'Verify'];
  return (
    <div className="flex items-start justify-center w-full mb-8">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-start">
            <div className="flex flex-col items-center w-[76px]">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/35'
                    : done
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-500'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`mt-2 text-xs font-medium ${active || done ? 'text-violet-600' : 'text-gray-500'}`}>{label}</span>
              <span className={`mt-1 h-0.5 w-7 rounded-full ${active ? 'bg-violet-600' : 'bg-transparent'}`} />
            </div>
            {i < items.length - 1 && (
              <div className={`h-px w-14 xl:w-16 mt-[18px] mx-1 transition-colors duration-300 ${step > n ? 'bg-violet-400' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [gstNumber, setGstNumber] = useState('');

  const [documents, setDocuments] = useState<Record<string, string>>({});
  const handleFile = (doc: string, f: File | null) => { if (f) setDocuments(p => ({ ...p, [doc]: f.name })); };

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!name || !userEmail || !password || !confirmPassword) { setError('All fields are required'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) { setError('Please enter a valid email'); return; }
    }
    if (step === 2) {
      if (!companyName || !companyType || !companyEmail || !companyPhone || !companyAddress) { setError('All required fields must be filled'); return; }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: userEmail, phone: userPhone, password, companyName, companyType, companyEmail, companyPhone, companyAddress, country, gstNumber: gstNumber || undefined, documents }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      setSuccess(true);
      setTimeout(async () => {
        const r = await signIn('credentials', { email: userEmail, password, redirect: false });
        window.location.href = r?.ok ? '/' : '/auth/signin';
      }, 1500);
    } catch { setError('Registration failed. Please try again.'); setLoading(false); }
  };

  const docs = companyType ? (DOCUMENT_REQUIREMENTS[companyType] || []) : [];
  const ctLabel = COMPANY_TYPES.find(c => c.value === companyType)?.label;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#eef0f6] flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      {/* Soft page blobs */}
      <div className="pointer-events-none absolute -top-32 left-[10%] w-[480px] h-[480px] rounded-full bg-white blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-[#d9d2f0] blur-3xl opacity-60" />
      <div className="pointer-events-none absolute -bottom-40 left-[28%] w-[520px] h-[520px] rounded-full bg-white blur-3xl opacity-60" />

      {/* Floating auth card */}
      <div className="relative w-full max-w-[1200px] min-h-[85vh] rounded-md overflow-hidden shadow-2xl shadow-violet-950/25 bg-white flex flex-col lg:flex-row">
        {/* ============ LEFT — DARK VIOLET HERO ============ */}
        <div
          className="hidden lg:flex lg:w-[47%] relative flex-col overflow-hidden px-8 xl:px-10 py-9"
          style={{ background: 'linear-gradient(135deg, #3d1a7b 0%, #4c1d95 48%, #2a0e5c 100%)' }}
        >
          {/* Radial violet glows */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-violet-500/40 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-violet-500/30 blur-3xl" />

          {/* Curved wave arcs — top-left & bottom-right */}
          <svg className="pointer-events-none absolute -top-24 -left-28 w-[460px] h-[460px]" viewBox="0 0 460 460" fill="none" aria-hidden="true">
            <path d="M40 460 C 70 260, 200 110, 460 60" stroke="#7c3aed" strokeOpacity="0.35" strokeWidth="80" />
            <path d="M0 420 C 50 240, 180 100, 430 20" stroke="#a78bfa" strokeOpacity="0.30" strokeWidth="26" />
          </svg>
          <svg className="pointer-events-none absolute -bottom-24 -right-28 w-[460px] h-[460px] rotate-180" viewBox="0 0 460 460" fill="none" aria-hidden="true">
            <path d="M40 460 C 70 260, 200 110, 460 60" stroke="#6d28d9" strokeOpacity="0.40" strokeWidth="80" />
            <path d="M0 420 C 50 240, 180 100, 430 20" stroke="#8b5cf6" strokeOpacity="0.28" strokeWidth="26" />
          </svg>

          {/* Faint dot grids — mid-left & right edge */}
          <div className="pointer-events-none absolute left-5 top-[54%] h-24 w-20 opacity-[0.10]" style={dotGrid('#ffffff')} />
          <div className="pointer-events-none absolute right-4 top-[26%] h-28 w-14 opacity-[0.08]" style={dotGrid('#ffffff')} />

          <div className="relative z-10 flex flex-col h-full">
            {/* Top row: logo + script tagline */}
            <div className="flex items-start justify-between">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-white shadow-lg shadow-black/25 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ainos.jpg" alt="AINOS" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-wide text-white leading-none">AINOS</h1>
                  <p className="mt-1 text-[10px] tracking-[0.25em] text-purple-200/80 font-medium leading-none">BUSINESS SUITE</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-right pt-1 pr-1">
                <p className={`${caveat.className} text-2xl leading-none text-purple-200`}>Build &#8226; Automate &#8226; Grow</p>
                <svg viewBox="0 0 160 12" className="mt-1 ml-auto h-3 w-32" fill="none" aria-hidden="true">
                  <path d="M6 9 C 44 3, 96 2, 154 6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>
            </div>

            {/* Headline + subcopy */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10">
              <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1]">
                <span className="text-white">Start Your</span>
                <br />
                <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#67e8f9] bg-clip-text text-transparent">Business</span>
              </h2>
              <p className="mt-4 text-sm text-purple-100/80 max-w-xs leading-relaxed">
                One intelligent platform for invoices, customers &amp; growth.
              </p>
            </motion.div>

            {/* Feature row */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              {HERO_FEATURES.map(f => (
                <div key={f.line1} className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-white text-xs font-semibold whitespace-nowrap">{f.line1}</p>
                    <p className="text-purple-200/70 text-[11px] whitespace-nowrap">{f.line2}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Illustration */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 min-h-0 flex items-center justify-center py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/aino.png" alt="AINOS Platform" className="w-full max-w-md mx-auto object-contain drop-shadow-[0_0_45px_rgba(167,139,250,0.45)]" />
            </motion.div>

            {/* Bottom pill bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-full shadow-xl px-6 py-3 flex items-center justify-center gap-4 xl:gap-6">
              {PILL_CHIPS.map(f => (
                <div key={f.text} className="flex items-center gap-1.5">
                  <f.icon className="h-4 w-4 text-violet-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{f.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ============ RIGHT — LIGHT LAVENDER FORM ============ */}
        <div className="relative w-full lg:w-[53%] bg-[#f5f2fb] overflow-y-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-10">
          {/* Soft white blobs + dot grid on right edge */}
          <div className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white blur-3xl opacity-70" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl opacity-60" />
          <div className="pointer-events-none absolute right-6 top-[30%] h-24 w-16 opacity-40" style={dotGrid('rgba(109,40,217,0.35)')} />

          <div className="relative z-10 w-full max-w-[440px] mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-[#4c1d95] to-[#2a0e5c] shadow-lg shadow-violet-900/25 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="M12 3.5 21 20.5 H3 Z" fill="#ffffff" />
                  <path d="M12 10.2 15.4 17 H8.6 Z" fill="#4c1d95" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide text-gray-900 leading-none">AINOS</h1>
                <p className="mt-1 text-[10px] tracking-[0.25em] text-violet-600/80 font-medium leading-none">BUSINESS SUITE</p>
              </div>
            </div>

            {/* Top link */}
            <div className="flex justify-end mb-6">
              <span className="text-xs text-gray-500">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-violet-600 font-semibold inline-flex items-center gap-1 hover:text-violet-700 transition-colors">
                  Sign in <ArrowRight className="w-3 h-3" />
                </Link>
              </span>
            </div>

            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1.5">Company Registered!</h3>
                <p className="text-sm text-gray-400">Setting up your workspace...</p>
              </motion.div>
            ) : (
              <>
                <Steps step={step} />

                <AnimatePresence mode="wait">
                  {/* STEP 1 */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">Create your account</h2>
                        <p className="text-sm text-gray-400">Start your journey with AINOS</p>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.995 }}
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        disabled={loading}
                        className="w-full h-11 rounded-lg bg-[#edeaf7] hover:bg-[#e3def2] transition-colors flex items-center justify-center gap-3 text-sm font-semibold text-gray-800 disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin text-violet-600" /> : <><GoogleIcon /> Continue with Google</>}
                      </motion.button>

                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] tracking-[0.2em] text-gray-400 font-medium">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <div className="space-y-4">
                        <Field icon={User} label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                        <Field icon={Mail} label="Email Address" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="john@company.com" />
                        <Field icon={Phone} label="Phone Number" type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+91 98765 43210" />

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                              className={`${inputBase} pl-10 pr-10`} />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw ? 'Hide password' : 'Show password'}>
                              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input type={showPw2 ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                              className={`${inputBase} pl-10 pr-10`} />
                            <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw2 ? 'Hide password' : 'Show password'}>
                              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <motion.button
                          type="button"
                          onClick={goNext}
                          whileTap={{ scale: 0.995 }}
                          className={`${gradientBtn} w-full h-11`}
                        >
                          Create Account <ArrowRight className="h-4 w-4" />
                        </motion.button>

                        <p className="text-center text-[11px] leading-relaxed text-gray-400 pt-1">
                          By creating an account, you agree to our{' '}
                          <a href="#" className="text-violet-600 hover:underline">Terms</a>
                          {' & '}
                          <a href="#" className="text-violet-600 hover:underline">Privacy Policy</a>.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">Company details</h2>
                        <p className="text-sm text-gray-400">Tell us about your business</p>
                      </div>

                      <div className="space-y-4">
                        <Field icon={Briefcase} label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Industries Pvt Ltd" />

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Company Type</label>
                          <div className="grid grid-cols-3 gap-2">
                            {COMPANY_TYPES.map(ct => {
                              const Icon = ct.icon;
                              const selected = companyType === ct.value;
                              return (
                                <button key={ct.value} type="button" onClick={() => { setCompanyType(ct.value); setDocuments({}); }}
                                  className={`h-auto py-2.5 px-2 rounded-lg border text-[12px] font-medium transition-all text-center flex flex-col items-center gap-1 ${selected ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'}`}>
                                  <Icon className="w-4 h-4" />
                                  {ct.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field icon={Mail} label="Company Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="info@acme.com" />
                          <Field icon={Phone} label="Company Phone" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+91 11 2345 6789" />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                            <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Business Park, Sector 5, Gurugram" rows={2}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition resize-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Country</label>
                            <select value={country} onChange={e => setCountry(e.target.value)}
                              className={`${inputBase} px-3 appearance-none cursor-pointer`}>
                              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">GST Number <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15}
                              className={`${inputBase} px-3 font-mono`} />
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button type="button" onClick={() => setStep(1)}
                            className="flex-1 h-11 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button type="button" onClick={goNext}
                            className={`${gradientBtn} flex-[2] h-11`}>
                            Continue <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">Documents &amp; Review</h2>
                        <p className="text-sm text-gray-400">{companyType ? `Required for ${ctLabel}` : 'Select a company type first'}</p>
                      </div>

                      <div className="space-y-4">
                        {docs.length > 0 && (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {docs.map(d => {
                              const uploaded = documents[d.name];
                              return (
                                <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <FileText className="w-4 h-4 text-violet-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-medium text-gray-800 truncate">{d.name}</p>
                                      {d.optional && <p className="text-[11px] text-gray-400">Optional</p>}
                                    </div>
                                  </div>
                                  <label className="flex-shrink-0 ml-2 cursor-pointer">
                                    <input type="file" className="hidden" onChange={e => handleFile(d.name, e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${uploaded ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'}`}>
                                      {uploaded ? <><Check className="w-3.5 h-3.5" /><span className="hidden sm:inline max-w-[80px] truncate">{documents[d.name]}</span><span className="sm:hidden">Done</span></> : <><Upload className="w-3.5 h-3.5" />Upload</>}
                                    </div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {docs.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <FolderCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-[13px]">Go back and select a company type</p>
                          </div>
                        )}

                        <div className="p-4 rounded-xl border border-gray-200 bg-white">
                          <h4 className="text-[11px] font-semibold text-violet-600 uppercase tracking-[0.14em] mb-3">Summary</h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                            <div><span className="text-gray-500">Name:</span> <span className="ml-1.5 font-medium text-gray-900">{name}</span></div>
                            <div><span className="text-gray-500">Email:</span> <span className="ml-1.5 font-medium text-gray-900 truncate">{userEmail}</span></div>
                            <div><span className="text-gray-500">Company:</span> <span className="ml-1.5 font-medium text-gray-900">{companyName}</span></div>
                            <div><span className="text-gray-500">Type:</span> <span className="ml-1.5 font-medium text-gray-900">{ctLabel || '—'}</span></div>
                            <div><span className="text-gray-500">Country:</span> <span className="ml-1.5 font-medium text-gray-900">{country}</span></div>
                            <div><span className="text-gray-500">GST:</span> <span className="ml-1.5 font-medium text-gray-900 font-mono">{gstNumber || '—'}</span></div>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button type="button" onClick={() => setStep(2)}
                            className="flex-1 h-11 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button type="button" onClick={submit} disabled={loading}
                            className={`${gradientBtn} flex-[2] h-11 disabled:opacity-60`}>
                            {loading
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                              : <><Sparkles className="w-4 h-4" /> Create Company <ArrowRight className="w-4 h-4" /></>
                            }
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="lg:hidden text-center text-[13px] text-gray-500 mt-8">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-violet-600 font-semibold">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
