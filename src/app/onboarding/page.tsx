'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, Check } from 'lucide-react';

interface ProfileData {
  name: string;
  phone: string;
  address: string;
  country: string;
  timezone: string;
}

interface CompanyData {
  name: string;
  gstNumber: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    name: session?.user?.name || '',
    phone: '',
    address: '',
    country: '',
    timezone: 'UTC',
  });
  
  const [company, setCompany] = useState<CompanyData>({
    name: '',
    gstNumber: '',
    address: '',
    email: '',
    phone: '',
    website: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      
      if (res.ok) {
        setStep(2);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      
      if (res.ok) {
        await update();
        router.push('/invoices');
      }
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to AIONS</h1>
          <p className="text-white/60">Let&apos;s set up your account</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm">Profile</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-white/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-sm">Company</span>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Country</label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Timezone</label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Kolkata">India</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Company Name *</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">GST/Tax Number</label>
              <input
                type="text"
                value={company.gstNumber}
                onChange={(e) => setCompany({ ...company, gstNumber: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Address</label>
              <textarea
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Phone</label>
                <input
                  type="tel"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="glass-input w-full px-4 py-2 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Website</label>
              <input
                type="url"
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="glass-input w-full px-4 py-2 rounded-lg text-white"
                placeholder="https://"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {loading ? 'Creating...' : 'Complete Setup'}
              <Check className="w-4 h-4" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
