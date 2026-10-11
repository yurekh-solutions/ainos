'use client';

import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Sparkles, ArrowRight, ArrowLeft,
  Check, Loader2, AlertCircle,
  Eye, EyeOff, Building2, FolderCheck, Upload,
  Phone, MapPin, Mail, Lock, User, Briefcase,
  Zap, BarChart3, Users, ShieldCheck, LogIn, Globe
} from 'lucide-react';
import { useState, type ChangeEvent, type ElementType } from 'react';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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

const leftFeatures = [
  { icon: ShieldCheck, title: 'Secure & Encrypted Login', desc: 'Bank-grade security for your data' },
  { icon: Zap, title: 'AI-Powered Automation', desc: 'Smart workflows that save hours' },
  { icon: BarChart3, title: 'Real-time Dashboard Access', desc: 'Live analytics at your fingertips' },
  { icon: FileText, title: 'Smart Invoicing & GST', desc: 'Automated billing and compliance' },
];

const inputBase =
  'w-full h-11 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 ' +
  'placeholder:text-gray-400 outline-none transition ' +
  'focus:border-purple-400 focus:ring-2 focus:ring-purple-100';

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
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
            <Icon className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputBase} ${Icon ? 'pl-11' : 'pl-3'} pr-3`}
          {...rest}
        />
      </div>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const items = ['Account', 'Company', 'Verify'];
  return (
    <div className="flex items-start justify-center w-full mb-6">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-start">
            <div className="flex flex-col items-center w-[72px]">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  active
                    ? 'text-white shadow-md'
                    : done
                      ? 'text-white'
                      : 'bg-white border border-gray-200 text-gray-400'
                }`}
                style={active || done ? { background: '#4c1d95' } : {}}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`mt-1.5 text-[11px] font-medium ${active || done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              <span className={`mt-1 h-0.5 w-6 rounded-full ${active ? 'bg-[#4c1d95]' : 'bg-transparent'}`} />
            </div>
            {i < items.length - 1 && (
              <div className={`h-px w-10 mt-[16px] mx-1 transition-colors duration-300 ${step > n ? 'bg-[#4c1d95]' : 'bg-gray-200'}`} />
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

  const [documents, setDocuments] = useState<Record<string, { filename: string; fileUrl: string }>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  
  const handleFile = async (doc: string, f: File | null) => {
    if (!f) return;
    
    // For now, store temporarily - will upload after company is created
    setDocuments(p => ({ ...p, [doc]: { filename: f.name, fileUrl: '' } }));
  };

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
      // Step 1: Create company first
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, email: userEmail, phone: userPhone, password, 
          companyName, companyType, companyEmail, companyPhone, 
          companyAddress, country, gstNumber: gstNumber || undefined, 
          documents: {} // Empty initially
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      
      const companyId = data.company.id;
      
      // Step 2: Upload documents if any
      const uploadedDocs: Record<string, { filename: string; fileUrl: string }> = {};
      for (const [docName, docData] of Object.entries(documents)) {
        if (docData.filename) {
          // Find the original file from the input
          const fileInput = document.querySelector(`input[data-doc-name="${docName}"]`) as HTMLInputElement;
          const file = fileInput?.files?.[0];
          
          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('docType', docName);
            formData.append('companyId', companyId);
            
            const uploadRes = await fetch('/api/upload-document', {
              method: 'POST',
              body: formData,
            });
            
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              uploadedDocs[docName] = {
                filename: docData.filename,
                fileUrl: uploadData.fileUrl,
              };
            }
          }
        }
      }
      
      // Step 3: Update company with uploaded documents
      if (Object.keys(uploadedDocs).length > 0) {
        await fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadedDocs }),
        });
      }
      
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
    <div className="min-h-screen bg-[#f8f7fc]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* ===== LEFT — Branding & Info Cards ===== */}
          <div className="space-y-6">
            {/* Brand Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#4c1d95' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ainos.jpg" alt="AINOS" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">AINOS</h1>
                  <p className="text-xs text-gray-500 font-medium">Where Intelligence Meets Business</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Start your journey with AINOS — one intelligent platform for invoices, customers, inventory, HR, and AI automation.
              </p>
            </motion.div>

            {/* New Supplier / Onboarding Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#4c1d95' }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">New Business?</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Join growing businesses using AI-powered invoicing, CRM, and automation. Quick approval process!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: '#4c1d95' }}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Quick Onboarding
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Cards */}
            <div className="space-y-3">
              {leftFeatures.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,29,149,0.08)' }}>
                    <f.icon className="w-5 h-5" style={{ color: '#4c1d95' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ===== RIGHT — Registration Form Card ===== */}
          <div className="lg:sticky lg:top-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-gray-50">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}>
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Business Registration</h2>
                <p className="text-sm text-gray-500">Create your account and register your company</p>
              </div>

              {/* Top link */}
              <div className="flex justify-end px-6 sm:px-8 pt-4">
                <span className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="font-semibold inline-flex items-center gap-1 hover:underline" style={{ color: '#6d28d9' }}>
                    Sign in <ArrowRight className="w-3 h-3" />
                  </Link>
                </span>
              </div>

              {/* Card Body */}
              <div className="px-6 sm:px-8 py-6">
                {success ? (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">Company Registered!</h3>
                    <p className="text-sm text-gray-500">Setting up your workspace...</p>
                  </motion.div>
                ) : (
                  <>
                    <Steps step={step} />

                    <AnimatePresence mode="wait">
                      {/* STEP 1 — Account */}
                      {step === 1 && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                          <div className="mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Create your account</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Start your journey with AINOS</p>
                          </div>

                          <div className="space-y-4">
                            {/* Google */}
                            <motion.button
                              whileTap={{ scale: 0.995 }}
                              onClick={() => signIn('google', { callbackUrl: '/' })}
                              disabled={loading}
                              className="w-full h-11 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 border border-gray-200 disabled:opacity-60"
                            >
                              {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" style={{ color: '#4c1d95' }} /> : <><GoogleIcon /> Continue with Google</>}
                            </motion.button>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-gray-200" />
                              <span className="text-[10px] tracking-[0.2em] text-gray-400 font-medium">OR</span>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <Field icon={User} label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                            <Field icon={Mail} label="Email Address" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="john@company.com" />
                            <Field icon={Phone} label="Phone Number" type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+91 98765 43210" />

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                                  <Lock className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                                </div>
                                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                                  className={`${inputBase} pl-11 pr-10`} />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw ? 'Hide password' : 'Show password'}>
                                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                                  <Lock className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                                </div>
                                <input type={showPw2 ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                                  className={`${inputBase} pl-11 pr-10`} />
                                <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw2 ? 'Hide password' : 'Show password'}>
                                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            {error && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                              </motion.div>
                            )}

                            <motion.button
                              type="button"
                              onClick={goNext}
                              whileTap={{ scale: 0.995 }}
                              className="w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                              style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}
                            >
                              Create Account <ArrowRight className="h-4 w-4" />
                            </motion.button>

                            <p className="text-center text-[11px] leading-relaxed text-gray-400 pt-1">
                              By creating an account, you agree to our{' '}
                              <a href="#" className="hover:underline" style={{ color: '#6d28d9' }}>Terms</a>
                              {' & '}
                              <a href="#" className="hover:underline" style={{ color: '#6d28d9' }}>Privacy Policy</a>.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2 — Company */}
                      {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                          <div className="mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Company details</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Tell us about your business</p>
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
                                      className={`h-auto py-2.5 px-2 rounded-xl border text-[12px] font-medium transition-all text-center flex flex-col items-center gap-1 ${selected ? 'text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                                      style={selected ? { background: '#4c1d95', borderColor: '#4c1d95' } : {}}
                                    >
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
                                <div className="absolute left-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                                  <MapPin className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                                </div>
                                <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Business Park, Sector 5, Gurugram" rows={2}
                                  className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
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
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                              </motion.div>
                            )}

                            <div className="flex gap-3 pt-1">
                              <button type="button" onClick={() => setStep(1)}
                                className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" /> Back
                              </button>
                              <button type="button" onClick={goNext}
                                className="flex-[2] h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                                style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}>
                                Continue <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3 — Documents & Review */}
                      {step === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                          <div className="mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Documents &amp; Review</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{companyType ? `Required for ${ctLabel}` : 'Select a company type first'}</p>
                          </div>

                          <div className="space-y-4">
                            {docs.length > 0 && (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {docs.map(d => {
                                  const uploaded = documents[d.name];
                                  return (
                                    <div key={d.name} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#4c1d95' }} />
                                        <div className="min-w-0">
                                          <p className="text-[13px] font-medium text-gray-800 truncate">{d.name}</p>
                                          {d.optional && <p className="text-[11px] text-gray-400">Optional</p>}
                                        </div>
                                      </div>
                                      <label className="flex-shrink-0 ml-2 cursor-pointer">
                                        <input type="file" className="hidden" data-doc-name={d.name} onChange={e => handleFile(d.name, e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${uploaded ? 'bg-green-50 text-green-700 border border-green-200' : 'text-white border'}`}
                                          style={uploaded ? {} : { background: '#4c1d95', borderColor: '#4c1d95' }}>
                                          {uploaded ? <><Check className="w-3.5 h-3.5" /><span className="hidden sm:inline max-w-[80px] truncate">{documents[d.name]?.filename}</span><span className="sm:hidden">Done</span></> : <><Upload className="w-3.5 h-3.5" />Upload</>}
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

                            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                              <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: '#4c1d95' }}>Summary</h4>
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
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                              </motion.div>
                            )}

                            <div className="flex gap-3 pt-1">
                              <button type="button" onClick={() => setStep(2)}
                                className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" /> Back
                              </button>
                              <button type="button" onClick={submit} disabled={loading}
                                className="flex-[2] h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}>
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
                  </>
                )}
              </div>
            </motion.div>

            {/* Mobile: Already have account */}
            <p className="lg:hidden text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold" style={{ color: '#6d28d9' }}>Sign in</Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mt-8"
        >
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            Trusted by <span className="font-semibold" style={{ color: '#6d28d9' }}>10,000+</span> businesses worldwide
          </span>
        </motion.div>
      </div>
    </div>
  );
}
