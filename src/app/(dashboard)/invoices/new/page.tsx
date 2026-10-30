'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save, FileText, Building2, ChevronDown, IndianRupee, Truck, CreditCard, ScanLine, Loader2, LayoutGrid, ShieldCheck, FileSpreadsheet, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BUSINESS_PRESETS } from '@/lib/finance/business-presets';

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  hsnCode: string;
  quantity: string;
  price: string;
  costPrice: string;
  gstRate: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  cost?: number;
  mrp?: number;
  hsnCode?: string;
  gstRate?: number;
  taxRate?: number;
}

interface Company {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  logoUrl?: string;
}

interface FormField {
  label: string;
  key: string;
  type: 'text' | 'date' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault?: boolean;
  formFields?: FormField[];
  tableColumns?: { label: string; key: string; width?: string }[];
}

const GST_RATES = [0, 5, 12, 18, 28];

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [businessKey, setBusinessKey] = useState('');
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  // Digital Signature
  const [signatureType, setSignatureType] = useState<'upload' | 'draw' | 'none'>('none');
  const [signatureImage, setSignatureImage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{x: number, y: number} | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerPan, setCustomerPan] = useState('');
  // Billing
  const [supplyType, setSupplyType] = useState<'intra' | 'inter'>('intra');
  const [billingType, setBillingType] = useState<'gst' | 'non-gst' | 'mrp'>('gst');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencyRate, setCurrencyRate] = useState('1');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', productId: '', productName: '', description: '', hsnCode: '', quantity: '1', price: '', costPrice: '', gstRate: '18' }
  ]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  // Customer search
  const [customers, setCustomers] = useState<Array<{id:string;name:string;email?:string;phone?:string;address?:string;gstNumber?:string;panNumber?:string;state?:string}>>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const fetchData = async () => {
    try {
      const [productsRes, companyRes, templatesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/company'),
        fetch('/api/invoice-templates'),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (companyRes.ok) {
        const c = await companyRes.json();
        setCompany(c);
      }
      // Fetch customers for auto-fill
      try {
        const custRes = await fetch('/api/customers');
        if (custRes.ok) setCustomers(await custRes.json());
      } catch { /* customers optional */ }
      if (templatesRes.ok) {
        const templates = await templatesRes.json();
        const defaultTemplate = templates.find((t: InvoiceTemplate) => t.isDefault) || templates[0];
        if (defaultTemplate) {
          setTemplate(defaultTemplate);
          // Initialize dynamic field values with empty strings
          if (defaultTemplate.formFields) {
            const initialValues: Record<string, string> = {};
            (defaultTemplate.formFields as FormField[]).forEach(field => {
              initialValues[field.key] = '';
            });
            setDynamicFieldValues(initialValues);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Pre-fill from quote conversion
  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    const clientName = searchParams.get('client');
    if (quoteId) {
      // Fetch quote data and pre-fill invoice form
      fetch(`/api/quotes`).then(r => r.json()).then((quotes: Array<{id: string; clientName: string; items: Array<{description: string; quantity: number; rate: number}>; subtotal: number; tax: number; discount: number; notes?: string}>) => {
        const quote = quotes.find((q: {id: string}) => q.id === quoteId);
        if (quote) {
          setCustomerName(quote.clientName || clientName || '');
          if (quote.notes) setNotes(quote.notes);
          // Pre-fill items from quote
          if (quote.items && quote.items.length > 0) {
            const quoteItems: InvoiceItem[] = quote.items.map((item: {description: string; quantity: number; rate: number}, idx: number) => ({
              id: Date.now().toString() + idx,
              productId: '',
              productName: '',
              description: item.description || '',
              hsnCode: '',
              quantity: String(item.quantity || 1),
              price: String(item.rate || 0),
              costPrice: '',
              gstRate: '18',
            }));
            setItems(quoteItems);
          }
        }
      }).catch(err => console.error('Error loading quote:', err));
    } else if (clientName) {
      setCustomerName(clientName);
    }
  }, [searchParams]);

  const selectCustomer = (c: typeof customers[0]) => {
    setCustomerName(c.name);
    setCustomerEmail(c.email || '');
    setCustomerPhone(c.phone || '');
    setCustomerAddress(c.address || '');
    setCustomerGst(c.gstNumber || '');
    setCustomerState(c.state || '');
    setCustomerPan(c.panNumber || '');
    setCustomerSearch('');
    setShowCustomerResults(false);
    // Auto-detect supply type from GST state match
    if (c.gstNumber && c.state && company) {
      // If customer state differs from company state, it's inter-state
      setSupplyType('intra'); // default, will be overridden by user
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(), productId: '', productName: '', description: '',
      hsnCode: '', quantity: '1', price: '', costPrice: '', gstRate: '18'
    }]);
  };

  // Receipt/invoice OCR: read an image, send to the AI extract endpoint and
  // append the recognised line items (values stay editable before saving).
  const onOcrFile = async (file: File) => {
    setOcrLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/finance/ai/ocr', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed');
      const ocrItems: InvoiceItem[] = (data.items || []).map((it: Record<string, unknown>, idx: number) => ({
        id: `ocr-${Date.now()}-${idx}`,
        productId: '', productName: String(it.productName || ''), description: String(it.description || ''),
        hsnCode: String(it.hsnCode || ''), quantity: String(it.quantity ?? 1), price: String(it.price ?? ''),
        costPrice: '', gstRate: String(it.gstRate ?? 18),
      }));
      if (ocrItems.length) {
        setItems(prev => {
          const cleaned = prev.filter(i => i.productName || i.price); // drop the blank starter row
          return [...cleaned, ...ocrItems];
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'OCR failed');
    } finally {
      setOcrLoading(false);
      if (ocrFileRef.current) ocrFileRef.current.value = '';
    }
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const selectProduct = (itemId: string, product: Product) => {
    setItems(items.map(i =>
      i.id === itemId ? {
        ...i,
        productId: product.id,
        productName: product.name,
        description: product.description || '',
        hsnCode: product.hsnCode || '',
        price: (product.mrp ?? product.price ?? 0).toString(),
        costPrice: (product.costPrice ?? product.cost ?? 0).toString(),
        gstRate: (product.gstRate ?? product.taxRate ?? 18).toString(),
      } : i
    ));
    setShowDropdown(null);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  const taxTotal = items.reduce((sum, item) => {
    if (billingType === 'non-gst') return sum;
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const rate = parseFloat(item.gstRate) || 0;
    const itemSub = qty * price;
    if (billingType === 'mrp') {
      return sum + itemSub - (itemSub / (1 + rate / 100));
    }
    return sum + (itemSub * rate / 100);
  }, 0);

  const discount = discountType === 'percent'
    ? (subtotal * (parseFloat(discountAmount) || 0)) / 100
    : parseFloat(discountAmount) || 0;

  const totalAmount = subtotal + taxTotal - discount;

  const cgst = supplyType === 'intra' ? taxTotal / 2 : 0;
  const sgst = supplyType === 'intra' ? taxTotal / 2 : 0;
  const igst = supplyType === 'inter' ? taxTotal : 0;

  const profit = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const cost = parseFloat(item.costPrice) || 0;
    return sum + ((price - cost) * qty);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const apiItems = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: parseFloat(item.quantity) || 0,
      price: parseFloat(item.price) || 0,
      costPrice: parseFloat(item.costPrice) || 0,
      gstRate: parseFloat(item.gstRate) || 0,
    })).filter(item => item.productName || item.price > 0);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName, customerEmail, customerPhone, customerAddress,
          customerGst, customerState, customerPan,
          items: apiItems, supplyType, billingType,
          currency: currency || 'INR',
          currencyRate: currency && currency !== 'INR' ? (parseFloat(currencyRate) || 1) : 1,
          discountAmount: parseFloat(discountAmount) || 0,
          discountType, paymentMethod, notes,
          dueDate: dueDate || undefined,
          status: 'draft',
          customFields: dynamicFieldValues, // Dynamic fields from template
          signatureImage: signatureImage || null,
          signatureType: signatureType || null,
          signatureDate: signatureType !== 'none' ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing functions (DPR-aware: crisp, uniform, undistorted strokes)
  const configureCtx = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const prev = canvas.width > 0 && signatureImage ? canvas.toDataURL() : null;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    configureCtx(ctx);
    if (prev) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = prev;
    }
  };

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e, canvas);
    configureCtx(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    lastPointRef.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const { x, y } = getPointerPos(e, canvas);
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      const midX = (lastPoint.x + x) / 2;
      const midY = (lastPoint.y + y) / 2;
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
      ctx.stroke();
    }
    lastPointRef.current = { x, y };
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);
      if (hasContent) {
        setSignatureImage(canvas.toDataURL('image/png'));
      }
    }, 400);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    configureCtx(ctx);
    setSignatureImage('');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  };

  useEffect(() => {
    if (signatureType !== 'draw') return;
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureType]);

  const inputStyle = {
    background: 'hsl(var(--card-bg))',
    border: '1px solid hsl(var(--border) / 0.5)',
    color: 'hsl(var(--foreground))',
  };

  // Apply a business-type preset: swap the invoice table columns + custom fields
  // the user sees, keeping the current template's other settings intact.
  const applyBusinessPreset = (key: string) => {
    setBusinessKey(key);
    const preset = BUSINESS_PRESETS.find(p => p.key === key);
    if (!preset) return;
    setTemplate(prev => ({
      ...(prev || { id: 'preset', name: preset.label }),
      formFields: preset.formFields,
      tableColumns: preset.tableColumns,
    } as InvoiceTemplate));
    // Re-init dynamic field values for the new field set (keep shared keys).
    setDynamicFieldValues(prev => {
      const next: Record<string, string> = {};
      preset.formFields.forEach(f => { next[f.key] = prev[f.key] || ''; });
      return next;
    });
  };

  const selectedPreset = BUSINESS_PRESETS.find(p => p.key === businessKey);

  // Numbered step badge + header trust chip (shared visual atoms).
  const stepBadge = (n: number) => (
    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>{n}</span>
  );
  const trustChip = (icon: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))' }}>{icon}{label}</span>
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm mb-4 hover:opacity-80" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Create GST Invoice</h1>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Generate professional GST-compliant invoices in seconds</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {trustChip(<ShieldCheck className="w-3.5 h-3.5" />, 'GST Compliant')}
              {trustChip(<FileSpreadsheet className="w-3.5 h-3.5" />, 'Tally Export')}
              {trustChip(<Bell className="w-3.5 h-3.5" />, 'Auto Reminders')}
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick start: pick your business type */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                  <LayoutGrid className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Quick start</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Select your business to auto-fill the invoice columns &amp; fields</p>
                </div>
              </div>
              <select
                value={businessKey}
                onChange={e => applyBusinessPreset(e.target.value)}
                className="w-full sm:w-60 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 cursor-pointer"
                style={inputStyle}
              >
                <option value="">Select your business…</option>
                {BUSINESS_PRESETS.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            {selectedPreset && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                <span className="text-[11px] uppercase tracking-wide mr-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Custom fields</span>
                {selectedPreset.formFields.map(f => (
                  <span key={f.key} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))' }}>{f.label}</span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Step 1: Company & Customer Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {stepBadge(1)}
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Company &amp; Customer Details</h2>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Enter your business and customer information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
              {/* Company */}
              <div className="rounded-xl p-4 sm:p-5" style={{ background: 'hsl(var(--card-bg))', border: '1px solid hsl(var(--border) / 0.5)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                    <Building2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Company Details</h3>
                  <Link href="/company" className="ml-auto text-xs hover:underline" style={{ color: 'hsl(var(--primary))' }}>Edit</Link>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Company Name</label>
                    <input type="text" value={company?.name || ''} readOnly className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none opacity-70" style={inputStyle} placeholder="Your business name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN</label>
                    <input type="text" value={company?.gstNumber || ''} readOnly className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none opacity-70" style={inputStyle} placeholder="22AAAAA0000A1Z5" />
                  </div>
                </div>
              </div>
              {/* Customer */}
              <div className="rounded-xl p-4 sm:p-5" style={{ background: 'hsl(var(--card-bg))', border: '1px solid hsl(var(--border) / 0.5)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                    <User className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Customer Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative sm:col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Name *</label>
                    <input type="text" value={customerSearch || customerName} onChange={e => { setCustomerSearch(e.target.value); setCustomerName(''); setShowCustomerResults(true); }}
                      onFocus={() => setShowCustomerResults(true)}
                      onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="Search customer..." required />
                    {showCustomerResults && filteredCustomers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-xl border shadow-lg" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                        {filteredCustomers.slice(0, 8).map(c => (
                          <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity border-b last:border-b-0"
                            style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.name}</span>
                            {c.email && <span className="ml-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.email}</span>}
                            {c.gstNumber && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{c.gstNumber}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Email</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Phone</label>
                    <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>GSTIN</label>
                    <input type="text" value={customerGst} onChange={e => setCustomerGst(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>PAN</label>
                    <input type="text" value={customerPan} onChange={e => setCustomerPan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="ABCDE1234F" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>State</label>
                    <input type="text" value={customerState} onChange={e => setCustomerState(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="Maharashtra" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Address</label>
                    <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                      style={inputStyle} placeholder="Full address with PIN code" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Invoice Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {stepBadge(2)}
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Invoice Details</h2>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Set supply type, billing and payment options</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice Type</label>
                <select value={supplyType} onChange={e => setSupplyType(e.target.value as 'intra' | 'inter')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="intra">B2B Intra-State (CGST + SGST)</option>
                  <option value="inter">B2B Inter-State (IGST)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Bill Type</label>
                <select value={billingType} onChange={e => setBillingType(e.target.value as 'gst' | 'non-gst' | 'mrp')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="gst">GST Bill</option>
                  <option value="non-gst">No GST</option>
                  <option value="mrp">MRP (price includes tax)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="SAR">SAR — Saudi Riyal</option>
                </select>
                {currency !== 'INR' && (
                  <input type="number" step="0.0001" value={currencyRate} onChange={e => setCurrencyRate(e.target.value)}
                    placeholder="Rate to INR" className="mt-2 w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
            {template?.formFields && (template.formFields as FormField[]).length > 0 && (
              <div className="mt-5 pt-5 border-t" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>Custom Fields</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(template.formFields as FormField[]).map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {field.label} {field.required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={dynamicFieldValues[field.key] || ''}
                          onChange={e => setDynamicFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                          style={inputStyle}
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={dynamicFieldValues[field.key] || ''}
                          onChange={e => setDynamicFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                          style={inputStyle}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 3: Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {stepBadge(3)}
                <div>
                  <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Items</h2>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Add products or services to your invoice</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={ocrFileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onOcrFile(f); }} />
                <button type="button" onClick={() => ocrFileRef.current?.click()} disabled={ocrLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                  style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} Scan Receipt
                </button>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-2 px-3 py-2 text-xs font-medium mt-4 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <div className="col-span-2">Product</div>
              <div className="col-span-1">HSN/SAC</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">Rate (₹)</div>
              <div className="col-span-1">Cost</div>
              <div className="col-span-1">GST%</div>
              <div className="col-span-1">Tax</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Profit</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const cost = parseFloat(item.costPrice) || 0;
                const rate = parseFloat(item.gstRate) || 0;
                const itemSub = qty * price;
                const itemTax = billingType === 'non-gst' ? 0 : itemSub * rate / 100;
                const itemTotal = itemSub + itemTax;
                const itemProfit = (price - cost) * qty;

                return (
                  <div key={item.id} className="grid grid-cols-2 lg:grid-cols-12 gap-2 p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                    {/* Product */}
                    <div className="lg:col-span-2 relative">
                      <input type="text" value={item.productName}
                        onChange={e => updateItem(item.id, 'productName', e.target.value)}
                        onFocus={() => setShowDropdown(item.id)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]/20"
                        style={inputStyle} placeholder="Product" />
                      {showDropdown === item.id && products.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 glass-card rounded-lg shadow-lg max-h-40 overflow-auto">
                          {products.map(p => (
                            <div key={p.id} className="px-2 py-1.5 hover:bg-[hsl(var(--primary)/0.1)] cursor-pointer text-xs"
                              onClick={() => selectProduct(item.id, p)}>
                              <div className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</div>
                              <div style={{ color: 'hsl(var(--muted-foreground))' }}>₹{p.price} | GST {p.gstRate ?? p.taxRate ?? 18}%</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* HSN */}
                    <div className="lg:col-span-1">
                      <input type="text" value={item.hsnCode} onChange={e => updateItem(item.id, 'hsnCode', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="HSN" />
                    </div>
                    {/* Qty */}
                    <div className="lg:col-span-1">
                      <input type="number" min="0" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Qty" />
                    </div>
                    {/* Rate */}
                    <div className="lg:col-span-1">
                      <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Rate" />
                    </div>
                    {/* Cost */}
                    <div className="lg:col-span-1">
                      <input type="number" min="0" step="0.01" value={item.costPrice} onChange={e => updateItem(item.id, 'costPrice', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle} placeholder="Cost" />
                    </div>
                    {/* GST% */}
                    <div className="lg:col-span-1">
                      <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', e.target.value)}
                        className="w-full px-1 py-2 rounded-lg text-xs focus:outline-none" style={inputStyle}>
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    {/* Tax */}
                    <div className="lg:col-span-1 flex items-center">
                      <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{itemTax.toFixed(0)}</span>
                    </div>
                    {/* Total */}
                    <div className="lg:col-span-1 flex items-center">
                      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>₹{itemTotal.toFixed(0)}</span>
                    </div>
                    {/* Profit */}
                    <div className="lg:col-span-1 flex items-center">
                      <span className={`text-xs font-medium ${itemProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{itemProfit.toFixed(0)}
                      </span>
                    </div>
                    {/* Remove */}
                    <div className="lg:col-span-1 flex items-center justify-end">
                      <button type="button" onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors" disabled={items.length === 1}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: items.length === 1 ? 'hsl(var(--muted-foreground))' : '#ef4444' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Step 4: Review & Sign */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {stepBadge(4)}
              <div>
                <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Review &amp; Sign</h2>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Add discount, review totals and sign the invoice</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Discount</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none" style={inputStyle} placeholder="0" />
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as 'flat' | 'percent')}
                    className="px-2 py-2 rounded-lg text-sm focus:outline-none" style={inputStyle}>
                    <option value="flat">₹</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none" style={inputStyle} placeholder="Payment terms, thank you note..." />
              </div>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
              {/* GST Breakdown */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                  {supplyType === 'intra' ? 'CGST + SGST Breakdown' : 'IGST Breakdown'}
                </h3>
                <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {supplyType === 'intra' ? (
                  <>
                    <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>CGST</span><span>₹{cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>SGST</span><span>₹{sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span>IGST</span><span>₹{igst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-400">
                    <span>Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              {/* Grand Total + Profit */}
              <div className="space-y-3">
                <div className="border-t pt-3 flex justify-between items-center" style={{ borderColor: 'hsl(var(--border))' }}>
                  <span className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Grand Total</span>
                  <span className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Estimated Profit</span>
                  <span className={`font-semibold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{profit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

              <h3 className="text-base font-semibold mt-6 pt-6 border-t mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border) / 0.5)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                  <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                Digital Signature
              </h3>
              <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setSignatureType('upload')}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${signatureType === 'upload' ? 'ring-2 ring-[hsl(var(--primary))]' : ''}`}
                  style={{ background: signatureType === 'upload' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                >
                  Upload Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureType('draw')}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${signatureType === 'draw' ? 'ring-2 ring-[hsl(var(--primary))]' : ''}`}
                  style={{ background: signatureType === 'draw' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => { setSignatureType('none'); setSignatureImage(''); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${signatureType === 'none' ? 'ring-2 ring-[hsl(var(--primary))]' : ''}`}
                  style={{ background: signatureType === 'none' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                >
                  No Signature
                </button>
              </div>

              {signatureType === 'upload' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Upload Signature Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSignatureImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                    style={inputStyle}
                  />
                  {signatureImage && (
                    <div className="mt-2 p-3 rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                      <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Preview:</p>
                      <img src={signatureImage} alt="Signature" className="max-h-20" />
                    </div>
                  )}
                </div>
              )}

              {signatureType === 'draw' && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Draw Your Signature (Auto-saves)</label>
                  <div className="border-2 border-dashed rounded-xl p-3 sm:p-4" style={{ borderColor: 'hsl(var(--border))' }}>
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-40 sm:h-44 bg-white rounded-lg border touch-none"
                        style={{ borderColor: 'hsl(var(--border))', cursor: 'crosshair' }}
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                      />
                      {!signatureImage && !isDrawing && (
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-7">
                          <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Draw your signature here</span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute left-6 right-6 bottom-9 border-b border-dashed" style={{ borderColor: 'hsl(var(--border))' }} />
                    </div>
                    {signatureImage && (
                      <div className="mt-2 p-2 rounded-lg border flex items-center gap-2" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--primary) / 0.05)' }}>
                        <span className="text-xs" style={{ color: 'hsl(var(--primary))' }}>✓ Saved</span>
                        <img src={signatureImage} alt="Signature" className="max-h-12" />
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                      >
                        Clear & Redraw
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
            <Link href="/invoices" className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-center text-sm font-medium transition-colors"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
              Cancel
            </Link>
            <button type="submit" disabled={loading || !customerName}
              className="flex-1 sm:flex-auto px-6 py-3 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.4)'
              }}>
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create GST Invoice'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
