'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Shield, Globe, Save, Check } from 'lucide-react';

export default function EcomSettingsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  const [saved, setSaved] = useState(false);
  const [payments, setPayments] = useState({ razorpayKey: '', razorpaySecret: '', stripeKey: '', stripeSecret: '', paypalClient: '', paypalSecret: '' });
  const [shipping, setShipping] = useState({ freeThreshold: 500, flatRate: 50, enableCod: true, codCharge: 30 });
  const [tax, setTax] = useState({ gstin: '', pan: '', enableGst: true, defaultRate: 18 });
  const [store, setStore] = useState({ storeName: '', supportEmail: '', supportPhone: '', defaultCurrency: 'INR', timezone: 'Asia/Kolkata' });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'shipping', label: 'Shipping', icon: Truck },
    { key: 'tax', label: 'Tax & Compliance', icon: Shield },
    { key: 'store', label: 'Store Settings', icon: Globe },
  ];

  const inputClass = "w-full px-3 py-2 rounded-lg border text-sm";
  const inputStyle = { background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' };
  const labelClass = "block text-sm font-medium mb-1";
  const labelStyle = { color: 'hsl(var(--foreground))' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>eCommerce Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Configure payment, shipping, and store preferences</p></div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'text-white' : ''}`}
              style={activeTab === t.key ? { background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' } : { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>))}
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Payment Gateways</h3>
              <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                <h4 className="font-medium text-sm" style={{ color: '#8B5CF6' }}>Razorpay</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass} style={labelStyle}>Key ID</label><input value={payments.razorpayKey} onChange={e => setPayments({ ...payments, razorpayKey: e.target.value })} className={inputClass} style={inputStyle} /></div>
                  <div><label className={labelClass} style={labelStyle}>Secret Key</label><input type="password" value={payments.razorpaySecret} onChange={e => setPayments({ ...payments, razorpaySecret: e.target.value })} className={inputClass} style={inputStyle} /></div>
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                <h4 className="font-medium text-sm" style={{ color: '#8B5CF6' }}>Stripe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass} style={labelStyle}>Publishable Key</label><input value={payments.stripeKey} onChange={e => setPayments({ ...payments, stripeKey: e.target.value })} className={inputClass} style={inputStyle} /></div>
                  <div><label className={labelClass} style={labelStyle}>Secret Key</label><input type="password" value={payments.stripeSecret} onChange={e => setPayments({ ...payments, stripeSecret: e.target.value })} className={inputClass} style={inputStyle} /></div>
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                <h4 className="font-medium text-sm" style={{ color: '#8B5CF6' }}>PayPal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass} style={labelStyle}>Client ID</label><input value={payments.paypalClient} onChange={e => setPayments({ ...payments, paypalClient: e.target.value })} className={inputClass} style={inputStyle} /></div>
                  <div><label className={labelClass} style={labelStyle}>Secret</label><input type="password" value={payments.paypalSecret} onChange={e => setPayments({ ...payments, paypalSecret: e.target.value })} className={inputClass} style={inputStyle} /></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Shipping Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass} style={labelStyle}>Free Shipping Above (₹)</label>
                  <input type="number" value={shipping.freeThreshold} onChange={e => setShipping({ ...shipping, freeThreshold: +e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>Flat Rate (₹)</label>
                  <input type="number" value={shipping.flatRate} onChange={e => setShipping({ ...shipping, flatRate: +e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>COD Charge (₹)</label>
                  <input type="number" value={shipping.codCharge} onChange={e => setShipping({ ...shipping, codCharge: +e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={shipping.enableCod} onChange={e => setShipping({ ...shipping, enableCod: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Enable Cash on Delivery</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Tax & Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass} style={labelStyle}>GSTIN</label>
                  <input value={tax.gstin} onChange={e => setTax({ ...tax, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>PAN</label>
                  <input value={tax.pan} onChange={e => setTax({ ...tax, pan: e.target.value })} placeholder="AAAAA0000A" className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>Default Tax Rate (%)</label>
                  <input type="number" value={tax.defaultRate} onChange={e => setTax({ ...tax, defaultRate: +e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={tax.enableGst} onChange={e => setTax({ ...tax, enableGst: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Enable GST</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Store Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass} style={labelStyle}>Store Name</label>
                  <input value={store.storeName} onChange={e => setStore({ ...store, storeName: e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>Support Email</label>
                  <input type="email" value={store.supportEmail} onChange={e => setStore({ ...store, supportEmail: e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>Support Phone</label>
                  <input value={store.supportPhone} onChange={e => setStore({ ...store, supportPhone: e.target.value })} className={inputClass} style={inputStyle} /></div>
                <div><label className={labelClass} style={labelStyle}>Default Currency</label>
                  <select value={store.defaultCurrency} onChange={e => setStore({ ...store, defaultCurrency: e.target.value })} className={inputClass} style={inputStyle}>
                    <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                  </select></div>
                <div><label className={labelClass} style={labelStyle}>Timezone</label>
                  <select value={store.timezone} onChange={e => setStore({ ...store, timezone: e.target.value })} className={inputClass} style={inputStyle}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York (EST)</option>
                  </select></div>
              </div>
            </div>
          )}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </motion.button>
      </motion.div>
    </div>
  );
}
