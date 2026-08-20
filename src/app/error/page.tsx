'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const [countdown, setCountdown] = useState(5);

  const errorMessages: Record<string, string> = {
    OAuthCallback: 'Google authentication timed out. Retrying automatically...',
    OAuthSignin: 'Sign-in was cancelled. Redirecting back...',
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    AccessDenied: 'Access denied. You do not have permission to sign in.',
    Configuration: 'Server configuration issue. Please contact support.',
    Default: 'Authentication failed. Retrying automatically...',
  };

  const message = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

  // Auto-redirect to sign-in after 5 seconds (with countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/auth/signin');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111118 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-8 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(165deg, rgba(20,20,35,0.95) 0%, rgba(15,15,28,0.9) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 50px 100px -30px rgba(0,0,0,0.5)'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6"
        >
          <AlertCircle className="w-8 h-8 text-red-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-3">Authentication Error</h1>
        <p className="text-slate-400 mb-2">{message}</p>
        {error && <p className="text-xs text-slate-600 mb-4">Error code: {error}</p>}
        <p className="text-xs text-purple-400 mb-8">Redirecting to sign-in in {countdown}s...</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
          
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
