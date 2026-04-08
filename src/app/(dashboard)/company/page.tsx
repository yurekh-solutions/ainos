'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Globe, CreditCard, Save, Upload, CheckCircle2, X, Image as ImageIcon, Hash, Landmark, FileText } from 'lucide-react';
import Image from 'next/image';

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  accountHolder: string;
  logoUrl: string;
}

export default function CompanyPage() {
  const [company, setCompany] = useState<CompanyData>({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India',
    website: '', gstNumber: '', panNumber: '', bankName: '', bankAccount: '', ifscCode: '', accountHolder: '', logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { fetchCompany(); }, []);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCompany({ ...company, ...data });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Get form data
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data: Partial<CompanyData> = {};
    
    formData.forEach((value, key) => {
      if (key !== 'logo') {
        (data as Record<string, string>)[key] = value as string;
      }
    });
    
    // Add logo
    data.logoUrl = company.logoUrl;
    
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setCompany(prev => ({ ...prev, logoUrl: base64 }));
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setCompany(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ];

  // Reusable input component with proper focus handling
  const FormInput = ({ name, defaultValue, placeholder, type = 'text', required = false, className = '' }: { 
    name: string; 
    defaultValue?: string; 
    placeholder?: string; 
    type?: string; 
    required?: boolean;
    className?: string;
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <input 
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all duration-200 ${className}`}
        style={{
          background: '#FFFFFF',
          border: isFocused ? '2px solid #C17A47' : '2px solid #E8E0D5',
          color: '#3A2D24',
          outline: 'none',
          boxShadow: isFocused ? '0 0 0 3px rgba(193, 122, 71, 0.15)' : 'none'
        }}
      />
    );
  };

  // Reusable select component
  const FormSelect = ({ name, defaultValue, required = false, children }: { 
    name: string; 
    defaultValue?: string; 
    required?: boolean;
    children: React.ReactNode;
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <select 
        name={name}
        defaultValue={defaultValue}
        required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 py-2.5 text-sm rounded-xl transition-all duration-200"
        style={{
          background: '#FFFFFF',
          border: isFocused ? '2px solid #C17A47' : '2px solid #E8E0D5',
          color: '#3A2D24',
          outline: 'none',
          boxShadow: isFocused ? '0 0 0 3px rgba(193, 122, 71, 0.15)' : 'none'
        }}
      >
        {children}
      </select>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--page-gradient)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" 
          style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Company Profile</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your business information</p>
          </div>
          {saved && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ 
                background: 'hsl(142 76% 36% / 0.1)',
                border: '1px solid hsl(142 76% 36% / 0.2)',
                color: 'hsl(142 76% 36%)'
              }}
            >
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </motion.div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <ImageIcon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Company Logo
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                  style={{ 
                    background: 'hsl(var(--muted))',
                    border: '2px dashed hsl(var(--border) / 0.5)'
                  }}>
                  {company.logoUrl ? (
                    <Image src={company.logoUrl} alt="Company Logo" fill className="object-cover" unoptimized />
                  ) : (
                    <Building2 className="w-10 h-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  )}
                </div>
                {company.logoUrl && (
                  <button 
                    type="button" 
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                    style={{ background: 'hsl(0 84% 60%)' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-center sm:text-left">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                  accept="image/jpeg,image/png,image/jpg,image/webp" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 mx-auto sm:mx-0 disabled:opacity-50"
                  style={{ 
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" 
                      style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : company.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>PNG, JPG up to 2MB</p>
              </div>
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Building2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Building2 className="w-3.5 h-3.5" /> Business Name *
                </label>
                <FormInput name="name" defaultValue={company.name} placeholder="e.g., Raj Enterprises" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <FormInput name="email" type="email" defaultValue={company.email} placeholder="company@gmail.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Phone className="w-3.5 h-3.5" /> Phone *
                </label>
                <FormInput name="phone" type="tel" defaultValue={company.phone} placeholder="9876543210" required />
                <p className="text-[10px] text-[#8B7355]">Enter 10 digit mobile number</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Globe className="w-3.5 h-3.5" /> Website
                </label>
                <FormInput name="website" defaultValue={company.website} placeholder="www.yourcompany.com" />
              </div>
            </div>
          </motion.div>

          {/* GST & Tax Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> GST & Tax Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Hash className="w-3.5 h-3.5" /> GST Number
                </label>
                <FormInput name="gstNumber" defaultValue={company.gstNumber} placeholder="22AAAAA0000A1Z5" className="uppercase" />
                <p className="text-[10px] text-[#8B7355]">15 digit GSTIN</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <CreditCard className="w-3.5 h-3.5" /> PAN Number
                </label>
                <FormInput name="panNumber" defaultValue={company.panNumber} placeholder="AAAAA0000A" className="uppercase" />
                <p className="text-[10px] text-[#8B7355]">10 digit PAN</p>
              </div>
            </div>
          </motion.div>

          {/* Address */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Business Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin className="w-3.5 h-3.5" /> Street Address *
                </label>
                <FormInput name="address" defaultValue={company.address} placeholder="Shop No. 12, Main Market Road" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin className="w-3.5 h-3.5" /> City *
                </label>
                <FormInput name="city" defaultValue={company.city} placeholder="Mumbai" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin className="w-3.5 h-3.5" /> State *
                </label>
                <FormSelect name="state" defaultValue={company.state} required>
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </FormSelect>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <MapPin className="w-3.5 h-3.5" /> PIN Code *
                </label>
                <FormInput name="pincode" defaultValue={company.pincode} placeholder="400001" required />
                <p className="text-[10px] text-[#8B7355]">6 digit code</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Globe className="w-3.5 h-3.5" /> Country
                </label>
                <FormInput name="country" defaultValue={company.country || 'India'} placeholder="India" />
              </div>
            </div>
          </motion.div>

          {/* Bank Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Landmark className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Bank Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Building2 className="w-3.5 h-3.5" /> Account Holder
                </label>
                <FormInput name="accountHolder" defaultValue={company.accountHolder} placeholder="Name as per bank" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Landmark className="w-3.5 h-3.5" /> Bank Name
                </label>
                <FormInput name="bankName" defaultValue={company.bankName} placeholder="e.g., State Bank of India" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <CreditCard className="w-3.5 h-3.5" /> Account Number
                </label>
                <FormInput name="bankAccount" defaultValue={company.bankAccount} placeholder="Your account number" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Hash className="w-3.5 h-3.5" /> IFSC Code
                </label>
                <FormInput name="ifscCode" defaultValue={company.ifscCode} placeholder="SBIN0001234" className="uppercase" />
                <p className="text-[10px] text-[#8B7355]">11 characters</p>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            className="flex justify-end"
          >
            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
              }}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" 
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
