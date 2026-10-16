'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ArrowRight, ArrowLeft,
  Check, Loader2, AlertCircle,
  Eye, EyeOff, Building2, FolderCheck, Upload,
  Phone, MapPin, Mail, Lock, User, Briefcase,
  Zap, BarChart3, Users, ShieldCheck, LogIn, Globe, UserPlus, Shield
} from 'lucide-react';
import { useState, type ChangeEvent, type ElementType } from 'react';
import Link from 'next/link';

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

// ─── GST Auto-Detection ─────────────────────────────────────────────────
// GST format (15 chars): [0-1] State code | [2-11] PAN | [12] Entity |
// [13] 'Z' | [14] Check digit
// PAN[3] (GST index 5) indicates the legal entity type.
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'DNH & Daman Diu', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

const PAN_ENTITY_MAP: Record<string, string> = {
  P: 'proprietorship', H: 'proprietorship',
  C: 'pvt_ltd',
  F: 'llp',
  A: 'partnership', T: 'partnership', B: 'partnership',
  L: 'public_ltd', J: 'public_ltd', G: 'public_ltd',
};

function parseGst(gst: string): { stateName: string; entityType: string; entityLabel: string } | null {
  const cleaned = gst.trim().toUpperCase();
  if (!GST_REGEX.test(cleaned)) return null;
  const stateName = GST_STATE_CODES[cleaned.slice(0, 2)];
  const entityType = PAN_ENTITY_MAP[cleaned.charAt(5)];
  if (!stateName || !entityType) return null;
  const entityLabel = COMPANY_TYPES.find(c => c.value === entityType)?.label || entityType;
  return { stateName, entityType, entityLabel };
}

const DOCUMENT_REQUIREMENTS: Record<string, { name: string; optional?: boolean }[]> = {
  proprietorship: [
    { name: 'PAN Card' },
    { name: 'Aadhaar Card' },
    { name: 'Address Proof (Utility Bill / Rent Agreement)', optional: true },
    { name: 'Business Registration Certificate', optional: true },
  ],
  partnership: [
    { name: 'Partnership Deed' },
    { name: 'PAN Card of Firm' },
    { name: 'PAN Card of All Partners', optional: true },
    { name: 'Address Proof of Firm', optional: true },
  ],
  llp: [
    { name: 'Certificate of Incorporation' },
    { name: 'LLP Agreement' },
    { name: 'PAN Card of LLP', optional: true },
    { name: 'Address Proof of Registered Office', optional: true },
    { name: 'Director ID Proof (All Partners)', optional: true },
  ],
  pvt_ltd: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)', optional: true },
    { name: 'PAN Card of Company', optional: true },
    { name: 'Director ID Proof (All Directors)', optional: true },
    { name: 'Registered Office Address Proof', optional: true },
  ],
  public_ltd: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)', optional: true },
    { name: 'PAN Card of Company', optional: true },
    { name: 'Director ID Proof (All Directors)', optional: true },
    { name: 'Share Capital Details', optional: true },
    { name: 'Registered Office Address Proof', optional: true },
  ],
  opc: [
    { name: 'Certificate of Incorporation' },
    { name: 'MOA (Memorandum of Association)' },
    { name: 'AOA (Articles of Association)', optional: true },
    { name: 'PAN Card of Company', optional: true },
    { name: 'Nominee Details & Consent', optional: true },
    { name: 'Director ID Proof', optional: true },
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
    <div className="flex items-start justify-center w-full mb-6 overflow-hidden">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-start">
            <div className="flex flex-col items-center w-[56px] sm:w-[72px]">
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
              <div className={`h-px w-6 sm:w-10 mt-[16px] mx-1 sm:mx-1 transition-colors duration-300 ${step > n ? 'bg-[#4c1d95]' : 'bg-gray-200'}`} />
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
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

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
  const [gstInfo, setGstInfo] = useState<{ stateName: string; entityType: string; entityLabel: string } | null>(null);
  const [fetchingGst, setFetchingGst] = useState(false);
  
  // Captcha states for GST verification
  const [captchaSessionId, setCaptchaSessionId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState('');

  const handleGstChange = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstNumber(cleaned);
    // Reset captcha states when GST changes
    setShowCaptcha(false);
    setCaptchaImage('');
    setCaptchaSessionId('');
    setCaptchaText('');
    setGstVerified(false);
    setGstError('');
    
    if (cleaned.length === 15) {
      const parsed = parseGst(cleaned);
      if (parsed) {
        setGstInfo(parsed);
        setCountry('India');
        if (parsed.entityType !== companyType) {
          setCompanyType(parsed.entityType);
          setDocuments({});
          setDocPreviews({});
          setPreviewDoc(null);
        }
        // Fetch captcha for GST verification
        fetchCaptcha(cleaned);
        return;
      }
    }
    setGstInfo(null);
  };

  const fetchCaptcha = async (gst: string) => {
    if (gst.length !== 15) return;
    setFetchingGst(true);
    setGstError('');
    try {
      const res = await fetch('/api/gst-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCaptcha', gstNumber: gst }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCaptchaSessionId(data.sessionId);
          setCaptchaImage(data.captchaImage);
          setShowCaptcha(true);
        } else {
          setGstError(data.error || 'Failed to load captcha');
        }
      } else {
        const data = await res.json();
        setGstError(data.error || 'Failed to connect to GST service');
      }
    } catch (err) {
      setGstError('Failed to connect to GST service. Make sure Flask server is running.');
      console.error('Captcha fetch failed:', err);
    } finally {
      setFetchingGst(false);
    }
  };

  const verifyGstWithCaptcha = async () => {
    if (!captchaSessionId || !captchaText.trim()) return;
    setVerifyingGst(true);
    setGstError('');
    try {
      const res = await fetch('/api/gst-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyGST',
          sessionId: captchaSessionId,
          gstNumber,
          captchaText: captchaText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Auto-fill all fields from real GSTN data
        if (data.companyName) setCompanyName(data.companyName);
        if (data.tradeName && !companyName) setCompanyName(data.tradeName);
        if (data.address) setCompanyAddress(data.address);
        if (data.entityType && data.entityType !== companyType) setCompanyType(data.entityType);
        setGstVerified(true);
        setShowCaptcha(false);
      } else {
        setGstError(data.error || 'GST verification failed. Please check captcha and try again.');
        // Refresh captcha on failure
        if (gstNumber.length === 15) fetchCaptcha(gstNumber);
      }
    } catch (err) {
      setGstError('Verification failed. Please try again.');
      console.error('GST verify failed:', err);
    } finally {
      setVerifyingGst(false);
    }
  };

  const [documents, setDocuments] = useState<Record<string, { filename: string; fileUrl: string }>>({});
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  
  const handleFile = async (doc: string, f: File | null) => {
    if (!f) return;

    if (!/\.pdf$/i.test(f.name)) {
      setToast({ msg: 'Only PDF files are allowed', type: 'error' });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (f.size > 1024 * 1024) {
      setToast({ msg: 'File size must be less than 1MB', type: 'error' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // Store temporarily — uploaded to Cloudinary after company is created.
    // Keep a local blob URL so the user can preview the document immediately.
    const blobUrl = URL.createObjectURL(f);
    setDocPreviews(p => ({ ...p, [doc]: blobUrl }));
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
    // Scroll to top on mobile when step changes
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submit = async () => {
    setError(null);

    // Validate mandatory documents before submit
    const mandatoryDocs = docs.filter(d => !d.optional);
    const missingMandatory = mandatoryDocs.filter(d => !documents[d.name]);
    if (missingMandatory.length > 0) {
      setToast({ msg: `Please upload all required documents: ${missingMandatory.map(d => d.name).join(', ')}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

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
      const uploadToken = data.uploadToken || '';

      // Step 2: Upload documents (x-upload-token: pre-approval uploads have no session yet)
      const uploadedDocs: Record<string, { filename: string; fileUrl: string }> = {};
      const failedDocs: string[] = [];
      for (const [docName, docData] of Object.entries(documents)) {
        if (docData.filename) {
          const fileInput = document.querySelector(`input[data-doc-name="${docName}"]`) as HTMLInputElement;
          const file = fileInput?.files?.[0];

          if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('docType', docName);
            formData.append('companyId', companyId);

            const uploadRes = await fetch('/api/upload-document', {
              method: 'POST',
              headers: { 'x-upload-token': uploadToken },
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              uploadedDocs[docName] = {
                filename: docData.filename,
                fileUrl: uploadData.fileUrl,
              };
            } else {
              failedDocs.push(docName);
            }
          }
        }
      }

      if (failedDocs.length > 0) {
        setToast({ msg: `Failed to upload: ${failedDocs.join(', ')} — admin may ask for these again.`, type: 'error' });
        setTimeout(() => setToast(null), 6000);
      }

      // Step 3: Update company with uploaded documents
      if (Object.keys(uploadedDocs).length > 0) {
        await fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-upload-token': uploadToken },
          body: JSON.stringify({ uploadedDocs }),
        });
      }
      
      setSuccess(true);
      setLoading(false);
    } catch { setError('Registration failed. Please try again.'); setLoading(false); }
  };

  const docs = companyType ? (DOCUMENT_REQUIREMENTS[companyType] || []) : [];
  const ctLabel = COMPANY_TYPES.find(c => c.value === companyType)?.label;

  return (
    <div className="min-h-screen bg-[#f8f7fc] overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
              <p className="text-sm font-medium leading-snug">{toast.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal — Admin Review Pending */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>
                <FolderCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
              <p className="text-sm text-gray-500 mb-1">
                Your documents have been sent for admin review.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You will be able to login once your account is approved.
              </p>
              <button
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}
              >
                <LogIn className="w-4 h-4" /> Go to Sign In
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">

          {/* ===== LEFT — Branding & Info Cards (desktop only: form comes first on mobile) ===== */}
          <div className="space-y-6 hidden lg:block">
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
                  <UserPlus className="w-5 h-5 text-white" />
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
              className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-lg overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center border-b border-gray-50">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}>
                  <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Business Registration</h2>
                <p className="text-xs sm:text-sm text-gray-500">Create your account and register your company</p>
              </div>

              {/* Top link */}
              <div className="flex justify-center px-4 sm:px-8 pt-3 sm:pt-4">
                <span className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="font-semibold inline-flex items-center gap-1 hover:underline" style={{ color: '#6d28d9' }}>
                    Sign in <ArrowRight className="w-3 h-3" />
                  </Link>
                </span>
              </div>

              {/* Card Body */}
              <div className="px-4 sm:px-8 py-4 sm:py-6">
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
                              <Link href="/terms" className="hover:underline" style={{ color: '#6d28d9' }}>Terms of Service</Link>
                              {' & '}
                              <Link href="/privacy" className="hover:underline" style={{ color: '#6d28d9' }}>Privacy Policy</Link>.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2 — Company */}
                      {step === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                          <div className="mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">Company details</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Tell us about your business</p>
                          </div>

                          <div className="space-y-3.5">
                            {/* GST Number - TOP FIELD */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                GST Number <span className="text-gray-400 font-normal">(enter to auto-fill)</span>
                              </label>
                              <input type="text" value={gstNumber} onChange={e => handleGstChange(e.target.value)} placeholder="22AAAAA0000A1Z5" maxLength={15}
                                className={`${inputBase} px-3 font-mono`} />
                            </div>

                            {fetchingGst && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                                <p className="text-[13px] text-blue-700">
                                  <span className="font-semibold">Loading GST captcha...</span>
                                </p>
                              </motion.div>
                            )}

                            {gstError && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">
                                  <span className="font-semibold">Error:</span> {gstError}
                                </p>
                              </motion.div>
                            )}

                            {showCaptcha && captchaImage && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-blue-600" />
                                  <p className="text-sm font-semibold text-blue-900">GST Verification Required</p>
                                </div>
                                <p className="text-xs text-gray-600">Please enter the captcha shown below to verify your GST number and auto-fill company details.</p>
                                <div className="flex flex-col items-center gap-3">
                                  <img src={captchaImage} alt="GST Captcha" className="border-2 border-gray-300 rounded-lg bg-white" />
                                  <input type="text" value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                                    placeholder="Enter captcha text"
                                    className={`${inputBase} px-3 text-center font-mono tracking-widest`}
                                    onKeyDown={e => e.key === 'Enter' && verifyGstWithCaptcha()} />
                                  <button type="button" onClick={verifyGstWithCaptcha} disabled={verifyingGst || !captchaText.trim()}
                                    className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}>
                                    {verifyingGst ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><Shield className="w-4 h-4" /> Verify & Auto-Fill</>}
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {gstVerified && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <p className="text-[13px] text-green-700">
                                    <span className="font-semibold">GST verified!</span> Company details auto-filled from GSTN portal.
                                  </p>
                                </div>
                              </motion.div>
                            )}

                            {/* Company Name - Auto-filled from GST */}
                            <Field icon={Briefcase} label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Auto-filled from GST" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Country</label>
                                <select value={country} onChange={e => setCountry(e.target.value)}
                                  className={`${inputBase} px-3 appearance-none cursor-pointer`}>
                                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                  Company Type
                                  {gstInfo && <span className="ml-2 text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Auto-detected</span>}
                                </label>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {COMPANY_TYPES.map(ct => {
                                const Icon = ct.icon;
                                const selected = companyType === ct.value;
                                return (
                                  <button key={ct.value} type="button" onClick={() => { setCompanyType(ct.value); setDocuments({}); setDocPreviews({}); setPreviewDoc(null); }}
                                    className={`h-auto py-2.5 px-1.5 rounded-xl border text-[11px] font-medium transition-all text-center flex flex-col items-center gap-1 leading-tight ${selected ? 'text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                                    style={selected ? { background: '#4c1d95', borderColor: '#4c1d95' } : {}}
                                  >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="break-words w-full">{ct.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {error && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                              </motion.div>
                            )}

                            <div className="flex gap-2.5 pt-1">
                              <button type="button" onClick={() => { setStep(1); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                          <div className="mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">Documents &amp; Review</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{companyType ? `Required for ${ctLabel}` : 'Select a company type first'}</p>
                          </div>

                          <div className="space-y-3.5">
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
                                        <input type="file" className="hidden" data-doc-name={d.name} onChange={e => handleFile(d.name, e.target.files?.[0] || null)} accept=".pdf" />
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${uploaded ? 'bg-green-50 text-green-700 border border-green-200' : 'text-white border'}`}
                                          style={uploaded ? {} : { background: '#4c1d95', borderColor: '#4c1d95' }}>
                                          {uploaded ? <><Check className="w-3.5 h-3.5" /><span className="hidden sm:inline max-w-[80px] truncate">{documents[d.name]?.filename}</span><span className="sm:hidden">Done</span></> : <><Upload className="w-3.5 h-3.5" />Upload</>}
                                        </div>
                                      </label>
                                      {uploaded && docPreviews[d.name] && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewDoc(previewDoc === d.name ? null : d.name)}
                                          className={`flex-shrink-0 ml-1.5 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${previewDoc === d.name ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200'}`}
                                          title="Preview document"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {previewDoc && docPreviews[previewDoc] && (
                              <div className="rounded-xl border border-purple-200 overflow-hidden bg-white">
                                <div className="flex items-center justify-between px-3 py-2 border-b border-purple-100 bg-purple-50/60">
                                  <p className="text-[11px] font-semibold text-purple-900 truncate">{previewDoc}</p>
                                  <button type="button" onClick={() => setPreviewDoc(null)} className="text-[11px] font-medium text-purple-600 hover:text-purple-800 flex-shrink-0 ml-2">Close</button>
                                </div>
                                <iframe src={docPreviews[previewDoc]} title={`Preview ${previewDoc}`} className="w-full h-56 bg-white" />
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                                <div className="min-w-0"><span className="text-gray-500">Name:</span> <span className="ml-1.5 font-medium text-gray-900">{name}</span></div>
                                <div className="min-w-0"><span className="text-gray-500">Email:</span> <span className="ml-1.5 font-medium text-gray-900 break-all">{userEmail}</span></div>
                                <div className="min-w-0"><span className="text-gray-500">Company:</span> <span className="ml-1.5 font-medium text-gray-900">{companyName}</span></div>
                                <div className="min-w-0"><span className="text-gray-500">Type:</span> <span className="ml-1.5 font-medium text-gray-900">{ctLabel || '—'}</span></div>
                                <div className="min-w-0"><span className="text-gray-500">Country:</span> <span className="ml-1.5 font-medium text-gray-900">{country}</span></div>
                                <div className="min-w-0"><span className="text-gray-500">GST:</span> <span className="ml-1.5 font-medium text-gray-900 font-mono">{gstNumber || '—'}</span></div>
                              </div>
                            </div>

                            {error && (
                              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                              </motion.div>
                            )}

                            <div className="flex gap-2.5 pt-1">
                              <button type="button" onClick={() => { setStep(2); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                                <ArrowLeft className="w-4 h-4" /> Back
                              </button>
                              <button type="button" onClick={submit} disabled={loading}
                                className="flex-[2] h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}>
                                {loading
                                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                                  : <><Building2 className="w-4 h-4" /> Create Company <ArrowRight className="w-4 h-4" /></>
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
          className="flex items-center justify-center gap-2 mt-6 sm:mt-8"
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
