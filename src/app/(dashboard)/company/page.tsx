'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, Globe, CreditCard, Save, Upload, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankRouting: string;
  logoUrl: string;
}

export default function CompanyPage() {
  const [company, setCompany] = useState<CompanyData>({
    name: '', email: '', phone: '', address: '', city: '', country: '',
    website: '', taxId: '', bankName: '', bankAccount: '', bankRouting: '', logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchCompany(); }, []);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        if (data) setCompany(data);
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
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
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

  const InputField = ({ label, icon: Icon, ...props }: { label: string; icon: React.ElementType; [key: string]: unknown }) => (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <input {...props}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Profile</h1>
            <p className="text-white/50 text-sm">Manage your business information</p>
          </div>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 md:p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Company Logo
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-2 border-dashed border-white/20 flex items-center justify-center shadow-lg overflow-hidden">
                  {company.logoUrl ? (
                    <Image src={company.logoUrl} alt="Company Logo" fill className="object-cover" unoptimized />
                  ) : (
                    <Building2 className="w-10 h-10 text-white/40" />
                  )}
                </div>
                {company.logoUrl && (
                  <button type="button" onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg">
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
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-2 mx-auto sm:mx-0 disabled:opacity-50 min-h-[44px]">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : company.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-white/40 text-xs mt-2">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </motion.div>

          {/* Basic Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 md:p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Company Name" icon={Building2} placeholder="Your Company Name"
                value={company.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, name: e.target.value })} />
              <InputField label="Email" icon={Mail} type="email" placeholder="company@example.com"
                value={company.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, email: e.target.value })} />
              <InputField label="Phone" icon={Phone} type="tel" placeholder="+1 234 567 890"
                value={company.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, phone: e.target.value })} />
              <InputField label="Website" icon={Globe} placeholder="https://yourcompany.com"
                value={company.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, website: e.target.value })} />
            </div>
          </motion.div>

          {/* Address */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 md:p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-400" /> Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField label="Street Address" icon={MapPin} placeholder="123 Business Street"
                  value={company.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, address: e.target.value })} />
              </div>
              <InputField label="City" icon={MapPin} placeholder="New York"
                value={company.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, city: e.target.value })} />
              <InputField label="Country" icon={Globe} placeholder="United States"
                value={company.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, country: e.target.value })} />
            </div>
          </motion.div>

          {/* Tax & Banking */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 md:p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" /> Tax & Banking
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Tax ID / VAT Number" icon={CreditCard} placeholder="XX-XXXXXXX"
                value={company.taxId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, taxId: e.target.value })} />
              <InputField label="Bank Name" icon={Building2} placeholder="Bank of America"
                value={company.bankName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, bankName: e.target.value })} />
              <InputField label="Account Number" icon={CreditCard} placeholder="XXXX-XXXX-XXXX"
                value={company.bankAccount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, bankAccount: e.target.value })} />
              <InputField label="Routing Number" icon={CreditCard} placeholder="XXXXXXXXX"
                value={company.bankRouting} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, bankRouting: e.target.value })} />
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex justify-end">
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-sm font-medium shadow-lg shadow-emerald-500/25 disabled:opacity-50">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
