'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail, Plus, Send, Edit3, Trash2, Eye, Loader2,
  Search, Filter, BarChart3, Users, Clock, ChevronDown,
} from 'lucide-react';
import {
  type EmailCampaign, type ToastMsg,
  statusColors, statusIcons, statusLabels, formatDate, Toast,
} from './_components/lib';

export default function EmailCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (message: string, type: ToastMsg['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      } else {
        showToast('Could not load your emails', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error — could not load', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleSend = async (campaign: EmailCampaign) => {
    if (!confirm(`Send "${campaign.name}" to ${campaign.recipients?.length || 0} customers?`)) return;
    setSendingId(campaign.id);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}&action=send`, { method: 'PUT' });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const s = data?.send;
        if (s && typeof s.sent === 'number') {
          if (s.failed > 0) {
            showToast(`Sent ${s.sent} of ${s.total} — ${s.failed} failed`, 'error');
          } else {
            showToast(`Sent to ${s.sent} customer${s.sent === 1 ? '' : 's'}`, 'success');
          }
        } else {
          showToast(`"${campaign.name}" sent`, 'success');
        }
        fetchCampaigns();
      } else {
        showToast(data?.error || 'Could not send', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error — could not send', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (campaign: EmailCampaign) => {
    if (!confirm(`Delete "${campaign.name}"? This can't be undone.`)) return;
    setDeletingId(campaign.id);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`"${campaign.name}" deleted`, 'success');
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Could not delete', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error — could not delete', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: campaigns.length,
    drafts: campaigns.filter((c) => c.status === 'draft').length,
    sent: campaigns.filter((c) => c.status === 'sent').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + (c.recipients?.length || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-600/25 flex items-center justify-center flex-shrink-0">
              <Mail className="text-white" size={22} strokeWidth={2.2} />
            </div>
            Email Campaigns
          </h1>
          <p className="text-gray-500 mt-1">Send one email to all your customers at once</p>
        </div>
        {/* The single entry point for creating an email */}
        <button
          onClick={() => router.push('/marketing/campaigns/new')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-600/20"
        >
          <Plus size={18} />
          New Email
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Emails', value: stats.total, icon: BarChart3, grad: 'from-violet-500 to-purple-600', shadow: 'shadow-purple-600/25' },
          { label: 'Not Sent', value: stats.drafts, icon: Clock, grad: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' },
          { label: 'Sent', value: stats.sent, icon: Send, grad: 'from-green-500 to-emerald-600', shadow: 'shadow-emerald-500/25' },
          { label: 'People Reached', value: stats.totalRecipients, icon: Users, grad: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className={`inline-flex w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.grad} ${stat.shadow} shadow-md mb-3`}>
              <stat.icon className="text-white" size={19} strokeWidth={2.2} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 appearance-none cursor-pointer"
          >
            <option value="">All</option>
            <option value="draft">Not sent</option>
            <option value="sent">Sent</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {search || statusFilter ? 'No emails match your search' : 'No emails yet'}
          </h3>
          <p className="text-gray-500 text-sm">
            {search || statusFilter
              ? 'Try a different word or filter'
              : 'Use the “New Email” button above to write your first email.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status] || Clock;
            return (
              <motion.div
                key={campaign.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 hover:shadow-md hover:border-purple-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Campaign Info — tap to open detail page */}
                  <Link
                    href={`/marketing/campaigns/${campaign.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {campaign.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
                        <StatusIcon size={12} />
                        {statusLabels[campaign.status] || campaign.status}
                      </span>
                    </div>
                    {campaign.subject && (
                      <p className="text-sm text-gray-500 truncate">Subject: {campaign.subject}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {campaign.recipients?.length || 0} recipients
                      </span>
                      {campaign.status === 'sent' && campaign.sentCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Send size={12} />
                          {campaign.sentCount} sent
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(campaign.createdAt)}
                      </span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/marketing/campaigns/${campaign.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </Link>
                    {(campaign.status === 'draft' || campaign.status === 'failed') && (
                      <>
                        <Link
                          href={`/marketing/campaigns/${campaign.id}/edit`}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <button
                          onClick={() => handleSend(campaign)}
                          disabled={sendingId === campaign.id || !campaign.recipients?.length}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={campaign.status === 'failed' ? 'Try sending again' : 'Send campaign'}
                        >
                          {sendingId === campaign.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(campaign)}
                      disabled={deletingId === campaign.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deletingId === campaign.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
