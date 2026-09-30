'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Plus, Send, Edit3, Trash2, Eye, X, CheckCircle,
  AlertCircle, Loader2, Search, Filter, BarChart3, Users,
  Clock, TrendingUp, Copy, ChevronDown
} from 'lucide-react';

interface EmailCampaign {
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

interface Toast {
  message: string;
  type: 'success' | 'error';
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusIcons: Record<string, typeof Clock> = {
  draft: Clock,
  sent: CheckCircle,
  scheduled: TrendingUp,
};

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<EmailCampaign | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRecipients, setFormRecipients] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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
        showToast('Failed to load campaigns', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error loading campaigns', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const resetForm = () => {
    setFormName('');
    setFormSubject('');
    setFormContent('');
    setFormRecipients('');
    setFormStatus('draft');
    setEditingCampaign(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (campaign: EmailCampaign) => {
    setFormName(campaign.name);
    setFormSubject(campaign.subject || '');
    setFormContent(campaign.content || '');
    setFormRecipients((campaign.recipients || []).join(', '));
    setFormStatus(campaign.status);
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Campaign name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const recipients = formRecipients
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        name: formName,
        subject: formSubject,
        content: formContent,
        recipients,
        status: formStatus,
      };

      const url = editingCampaign
        ? `/api/email-campaigns?id=${editingCampaign.id}`
        : '/api/email-campaigns';

      const res = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully',
          'success'
        );
        resetForm();
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to save campaign', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error saving campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (campaign: EmailCampaign) => {
    if (!confirm(`Send campaign "${campaign.name}" to ${campaign.recipients?.length || 0} recipients?`)) return;

    setSendingId(campaign.id);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}&action=send`, { method: 'PUT' });
      if (res.ok) {
        showToast(`Campaign "${campaign.name}" sent successfully`, 'success');
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to send campaign', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error sending campaign', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (campaign: EmailCampaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;

    setDeletingId(campaign.id);
    try {
      const res = await fetch(`/api/email-campaigns?id=${campaign.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Campaign "${campaign.name}" deleted`, 'success');
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to delete campaign', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error deleting campaign', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const copyRecipients = (recipients: string[] | null) => {
    if (!recipients?.length) return;
    navigator.clipboard.writeText(recipients.join(', '));
    showToast('Recipients copied to clipboard', 'success');
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Mail className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            Email Campaigns
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and send email campaigns to your audience
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-600/20"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Campaigns', value: stats.total, icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Sent', value: stats.sent, icon: Send, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Total Recipients', value: stats.totalRecipients, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
              <stat.icon className={stat.color} size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
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
          <Mail className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {search || statusFilter ? 'No campaigns match your filters' : 'No campaigns yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {search || statusFilter ? 'Try adjusting your search or filter' : 'Create your first email campaign to get started'}
          </p>
          {!search && !statusFilter && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Create Campaign
            </button>
          )}
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
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Campaign Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {campaign.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
                        <StatusIcon size={12} />
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.subject && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Subject: {campaign.subject}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewingCampaign(campaign)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    {campaign.status === 'draft' && (
                      <>
                        <button
                          onClick={() => openEdit(campaign)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleSend(campaign)}
                          disabled={sendingId === campaign.id || !campaign.recipients?.length}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Send campaign"
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
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Summer Sale 2026"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g., Don't miss our summer deals!"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Content
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Write your email content here..."
                    rows={6}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-y"
                  />
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Recipients <span className="text-gray-400 font-normal">(comma-separated emails)</span>
                  </label>
                  <textarea
                    value={formRecipients}
                    onChange={(e) => setFormRecipients(e.target.value)}
                    placeholder="john@example.com, jane@example.com"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-y font-mono"
                  />
                  {formRecipients.trim() && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formRecipients.split(',').map((r) => r.trim()).filter(Boolean).length} recipient(s)
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-600/20"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Campaign Modal */}
      <AnimatePresence>
        {viewingCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setViewingCampaign(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Campaign Details
                </h2>
                <button
                  onClick={() => setViewingCampaign(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {viewingCampaign.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[viewingCampaign.status] || statusColors.draft}`}>
                      {viewingCampaign.status}
                    </span>
                  </div>
                </div>

                {viewingCampaign.subject && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subject</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{viewingCampaign.subject}</p>
                  </div>
                )}

                {viewingCampaign.content && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Content</label>
                    <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {viewingCampaign.content}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Recipients ({viewingCampaign.recipients?.length || 0})
                  </label>
                  {viewingCampaign.recipients?.length ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {viewingCampaign.recipients.map((email, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono">
                          {email}
                        </span>
                      ))}
                      <button
                        onClick={() => copyRecipients(viewingCampaign.recipients)}
                        className="px-2.5 py-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Copy size={12} />
                        Copy all
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">No recipients added</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(viewingCampaign.createdAt)}</p>
                  </div>
                  {viewingCampaign.sentAt && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent At</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(viewingCampaign.sentAt)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent Count</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingCampaign.sentCount}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
