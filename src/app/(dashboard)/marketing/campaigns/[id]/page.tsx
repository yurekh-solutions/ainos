'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit3, Send, Trash2, Loader2, Users, Copy, CheckCircle, Clock, Mail } from 'lucide-react';
import {
  type EmailCampaign, type ToastMsg,
  statusColors, statusLabels, formatDate, Toast,
} from '../_components/lib';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleSend = async () => {
    if (!campaign) return;
    if (!confirm(`Send "${campaign.name}" to ${campaign.recipients?.length || 0} customers?`)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}&action=send`, { method: 'PUT' });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const s = data?.send;
        if (s && typeof s.sent === 'number') {
          if (s.failed > 0) showToast(`Sent ${s.sent} of ${s.total} — ${s.failed} failed`, 'error');
          else showToast(`Sent to ${s.sent} customer${s.sent === 1 ? '' : 's'}`, 'success');
        } else {
          showToast(`"${campaign.name}" sent`, 'success');
        }
        fetchCampaign();
      } else {
        showToast(data?.error || 'Could not send', 'error');
      }
    } catch {
      showToast('Network error — could not send', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    if (!confirm(`Delete "${campaign.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Email deleted', 'success');
        router.push('/marketing/campaigns');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Could not delete', 'error');
        setDeleting(false);
      }
    } catch {
      showToast('Network error — could not delete', 'error');
      setDeleting(false);
    }
  };

  const copyRecipients = () => {
    if (!campaign?.recipients?.length) return;
    navigator.clipboard.writeText(campaign.recipients.join(', '));
    showToast('Recipients copied to clipboard', 'success');
  };

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
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 break-words">{campaign.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[campaign.status] || statusColors.draft}`}>
                    {statusLabels[campaign.status] || campaign.status}
                  </span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(campaign.status === 'draft' || campaign.status === 'failed') && (
                    <>
                      <Link
                        href={`/marketing/campaigns/${campaign.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <Edit3 size={15} /> Edit
                      </Link>
                      <button
                        onClick={handleSend}
                        disabled={sending || !campaign.recipients?.length}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        {campaign.status === 'failed' ? 'Try again' : 'Send'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {campaign.subject && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                  <p className="mt-1 text-gray-900">{campaign.subject}</p>
                </div>
              )}

              {campaign.content && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {campaign.content}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recipients ({campaign.recipients?.length || 0})
                  </label>
                  {campaign.recipients?.length ? (
                    <button
                      onClick={copyRecipients}
                      className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <Copy size={12} /> Copy all
                    </button>
                  ) : null}
                </div>
                {campaign.recipients?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.recipients.map((email, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-mono">
                        {email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">No recipients added</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-gray-200 text-sm">
                <div className="flex items-start gap-1.5 text-gray-500 min-w-0">
                  <Clock size={14} className="mt-0.5 shrink-0" /> <span className="shrink-0">Created:</span> <span className="text-gray-900 break-words">{formatDate(campaign.createdAt)}</span>
                </div>
                {campaign.sentAt && (
                  <div className="flex items-start gap-1.5 text-gray-500 min-w-0">
                    <CheckCircle size={14} className="mt-0.5 shrink-0" /> <span className="shrink-0">Sent:</span> <span className="text-gray-900 break-words">{formatDate(campaign.sentAt)}</span>
                  </div>
                )}
                {campaign.status === 'sent' && (
                  <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                    <Users size={14} className="shrink-0" /> Delivered: <span className="text-gray-900">{campaign.sentCount}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
