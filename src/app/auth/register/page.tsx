'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ArrowRight, ArrowLeft, Check, Loader2, AlertCircle, Eye, EyeOff, Building2, FolderCheck, Upload, Phone, MapPin, Mail, Lock, User, Briefcase, Building, BarChart3, Users, ShieldCheck, LogIn, Globe, UserPlus, Shield, RefreshCw, MailCheck } from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type ElementType } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/toast';
import { validateEmail, validatePhone, validatePassword, cleanPhone, PHONE_REGEX } from '@/lib/validation';

const COMPANY_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship', icon: User },
  { value: 'partnership', label: 'Partnership', icon: Users },
  { value: 'llp', label: 'LLP', icon: Building2 },
  { value: 'pvt_ltd', label: 'Pvt Ltd', icon: Briefcase },
  { value: 'public_ltd', label: 'Public Ltd', icon: BarChart3 },
  { value: 'opc', label: 'OPC', icon: Building },
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Singapore', 'UAE', 'Germany', 'France', 'Japan', 'China', 'Brazil',
  'South Africa', 'Nigeria', 'Indonesia', 'Mexico', 'Other'
];

// ─── GST auto-detection ───────────────────────────────────────────────────
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
  { icon: ShieldCheck, title: 'Verified onboarding', desc: 'Email confirmed before review' },
  { icon: BarChart3, title: 'Real-time dashboard', desc: 'Live analytics the moment you are approved' },
  { icon: FileText, title: 'Smart invoicing & GST', desc: 'Automated billing and compliance' },
];

const inputBase =
  'w-full min-w-0 max-w-full h-11 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 ' +
  'placeholder:text-gray-400 outline-none transition ' +
  'focus:border-purple-400 focus:ring-2 focus:ring-purple-100';

const primaryButton =
  'h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60';

const primaryStyle = { background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' };

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, className = '', error, ...rest }: {
  icon?: ElementType;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  error?: string;
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
          aria-invalid={Boolean(error)}
          className={`${inputBase} ${Icon ? 'pl-11' : 'pl-3'} pr-3 ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`}
          {...rest}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const items = ['Applicant', 'Verify', 'Company', 'Submit'];
  return (
    <div className="flex items-start justify-center w-full mb-6 overflow-hidden">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-start">
            <div className="flex flex-col items-center w-[48px] sm:w-[64px]">
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
              <span className={`mt-1.5 text-[10px] sm:text-[11px] font-medium ${active || done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              <span className={`mt-1 h-0.5 w-5 sm:w-6 rounded-full ${active ? 'bg-[#4c1d95]' : 'bg-transparent'}`} />
            </div>
            {i < items.length - 1 && (
              <div className={`h-px w-3 sm:w-8 mt-[16px] mx-0.5 sm:mx-1 transition-colors duration-300 ${step > n ? 'bg-[#4c1d95]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1 — applicant
  const [name, setName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  // Set when the address belongs to an account that already has a password.
  // Such users must sign in (or reset) rather than apply a second time.
  const [emailTaken, setEmailTaken] = useState(false);

  // Step 2 — email verification
  const [emailCode, setEmailCode] = useState('');
  const [emailProof, setEmailProof] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailSentAt, setEmailSentAt] = useState(0);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [devEmailCode, setDevEmailCode] = useState<string | null>(null);
  // Clock kept in state so countdowns stay pure during render.
  const [now, setNow] = useState(0);

  // Step 3 — company
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [gstNumber, setGstNumber] = useState('');
  const [gstInfo, setGstInfo] = useState<{ stateName: string; entityType: string; entityLabel: string } | null>(null);
  const [fetchingGst, setFetchingGst] = useState(false);

  // GST captcha
  const [captchaSessionId, setCaptchaSessionId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState('');

  // Step 4 — documents
  const [documents, setDocuments] = useState<Record<string, { filename: string; fileUrl: string }>>({});
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const emailTarget = userEmail.trim().toLowerCase();
  const phoneDigits = cleanPhone(userPhone);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => prev[field] ? { ...prev, [field]: '' } : prev);
  };

  // ── Email OTP: send ──────────────────────────────────────────────────────
  const sendCode = useCallback(async () => {
    const target = emailTarget;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setEmailError('Enter a valid email address first');
      return;
    }

    setEmailSending(true);
    setEmailError(null);
    setEmailNotice(null);

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', target, purpose: 'signup' }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) setEmailTaken(true);
        setEmailError(data?.error || 'Could not send the code');
        return;
      }

      setNow(Date.now());
      setEmailSentAt(Date.now());
      setEmailNotice(`Code sent to ${target}. It expires in 10 minutes.`);
      setDevEmailCode(data.devCode || null);
    } catch {
      setEmailError('Could not send the code. Please try again.');
    } finally {
      setEmailSending(false);
    }
  }, [emailTarget]);

  // ── Email OTP: verify ────────────────────────────────────────────────────
  const verifyCode = async () => {
    const code = emailCode.replace(/[^\d]/g, '');

    if (code.length !== 6) {
      setEmailError('Enter the 6-digit code');
      return;
    }

    setEmailVerifying(true);
    setEmailError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', target: emailTarget, purpose: 'signup', code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEmailError(data?.error || 'Verification failed');
        return;
      }

      setEmailProof(data.proof);
      setEmailVerified(true);
      setEmailNotice('Email verified');
    } catch {
      setEmailError('Verification failed. Please try again.');
    } finally {
      setEmailVerifying(false);
    }
  };

  const resendIn = (sentAt: number) => {
    if (!sentAt || !now) return 0;
    const elapsed = Math.floor((now - sentAt) / 1000);
    return Math.max(0, 45 - elapsed);
  };

  // ── GST lookup ───────────────────────────────────────────────────────────
  const fetchCaptcha = async (gst: string) => {
    if (gst.length !== 15) return;
    setFetchingGst(true);
    setGstError('');

    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
            setFetchingGst(false);
            return;
          }
          if (attempt === MAX_ATTEMPTS) {
            setGstError(data.error || 'Failed to load captcha');
            setFetchingGst(false);
            return;
          }
        } else if (attempt === MAX_ATTEMPTS) {
          const data = await res.json().catch(() => ({ error: 'Failed to connect to GST service' }));
          setGstError(data.error || 'Failed to connect to GST service');
          setFetchingGst(false);
          return;
        }
      } catch {
        if (attempt === MAX_ATTEMPTS) {
          setGstError('Could not reach GST service. Please try again in a moment.');
          setFetchingGst(false);
          return;
        }
      }
      await new Promise(r => setTimeout(r, attempt * 4000));
    }
    setFetchingGst(false);
  };

  const handleGstChange = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstNumber(cleaned);
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
        fetchCaptcha(cleaned);
        return;
      }
    }
    setGstInfo(null);
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
        if (data.companyName) setCompanyName(data.companyName);
        if (data.tradeName && !companyName) setCompanyName(data.tradeName);
        if (data.address) setCompanyAddress(data.address);
        if (data.entityType && data.entityType !== companyType) setCompanyType(data.entityType);
        setGstVerified(true);
        setShowCaptcha(false);
      } else {
        setGstError(data.error || 'GST verification failed. Please check the captcha and try again.');
        if (gstNumber.length === 15) fetchCaptcha(gstNumber);
      }
    } catch {
      setGstError('Verification failed. Please try again.');
    } finally {
      setVerifyingGst(false);
    }
  };

  // ── Documents ────────────────────────────────────────────────────────────
  const handleFile = (doc: string, f: File | null) => {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (f.size > 1024 * 1024) {
      toast.error('File size must be less than 1MB');
      return;
    }
    const blobUrl = URL.createObjectURL(f);
    setDocPreviews(p => ({ ...p, [doc]: blobUrl }));
    setDocuments(p => ({ ...p, [doc]: { filename: f.name, fileUrl: '' } }));
  };

  const docs = companyType ? (DOCUMENT_REQUIREMENTS[companyType] || []) : [];
  const ctLabel = COMPANY_TYPES.find(c => c.value === companyType)?.label;

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required';

    const emailErr = validateEmail(userEmail);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(userPhone);
    if (phoneErr) errors.phone = phoneErr;

    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors below');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) errors.companyName = 'Company name is required';
    if (companyEmail.trim()) {
      const emailErr = validateEmail(companyEmail);
      if (emailErr) errors.companyEmail = emailErr;
    }
    if (companyPhone.trim()) {
      const phoneErr = validatePhone(companyPhone);
      if (phoneErr) errors.companyPhone = phoneErr;
    }
    if (!companyAddress.trim()) errors.companyAddress = 'Registered address is required';
    if (!companyType) errors.companyType = 'Company type is required';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors below');
      return false;
    }
    return true;
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = async () => {
    setError(null);

    if (step === 1) {
      if (!validateStep1()) return;

      // Catch an already-registered address here rather than on the Verify
      // step, where the OTP endpoint would refuse and leave the form stranded.
      setCheckingEmail(true);
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTarget }),
        });
        const data = await res.json();
        if (res.ok && data?.canRegister === false) {
          setEmailTaken(true);
          setError('This email is already registered. Sign in with your password, or use Forgot password.');
          return;
        }
        setEmailTaken(false);
      } catch {
        // Non-blocking: register-company still refuses duplicate accounts.
      } finally {
        setCheckingEmail(false);
      }

      setFieldErrors({});
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Send the email verification code on arrival.
      if (!emailVerified && !emailSentAt) void sendCode();
      return;
    }

    if (step === 2) {
      if (!emailVerified) { setError('Verify your email address to continue'); return; }
    }

    if (step === 3 && !validateStep3()) return;

    setFieldErrors({});
    setStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError(null);
    setFieldErrors({});
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setError(null);

    if (!emailProof) { setError('Email verification expired — please verify again'); setFieldErrors({}); setStep(2); return; }

    const mandatoryDocs = docs.filter(d => !d.optional);
    const missingMandatory = mandatoryDocs.filter(d => !documents[d.name]);
    if (missingMandatory.length > 0) {
      toast.error(`Please upload: ${missingMandatory.map(d => d.name).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: emailTarget,
          phone: userPhone,
          password,
          companyName,
          companyType,
          companyEmail,
          companyPhone,
          companyAddress,
          country,
          gstNumber: gstNumber || undefined,
          documents: {},
          emailProof,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.code === 'EMAIL_NOT_VERIFIED') { setFieldErrors({}); setStep(2); }
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      const companyId = data.company.id;
      const uploadToken = data.company.uploadToken || '';

      const uploadedDocs: Record<string, { filename: string; fileUrl: string }> = {};
      const failedDocs: string[] = [];

      for (const [docName, docData] of Object.entries(documents)) {
        if (!docData.filename) continue;
        const fileInput = document.querySelector(`input[data-doc-name="${docName}"]`) as HTMLInputElement;
        const file = fileInput?.files?.[0];
        if (!file) continue;

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
          uploadedDocs[docName] = { filename: docData.filename, fileUrl: uploadData.fileUrl };
        } else {
          failedDocs.push(docName);
        }
      }

      if (failedDocs.length > 0) {
        toast.error(`Failed to upload: ${failedDocs.join(', ')} — admin may ask for these again.`);
      }

      if (Object.keys(uploadedDocs).length > 0) {
        await fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-upload-token': uploadToken },
          body: JSON.stringify({ uploadedDocs }),
        });
      }

      setSuccess(true);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardShell = 'bg-white rounded-2xl border border-gray-100 shadow-sm';

  const verificationCard = () => {
    const seconds = resendIn(emailSentAt);

    return (
      <div className={`rounded-xl border p-4 sm:p-5 ${emailVerified ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: emailVerified ? '#16a34a' : '#4c1d95' }}>
              {emailVerified ? <Check className="w-4 h-4 text-white" /> : <MailCheck className="w-4 h-4 text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Email verification</p>
              <p className="text-[11px] text-gray-500 truncate">{emailTarget || '—'}</p>
            </div>
          </div>
          {emailVerified && <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">Verified</span>}
        </div>

        {!emailVerified && (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                value={emailCode}
                onChange={e => setEmailCode(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void verifyCode(); } }}
                placeholder="6-digit code"
                className={`${inputBase} px-3 text-center tracking-[0.3em] font-mono`}
              />
              <button
                type="button"
                onClick={() => verifyCode()}
                disabled={emailVerifying || emailCode.length !== 6}
                className={`${primaryButton} sm:w-28 flex-shrink-0`}
                style={primaryStyle}
              >
                {emailVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2.5 gap-2">
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={emailSending || seconds > 0}
                className="text-[12px] font-medium inline-flex items-center gap-1.5 disabled:text-gray-400"
                style={emailSending || seconds > 0 ? {} : { color: '#6d28d9' }}
              >
                {emailSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {emailSentAt ? (seconds > 0 ? `Resend in ${seconds}s` : 'Resend code') : 'Send code'}
              </button>
              <span className="text-[10px] text-gray-400">Valid 10 min</span>
            </div>
          </>
        )}

        {emailNotice && !emailError && <p className="mt-2 text-[12px] text-gray-600">{emailNotice}</p>}
        {emailError && (
          <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12px] text-red-700">{emailError}</p>
              {emailTaken && (
                <Link
                  href="/auth/signin"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold hover:underline"
                  style={{ color: '#4c1d95' }}
                >
                  Sign in instead <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}
        {devEmailCode && !emailVerified && (
          <p className="mt-2 text-[11px] text-amber-700">Dev mode code: <span className="font-mono font-semibold">{devEmailCode}</span></p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#f8f7fc] overflow-x-hidden overflow-y-auto">
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
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={primaryStyle}>
                <FolderCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Application submitted</h2>
              <p className="text-sm text-gray-500 mb-1">
                Your company application and documents are with our onboarding team.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can sign in once your account is approved — we&apos;ll email you the moment it happens.
              </p>
              <button
                onClick={() => { window.location.href = '/auth/signin'; }}
                className={`w-full ${primaryButton}`}
                style={primaryStyle}
              >
                <LogIn className="w-4 h-4" /> Go to Sign In
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">

          {/* Left — branding (desktop only) */}
          <div className="space-y-6 hidden lg:block">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${cardShell} p-6 sm:p-8`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-violet-100 to-purple-100 ring-1 ring-violet-200 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/ainos-alpha.png" alt="AINOS" className="w-7 h-7 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">AINOS</h1>
                  <p className="text-xs text-gray-500 font-medium">Where Intelligence Meets Business</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                One intelligent platform for invoices, customers, inventory, HR and AI automation — onboard your business in four short steps.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${cardShell} p-6 sm:p-8`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#4c1d95' }}>
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">New business?</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Verify your email, upload your registration documents, and our team reviews the application within one business day.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: '#4c1d95' }}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified onboarding
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
              {leftFeatures.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`${cardShell} p-4 flex items-center gap-4`}
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

          {/* Right — application form */}
          <div className="min-w-0 lg:sticky lg:top-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-lg overflow-hidden max-w-full mb-6 sm:mb-0"
            >
              <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center border-b border-gray-50">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center" style={primaryStyle}>
                  <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Business application</h2>
                <p className="text-xs sm:text-sm text-gray-500">Apply for an AINOS account for your company</p>
              </div>

              <div className="flex justify-center px-4 sm:px-8 pt-3 sm:pt-4">
                <span className="text-xs text-gray-500">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="font-semibold inline-flex items-center gap-1 hover:underline" style={{ color: '#6d28d9' }}>
                    Sign in <ArrowRight className="w-3 h-3" />
                  </Link>
                </span>
              </div>

              <div className="px-4 sm:px-8 py-4 sm:py-6 pb-36 sm:pb-6 overflow-x-hidden">
                <Steps step={step} />

                <AnimatePresence mode="wait">
                  {/* STEP 1 — Applicant */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Applicant details</h3>
                        <p className="text-xs text-gray-500 mt-0.5">The person who will own this account</p>
                      </div>

                      <div className="space-y-4">
                        <Field icon={User} label="Full name" value={name} error={fieldErrors.name} onChange={e => { setName(e.target.value); clearFieldError('name'); }} placeholder="John Doe" />
                        <Field icon={Mail} label="Email address" type="email" value={userEmail} error={fieldErrors.email} onChange={e => { setUserEmail(e.target.value); clearFieldError('email'); setEmailTaken(false); setError(null); }} placeholder="john@company.com" />
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile number</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                              <Phone className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                            </div>
                            <span className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              pattern={PHONE_REGEX.source}
                              value={userPhone}
                              onChange={e => {
                                setUserPhone(cleanPhone(e.target.value).slice(0, 10));
                                clearFieldError('phone');
                              }}
                              placeholder="98765 43210"
                              aria-invalid={Boolean(fieldErrors.phone)}
                              className={`${inputBase} pl-[4.75rem] pr-3 ${fieldErrors.phone ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`}
                            />
                          </div>
                          {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                            </div>
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); clearFieldError('password'); }} placeholder="Min 8 characters"
                              aria-invalid={Boolean(fieldErrors.password)}
                              className={`${inputBase} pl-11 pr-10 ${fieldErrors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`} />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw ? 'Hide password' : 'Show password'}>
                              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                              <Lock className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                            </div>
                            <input type={showPw2 ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }} placeholder="Re-enter password"
                              aria-invalid={Boolean(fieldErrors.confirmPassword)}
                              className={`${inputBase} pl-11 pr-10 ${fieldErrors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`} />
                            <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPw2 ? 'Hide password' : 'Show password'}>
                              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <motion.button type="button" onClick={goNext} disabled={checkingEmail} whileTap={{ scale: 0.995 }} className={`w-full ${primaryButton}`} style={primaryStyle}>
                          {checkingEmail ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Checking email…</>
                          ) : (
                            <>Continue <ArrowRight className="h-4 w-4" /></>
                          )}
                        </motion.button>

                        {emailTaken && (
                          <Link
                            href="/auth/signin"
                            className="flex items-center justify-center gap-1.5 h-11 rounded-xl border text-[13px] font-semibold"
                            style={{ borderColor: 'rgba(76,29,149,0.25)', background: 'rgba(76,29,149,0.06)', color: '#4c1d95' }}
                          >
                            Sign in to this account <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <p className="text-center text-[11px] leading-relaxed text-gray-400 pt-1">
                          By applying you agree to our{' '}
                          <Link href="/terms" className="hover:underline" style={{ color: '#6d28d9' }}>Terms of Service</Link>
                          {' and '}
                          <Link href="/privacy" className="hover:underline" style={{ color: '#6d28d9' }}>Privacy Policy</Link>.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2 — Verification */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Verify your email address</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Enter the 6-digit code sent to your email</p>
                      </div>

                      <div className="space-y-3">
                        {verificationCard()}

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-2.5 pt-1">
                          <button type="button" onClick={goBack}
                            className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button type="button" onClick={goNext}
                            className={`flex-[2] ${primaryButton}`}
                            style={primaryStyle}>
                            Continue <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 — Company */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Company details</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Tell us about your business</p>
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            GST number <span className="text-gray-400 font-normal">(enter to auto-fill)</span>
                          </label>
                          <input type="text" value={gstNumber} onChange={e => handleGstChange(e.target.value)} placeholder="22AAAAA0000A1Z5" maxLength={15}
                            className={`${inputBase} px-3 font-mono text-xs sm:text-sm`} />
                        </div>

                        {fetchingGst && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                            <p className="text-[13px] text-blue-700"><span className="font-semibold">Connecting to GSTN portal…</span> This may take a few seconds.</p>
                          </motion.div>
                        )}

                        {gstError && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700"><span className="font-semibold">Error:</span> {gstError}</p>
                          </motion.div>
                        )}

                        {showCaptcha && captchaImage && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <p className="text-sm font-semibold text-blue-900">GST verification required</p>
                            </div>
                            <p className="text-xs text-gray-600">Enter the captcha below to verify your GST number and auto-fill company details.</p>
                            <div className="flex flex-col items-center gap-3 w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={captchaImage} alt="GST captcha" className="max-w-full h-auto border-2 border-gray-300 rounded-lg bg-white" />
                              <input type="text" value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                                placeholder="Enter captcha text"
                                className={`${inputBase} px-3 text-center font-mono tracking-widest`}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void verifyGstWithCaptcha(); } }} />
                              <button type="button" onClick={verifyGstWithCaptcha} disabled={verifyingGst || !captchaText.trim()}
                                className="w-full h-10 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={primaryStyle}>
                                {verifyingGst ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><Shield className="w-4 h-4" /> Verify &amp; auto-fill</>}
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {gstVerified && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <div className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <p className="text-[13px] text-green-700 break-words leading-snug">
                                <span className="font-semibold">GST verified.</span> Company details auto-filled from the GSTN portal.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <Field icon={Briefcase} label="Company name" value={companyName} error={fieldErrors.companyName} onChange={e => { setCompanyName(e.target.value); clearFieldError('companyName'); }} placeholder="Yurekh Solutions Private Limited" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field icon={Mail} label="Company email (optional)" type="email" value={companyEmail} error={fieldErrors.companyEmail} onChange={e => { setCompanyEmail(e.target.value); clearFieldError('companyEmail'); }} placeholder="info@acme.com" />
                          <Field icon={Phone} label="Company phone (optional)" type="tel" inputMode="numeric" maxLength={10} pattern={PHONE_REGEX.source} value={companyPhone} error={fieldErrors.companyPhone} onChange={e => { setCompanyPhone(cleanPhone(e.target.value).slice(0, 10)); clearFieldError('companyPhone'); }} placeholder="9876543210" />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered address</label>
                          <div className="relative">
                            <div className="absolute left-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                              <MapPin className="w-3.5 h-3.5" style={{ color: '#4c1d95' }} />
                            </div>
                            <textarea value={companyAddress} onChange={e => { setCompanyAddress(e.target.value); clearFieldError('companyAddress'); }} placeholder="123 Business Park, Sector 5, Gurugram" rows={2}
                              aria-invalid={Boolean(fieldErrors.companyAddress)}
                              className={`w-full min-w-0 max-w-full pl-11 pr-3 py-2.5 rounded-xl bg-white border text-sm text-gray-800 placeholder:text-gray-400 outline-none transition resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 ${fieldErrors.companyAddress ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`} />
                          </div>
                          {fieldErrors.companyAddress && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyAddress}</p>}
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
                              Company type
                              {gstInfo && <span className="ml-1.5 inline-flex items-center text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">Auto-detected</span>}
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                          {COMPANY_TYPES.map(ct => {
                            const Icon = ct.icon;
                            const selected = companyType === ct.value;
                            return (
                              <button key={ct.value} type="button" onClick={() => { setCompanyType(ct.value); clearFieldError('companyType'); setDocuments({}); setDocPreviews({}); setPreviewDoc(null); }}
                                className={`h-auto py-2 px-1 rounded-xl border text-[10px] sm:text-[11px] font-medium transition-all text-center flex flex-col items-center justify-center gap-1 leading-tight min-h-[56px] sm:min-h-[64px] lg:min-h-[72px] ${selected ? 'text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                                style={selected ? { background: '#4c1d95', borderColor: '#4c1d95' } : {}}>
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="break-words w-full px-0.5">{ct.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors.companyType && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyType}</p>}

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-2.5 pt-1 mb-4 sm:mb-0">
                          <button type="button" onClick={goBack}
                            className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button type="button" onClick={goNext} className={`flex-[2] ${primaryButton}`} style={primaryStyle}>
                            Continue <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4 — Documents & submit */}
                  {step === 4 && (
                    <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Documents &amp; review</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{companyType ? `Required for ${ctLabel}` : 'Select a company type first'}</p>
                      </div>

                      <div className="space-y-3.5">
                        {docs.length > 0 && (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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
                          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: '#4c1d95' }}>Application summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                            <div className="min-w-0"><span className="text-gray-500">Name:</span> <span className="ml-1.5 font-medium text-gray-900">{name}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">Email:</span> <span className="ml-1.5 font-medium text-gray-900 break-all">{emailTarget}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">Phone:</span> <span className="ml-1.5 font-medium text-gray-900">{phoneDigits ? `+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}` : '—'}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">Company:</span> <span className="ml-1.5 font-medium text-gray-900">{companyName}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">Type:</span> <span className="ml-1.5 font-medium text-gray-900">{ctLabel || '—'}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">Country:</span> <span className="ml-1.5 font-medium text-gray-900">{country}</span></div>
                            <div className="min-w-0"><span className="text-gray-500">GST:</span> <span className="ml-1.5 font-medium text-gray-900 font-mono">{gstNumber || '—'}</span></div>
                            <div className="min-w-0">
                              <span className="text-gray-500">Email verified:</span>{' '}
                              <span className="ml-1.5 font-medium text-gray-900">{emailVerified ? 'Yes' : '—'}</span>
                            </div>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[13px] text-red-700">{error}</p>
                          </motion.div>
                        )}

                        <div className="flex gap-2.5 pt-1 pb-4 sm:pb-0 mb-4 sm:mb-0">
                          <button type="button" onClick={goBack}
                            className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <button type="button" onClick={submit} disabled={loading} className={`flex-[2] ${primaryButton}`} style={primaryStyle}>
                            {loading
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                              : <><Building2 className="w-4 h-4" /> Submit application <ArrowRight className="w-4 h-4" /></>
                            }
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <p className="lg:hidden text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold" style={{ color: '#6d28d9' }}>Sign in</Link>
            </p>
          </div>
        </div>

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
