'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Globe, Palette, Megaphone, Rocket, Printer, BarChart3, Newspaper, Clock, Briefcase, ExternalLink, Wand2, Zap, Eye, Download, Trash2 } from 'lucide-react';
import WebsiteBuilder from '@/components/services/WebsiteBuilder';
import AIToolStudio, { StudioToolId } from '@/components/services/AIToolStudio';

interface ServiceRequestItem { _id: string; serviceName: string; category: string; status: string; createdAt: string; }

interface GeneratedSiteItem { _id: string; businessName: string; industry: string; siteType: string; theme: string; primaryColor: string; createdAt: string; }

interface ServiceCategory { title: string; icon: React.ElementType; description: string; services: string[]; }

// Development services that open the AI Website Builder tool (Lovable-style instant build)
const AI_BUILDABLE = new Set(['Website Development', 'Responsive Website', 'Landing Pages', 'E-commerce', 'Microsite', 'Digital Visiting Card', 'E-commerce Platform Development', 'UI/UX Designing', 'Web Maintenance']);

// Every other service maps to the AINOS AI tool that executes it
const CATEGORY_TOOL_DEFAULT: Record<string, StudioToolId> = {
  'Development Services': 'launch',
  'Premium Digital Branding': 'brandkit',
  'Product Launch & Development': 'launch',
  'Social Media Marketing': 'social',
  'Elevated Branding Services': 'brandkit',
  'Print Media & Advertising': 'poster',
  'Tailored Digital Work': 'seo',
  'Public Relations (PR)': 'pr',
};

function toolForService(service: string, category: string): StudioToolId {
  const s = service.toLowerCase();
  if (/qr code/.test(s)) return 'qr';
  if (/logo|monogram/.test(s)) return 'logo';
  if (/social|influencer/.test(s)) return 'social';
  if (/email/.test(s)) return 'email';
  if (/seo|analytics|tracking|segmentation|competitor|data visual|listening|a\/b/.test(s)) return 'seo';
  if (/content|copy|blog|storytelling|messaging|voice|tagline|ppc|advertis/.test(s)) return 'content';
  if (/press|publicity|media relations|media placements|ambassador|sponsorship/.test(s)) return 'pr';
  if (/print|magazine|billboard|mail|packaging|stationery|photography|poster|collateral|promotional/.test(s)) return 'poster';
  if (/launch|market research|pricing|positioning|distribution|timeline|assessment|automation|software|mobile|quality assurance/.test(s)) return 'launch';
  if (/brand|style guide|presentation|audit/.test(s)) return 'brandkit';
  return CATEGORY_TOOL_DEFAULT[category] || 'brandkit';
}

const TOOL_LABELS: Record<StudioToolId, string> = {
  logo: 'Logo AI', brandkit: 'Brand Kit AI', social: 'Social AI', content: 'Writer AI', seo: 'SEO AI',
  email: 'Email AI', pr: 'PR AI', launch: 'Blueprint AI', poster: 'Print AI', qr: 'QR Tool',
};

const serviceCategories: ServiceCategory[] = [
  {
    title: 'Development Services',
    icon: Globe,
    description: 'Websites, apps & custom software built for your business',
    services: ['Website Development', 'Responsive Website', 'Web Maintenance', 'Landing Pages', 'Mobile Application', 'UI/UX Designing', 'E-commerce', 'Microsite', 'Digital Visiting Card', 'Custom QR Code', 'Custom Software', 'E-commerce Platform Development', 'Quality Assurance & Testing'],
  },
  {
    title: 'Premium Digital Branding',
    icon: Palette,
    description: 'Elite design, SEO, PPC & content that positions your brand',
    services: ['Elite Website Design & Development', 'Exclusive Social Media Management', 'Decadent SEO Strategies', 'Opulent PPC Advertising Campaigns', 'Majestic Email Marketing Automation', 'Sumptuous Content Creation', 'Tailored Landing Page', 'Royal Social Media Analytics', 'Mobile Responsive Elegance', 'Regal Campaign Optimization'],
  },
  {
    title: 'Product Launch & Development',
    icon: Rocket,
    description: 'Research, positioning & launch execution end to end',
    services: ['Exclusive Market Research & Analysis', 'Strategic Launch Blueprint', 'Premium Brand Positioning Strategies', 'Expert Pricing Consultation', 'Bespoke Promotional Materials', 'Exclusive Launch Events', 'Luxury Distribution Channels', 'Celebrity Collaborations', 'Milestone-Laden Timeline', 'Post-Launch Assessment'],
  },
  {
    title: 'Social Media Marketing',
    icon: Megaphone,
    description: 'Strategy, content & campaigns that grow your audience',
    services: ['Bespoke Social Media Strategy Development', 'Opulent Content Creation & Management', 'Royal Influencer Partnership Collaborations', 'Lavish Social Media Campaigns & Contests', 'Exclusive Social Media Analytics & Reporting'],
  },
  {
    title: 'Elevated Branding Services',
    icon: Briefcase,
    description: 'Logos, brand systems & identity that command attention',
    services: ['Luxury Logo Design', 'Opulent Brand Style Guide', 'Sumptuous Brand Collateral', 'Consistent Brand Representation', 'Tailored Brand Messaging', 'Refined Brand Voice & Tone', 'Royal Tagline Creation', 'Exclusive Brand Storytelling', 'Regal Presentation Templates', 'Aristocratic Brand Audit', 'High-End Packaging Design', 'Luxury Stationery Design', 'Exquisite Product Photography'],
  },
  {
    title: 'Print Media & Advertising',
    icon: Printer,
    description: 'Print collateral, magazine, outdoor & direct mail campaigns',
    services: ['Luxury Print Collateral Design', 'High-End Magazine Advertisements', 'Opulent Billboard & Outdoor Advertising', 'Aristocratic Direct Mail Campaigns', 'Bespoke Print Media Campaigns'],
  },
  {
    title: 'Tailored Digital Work',
    icon: BarChart3,
    description: 'Analytics, automation & data-driven growth systems',
    services: ['Exclusive Monthly Analytics Reports', 'Lavish A/B Testing', 'Luxurious Tracking & Attribution', 'Elite Customer Segmentation', 'Bespoke Data Visualization', 'Opulent Competitor Analysis', 'Extravagant Marketing Automation', 'Decadent Social Listening', 'Exclusive Content Strategy', 'Exclusive Training & Support', 'VIP Customer Engagement Programs', 'Luxury Loyalty Programs', 'High-Touch Customer Service Portals', 'Interactive Web Experiences'],
  },
  {
    title: 'Public Relations (PR)',
    icon: Newspaper,
    description: 'Media relations, publicity & high-profile placements',
    services: ['VIP Media Relations & Press Releases', 'Exquisite Event Publicity & Coverage', 'Royal Brand Ambassador Programs', 'Luxury Brand Partnership & Sponsorships', 'High-Profile Media Placements & Features'],
  },
];

export default function YurekhServicesPage() {
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [sites, setSites] = useState<GeneratedSiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [builderService, setBuilderService] = useState<string | null>(null);
  const [studioTool, setStudioTool] = useState<{ tool: StudioToolId; service: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ businessName: '', requirements: '', budgetRange: '', timeline: '' });

  useEffect(() => { fetchRequests(); fetchSites(); }, []);

  const fetchRequests = async () => {
    try { const res = await fetch('/api/service-requests'); if (res.ok) setRequests(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSites = async () => {
    try { const res = await fetch('/api/ai-builder'); if (res.ok) setSites(await res.json()); } catch (e) { console.error(e); }
  };

  const openSite = async (id: string, download = false) => {
    try {
      const res = await fetch(`/api/ai-builder?id=${id}`);
      if (!res.ok) return;
      const site = await res.json();
      const blob = new Blob([site.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${site.businessName.toLowerCase().replace(/\s+/g, '-')}.html`;
        a.click();
      } else {
        window.open(url, '_blank');
      }
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const deleteSite = async (id: string) => {
    try { const res = await fetch(`/api/ai-builder?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchSites(); } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !activeCategory) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: selectedService, category: activeCategory.title, ...form }),
      });
      if (res.ok) {
        setForm({ businessName: '', requirements: '', budgetRange: '', timeline: '' });
        setSelectedService(null);
        setActiveCategory(null);
        fetchRequests();
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const statusColors: Record<string, string> = {
    pending: 'hsl(252 60% 55%)', 'in-review': '#a78bfa', 'in-progress': '#60a5fa', delivered: '#34d399', cancelled: '#94a3b8',
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Yurekh Services</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Every Yurekh service is a working AI tool — AINOS executes it and delivers the output instantly</p>
          </div>
          <a href="https://yurekh.com/services" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold self-start lg:self-auto"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}>
            Explore on yurekh.com <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>

        {/* AI Website Builder hero banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }} />
          <div className="flex flex-col md:flex-row md:items-center gap-5 relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>AI Website Builder</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}><Zap className="w-3 h-3" /> NEW TOOL</span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Describe your business and get a complete, ready-to-use website in under a minute — just like Lovable & Replit, built into AINOS. Download it, host it anywhere, or let Yurekh customize it further.</p>
            </div>
            <button onClick={() => setBuilderService('Website Development')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 self-start md:self-auto"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
              <Wand2 className="w-4 h-4" /> Build My Website
            </button>
          </div>
        </motion.div>

        {/* My Generated Websites */}
        {sites.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>My Websites</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: s.primaryColor }} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{s.businessName}</h3>
                        <p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.industry} · {s.theme}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteSite(s._id)} className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => openSite(s._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 justify-center"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}><Eye className="w-3.5 h-3.5" /> Preview</button>
                    <button onClick={() => openSite(s._id, true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-1 justify-center"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}><Download className="w-3.5 h-3.5" /> Download</button>
                  </div>
                  <p className="text-[11px] flex items-center gap-1 mt-2.5" style={{ color: '#94a3b8' }}><Clock className="w-3 h-3" />{new Date(s.createdAt).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* My Requests */}
        {!loading && requests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>My Service Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((r, i) => (
                <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{r.serviceName}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.category}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize flex-shrink-0" style={{ background: statusColors[r.status] || '#94a3b8' }}>{r.status.replace('-', ' ')}</span>
                  </div>
                  <p className="text-xs flex items-center gap-1 mt-3" style={{ color: '#94a3b8' }}><Clock className="w-3 h-3" />{new Date(r.createdAt).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Service Catalog */}
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Service Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {serviceCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button key={cat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveCategory(cat)}
                className="glass-card p-5 rounded-2xl text-left">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{cat.title}</h3>
                <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{cat.description}</p>
                <p className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>{cat.services.length} services →</p>
              </motion.button>
            );
          })}
        </div>

        {/* Category Detail Modal */}
        {activeCategory && !selectedService && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveCategory(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{activeCategory.title}</h2>
                <button onClick={() => setActiveCategory(null)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Pick a service — AINOS runs it as an AI tool and delivers the output instantly:</p>
              <div className="space-y-2">
                {activeCategory.services.map((service) => {
                  const websiteTool = AI_BUILDABLE.has(service);
                  const tool = websiteTool ? null : toolForService(service, activeCategory.title);
                  return (
                    <button key={service}
                      onClick={() => {
                        setActiveCategory(null);
                        if (websiteTool) setBuilderService(service);
                        else setStudioTool({ tool: tool!, service });
                      }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left text-sm transition-colors"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                      <span className="flex items-center gap-2 flex-wrap">
                        {service}
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white flex items-center gap-0.5" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                          <Zap className="w-2.5 h-2.5" /> {websiteTool ? 'WEBSITE AI' : TOOL_LABELS[tool!].toUpperCase()}
                        </span>
                      </span>
                      <Wand2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Request Form Modal */}
        {activeCategory && selectedService && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedService(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Request Service</h2>
                <button onClick={() => setSelectedService(null)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <p className="text-sm mb-5" style={{ color: 'hsl(var(--primary))' }}>{selectedService}</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input placeholder="Your business name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <textarea required placeholder="What do you need? Describe your requirements *" value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={4}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.budgetRange} onChange={e => setForm({ ...form, budgetRange: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    <option value="">Budget range</option>
                    <option value="under-1000">Under $1,000</option>
                    <option value="1000-5000">$1,000 – $5,000</option>
                    <option value="5000-20000">$5,000 – $20,000</option>
                    <option value="above-20000">Above $20,000</option>
                  </select>
                  <select value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    <option value="">Timeline</option>
                    <option value="asap">ASAP</option>
                    <option value="1-month">Within 1 month</option>
                    <option value="3-months">Within 3 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>The Yurekh team will review your request and reach out to you.</p>
              </form>
            </motion.div>
          </div>
        )}

        {/* AI Website Builder popup */}
        {builderService && (
          <WebsiteBuilder siteType={builderService} onClose={() => setBuilderService(null)} onGenerated={fetchSites} />
        )}

        {/* AI Tool Studio popup — the service is executed by AINOS */}
        {studioTool && (
          <AIToolStudio tool={studioTool.tool} serviceName={studioTool.service}
            onClose={() => setStudioTool(null)}
            onRequestTeam={(service) => {
              const cat = serviceCategories.find((c) => c.services.includes(service));
              setStudioTool(null);
              if (cat) { setActiveCategory(cat); setSelectedService(service); }
            }} />
        )}
      </div>
    </div>
  );
}
