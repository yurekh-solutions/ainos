'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Mail, Send, BarChart3, CheckCircle, Clock } from 'lucide-react';

interface EmailCampaign { id: string; name: string; subject: string | null; content: string | null; recipients: unknown; status: string; sentAt: string | null; sentCount: number; createdAt: string; }

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', content: '', recipientEmails: '' });
  const [sending, setSending] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try { const res = await fetch('/api/email-campaigns'); if (res.ok) setCampaigns(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse recipient emails into array
      const emails = form.recipientEmails.split(',').map(e => e.trim()).filter(Boolean);
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          content: form.content,
          recipients: emails,
          sentCount: 0,
          status: 'draft',
        }),
      });
      if (res.ok) {
        setForm({ name: '', subject: '', content: '', recipientEmails: '' });
        setShowForm(false);
        fetchCampaigns();
      }
    } catch (e) { console.error(e); }
  };

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      const res = await fetch(`/api/email-campaigns?id=${id}`, { method: 'PUT' });
      if (res.ok) fetchCampaigns();
    } catch (e) { console.error(e); }
    finally { setSending(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      const res = await fetch(`/api/email-campaigns?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchCampaigns();
    } catch (e) { console.error(e); }
  };

  const getRecipientCount = (recipients: unknown): number => {
    if (Array.isArray(recipients)) return recipients.length;
    if (typeof recipients === 'number') return recipients;
    return 0;
  };

  const totalRecipients = campaigns.reduce((s, c) => s + getRecipientCount(c.recipients), 0);
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((s, c) => s + c.sentCount, 0);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    scheduled: 'bg-violet-500',
    sending: 'bg-blue-500',
    sent: 'bg-emerald-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Create and manage email campaigns</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-colors">
            <Plus className="w-4 h-4" /> New Campaign
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total Campaigns', v: campaigns.length.toString(), c: 'text-purple-600 dark:text-purple-400', icon: Mail },
            { l: 'Sent', v: sentCampaigns.length.toString(), c: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
            { l: 'Total Sent', v: totalSent.toLocaleString(), c: 'text-blue-600 dark:text-blue-400', icon: Send },
            { l: 'Total Recipients', v: totalRecipients.toLocaleString(), c: 'text-violet-600 dark:text-violet-400', icon: BarChart3 },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.c}`} />
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.l}</p>
              </div>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaigns Grid */}
        {loading ? <div className="text-center py-20 text-gray-500">Loading...</div>
          : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No campaigns yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first email campaign to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp, i) => (
                <motion.div key={camp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{camp.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize ${statusColors[camp.status] || 'bg-gray-400'}`}>{camp.status}</span>
                  </div>
                  {camp.subject && <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">{camp.subject}</p>}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Send className="w-3 h-3" /> {getRecipientCount(camp.recipients)} recipients
                    </p>
                    {camp.status === 'sent' && (
                      <>
                        <p className="text-xs flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <CheckCircle className="w-3 h-3" /> {camp.sentCount} emails sent
                        </p>
                        {camp.sentAt && (
                          <p className="text-xs flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" /> {new Date(camp.sentAt).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {camp.status === 'draft' && (
                      <button onClick={() => handleSend(camp.id)} disabled={sending === camp.id}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50">
                        {sending === camp.id ? 'Sending...' : 'Send Now'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(camp.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {/* New Campaign Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Campaign</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Campaign Name *</label>
                  <input required placeholder="e.g., Monthly Newsletter" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject *</label>
                  <input required placeholder="Email subject line" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email Content *</label>
                  <textarea required placeholder="Write your email content here..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recipient Emails *</label>
                  <textarea required placeholder="email1@example.com, email2@example.com" value={form.recipientEmails} onChange={e => setForm({ ...form, recipientEmails: e.target.value })} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none" />
                  <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas</p>
                </div>
                <button type="submit"
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 transition-colors">
                  Create Campaign
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
