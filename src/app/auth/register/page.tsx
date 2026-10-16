'use client';

import { motion } from 'framer-motion';
import {
  Building2, Mail, Phone, MapPin, Globe, Briefcase,
  Check, Loader2, ArrowRight, ArrowLeft,
  Shield, Zap, BarChart3, FileText, UserPlus
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const COMPANY_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Pvt Ltd' },
  { value: 'public_ltd', label: 'Public Ltd' },
  { value: 'opc', label: 'OPC' },
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Singapore', 'UAE', 'Germany', 'France', 'Japan', 'China', 'Brazil',
  'South Africa', 'Nigeria', 'Indonesia', 'Mexico', 'Other'
];

// GST Validation
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

const FEATURES = [
  { icon: UserPlus, title: 'New Business?', desc: 'Join growing businesses using AI-powered invoicing, CRM, and automation. Quick approval process!' },
  { icon: Shield, title: 'Secure & Encrypted Login', desc: 'Bank-grade security for your data' },
  { icon: Zap, title: 'AI-Powered Automation', desc: 'Smart workflows that save hours' },
  { icon: BarChart3, title: 'Real-time Dashboard Access', desc: 'Live analytics at your fingertips' },
  { icon: FileText, title: 'Smart Invoicing & GST', desc: 'Automated billing and compliance' },
];

export default function RegisterPage() {
  const [step, setStep] = useState(2); // Start at company step for demo
  
  // Account fields (step 1)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Company fields (step 2)
  const [gstNumber, setGstNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [companyType, setCompanyType] = useState('');
  
  const [gstInfo, setGstInfo] = useState<{ stateName: string; entityType: string; entityLabel: string } | null>(null);
  const [fetchingGst, setFetchingGst] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGstChange = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstNumber(cleaned);
    
    if (cleaned.length === 15) {
      const parsed = parseGst(cleaned);
      if (parsed) {
        setGstInfo(parsed);
        setCountry('India');
        if (parsed.entityType !== companyType) {
          setCompanyType(parsed.entityType);
        }
        // Auto-fetch company details
        fetchGstDetails(cleaned);
      } else {
        setGstInfo(null);
      }
    } else {
      setGstInfo(null);
    }
  };

  const fetchGstDetails = async (gst: string) => {
    if (gst.length !== 15) return;
    setFetchingGst(true);
    try {
      const res = await fetch('/api/gst-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstNumber: gst }),
      });
      if (res.ok) {
        const data = await res.json();
        // Auto-fill all available fields
        if (data.companyName && !companyName) setCompanyName(data.companyName);
        if (data.address && !companyAddress) setCompanyAddress(data.address);
        if (data.entityType && !companyType) setCompanyType(data.entityType);
      }
    } catch (err) {
      console.error('GST fetch failed:', err);
    } finally {
      setFetchingGst(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // API call here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-900 font-bold text-xl">α</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AINOS</h1>
              <p className="text-purple-200 text-xs">Business Suite</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 space-y-4 flex-1">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-purple-200 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Text */}
        <div className="relative z-10 mt-8">
          <p className="text-purple-200 text-xs">
            © 2026 AINOS by Yurekh Solutions. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-purple-600 font-medium hover:underline">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 - Account */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Account</span>
            </div>
            
            <div className="w-16 h-0.5 bg-purple-600"></div>
            
            {/* Step 2 - Company (Active) */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">2</span>
              </div>
              <span className="text-sm font-semibold text-purple-600">Company</span>
            </div>
            
            <div className="w-16 h-0.5 bg-gray-300"></div>
            
            {/* Step 3 - Verify */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 font-semibold text-sm">3</span>
              </div>
              <span className="text-sm font-medium text-gray-500">Verify</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Company details</h2>
              </div>
              <p className="text-gray-600 ml-13">Tell us about your business</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Row 1: GST Number & Company Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => handleGstChange(e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {fetchingGst && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 animate-spin" />
                    )}
                    {gstInfo && !fetchingGst && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                    )}
                  </div>
                  {gstInfo && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {gstInfo.entityLabel} · {gstInfo.stateName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your registered company name"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Company Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Registered Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="123 Business Park, Sector 5, Gurugram"
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Row 4: Country & Company Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Type
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={companyType}
                      onChange={(e) => setCompanyType(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select company type</option>
                      {COMPANY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  {gstInfo && (
                    <p className="text-xs text-purple-600 mt-1">Auto-detected from GST</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !gstNumber || !companyName}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
