'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save, FileText, Percent, Building2, Package, ChevronDown, IndianRupee, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

const GST_RATES = [0, 5, 12, 18, 28];

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
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
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', productId: '', productName: '', description: '', hsnCode: '', quantity: '1', price: '', costPrice: '', gstRate: '18' }
  ]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [productsRes, companyRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/company'),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (companyRes.ok) {
        const c = await companyRes.json();
        setCompany(c);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(), productId: '', productName: '', description: '',
      hsnCode: '', quantity: '1', price: '', costPrice: '', gstRate: '18'
    }]);
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
          discountAmount: parseFloat(discountAmount) || 0,
          discountType, paymentMethod, notes,
          dueDate: dueDate || undefined,
          status: 'draft',
        }),
      });

      if (res.ok) router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'hsl(var(--card-bg))',
    border: '1px solid hsl(var(--border) / 0.5)',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invoices" className="p-2 rounded-xl transition-colors" style={{ background: 'hsl(var(--muted))' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>New GST Invoice</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create a GST-compliant invoice with CGST/SGST/IGST</p>
          </div>
        </div>

        {/* Company Info */}
        {company && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{company.name}</h3>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {company.gstNumber ? `GSTIN: ${company.gstNumber}` : 'No GSTIN'}
                </p>
              </div>
              <Link href="/company" className="text-xs hover:underline" style={{ color: 'hsl(var(--primary))' }}>Edit</Link>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  style={inputStyle} placeholder="Customer name" required />
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
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Address</label>
                <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  style={inputStyle} placeholder="Full address with PIN code" />
              </div>
            </div>
          </motion.div>

          {/* Billing Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Percent className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              Billing Settings
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Supply Type</label>
                <select value={supplyType} onChange={e => setSupplyType(e.target.value as 'intra' | 'inter')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="intra">Intra-State (CGST+SGST)</option>
                  <option value="inter">Inter-State (IGST)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Billing Type</label>
                <select value={billingType} onChange={e => setBillingType(e.target.value as 'gst' | 'non-gst' | 'mrp')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                  <option value="gst">GST Billing</option>
                  <option value="non-gst">Non-GST</option>
                  <option value="mrp">MRP (Tax Inclusive)</option>
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
                <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>
          </motion.div>

          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                  <Package className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                Items
              </h2>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-2 px-3 py-2 text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <div className="col-span-2">Product</div>
              <div className="col-span-1">HSN</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">Rate</div>
              <div className="col-span-1">Cost</div>
              <div className="col-span-1">GST%</div>
              <div className="col-span-1">Tax</div>
              <div className="col-span-1">Total</div>
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

          {/* Discount + Notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </motion.div>

          {/* Totals Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
