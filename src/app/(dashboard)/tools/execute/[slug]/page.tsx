'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Zap, Coins, Play, Loader2, CheckCircle, AlertCircle, Lock, Send,
  Copy, Check, Download, Plus, Trash2, FileText, Mail, Users, BarChart3, Share2, PenLine, Table2, Upload,
  Sparkles, Palette, Search, Megaphone, Rocket, ImageIcon, QrCode, Presentation, ShoppingBag,
  Briefcase, Scale, MessageCircle, BookOpen, Bot, Globe, Package, UserCog, ExternalLink,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: number;
  accessible?: boolean;
  level?: number;
  requiredPlan?: string;
}

interface InvoiceItem {
  description: string;
  quantity: string;
  price: string;
}

interface ToolOutput {
  content?: string;
  wordCount?: number;
  topic?: string;
  posts?: { platform: string; content: string }[];
  scored?: number;
  leads?: { id: string; name: string; company: string; score: number; priority: string }[];
  message?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  viewUrl?: string;
  sent?: number;
  failed?: number;
  failures?: string[];
  hint?: string;
  dataset?: string;
  recordCount?: number;
  filename?: string;
  mime?: string;
  success?: boolean;
  ocrText?: string;
  extracted?: {
    vendorName?: string;
    vendorAddress?: string;
    vendorPAN?: string;
    vendorGST?: string;
    vendorPhone?: string;
    vendorEmail?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    items?: { description: string; quantity: number; rate: number; amount: number }[];
    subtotal?: number;
    tax?: number;
    total?: number;
    amountPaid?: number;
    balance?: number;
  };
  // AI Studio deliverables (src/lib/ai-tools.ts)
  headline?: string;
  sections?: { title: string; body: string }[];
  images?: { label: string; url: string }[];
  palette?: { hex: string; name: string }[];
  aiUsed?: boolean;
  creditsUsed?: number;
  creditsBalance?: number;
  // Auto Blog
  title?: string;
  body?: string;
  metaDescription?: string;
  // AI Assistant
  question?: string;
  answer?: string;
  // Website Generator
  html?: string;
  businessName?: string;
  pageCount?: number;
  // Subscription redirect
  redirect?: string;
  moduleName?: string;
}

interface ToolResult {
  success: boolean;
  output?: ToolOutput | null;
  error?: string;
  newBalance?: number;
  requiredTool?: string;
  requiredPlan?: string;
}

const SLUG_ICONS: Record<string, typeof Zap> = {
  'ai-content-writer': PenLine,
  'social-media-generator': Share2,
  'lead-scoring-ai': BarChart3,
  'invoice-generator': FileText,
  'invoice-extractor': Upload,
  'email-campaign-sender': Mail,
  'data-export': Table2,
  // AI Studio deliverables (src/lib/ai-tools.ts)
  logo: Palette,
  brandkit: Sparkles,
  social: Share2,
  content: PenLine,
  seo: Search,
  email: Mail,
  pr: Megaphone,
  launch: Rocket,
  poster: ImageIcon,
  qr: QrCode,
  pitchdeck: Presentation,
  listing: ShoppingBag,
  bizplan: Briefcase,
  legal: Scale,
  chatbot: MessageCircle,
  // Subscription / company modules
  autoBlog: BookOpen,
  aiAssistant: Bot,
  websiteGen: Globe,
  invoiceGen: FileText,
  crmAccess: Users,
  inventoryMgmt: Package,
  hrPayroll: UserCog,
  emailMarketing: Mail,
};

// ─── Input forms for the AI Studio tools ────────────────────────────────────
// One config per slug drives both the form and the payload, so a new tool is a
// config entry rather than new markup.

type FieldType = 'text' | 'textarea' | 'select' | 'color' | 'number';

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // for select
}

const TOOL_FIELDS: Record<string, FieldConfig[]> = {
  logo: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology, Restaurant, Fashion' },
    { key: 'colors', label: 'Preferred Colors', type: 'text', placeholder: 'e.g. blue and gold, earth tones' },
  ],
  brandkit: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'primaryColor', label: 'Primary Color', type: 'color' },
  ],
  social: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Fashion' },
    { key: 'platform', label: 'Platform', type: 'select', options: [
      { value: 'Instagram', label: 'Instagram' }, { value: 'LinkedIn', label: 'LinkedIn' },
      { value: 'Twitter', label: 'Twitter/X' }, { value: 'Facebook', label: 'Facebook' },
    ] },
    { key: 'topic', label: 'Topic / Theme', type: 'text', placeholder: 'e.g. Diwali sale, new collection launch' },
  ],
  content: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. Benefits of GST compliance', required: true },
    { key: 'contentType', label: 'Content Type', type: 'select', options: [
      { value: 'blog', label: 'Blog Post' }, { value: 'ad', label: 'Ad Copy' },
    ] },
    { key: 'keywords', label: 'Keywords', type: 'text', placeholder: 'e.g. GST, compliance, small business' },
  ],
  seo: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'pageTopic', label: 'Page Topic', type: 'text', placeholder: 'e.g. web development services', required: true },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Mumbai, Delhi NCR' },
    { key: 'keywords', label: 'Extra Keywords', type: 'text', placeholder: 'Comma-separated keywords' },
  ],
  email: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'goal', label: 'Campaign Goal', type: 'select', options: [
      { value: 'promotion', label: 'Promotion' }, { value: 'announcement', label: 'Announcement' },
      { value: 'nurture', label: 'Nurture / Follow-up' }, { value: 'reactivation', label: 'Re-activation' },
    ] },
    { key: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. existing customers, new leads' },
    { key: 'offer', label: 'Offer / Message', type: 'text', placeholder: 'e.g. 20% off annual plans' },
  ],
  pr: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'announcement', label: 'Announcement', type: 'text', placeholder: 'e.g. Yurekh launches AI-powered business suite', required: true },
    { key: 'spokesperson', label: 'Spokesperson', type: 'text', placeholder: 'e.g. John Doe, CEO' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'e.g. Mumbai' },
  ],
  launch: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'productName', label: 'Product / Service Name', type: 'text', placeholder: 'e.g. AINOS Business Suite', required: true },
    { key: 'budgetLevel', label: 'Budget Level', type: 'select', options: [
      { value: 'lean', label: 'Lean (organic only)' }, { value: 'standard', label: 'Standard' }, { value: 'premium', label: 'Premium' },
    ] },
  ],
  poster: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Restaurant' },
    { key: 'message', label: 'Poster Message', type: 'text', placeholder: 'e.g. Grand Opening — 50% off this weekend', required: true },
    { key: 'style', label: 'Style', type: 'select', options: [
      { value: 'modern', label: 'Modern' }, { value: 'vintage', label: 'Vintage' },
      { value: 'minimal', label: 'Minimal' }, { value: 'bold', label: 'Bold & Colorful' },
    ] },
  ],
  qr: [
    { key: 'qrData', label: 'URL or Text to Encode', type: 'text', placeholder: 'e.g. https://yurekh.com', required: true },
    { key: 'qrColor', label: 'QR Color', type: 'color' },
  ],
  pitchdeck: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. SaaS, EdTech' },
    { key: 'problem', label: 'Problem You Solve', type: 'textarea', placeholder: 'What pain point does your product address?' },
    { key: 'product', label: 'Your Product / Solution', type: 'text', placeholder: 'Brief product description' },
    { key: 'askAmount', label: 'Funding Ask', type: 'text', placeholder: 'e.g. ₹50 lakh, $100K' },
    { key: 'traction', label: 'Traction (optional)', type: 'textarea', placeholder: 'Revenue, users, growth rate...' },
  ],
  listing: [
    { key: 'businessName', label: 'Brand Name', type: 'text', placeholder: 'e.g. Yurekh', required: true },
    { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g. Wireless Earbuds Pro', required: true },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Electronics, Fashion' },
    { key: 'platform', label: 'Platform', type: 'select', options: [
      { value: 'Amazon', label: 'Amazon' }, { value: 'Flipkart', label: 'Flipkart' },
      { value: 'Meesho', label: 'Meesho' }, { value: 'Shopify', label: 'Shopify' },
    ] },
    { key: 'features', label: 'Key Features', type: 'text', placeholder: 'Comma-separated: Noise cancelling, 24hr battery, IPX5' },
    { key: 'price', label: 'Price', type: 'text', placeholder: 'e.g. ₹1,999' },
  ],
  bizplan: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'description', label: 'Business Description', type: 'textarea', placeholder: 'What does your business do?', required: true },
    { key: 'startupCost', label: 'Startup Cost (₹)', type: 'number', placeholder: 'e.g. 200000' },
    { key: 'monthlyPrice', label: 'Monthly Price per Customer (₹)', type: 'number', placeholder: 'e.g. 1000' },
    { key: 'targetCustomers', label: 'Year-1 Target Customers', type: 'number', placeholder: 'e.g. 100' },
  ],
  legal: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'e.g. https://yurekh.com' },
    { key: 'contactEmail', label: 'Contact Email', type: 'text', placeholder: 'e.g. hello@yurekh.com' },
    { key: 'country', label: 'Country', type: 'text', placeholder: 'e.g. India' },
    { key: 'collectsPayments', label: 'Collects Payments Online?', type: 'select', options: [
      { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
    ] },
  ],
  chatbot: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology' },
    { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://yoursite.com' },
    { key: 'whatsapp', label: 'WhatsApp Number', type: 'text', placeholder: 'e.g. 919876543210' },
    { key: 'brandColor', label: 'Brand Color', type: 'color' },
    { key: 'faqs', label: 'FAQs (Q: ... A: ... per line)', type: 'textarea', placeholder: 'Q: What do you offer?\nA: We offer...' },
  ],
  autoBlog: [
    { key: 'topic', label: 'Blog Topic', type: 'text', placeholder: 'e.g. Top 10 business trends in 2025', required: true },
    { key: 'tone', label: 'Tone', type: 'select', options: [
      { value: 'professional', label: 'Professional' }, { value: 'casual', label: 'Casual' },
      { value: 'educational', label: 'Educational' }, { value: 'persuasive', label: 'Persuasive' },
    ] },
    { key: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g. Small business owners' },
  ],
  aiAssistant: [
    { key: 'question', label: 'Your Question', type: 'textarea', placeholder: 'Ask anything about business, marketing, finance...', required: true },
    { key: 'context', label: 'Business Context (optional)', type: 'textarea', placeholder: 'Brief background about your business for more relevant answers' },
  ],
  websiteGen: [
    { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g. Yurekh Solutions', required: true },
    { key: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g. Technology, Restaurant' },
    { key: 'description', label: 'Business Description', type: 'textarea', placeholder: 'What does your business do? What services/products?', required: true },
    { key: 'primaryColor', label: 'Primary Color', type: 'color' },
  ],
};

// Tools that ship with a subscription — the work happens inside the app itself
const SUBSCRIPTION_REDIRECTS: Record<string, string> = {
  invoiceGen: '/invoices',
  crmAccess: '/crm',
  inventoryMgmt: '/inventory',
  hrPayroll: '/hr',
  emailMarketing: '/marketing',
};

// Per-tool primary action label — everything else falls back to the shape of
// the form (deliverable generators vs. data tools).
const ACTION_LABELS: Record<string, string> = {
  'lead-scoring-ai': 'Score My Leads',
  'email-campaign-sender': 'Send Email',
  autoBlog: 'Write Article',
  aiAssistant: 'Ask AINOS',
  websiteGen: 'Generate Website',
};

function defaultFieldValue(f: FieldConfig): string {
  if (f.type === 'color') return f.key === 'qrColor' ? '#000000' : '#6d5df6';
  if (f.type === 'select' && f.options?.length) return f.options[0].value;
  return '';
}

// Defaults are derived, not stored: the form is correct on first paint and after
// switching tools, with no reset effect and no cascading renders.
function collectFieldValues(fields: FieldConfig[] | undefined, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields || []) out[f.key] = (values[f.key] ?? defaultFieldValue(f)).trim();
  return out;
}

const inputCls =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function ToolExecutePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Config-driven fields for the AI Studio tools (one state object, not 60)
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fields = TOOL_FIELDS[slug];
  const subscriptionTarget = SUBSCRIPTION_REDIRECTS[slug];
  const missingRequired = (fields || [])
    .filter(f => f.required && !(formValues[f.key] ?? defaultFieldValue(f)).trim())
    .map(f => f.label);

  // generic fields
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  // invoice fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: '1', price: '' }]);
  // email fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // email campaign audience (loaded once, shown before send)
  const [audience, setAudience] = useState<number | null>(null);
  // export fields
  const [dataset, setDataset] = useState('customers');
  const [format, setFormat] = useState('csv');
  // invoice extractor fields
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceBase64, setInvoiceBase64] = useState('');

  useEffect(() => {
    fetch(`/api/tools?slug=${slug}`)
      .then(res => res.json())
      .then(data => { setTool(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Fetch the recipient count for the email campaign tool only, on mount.
  useEffect(() => {
    if (slug !== 'email-campaign-sender') return;
    fetch('/api/tools/audience')
      .then(res => res.ok ? res.json() : { recipients: 0 })
      .then(d => setAudience(typeof d.recipients === 'number' ? d.recipients : 0))
      .catch(() => setAudience(0));
  }, [slug]);

  const buildInput = (): Record<string, unknown> => {
    // AI Studio tools submit the configured fields verbatim
    if (fields) return collectFieldValues(fields, formValues);
    switch (slug) {
      case 'invoice-generator':
        return {
          customerName,
          customerEmail,
          taxRate: Number(taxRate) || 18,
          items: items.map(it => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
          })),
        };
      case 'invoice-extractor':
        return { base64: invoiceBase64 };
      case 'email-campaign-sender':
        return { subject, body: message };
      case 'data-export':
        return { dataset, format };
      case 'lead-scoring-ai':
        return {};
      default:
        return { topic, details };
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    setCopied(null);
    try {
      // Every tool — AI Studio, original and Business Suite — runs through one
      // registry: POST /api/tools/execute with { toolSlug, input }.
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: slug, input: buildInput() })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadResult = () => {
    if (!result?.success || !result.output?.content) return;
    const blob = new Blob([result.output.content], { type: result.output.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.output.filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6"><div className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse" /></div>;
  }

  if (!tool) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Tool not found</h2>
        <button onClick={() => router.push('/tools')} className="mt-4 text-purple-600 hover:underline font-medium">Back to tools</button>
      </div>
    );
  }

  const Icon = SLUG_ICONS[slug] || Zap;
  const out = result?.output;

  // Subscription tools have no form — point the user at the live feature
  if (subscriptionTarget) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/tools')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{tool.name}</h1>
              <p className="text-gray-500 text-sm">{tool.description}</p>
            </div>
          </div>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Included in Your Subscription</h3>
            <p className="text-gray-500 mb-4">This feature is already available in your dashboard.</p>
            <button
              onClick={() => router.push(subscriptionTarget)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm"
            >
              Go to {tool.name}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/tools')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>

      {/* Tool header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{tool.name}</h1>
            <p className="text-gray-500 text-sm">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Coins className="w-4 h-4 text-yellow-500" />
          Cost: <span className="font-semibold text-gray-700">{tool.creditCost} credits</span> per run
        </div>

        {tool.accessible === false && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-2 flex-1">
              <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  This tool needs the {tool.requiredPlan === 'marketing' ? 'Marketing' : 'relevant'} plan
                </p>
                <p className="text-xs text-gray-500">
                  You only pay for the tools you use. Subscribe to unlock and get monthly credits.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/billing${tool.requiredPlan ? `?plan=${tool.requiredPlan}` : ''}`)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              View plans
            </button>
          </div>
        )}
      </motion.div>

      {/* Input form — per tool */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
        {(slug === 'ai-content-writer' || slug === 'social-media-generator' || (!SLUG_ICONS[slug])) && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Topic</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={slug === 'social-media-generator' ? 'e.g. Diwali sale for my clothing store' : 'e.g. Benefits of GST compliance for small businesses'}
                className={inputCls} />
            </div>
            {slug === 'ai-content-writer' && (
              <div>
                <label className={labelCls}>Additional details <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3}
                  placeholder="Tone, audience, key points to cover..."
                  className={inputCls + ' resize-none'} />
              </div>
            )}
          </div>
        )}

        {slug === 'invoice-generator' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Reliance Retail Ltd" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Customer email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="billing@customer.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Items</label>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={it.description} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                      placeholder="Item description" className={inputCls + ' flex-1'} />
                    <div className="flex gap-2">
                      <input type="number" min="1" value={it.quantity} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                        placeholder="Qty" className={inputCls + ' w-20'} />
                      <input type="number" min="0" value={it.price} onChange={e => setItems(items.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                        placeholder="Price ₹" className={inputCls + ' w-28'} />
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-30" aria-label="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setItems([...items, { description: '', quantity: '1', price: '' }])}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                <Plus className="w-4 h-4" /> Add item
              </button>
            </div>
            <div className="w-full sm:w-40">
              <label className={labelCls}>GST rate %</label>
              <input type="number" min="0" max="28" value={taxRate} onChange={e => setTaxRate(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {slug === 'invoice-extractor' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-700 flex items-start gap-2">
              <Upload className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Upload an invoice image or PDF — we&apos;ll extract vendor details, items, GST, totals automatically using OCR + AI.
            </div>
            <div>
              <label className={labelCls}>Invoice file *</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setInvoiceFile(file);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setInvoiceBase64(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                  id="invoice-upload"
                />
                <label
                  htmlFor="invoice-upload"
                  className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500">
                      {invoiceFile ? <span className="font-medium text-purple-600">{invoiceFile.name}</span> : 'Click to upload invoice'}
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, PDF</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {slug === 'email-campaign-sender' && (
          <div className="space-y-5">
            {/* Who receives it — resolved before send, not after */}
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {audience === null ? 'Counting your contacts…' : `Will reach ${audience} customer${audience === 1 ? '' : 's'}`}
                </p>
                <p className="text-xs text-gray-500">Everyone in your CRM with an email address</p>
              </div>
            </div>

            {audience === 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                No customer emails yet.{' '}
                <a href="/crm" className="font-semibold underline">Add customers</a>{' '}
                with email addresses, then come back to send.
              </div>
            )}

            <div>
              <label className={labelCls}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={150}
                placeholder="e.g. New collection is live!"
                className={inputCls + ' text-base'}
              />
            </div>

            <div>
              <label className={labelCls}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your message. We'll format it into a clean, branded email."
                className={inputCls + ' resize-none text-base'}
              />
            </div>

            {/* Live preview mirrors the exact email the backend sends */}
            {(subject.trim() || message.trim()) && (
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
                  <span className="text-xs text-gray-400">To your customers</span>
                </div>
                <div className="p-5 bg-white">
                  <h2 className="text-base font-bold text-gray-900 mb-2 break-words">
                    {subject.trim() || <span className="text-gray-300">(your subject line)</span>}
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {message.trim() || <span className="text-gray-300">(your message body)</span>}
                  </p>
                  <hr className="my-5 border-gray-200" />
                  <p className="text-xs text-gray-400">Sent via AINOS Business Suite</p>
                </div>
              </div>
            )}
          </div>
        )}

        {slug === 'lead-scoring-ai' && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600 flex items-start gap-2">
            <BarChart3 className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
            Scores all your CRM leads using source, status, contact info and recency — and saves the score on each lead. One click, no input needed.
          </div>
        )}

        {slug === 'data-export' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dataset</label>
              <select value={dataset} onChange={e => setDataset(e.target.value)} className={inputCls}>
                <option value="customers">Customers</option>
                <option value="leads">Leads</option>
                <option value="invoices">Invoices</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className={inputCls}>
                <option value="csv">CSV (Excel / Google Sheets)</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        )}

        {fields && (
          <div className="space-y-4">
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-700 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Fill this in once — AINOS generates the finished deliverable, ready to copy, download or print.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(f => {
                const value = formValues[f.key] ?? defaultFieldValue(f);
                return (
                  <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className={labelCls}>
                      {f.label}{f.required && <span className="text-purple-500"> *</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        value={value}
                        placeholder={f.placeholder}
                        onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                        className={inputCls + ' resize-y'}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={value}
                        onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                        className={inputCls}
                      >
                        {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === 'color' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
                          aria-label={f.label}
                          onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                          className="w-11 h-11 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={value}
                          placeholder="#6d5df6"
                          onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                          className={inputCls + ' font-mono uppercase'}
                        />
                      </div>
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={value}
                        placeholder={f.placeholder}
                        onChange={e => setFormValues(v => ({ ...v, [f.key]: e.target.value }))}
                        className={inputCls}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {fields && missingRequired.length > 0 && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Still needed: {missingRequired.join(', ')}
          </p>
        )}

        <div className="mt-6 sticky bottom-3 z-10 -mx-2 px-2 py-2">
          <button
            onClick={handleExecute}
            disabled={executing || missingRequired.length > 0 || tool.accessible === false || (slug === 'email-campaign-sender' && (!subject.trim() || !message.trim()))}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {executing
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : tool.accessible === false
                ? <Lock className="w-5 h-5" />
                : slug === 'email-campaign-sender'
                  ? <Send className="w-5 h-5" />
                  : fields ? <Sparkles className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {executing
              ? 'Sending…'
              : tool.accessible === false
                ? 'Locked — subscribe to unlock'
                : ACTION_LABELS[slug] || (fields ? 'Generate Deliverable' : 'Run Tool')}
          </button>
        </div>
      </motion.div>

      {/* Result — human readable per tool */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 border ${result.success ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <h3 className="font-semibold text-gray-900">{result.success ? 'Done' : 'Error'}</h3>
            {typeof result.newBalance === 'number' && (
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500" /> Balance: {result.newBalance}
              </span>
            )}
          </div>

          {result.error && (
            <div className="text-sm text-red-600 whitespace-pre-wrap">
              {result.error}
              {result.requiredPlan && result.requiredPlan !== 'credits' && (
                <button
                  onClick={() => router.push(`/billing?plan=${result.requiredPlan}`)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  <Lock className="w-4 h-4" /> View {result.requiredPlan === 'marketing' ? 'Marketing' : ''} plans
                </button>
              )}
              {result.requiredPlan === 'credits' && (
                <button
                  onClick={() => router.push('/billing')}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  <Coins className="w-4 h-4" /> Buy more credits
                </button>
              )}
            </div>
          )}

          {/* Subscription tools answer with a pointer into the live module */}
          {result.success && out?.redirect && (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">{out.message}</p>
              <button onClick={() => router.push(String(out.redirect))}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all">
                Open {out.moduleName}
              </button>
            </div>
          )}

          {/* AI Studio deliverables — headline, palette, assets and copy-ready sections */}
          {result.success && out?.headline && <StudioOutput out={out} copied={copied} onCopy={copyText} />}

          {/* Auto Blog — finished article with meta description */}
          {result.success && slug === 'autoBlog' && out?.body && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{out.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{out.wordCount} words | Meta: {out.metaDescription}</p>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">{out.body}</div>
              </div>
              <button onClick={() => copyText('blog', `${String(out.title || '')}\n\n${String(out.body || '')}`)} className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700">
                {copied === 'blog' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === 'blog' ? 'Copied' : 'Copy Article'}
              </button>
            </div>
          )}

          {/* AI Assistant — question plus answer */}
          {result.success && slug === 'aiAssistant' && out?.answer && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-xl text-sm text-purple-800">
                <span className="font-medium">Q:</span> {out.question}
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {out.answer}
              </div>
              <button onClick={() => copyText('answer', String(out.answer || ''))} className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700">
                {copied === 'answer' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === 'answer' ? 'Copied' : 'Copy Answer'}
              </button>
            </div>
          )}

          {/* Website Generator — download or preview the generated site */}
          {result.success && slug === 'websiteGen' && out?.html && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-sm text-gray-600">Website generated for <span className="font-semibold">{out.businessName}</span></p>
                <p className="text-xs text-gray-500 mt-1">{String(out.html).length.toLocaleString()} characters, {out.pageCount || 1} page(s)</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const blob = new Blob([String(out.html)], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${String(out.businessName || 'website').replace(/\s+/g, '-').toLowerCase()}.html`;
                  a.click(); URL.revokeObjectURL(url);
                }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">
                  <Download className="w-4 h-4" /> Download HTML
                </button>
                <button onClick={() => {
                  const blob = new Blob([String(out.html)], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Preview
                </button>
              </div>
              <details className="group">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-purple-600">View HTML source</summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 overflow-auto max-h-64 whitespace-pre-wrap">{String(out.html).slice(0, 5000)}</pre>
              </details>
            </div>
          )}

          {/* Content writer */}
          {result.success && slug === 'ai-content-writer' && out?.content && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{out.wordCount} words generated</span>
                <button onClick={() => copyText('article', out.content || '')} className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700">
                  {copied === 'article' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'article' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">{out.content}</div>
            </div>
          )}

          {/* Social generator */}
          {result.success && slug === 'social-media-generator' && Array.isArray(out?.posts) && (
            <div className="space-y-4">
              {out.posts.map((p: { platform: string; content: string }) => (
                <div key={p.platform} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">{p.platform}</span>
                    <button onClick={() => copyText(p.platform, p.content)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-600">
                      {copied === p.platform ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === p.platform ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Lead scoring */}
          {result.success && slug === 'lead-scoring-ai' && (
            out?.scored ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">{out.scored} leads scored and saved to CRM.</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(out.leads || []).map((l: { id: string; name: string; company: string; score: number; priority: string }) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        l.priority === 'High' ? 'bg-green-100 text-green-700' : l.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {l.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.name}</p>
                        {l.company && <p className="text-xs text-gray-500 truncate">{l.company}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        l.priority === 'High' ? 'bg-green-100 text-green-700' : l.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                      }`}>{l.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{out?.message}</p>
            )
          )}

          {/* Invoice */}
          {result.success && slug === 'invoice-generator' && out?.invoiceNumber && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-sm text-gray-600">Invoice created</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{out.invoiceNumber}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-gray-500">Subtotal</p><p className="font-semibold text-gray-900">₹{Number(out.subtotal).toLocaleString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">GST</p><p className="font-semibold text-gray-900">₹{Number(out.tax).toLocaleString('en-IN')}</p></div>
                <div><p className="text-xs text-gray-500">Total</p><p className="font-semibold text-green-700">₹{Number(out.total).toLocaleString('en-IN')}</p></div>
              </div>
              <button onClick={() => router.push(out.viewUrl || '/invoices')}
                className="mt-4 w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
                View in Invoices
              </button>
            </div>
          )}

          {/* Invoice extractor */}
          {result.success && slug === 'invoice-extractor' && out?.extracted && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{out.message}</p>
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Vendor Name</p>
                    <p className="font-semibold text-gray-900">{out.extracted.vendorName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice Number</p>
                    <p className="font-semibold text-gray-900">{out.extracted.invoiceNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Invoice Date</p>
                    <p className="font-semibold text-gray-900">{out.extracted.invoiceDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vendor PAN</p>
                    <p className="font-semibold text-gray-900">{out.extracted.vendorPAN || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vendor GST</p>
                    <p className="font-semibold text-gray-900">{out.extracted.vendorGST || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vendor Phone</p>
                    <p className="font-semibold text-gray-900">{out.extracted.vendorPhone || '—'}</p>
                  </div>
                </div>
                {out.extracted.vendorAddress && (
                  <div>
                    <p className="text-xs text-gray-500">Vendor Address</p>
                    <p className="text-sm text-gray-700">{out.extracted.vendorAddress}</p>
                  </div>
                )}
                {Array.isArray(out.extracted.items) && out.extracted.items.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Items</p>
                    <div className="space-y-1">
                      {out.extracted.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-white px-3 py-2 rounded-lg">
                          <span className="text-gray-700">{item.description}</span>
                          <span className="font-semibold text-gray-900">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="font-semibold text-gray-900">₹{(out.extracted.subtotal || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tax</p>
                    <p className="font-semibold text-gray-900">₹{(out.extracted.tax || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-semibold text-green-700">₹{(out.extracted.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {out.extracted.balance !== undefined && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                      <p className="font-semibold text-gray-900">₹{(out.extracted.amountPaid || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="font-semibold text-orange-700">₹{(out.extracted.balance || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push('/invoices')}
                  className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">
                  Add as Expense
                </button>
                <button onClick={() => copyText('extracted', JSON.stringify(out.extracted, null, 2))}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  {copied === 'extracted' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === 'extracted' ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
            </div>
          )}

          {/* Email campaign */}
          {result.success && slug === 'email-campaign-sender' && out && (
            <div>
              {out.message ? (
                <p className="text-sm text-gray-600">{out.message}</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                  <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Recipients</p><p className="font-bold text-gray-900">{out.total}</p></div>
                  <div className="p-3 bg-green-50 rounded-xl"><p className="text-xs text-green-600">Sent</p><p className="font-bold text-green-700">{out.sent}</p></div>
                  <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-600">Failed</p><p className="font-bold text-red-600">{out.failed}</p></div>
                </div>
              )}
              {out.hint && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">{out.hint}</p>}
              {Array.isArray(out.failures) && out.failures.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Failures:</p>
                  {out.failures.map((f: string, i: number) => <p key={i} className="text-xs text-red-500">{f}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Data export */}
          {result.success && slug === 'data-export' && out && (
            out.recordCount ? (
              <div className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-gray-900">{out.recordCount} {out.dataset} records ready</p>
                  <p className="text-xs text-gray-500">{out.filename}</p>
                </div>
                <button onClick={downloadResult}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{out.message}</p>
            )
          )}

          {/* Fallback for unstyled tools */}
          {result.success && !SLUG_ICONS[slug] && !out?.headline && out != null && (
            <pre className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 overflow-auto max-h-64 whitespace-pre-wrap">
              {typeof out === 'string' ? out : JSON.stringify(out, null, 2)}
            </pre>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Unified AI Studio output renderer ──────────────────────────────────────
// Every AI Studio tool answers with the same shape, so one renderer covers
// logos, brand kits, SEO packs, legal pages and the rest.

function StudioOutput({ out, copied, onCopy }: {
  out: ToolOutput;
  copied: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  const sections = out.sections || [];
  const images = out.images || [];
  const palette = out.palette || [];
  const fullText = [out.headline || '', ...sections.map(s => `${s.title}\n${s.body}`)].join('\n\n');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 min-w-0 text-lg font-bold text-gray-900">{out.headline}</h2>
        {out.aiUsed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" /> AI Enhanced
          </span>
        )}
        {sections.length > 0 && (
          <button
            onClick={() => onCopy('studio-all', fullText)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            {copied === 'studio-all' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'studio-all' ? 'Copied' : 'Copy all'}
          </button>
        )}
      </div>

      {/* Brand palette — click a swatch to copy its hex */}
      {palette.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Palette — click to copy hex</p>
          <div className="flex flex-wrap gap-3">
            {palette.map((c, i) => {
              const key = `studio-hex-${i}`;
              return (
                <button key={key} onClick={() => onCopy(key, c.hex)} className="text-center group" title={`Copy ${c.hex}`}>
                  <div
                    className="w-16 h-16 rounded-xl border border-black/5 shadow-sm mb-1.5 group-hover:scale-105 transition-transform"
                    style={{ background: c.hex }}
                  />
                  <p className="text-[11px] font-semibold text-gray-800">{c.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 flex items-center justify-center gap-1">
                    {copied === key ? <><Check className="w-2.5 h-2.5 text-green-500" /> Copied</> : c.hex.toUpperCase()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rendered assets — open full size, then save */}
      {images.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Assets — click to open full size, then right-click → Save Image
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((im, i) => (
              <a
                key={`${im.label}-${i}`}
                href={im.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt={im.label} loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" /> Save Image
                  </span>
                </div>
                <p className="px-3 py-2 text-xs font-semibold text-gray-800 truncate">{im.label}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Copy-ready sections */}
      {sections.map((s, i) => {
        const key = `studio-sec-${i}`;
        return (
          <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
              <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
              <button
                onClick={() => onCopy(key, `${s.title}\n${s.body}`)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-600 flex-shrink-0"
              >
                {copied === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === key ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="px-4 pb-4 pt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{s.body}</p>
          </div>
        );
      })}
    </div>
  );
}
