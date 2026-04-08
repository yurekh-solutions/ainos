'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Bell, Shield, Palette, Globe, 
  Moon, Sun, CheckCircle2, 
  Mail, Lock, Smartphone, Sparkles,
  ChevronRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button 
    type="button" 
    onClick={onChange}
    className="relative w-14 h-7 rounded-full transition-all duration-300"
    style={{ 
      background: enabled 
        ? 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)' 
        : 'linear-gradient(135deg, hsl(35 30% 88%) 0%, hsl(32 25% 85%) 100%)',
      boxShadow: enabled ? '0 2px 10px rgba(193, 122, 71, 0.3)' : 'none'
    }}
  >
    <span 
      className="absolute top-1 w-5 h-5 rounded-full shadow-md transition-all duration-300"
      style={{ 
        left: enabled ? 'calc(100% - 1.5rem)' : '0.25rem',
        background: 'white'
      }}
    />
  </button>
);

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    invoiceReminders: true,
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    twoFactor: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'regional', icon: Globe, label: 'Regional' },
    { id: 'security', icon: Shield, label: 'Security' },
  ];

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Light', 
      icon: Sun, 
      desc: 'Clean and bright interface',
      preview: 'linear-gradient(145deg, #FCFAF7 0%, #F5F1EB 100%)',
    },
    { 
      value: 'dark', 
      label: 'Dark', 
      icon: Moon, 
      desc: 'Easy on the eyes',
      preview: 'linear-gradient(145deg, #2A211C 0%, #3A3128 100%)',
    },
  ];

  return (
    <div className="h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47] to-[#D4A574] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Settings</h1>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage preferences</p>
                </div>
              </div>

              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: activeSection === section.id 
                        ? 'linear-gradient(135deg, rgba(193, 122, 71, 0.12) 0%, rgba(212, 165, 116, 0.08) 100%)'
                        : 'transparent',
                      border: activeSection === section.id 
                        ? '1px solid rgba(193, 122, 71, 0.2)' 
                        : '1px solid transparent'
                    }}
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: activeSection === section.id 
                          ? 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)'
                          : 'rgba(193, 122, 71, 0.1)'
                      }}
                    >
                      <section.icon 
                        className="w-4 h-4" 
                        style={{ color: activeSection === section.id ? 'white' : '#C17A47' }} 
                      />
                    </div>
                    <span 
                      className="flex-1 text-left text-sm font-medium"
                      style={{ color: activeSection === section.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {section.label}
                    </span>
                    {activeSection === section.id && (
                      <ChevronRight className="w-4 h-4 text-[#C17A47]" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47]/20 to-[#D4A574]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#C17A47]" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Profile</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)' }}
                    >
                      {session?.user?.name?.[0] || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#8B9A7B] flex items-center justify-center border-2 border-white">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Full Name
                      </label>
                      <p className="text-lg font-semibold mt-1" style={{ color: 'hsl(var(--foreground))' }}>
                        {session?.user?.name || 'User'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Email Address
                      </label>
                      <p className="text-base mt-1" style={{ color: 'hsl(var(--foreground))' }}>
                        {session?.user?.email || 'user@example.com'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#8B9A7B]/15 text-[#6B7A5B] border border-[#8B9A7B]/25">
                        Google Account Connected
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47]/20 to-[#D4A574]/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-[#C17A47]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Appearance</h2>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Currently using <span className="font-medium text-[#C17A47]">{resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = theme === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as 'light' | 'dark')}
                        className="relative p-5 rounded-2xl transition-all duration-300 text-left group overflow-hidden"
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(180deg, hsl(40 50% 99% / 0.95) 0%, hsl(35 30% 96% / 0.9) 100%)' 
                            : 'linear-gradient(180deg, hsl(40 50% 99% / 0.6) 0%, hsl(35 30% 94% / 0.5) 100%)',
                          border: isSelected 
                            ? '2px solid rgba(193, 122, 71, 0.5)' 
                            : '2px solid rgba(193, 122, 71, 0.15)',
                          boxShadow: isSelected 
                            ? '0 10px 40px -10px rgba(193, 122, 71, 0.2)' 
                            : 'none',
                        }}
                      >
                        {/* Preview Window */}
                        <div 
                          className="w-full h-32 rounded-xl mb-4 relative overflow-hidden"
                          style={{ background: option.preview }}
                        >
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#C17A47]/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#B5A89A]/30" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8B9A7B]/30" />
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 space-y-2">
                            <div className="h-2 rounded-full w-3/4 bg-current opacity-10" />
                            <div className="h-2 rounded-full w-1/2 bg-current opacity-10" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-11 h-11 rounded-xl flex items-center justify-center"
                              style={{ 
                                background: isSelected 
                                  ? 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)'
                                  : 'rgba(193, 122, 71, 0.1)'
                              }}
                            >
                              <Icon 
                                className="w-5 h-5" 
                                style={{ color: isSelected ? 'white' : '#C17A47' }} 
                              />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                                {option.label}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {option.desc}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <motion.div
                              layoutId="themeCheck"
                              className="w-7 h-7 rounded-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)' }}
                            >
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47]/20 to-[#D4A574]/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#C17A47]" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Notifications</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', icon: Mail, label: 'Email Notifications', desc: 'Receive updates via email', color: '#C17A47' },
                    { key: 'pushNotifications', icon: Smartphone, label: 'Push Notifications', desc: 'Browser push notifications', color: '#B5A89A' },
                    { key: 'invoiceReminders', icon: Bell, label: 'Invoice Reminders', desc: 'Remind customers about pending invoices', color: '#8B9A7B' },
                  ].map((item) => (
                    <div 
                      key={item.key} 
                      className="flex items-center justify-between p-4 rounded-xl transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(193, 122, 71, 0.03) 0%, rgba(212, 165, 116, 0.02) 100%)',
                        border: '1px solid rgba(193, 122, 71, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ background: `${item.color}15` }}
                        >
                          <item.icon className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.label}</p>
                          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.desc}</p>
                        </div>
                      </div>
                      <Toggle 
                        enabled={settings[item.key as keyof typeof settings] as boolean}
                        onChange={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })} 
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Regional Section */}
            {activeSection === 'regional' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47]/20 to-[#D4A574]/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#C17A47]" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Regional Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'language', label: 'Language', options: ['English', 'Spanish', 'French'], icon: '🌐' },
                    { key: 'currency', label: 'Currency', options: ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)'], icon: '💰' },
                    { key: 'dateFormat', label: 'Date Format', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], icon: '📅' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {field.icon} {field.label}
                      </label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                        style={{ 
                          background: 'linear-gradient(135deg, hsl(40 50% 99%) 0%, hsl(35 30% 96%) 100%)',
                          border: '1px solid rgba(193, 122, 71, 0.2)',
                          color: 'hsl(var(--foreground))'
                        }}
                      >
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C17A47]/20 to-[#D4A574]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#C17A47]" />
                  </div>
                  <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Security</h2>
                </div>

                <div 
                  className="flex items-center justify-between p-5 rounded-xl"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(193, 122, 71, 0.03) 0%, rgba(212, 165, 116, 0.02) 100%)',
                    border: '1px solid rgba(193, 122, 71, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C17A47]/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#C17A47]" />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Two-Factor Authentication</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Toggle 
                    enabled={settings.twoFactor} 
                    onChange={() => setSettings({ ...settings, twoFactor: !settings.twoFactor })} 
                  />
                </div>
              </motion.div>
            )}

            {/* Save Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mt-6"
            >
              {saved && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B9A7B]/15 border border-[#8B9A7B]/25"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#6B7A5B]" /> 
                  <span className="text-sm font-medium text-[#6B7A5B]">Settings saved successfully</span>
                </motion.div>
              )}
              <button 
                onClick={handleSave}
                className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #C17A47 0%, #D4A574 100%)',
                  boxShadow: '0 4px 20px rgba(193, 122, 71, 0.3)'
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> 
                Save Changes
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
