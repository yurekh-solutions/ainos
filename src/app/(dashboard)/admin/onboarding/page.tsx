'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, FileText, Clock, CheckCircle2, XCircle,
  AlertTriangle, Eye, ChevronRight, Search, Filter, Users,
  ArrowLeft, ExternalLink, RefreshCw, Mail, Phone, Globe, MapPin,
  Calendar, Hash, UserCircle, Ban, RotateCcw, Loader2
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending' },
  docs_submitted: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: FileText, label: 'Docs Submitted' },
  under_review: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Eye, label: 'Under Review' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Rejected' },
  suspended: { color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: Ban, label: 'Suspended' },
};

const DOC_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Rejected' },
  resubmit: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Resubmit' },
};

const STATUS_FILTERS = ['all', 'pending', 'docs_submitted', 'under_review', 'approved', 'rejected', 'suspended'];

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
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Header */}
        <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => { setSelectedCompany(null); setDocuments([]); setAudits([]); }}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{selectedCompany.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConf.bg} ${statusConf.color}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {statusConf.label}
                </span>
              </div>
              <p className="text-sm text-white/40 mt-0.5">{selectedCompany.companyType} · {selectedCompany.country}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCompany.onboardingStatus !== 'approved' && (
                <button
                  onClick={() => handleAction(selectedCompany.id, 'approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              )}
              {selectedCompany.onboardingStatus !== 'rejected' && (
                <button
                  onClick={() => handleAction(selectedCompany.id, 'reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Company Details</h3>
                  <div className="space-y-3">
                    {selectedCompany.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-white/30" />
                        <span className="text-white/70">{selectedCompany.email}</span>
                      </div>
                    )}
                    {selectedCompany.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-white/30" />
                        <span className="text-white/70">{selectedCompany.phone}</span>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-4 h-4 text-white/30" />
                        <a href={selectedCompany.website} target="_blank" className="text-purple-400 hover:underline">{selectedCompany.website}</a>
                      </div>
                    )}
                    {selectedCompany.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-white/30" />
                        <span className="text-white/70">{selectedCompany.address}</span>
                      </div>
                    )}
                    {selectedCompany.gstNumber && (
                      <div className="flex items-center gap-3 text-sm">
                        <Hash className="w-4 h-4 text-white/30" />
                        <span className="text-white/70">GST: {selectedCompany.gstNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-white/30" />
                      <span className="text-white/70">Registered {new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Users */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Users ({selectedCompany.users.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedCompany.users.map(u => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <UserCircle className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-white/40">{u.email} · {u.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedCompany.totalDocsUploaded}</p>
                    <p className="text-xs text-white/40 mt-1">Uploaded</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{selectedCompany.totalDocsApproved}</p>
                    <p className="text-xs text-white/40 mt-1">Approved</p>
                  </div>
                </div>

                {/* Rejection reason */}
                {selectedCompany.onboardingRejectionReason && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-xs font-medium text-red-400 uppercase mb-1">Rejection Reason</p>
                    <p className="text-sm text-white/70">{selectedCompany.onboardingRejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Documents + Audit */}
              <div className="lg:col-span-2 space-y-6">
                {/* Documents */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Documents ({documents.length})
                    </h3>
                    <button
                      onClick={() => handleDocAction(selectedCompany.id, documents.filter(d => d.verificationStatus === 'pending').map(d => d.id), 'approve')}
                      disabled={actionLoading || !documents.some(d => d.verificationStatus === 'pending')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
                    >
                      Approve All Pending
                    </button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {documents.length === 0 ? (
                      <div className="p-8 text-center text-white/30 text-sm">No documents uploaded yet</div>
                    ) : (
                      documents.map(doc => {
                        const docConf = DOC_STATUS_CONFIG[doc.verificationStatus || 'pending'] || DOC_STATUS_CONFIG.pending;
                        return (
                          <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                            {/* Thumbnail / Icon */}
                            <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {doc.cloudinaryThumbnail ? (
                                <img src={doc.cloudinaryThumbnail} alt={doc.name} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-6 h-6 text-white/20" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-white/30">{doc.category}</span>
                                <span className="text-xs text-white/20">·</span>
                                <span className="text-xs text-white/30">{doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ''}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${docConf.bg} ${docConf.color}`}>
                                  {docConf.label}
                                </span>
                              </div>
                              {doc.rejectionReason && (
                                <p className="text-xs text-red-400/70 mt-1">{doc.rejectionReason}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
                                  title="View document"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {doc.verificationStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleDocAction(selectedCompany.id, [doc.id], 'approve')}
                                    disabled={actionLoading}
                                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400/50 hover:text-emerald-400 transition-colors disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDocAction(selectedCompany.id, [doc.id], 'reject')}
                                    disabled={actionLoading}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-50"
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
                <div className="rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Audit Trail
                    </h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {audits.length === 0 ? (
                      <div className="p-8 text-center text-white/30 text-sm">No audit entries yet</div>
                    ) : (
                      audits.map(audit => (
                        <div key={audit.id} className="p-4 flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm">
                              <span className="font-medium text-white/80">{audit.action.replace(/_/g, ' ')}</span>
                              <span className="text-white/30 ml-2">by {audit.performedByName}</span>
                            </p>
                            {audit.notes && <p className="text-xs text-white/40 mt-0.5">{audit.notes}</p>}
                            <p className="text-xs text-white/20 mt-1">{new Date(audit.createdAt).toLocaleString()}</p>
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

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Rejection Reason</h3>
                <p className="text-sm text-white/40 mb-4">Provide a reason so the company knows what to fix.</p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 resize-none"
                  rows={4}
                  placeholder="e.g., PAN card is blurry, please re-upload a clearer copy..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedCompany) handleAction(selectedCompany.id, 'reject');
                    }}
                    disabled={!rejectReason.trim() || actionLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-purple-400" />
              Onboarding & Verification
            </h1>
            <p className="text-white/40 mt-1">Review company registrations and verify documents</p>
          </div>
          <button
            onClick={() => fetchCompanies()}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/40 hover:text-white/60 border border-transparent'
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
            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">No companies found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCompanies.map(company => {
              const conf = getStatusConfig(company.onboardingStatus);
              const StatusIcon = conf.icon;
              return (
                <motion.div
                  key={company.id}
                  layout
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  onClick={() => fetchCompanyDetail(company.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate">{company.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {conf.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-white/40">
                        {company.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{company.email}</span>}
                        {company.companyType && <span>{company.companyType}</span>}
                        {company.country && <span>{company.country}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-center">
                        <p className="font-semibold">{company.totalDocsUploaded}</p>
                        <p className="text-xs text-white/30">docs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-400">{company.totalDocsApproved}</p>
                        <p className="text-xs text-white/30">approved</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{company._count.users}</p>
                        <p className="text-xs text-white/30">users</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20" />
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
