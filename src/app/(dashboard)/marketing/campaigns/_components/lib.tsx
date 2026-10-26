'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string | null;
  content: string | null;
  recipients: string[] | null;
  status: string;
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ToastMsg {
  message: string;
  type: 'success' | 'error';
}

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

export const statusIcons: Record<string, typeof Clock> = {
  draft: Clock,
  sent: CheckCircle,
  scheduled: TrendingUp,
  failed: AlertCircle,
};

// Plain-language labels so a first-time user instantly understands each status.
export const statusLabels: Record<string, string> = {
  draft: 'Not sent yet',
  sent: 'Sent',
  scheduled: 'Scheduled',
  failed: 'Failed',
};

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Small top-center toast reused by every campaigns sub-page. */
export function Toast({ toast }: { toast: ToastMsg | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50"
        >
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
