'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Loader2, Mail } from 'lucide-react';
import { type EmailCampaign, type ToastMsg, Toast } from '../../_components/lib';
import CampaignForm from '../../_components/CampaignForm';

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const showToast = (message: string, type: ToastMsg['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/email-campaigns?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data && !Array.isArray(data) ? data : null);
      } else {
        showToast('Could not load this email', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error — could not load', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const back = () => router.push(`/marketing/campaigns/${id}`);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Toast toast={toast} />
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/marketing/campaigns/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to email
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-purple-600" size={32} />
          </div>
        ) : !campaign ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Mail className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Email not found</h3>
            <p className="text-gray-500 text-sm">It may have been deleted.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center flex-shrink-0">
                <Edit3 className="text-white" size={20} strokeWidth={2.2} />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Edit email</h1>
            </div>
            <div className="p-6">
              <CampaignForm campaign={campaign} onDone={back} showToast={showToast} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
