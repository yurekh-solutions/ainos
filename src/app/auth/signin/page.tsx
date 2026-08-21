'use client';

import { signIn } from 'next-auth/react';
import { Shield, FileText, Users, Sparkles, Check, Star, TrendingUp, Globe, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const features = [
  { icon: FileText, title: 'Smart Invoicing', desc: 'AI-powered invoice generation' },
  { icon: Users, title: 'CRM Built-in', desc: 'Complete customer management' },
  { icon: Shield, title: 'Bank-grade Security', desc: 'End-to-end encryption' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Real-time business insights' },
];

const stats = [
  { value: '50K+', label: 'Invoices Created' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9', label: 'User Rating', icon: Star },
];

export default function SignInPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRetried = useRef(false);

  // Fire-and-forget warm-up
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    fetch('/api/ping', { signal: controller.signal, cache: 'no-store' }).catch(() => {});
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/ainos' });
    } catch {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  // Auto-retry once if the user lands back here with OAuthCallback error.
  useEffect(() => {
    if (urlError === 'OAuthCallback' && !autoRetried.current) {
      autoRetried.current = true;
      const timer = setTimeout(() => {
        handleSignIn();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError]);

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%, #f9fafb 100%)'
          }}
        />
        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(100,100,100,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] relative z-10 items-center justify-center p-8 xl:p-16">
        <div className="max-w-xl">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                  boxShadow: '0 20px 50px -15px rgba(99,102,241,0.5), 0 10px 20px -10px rgba(99,102,241,0.3)'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ainos/ainos-robot.png" alt="AINOS" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">AINOS</h1>
              <p className="text-sm font-medium text-gray-500">Business Suite</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-8">
            <h2 className="text-4xl xl:text-5xl font-bold leading-[1.15] mb-5 text-gray-900">
              Transform Your
              <span className="block mt-2">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                  }}
                >
                  Billing Experience
                </span>
              </span>
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Streamline invoicing, automate payments, and grow your business with intelligent automation.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {[
              { text: 'Automated Reminders', color: '#6366f1' },
              { text: 'Real-time Analytics', color: '#8b5cf6' },
              { text: 'PDF Generation', color: '#3b82f6' },
              { text: 'Multi-currency', color: '#a78bfa' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(249,250,251,0.6) 100%)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}20` }}
                >
                  <Check className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-purple-600">{stat.value}</span>
                  {stat.icon && <Star className="w-4 h-4 fill-purple-600 text-purple-600" />}
                </div>
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Card */}
      <div className="w-full lg:w-[45%] relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 12px 30px -8px rgba(99,102,241,0.4)'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ainos/ainos-robot.png" alt="AINOS" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AINOS</h1>
              <p className="text-xs text-gray-500">Business Suite</p>
            </div>
          </div>

          {/* Glass Card */}
          <div
            className="relative p-6 sm:p-8 rounded-[28px] overflow-hidden bg-white"
            style={{
              border: '1px solid rgba(99,102,241,0.15)',
              boxShadow: `0 50px 100px -30px rgba(0,0,0,0.1), 0 30px 60px -20px rgba(99,102,241,0.08), inset 0 1px 0 0 rgba(255,255,255,0.8)`
            }}
          >
            {/* Decorative Corner Glow */}
            <div
              className="absolute top-0 right-0 w-40 h-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
            />

            {/* Header */}
            <div className="relative text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">Welcome back</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                Sign in to continue
              </h2>

              <p className="text-sm text-gray-600">
                Access your invoices, customers & analytics
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="relative w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all overflow-hidden bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="relative font-semibold text-gray-700">Connecting to Google…</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span className="relative font-semibold text-gray-700">Continue with Google</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Why AINOS</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,250,251,0.8) 0%, rgba(243,244,246,0.6) 100%)',
                    border: '1px solid rgba(99,102,241,0.1)'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)' }}
                  >
                    <feature.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold mb-0.5 text-gray-900">{feature.title}</p>
                  <p className="text-[10px] text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] leading-relaxed text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-purple-600 hover:underline font-medium">Terms</a>
              {' & '}
              <a href="#" className="text-purple-600 hover:underline font-medium">Privacy Policy</a>
            </p>
          </div>

          {/* Bottom Badge */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              Trusted by <span className="font-semibold text-purple-600">10,000+</span> businesses worldwide
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
