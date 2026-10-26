'use client';
import { useState } from 'react';
import { Users, Loader2, CheckCircle } from 'lucide-react';
import type { EmailCampaign, ToastMsg } from './lib';

interface CampaignFormProps {
  /** Pass an existing campaign to edit; omit to create a new one. */
  campaign?: EmailCampaign | null;
  /** Called after a successful save (e.g. navigate back to the list). */
  onDone: () => void;
  showToast: (message: string, type?: ToastMsg['type']) => void;
}

const fieldCls =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Split on comma / semicolon / whitespace / newline so space-separated emails never collapse into one invalid address.
function splitEmails(s: string): string[] {
  return s.split(/[\s,;]+/).map((e) => e.trim()).filter((e) => EMAIL_RE.test(e));
}

export default function CampaignForm({ campaign, onDone, showToast }: CampaignFormProps) {
  const isEdit = Boolean(campaign);
  const [formName, setFormName] = useState(campaign?.name || '');
  const [formSubject, setFormSubject] = useState(campaign?.subject || '');
  const [formContent, setFormContent] = useState(campaign?.content || '');
  const [formRecipients, setFormRecipients] = useState((campaign?.recipients || []).join(', '));
  const [formStatus, setFormStatus] = useState(campaign?.status === 'scheduled' ? 'scheduled' : 'draft');
  const [submitting, setSubmitting] = useState(false);
  const [importingCrm, setImportingCrm] = useState(false);

  // One-tap: pull every CRM customer email into the recipients field (deduped).
  const importFromCrm = async () => {
    setImportingCrm(true);
    try {
      const res = await fetch('/api/tools/audience');
      if (!res.ok) { showToast('Could not load CRM contacts', 'error'); return; }
      const d = await res.json();
      const emails: string[] = Array.isArray(d.emails) ? d.emails : [];
      if (!emails.length) { showToast('No customer emails found in your CRM', 'error'); return; }
      const existing = splitEmails(formRecipients);
      const merged = Array.from(new Set([...existing, ...emails]));
      setFormRecipients(merged.join(', '));
      showToast(`Added ${emails.length} customer${emails.length === 1 ? '' : 's'} from your CRM`, 'success');
    } catch {
      showToast('Network error loading CRM contacts', 'error');
    } finally {
      setImportingCrm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please give the email a name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const recipients = splitEmails(formRecipients);
      const payload = {
        name: formName,
        subject: formSubject,
        content: formContent,
        recipients,
        status: formStatus,
      };
      const url = isEdit ? `/api/email-campaigns?id=${campaign!.id}` : '/api/email-campaigns';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('Email saved', 'success');
        onDone();
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Could not save', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error — could not save', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const recipientCount = splitEmails(formRecipients).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g., Summer Sale 2026"
          className={fieldCls}
          required
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject line</label>
        <input
          type="text"
          value={formSubject}
          onChange={(e) => setFormSubject(e.target.value)}
          placeholder="e.g., Don't miss our summer deals!"
          className={fieldCls}
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your message</label>
        <textarea
          value={formContent}
          onChange={(e) => setFormContent(e.target.value)}
          placeholder="Type what your customers will read..."
          rows={6}
          className={`${fieldCls} resize-y`}
        />
      </div>

      {/* Live preview mirrors the email as it is written */}
      {(formSubject.trim() || formContent.trim()) && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
          </div>
          <div className="p-5 bg-white">
            <h3 className="text-base font-bold text-gray-900 mb-2 break-words">
              {formSubject.trim() || <span className="text-gray-300">(your subject line)</span>}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {formContent.trim() || <span className="text-gray-300">(your message body)</span>}
            </p>
            <hr className="my-5 border-gray-200" />
            <p className="text-xs text-gray-400">Sent via AINOS Business Suite</p>
          </div>
        </div>
      )}

      {/* Recipients */}
      <div>
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <label className="block text-sm font-medium text-gray-700">Who receives it</label>
          <button
            type="button"
            onClick={importFromCrm}
            disabled={importingCrm}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
          >
            {importingCrm ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
            Use all my customers
          </button>
        </div>
        <textarea
          value={formRecipients}
          onChange={(e) => setFormRecipients(e.target.value)}
          placeholder="Tap “Use all my customers” above, or paste emails here"
          rows={3}
          className={`${fieldCls} resize-y font-mono`}
        />
        {recipientCount > 0 && (
          <p className="text-xs text-gray-400 mt-1">{recipientCount} customer(s)</p>
        )}
      </div>

      {/* When to send */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">When to send</label>
        <select
          value={formStatus}
          onChange={(e) => setFormStatus(e.target.value)}
          className={`${fieldCls} appearance-none cursor-pointer`}
        >
          <option value="draft">Save as draft</option>
          <option value="scheduled">Schedule for later</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-600/20"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {isEdit ? 'Save changes' : 'Save email'}
        </button>
      </div>
    </form>
  );
}
