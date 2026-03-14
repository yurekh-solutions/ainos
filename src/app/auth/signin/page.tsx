'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">IANOS</h1>
          <p className="text-white/60">Billing Suite</p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-white/50 text-sm">
              Sign in to manage your invoices and billing
            </p>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
            className="w-full glass-button py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-white font-medium transition-all hover:bg-white/10"
          >
            <Chrome className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-center text-white/40 text-xs">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
