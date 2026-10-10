'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, FileText, ArrowRight, Globe, Loader2, AlertCircle, Eye, EyeOff, LogIn, Zap, BarChart3, Lock, UserPlus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const errorMessages: Record<string, string> = {
  OAuthCallback: 'Connection timed out. Retrying automatically...',
  OAuthSignin: 'Please try signing in again.',
  Callback: 'Authentication callback failed. Please try again.',
  Default: 'An error occurred during sign-in.',
};

const leftFeatures = [
  { icon: Shield, title: 'Secure & Encrypted Login', desc: 'Bank-grade security for your data' },
  { icon: Zap, title: 'AI-Powered Automation', desc: 'Smart workflows that save hours' },
  { icon: BarChart3, title: 'Real-time Dashboard Access', desc: 'Live analytics at your fingertips' },
  { icon: FileText, title: 'Smart Invoicing & GST', desc: 'Automated billing and compliance' },
];

export default function SignInPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'google' | 'credentials'>('google');
  const autoRetried = useRef(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMode('google');

    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setStatus('Retrying...');
      await new Promise(r => setTimeout(r, 3000));
      try {
        await signIn('google', { callbackUrl: '/dashboard' });
      } catch {
        setError('Sign-in failed. Please try again.');
        setLoading(false);
      }
    }
  };

  const [status, setStatus] = useState('');

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMode('credentials');

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        window.location.href = '/dashboard';
        return;
      }

      setError('Sign-in failed. Please try again.');
      setLoading(false);
    } catch {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlError === 'OAuthCallback' && !autoRetried.current) {
      autoRetried.current = true;
      const timer = setTimeout(() => {
        handleGoogleSignIn();
      }, 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError]);

  const derivedError = urlError && urlError !== 'OAuthCallback'
    ? (errorMessages[urlError] || errorMessages.Default)
    : null;

  const displayError = error || derivedError;

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
                Welcome back! Access your dashboard to manage invoices, customers, inventory, and AI automation — all in one intelligent platform.
              </p>
            </motion.div>

            {/* New User Card */}
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
                  <h3 className="text-base font-bold text-gray-900 mb-1">New to AINOS?</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Join growing businesses using AI-powered invoicing, CRM, and automation. Quick setup in minutes!
                  </p>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#4c1d95' }}
                  >
                    Apply for Account <ArrowRight className="w-4 h-4" />
                  </Link>
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

          {/* ===== RIGHT — Sign In Form Card ===== */}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Supplier Login</h2>
                <p className="text-sm text-gray-500">Enter your credentials to access your dashboard</p>
              </div>

              {/* Card Body */}
              <div className="px-6 sm:px-8 py-6 space-y-5">
                {/* Google Sign In */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-purple-200 hover:shadow-sm transition-all disabled:opacity-60"
                >
                  {loading && mode === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4c1d95' }} />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>{loading && mode === 'google' ? (status || 'Connecting...') : 'Continue with Google'}</span>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">or sign in with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Form */}
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleCredentialsSignIn}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#4c1d95' }}>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full h-12 pl-14 pr-4 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#4c1d95' }}>
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-12 pl-14 pr-12 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{displayError}</p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading && mode === 'credentials'}
                    whileHover={{ scale: loading && mode === 'credentials' ? 1 : 1.01 }}
                    whileTap={{ scale: loading && mode === 'credentials' ? 1 : 0.99 }}
                    className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' }}
                  >
                    {loading && mode === 'credentials' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <><LogIn className="w-4 h-4" /> Login to Dashboard <ArrowRight className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </motion.form>

                {/* Forgot Password */}
                <div className="text-center">
                  <Link href="/auth/forgot-password" className="text-sm font-medium underline decoration-1 underline-offset-2" style={{ color: '#6d28d9' }}>
                    Forgot your password?
                  </Link>
                </div>

                {/* Important Note */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Important Note</p>
                    <p className="text-xs text-blue-700 mt-0.5">You can only login after your account is approved by admin.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mobile: Already have account */}
            <p className="lg:hidden text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold" style={{ color: '#6d28d9' }}>
                Create Account
              </Link>
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
