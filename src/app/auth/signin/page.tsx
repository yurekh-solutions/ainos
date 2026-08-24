'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, FileText, Users, Sparkles, ArrowRight, Check, Star, TrendingUp, Globe, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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

const errorMessages: Record<string, string> = {
  OAuthCallback: 'Connection timed out. Retrying automatically...',
  OAuthSignin: 'Please try signing in again.',
  Callback: 'Authentication callback failed. Please try again.',
  Default: 'An error occurred during sign-in.',
};

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
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setStatus('Retrying...');
      await new Promise(r => setTimeout(r, 3000));
      try {
        await signIn('google', { callbackUrl: '/' });
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
        window.location.href = '/';
        return;
      }

      setError('Sign-in failed. Please try again.');
      setLoading(false);
    } catch {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  // Auto-retry when redirected back with OAuthCallback error
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

  // Derive error from URL params
  const derivedError = urlError && urlError !== 'OAuthCallback'
    ? (errorMessages[urlError] || errorMessages.Default)
    : null;

  const displayError = error || derivedError;

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%, #f9fafb 100%)'
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 50%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 w-[900px] h-[900px] translate-x-1/3 translate-y-1/3"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 50%)' }}
        />
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] relative z-10 items-center justify-center p-8 xl:p-16">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-lg w-full text-center"
        >
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div 
              className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                boxShadow: '0 12px 30px -8px rgba(99,102,241,0.4)'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ainos-robot.png" alt="AINOS" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900">AINOS</h1>
              <p className="text-xs text-gray-500">Business Suite</p>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-3">
              One Platform.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Complete Business Control.
              </span>
            </h2>
            <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed">
              Manage invoices, customers, inventory, HR, and AI automation — all in one intelligent dashboard.
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/aino.png" 
              alt="AINOS Business Suite" 
              className="w-full max-w-md mx-auto object-contain"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Sign In Card */}
      <div className="w-full lg:w-[45%] relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-8"
          >
            <div 
              className="w-12 h-12 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 12px 30px -8px rgba(99,102,241,0.4)'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ainos-robot.png" alt="AINOS" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AINOS</h1>
              <p className="text-xs text-gray-500">Business Suite</p>
            </div>
          </motion.div>

          <div
            className="relative p-6 sm:p-8 rounded-[28px] overflow-hidden bg-white"
            style={{
              border: '1px solid rgba(99,102,241,0.15)',
              boxShadow: `
                0 50px 100px -30px rgba(0,0,0,0.1),
                0 30px 60px -20px rgba(99,102,241,0.08),
                inset 0 1px 0 0 rgba(255,255,255,0.8)
              `
            }}
          >
            <div 
              className="absolute top-0 right-0 w-40 h-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
            />

            <div className="relative text-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                  border: '1px solid rgba(99,102,241,0.2)'
                }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">Welcome back</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900"
              >
                Sign in to continue
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-gray-600"
              >
                Access your invoices, customers & analytics
              </motion.p>
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: loading && mode === 'google' ? 1 : 1.02, y: loading && mode === 'google' ? 0 : -2 }}
              whileTap={{ scale: loading && mode === 'google' ? 1 : 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="relative w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all group overflow-hidden bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && mode === 'google' ? (
                <>
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="relative font-semibold text-gray-700">{status || 'Connecting...'}</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span className="relative font-semibold text-gray-700">Continue with Google</span>
                </>
              )}
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-4 my-5"
            >
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">or sign in with email</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)' }} />
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              onSubmit={handleCredentialsSignIn}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{displayError}</p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading && mode === 'credentials'}
                whileHover={{ scale: loading && mode === 'credentials' ? 1 : 1.02, y: loading && mode === 'credentials' ? 0 : -2 }}
                whileTap={{ scale: loading && mode === 'credentials' ? 1 : 0.98 }}
                className="w-full py-3.5 px-6 rounded-2xl font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 10px 30px -10px rgba(99,102,241,0.5)'
                }}
              >
                {loading && mode === 'credentials' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </motion.button>
            </motion.form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm text-gray-600 mt-5"
            >
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-purple-600 hover:text-purple-700">
                Create Account
              </Link>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-[11px] leading-relaxed text-gray-500 mt-4"
            >
              By continuing, you agree to our{' '}
              <a href="#" className="text-purple-600 hover:underline font-medium">Terms</a>
              {' & '}
              <a href="#" className="text-purple-600 hover:underline font-medium">Privacy Policy</a>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              Trusted by <span className="font-semibold text-purple-600">10,000+</span> businesses worldwide
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
