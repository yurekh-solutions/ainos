'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { type ToastMsg, Toast } from '../_components/lib';
import CampaignForm from '../_components/CampaignForm';

export default function NewCampaignPage() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const showToast = (message: string, type: ToastMsg['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const back = () => router.push('/marketing/campaigns');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Toast toast={toast} />
      <div className="max-w-2xl mx-auto">
        <Link
          href="/marketing/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to emails
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-600/25 flex items-center justify-center flex-shrink-0">
              <Mail className="text-white" size={20} strokeWidth={2.2} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Write a new email</h1>
          </div>
          <div className="p-6">
            <CampaignForm onDone={back} showToast={showToast} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
