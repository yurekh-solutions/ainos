'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, FileText, Clock, CheckCircle2, XCircle,
  Eye, ChevronRight, Search, Filter, Users,
  ArrowLeft, ExternalLink, RefreshCw, Mail, Phone, Globe, MapPin,
  Calendar, Hash, UserCircle, Ban, X, Download, Loader2
} from 'lucide-react';

interface CompanySummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  companyType: string | null;
  onboardingStatus: string;
  onboardingSubmittedAt: string | null;
  onboardingRejectionReason: string | null;
  onboardingReviewedAt: string | null;
  onboardingReviewedBy: string | null;
  totalDocsUploaded: number;
  totalDocsApproved: number;
  docsVerified: boolean;
  createdAt: string;
  createdBy: string;
  _count: { documents: number; users: number };
}

interface DocumentRecord {
  id: string;
  name: string;
  type: string | null;
  url: string | null;
  size: number | null;
  category: string | null;
  cloudinaryUrl: string | null;
  cloudinaryThumbnail: string | null;
  resourceType: string | null;
  format: string | null;
  verificationStatus: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface AuditRecord {
  id: string;
  action: string;
  performedByName: string | null;
  notes: string | null;
  createdAt: string;
}

interface CompanyDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  country: string | null;
  companyType: string | null;
  gstNumber: string | null;
  taxId: string | null;
  onboardingStatus: string;
  onboardingSubmittedAt: string | null;
  onboardingRejectionReason: string | null;
  totalDocsUploaded: number;
  totalDocsApproved: number;
  docsVerified: boolean;
  createdAt: string;
  createdBy: string;
  users: { id: string; name: string; email: string; phone: string | null; role: string; createdAt: string }[];
}

const STATUS_CONFIG: Record<string, { chip: string; icon: typeof Clock; label: string }> = {
  pending: { chip: 'status-warning', icon: Clock, label: 'Pending' },
  docs_submitted: { chip: 'status-info', icon: FileText, label: 'Docs Submitted' },
  under_review: {
    chip: 'bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.25)] text-[hsl(var(--primary))]',
    icon: Eye, label: 'Under Review'
  },
  approved: { chip: 'status-success', icon: CheckCircle2, label: 'Approved' },
  rejected: { chip: 'status-error', icon: XCircle, label: 'Rejected' },
  suspended: {
    chip: 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]',
    icon: Ban, label: 'Suspended'
  },
};

const DOC_STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  pending: { chip: 'status-warning', label: 'Pending' },
  approved: { chip: 'status-success', label: 'Approved' },
  rejected: { chip: 'status-error', label: 'Rejected' },
  resubmit: { chip: 'status-info', label: 'Resubmit' },
};

const STATUS_FILTERS = ['all', 'pending', 'docs_submitted', 'under_review', 'approved', 'rejected', 'suspended'];

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Document Preview Modal ---------- */

function DocumentPreviewModal({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
  const docConf = DOC_STATUS_CONFIG[doc.verificationStatus || 'pending'] || DOC_STATUS_CONFIG.pending;
  const fileUrl = doc.cloudinaryUrl || doc.url;
  const isImage = doc.resourceType === 'image';
  const isPdf = (doc.format || '').toLowerCase() === 'pdf';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-[hsl(var(--border))] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.08)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[hsl(var(--primary))]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-[hsl(var(--foreground))] truncate">{doc.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {doc.category && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{doc.category}</span>
              )}
              {doc.size ? (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatSize(doc.size)}</span>
              ) : null}
              {doc.format && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {doc.format}
                </span>
              )}
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${docConf.chip}`}>
                {docConf.label}
              </span>
            </div>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex-shrink-0"
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden bg-[hsl(var(--secondary))]">
          {isImage && fileUrl ? (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
              <img
                src={fileUrl}
                alt={doc.name}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            </div>
          ) : isPdf && fileUrl ? (
            <iframe
              src={fileUrl}
              title={doc.name}
              className="w-full h-full border-0"
            />
          ) : fileUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-center mb-5">
                <FileText className="w-9 h-9 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h4 className="text-base font-medium text-[hsl(var(--foreground))]">Preview not available</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-sm font-light">
                {doc.format?.toUpperCase() || 'This'} files cannot be previewed in the browser. Download or open the file to review it.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4" />
                Open File
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-10 h-10 text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No file URL available for this document</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-[hsl(var(--border))] flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Uploaded {new Date(doc.createdAt).toLocaleString()}
          </p>
          {doc.verifiedAt && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Verified {new Date(doc.verifiedAt).toLocaleString()}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Main Page ---------- */

export default function AdminOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchCompanies = useCallback(async (filterStatus?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus ?? statusFilter, page: '1', limit: '20' });
      const res = await fetch(`/api/admin/onboarding?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchCompanyDetail = async (companyId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCompany(data.company);
        setDocuments(data.documents);
        setAudits(data.audits);
      }
    } catch (err) {
      console.error('Failed to fetch company detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (companyId: string, action: 'approve' | 'reject' | 'resubmit' | 'suspend') => {
    if (action === 'reject' && !rejectReason.trim()) {
      setShowRejectModal(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejectReason || undefined }),
      });

      if (res.ok) {
        await fetchCompanies();
        if (selectedCompany?.id === companyId) {
          await fetchCompanyDetail(companyId);
        }
        setRejectReason('');
        setShowRejectModal(false);
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocAction = async (companyId: string, documentIds: string[], action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, documentIds, reason: action === 'reject' ? rejectReason : undefined }),
      });

      if (res.ok) {
        await fetchCompanyDetail(companyId);
        await fetchCompanies();
      }
    } catch (err) {
      console.error('Doc action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  // Detail view
  if (selectedCompany) {
    const statusConf = getStatusConfig(selectedCompany.onboardingStatus);
    const StatusIcon = statusConf.icon;

    return (
      <div className="min-h-screen text-[hsl(var(--foreground))]">
        {/* Header */}
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))/0.8] backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => { setSelectedCompany(null); setDocuments([]); setAudits([]); }}
              className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-medium tracking-tight">{selectedCompany.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.chip}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {statusConf.label}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 font-light">
                {selectedCompany.companyType} · {selectedCompany.country}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedCompany.onboardingStatus !== 'approved' && (
                <button
                  onClick={() => handleAction(selectedCompany.id, 'approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              )}
              {selectedCompany.onboardingStatus !== 'rejected' && (
                <button
                  onClick={() => handleAction(selectedCompany.id, 'reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Company Info */}
              <div className="lg:col-span-1 space-y-5">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-5">
                    Company Details
                  </h3>
                  <div className="space-y-4">
                    {selectedCompany.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <span className="text-[hsl(var(--foreground))] font-light truncate">{selectedCompany.email}</span>
                      </div>
                    )}
                    {selectedCompany.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <span className="font-light">{selectedCompany.phone}</span>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline truncate">
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                    {selectedCompany.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <span className="font-light leading-relaxed">{selectedCompany.address}</span>
                      </div>
                    )}
                    {selectedCompany.gstNumber && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <Hash className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <span className="font-light">GST: {selectedCompany.gstNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      </div>
                      <span className="font-light">Registered {new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Users */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Users ({selectedCompany.users.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedCompany.users.map(u => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{u.email} · {u.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <p className="text-2xl font-medium">{selectedCompany.totalDocsUploaded}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Uploaded</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <p className="text-2xl font-medium text-emerald-600">{selectedCompany.totalDocsApproved}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Approved</p>
                  </div>
                </div>

                {/* Rejection reason */}
                {selectedCompany.onboardingRejectionReason && (
                  <div className="status-error rounded-2xl p-4">
                    <p className="text-xs font-medium uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-sm font-light">{selectedCompany.onboardingRejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Documents + Audit */}
              <div className="lg:col-span-2 space-y-5">
                {/* Documents */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-[hsl(var(--border))] flex items-center justify-between gap-3">
                    <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Documents ({documents.length})
                    </h3>
                    <button
                      onClick={() => handleDocAction(selectedCompany.id, documents.filter(d => d.verificationStatus === 'pending').map(d => d.id), 'approve')}
                      disabled={actionLoading || !documents.some(d => d.verificationStatus === 'pending')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Approve All Pending
                    </button>
                  </div>
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {documents.length === 0 ? (
                      <div className="p-10 text-center">
                        <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-[hsl(var(--muted-foreground))] font-light">No documents uploaded yet</p>
                      </div>
                    ) : (
                      documents.map(doc => {
                        const docConf = DOC_STATUS_CONFIG[doc.verificationStatus || 'pending'] || DOC_STATUS_CONFIG.pending;
                        return (
                          <div key={doc.id} className="p-4 sm:px-6 flex items-center gap-4 hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                            {/* Thumbnail — click to preview */}
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="w-14 h-14 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden flex-shrink-0 hover:border-[hsl(var(--primary)/0.4)] transition-colors"
                              title="Preview document"
                            >
                              {doc.cloudinaryThumbnail ? (
                                <img src={doc.cloudinaryThumbnail} alt={doc.name} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                              )}
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                {doc.category && (
                                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{doc.category}</span>
                                )}
                                {doc.size ? (
                                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatSize(doc.size)}</span>
                                ) : null}
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${docConf.chip}`}>
                                  {docConf.label}
                                </span>
                              </div>
                              {doc.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">{doc.rejectionReason}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                title="Preview document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(doc.url || doc.cloudinaryUrl) && (
                                <a
                                  href={doc.cloudinaryUrl || doc.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {doc.verificationStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleDocAction(selectedCompany.id, [doc.id], 'approve')}
                                    disabled={actionLoading}
                                    className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600/60 hover:text-emerald-600 transition-colors disabled:opacity-40"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDocAction(selectedCompany.id, [doc.id], 'reject')}
                                    disabled={actionLoading}
                                    className="p-2 rounded-xl hover:bg-red-50 text-red-600/60 hover:text-red-600 transition-colors disabled:opacity-40"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Audit Trail */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-5 sm:px-6 py-4 border-b border-[hsl(var(--border))]">
                    <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Audit Trail
                    </h3>
                  </div>
                  <div className="divide-y divide-[hsl(var(--border))]">
                    {audits.length === 0 ? (
                      <div className="p-10 text-center">
                        <ShieldCheck className="w-8 h-8 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-[hsl(var(--muted-foreground))] font-light">No audit entries yet</p>
                      </div>
                    ) : (
                      audits.map(audit => (
                        <div key={audit.id} className="p-4 sm:px-6 flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">{audit.action.replace(/_/g, ' ')}</span>
                              <span className="text-[hsl(var(--muted-foreground))] ml-2 font-light">by {audit.performedByName}</span>
                            </p>
                            {audit.notes && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-light">{audit.notes}</p>}
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 opacity-70">{new Date(audit.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Preview Modal */}
        <AnimatePresence>
          {previewDoc && (
            <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-medium mb-1">Rejection Reason</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 font-light">
                  Provide a reason so the company knows what to fix.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-sm resize-none"
                  rows={4}
                  placeholder="e.g., PAN card is blurry, please re-upload a clearer copy..."
                />
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedCompany) handleAction(selectedCompany.id, 'reject');
                    }}
                    disabled={!rejectReason.trim() || actionLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Confirm Reject
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen text-[hsl(var(--foreground))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              Onboarding & Verification
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] mt-2 font-light">
              Review company registrations and verify documents
            </p>
          </div>
          <button
            onClick={() => fetchCompanies()}
            className="p-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-transparent'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Company List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="glass-card rounded-2xl text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-[hsl(var(--muted-foreground))] font-light">No companies found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCompanies.map((company, idx) => {
              const conf = getStatusConfig(company.onboardingStatus);
              const StatusIcon = conf.icon;
              return (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  className="glass-card rounded-2xl p-5 cursor-pointer"
                  onClick={() => fetchCompanyDetail(company.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4c1d95]/10 to-[#6d28d9]/10 border border-[hsl(var(--primary)/0.15)] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-[hsl(var(--primary))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-medium truncate">{company.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${conf.chip}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1 -mt-0.5" />
                          {conf.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[hsl(var(--muted-foreground))] font-light flex-wrap">
                        {company.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />{company.email}
                          </span>
                        )}
                        {company.companyType && <span>{company.companyType}</span>}
                        {company.country && <span>{company.country}</span>}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-center">
                        <p className="font-medium">{company.totalDocsUploaded}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">docs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-emerald-600">{company.totalDocsApproved}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">approved</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{company._count.users}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">users</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
