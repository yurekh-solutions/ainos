'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Search, X } from 'lucide-react';

interface POSProduct { id: string; name: string; price: number; barcode?: string; quickKey?: string; isInStock: boolean; category?: { name: string; color?: string }; }
interface CartItem { product: POSProduct; qty: number; }

export default function POSRegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session') || '';
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try { const res = await fetch('/api/pos/products'); if (res.ok) setProducts(await res.json()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product: POSProduct) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.product.id === productId) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const removeFromCart = (productId: string) => { setCart(cart.filter(c => c.product.id !== productId)); };

  const subtotal = cart.reduce((a, c) => a + c.product.price * c.qty, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const change = amountPaid - total;

  const filteredProducts = products.filter(p => p.isInStock && (p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)));

  const processOrder = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ productId: c.product.id, name: c.product.name, price: c.product.price, qty: c.qty })),
          subtotal, tax, total, paymentMethod, amountPaid, changeAmount: change > 0 ? change : 0,
          sessionId: sessionId || null,
        })
      });
      if (res.ok) {
        setCart([]); setShowCheckout(false); setAmountPaid(0);
        alert('Order completed!');
      }
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <button onClick={() => router.push('/pos/sessions')} className="p-1.5 rounded-lg hover:bg-white/10"><ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} /></button>
        <h1 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>POS Terminal</h1>
        <div className="flex-1" />
        <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or scan barcode..."
          className="w-64 px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map(p => (
              <motion.button key={p.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => addToCart(p)}
                className="rounded-xl p-3 border text-left transition-colors hover:border-purple-500"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="w-full h-12 rounded-lg mb-2 flex items-center justify-center" style={{ background: p.category?.color ? p.category.color + '20' : '#6D28D920' }}>
                  <ShoppingCart className="w-5 h-5" style={{ color: p.category?.color || '#8B5CF6' }} />
                </div>
                <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#8B5CF6' }}>₹{p.price.toFixed(2)}</p>
                {p.quickKey && <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: '#6D28D920', color: '#8B5CF6' }}>{p.quickKey}</span>}
              </motion.button>))}
          </div>
          {filteredProducts.length === 0 && <p className="text-center py-12" style={{ color: 'hsl(var(--muted-foreground))' }}>No products found. Add products first.</p>}
        </div>

        {/* Cart sidebar */}
        <div className="w-80 border-l flex flex-col" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Current Order</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{cart.length} items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'hsl(var(--background))' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{item.product.name}</p>
                  <p className="text-xs" style={{ color: '#8B5CF6' }}>₹{item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.product.id, -1)} className="p-1 rounded hover:bg-white/10"><Minus className="w-3 h-3" style={{ color: 'hsl(var(--foreground))' }} /></button>
                  <span className="text-xs font-medium w-6 text-center" style={{ color: 'hsl(var(--foreground))' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="p-1 rounded hover:bg-white/10"><Plus className="w-3 h-3" style={{ color: 'hsl(var(--foreground))' }} /></button>
                </div>
                <p className="text-xs font-medium w-16 text-right" style={{ color: 'hsl(var(--foreground))' }}>₹{(item.product.price * item.qty).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.product.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-3 h-3" style={{ color: '#ef4444' }} /></button>
              </div>))}
            {cart.length === 0 && <p className="text-center py-8 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Cart is empty</p>}
          </div>

          <div className="p-4 border-t space-y-3" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'hsl(var(--muted-foreground))' }}>GST (18%)</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}><span style={{ color: 'hsl(var(--foreground))' }}>Total</span><span style={{ color: '#8B5CF6' }}>₹{total.toFixed(2)}</span></div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setAmountPaid(total); setShowCheckout(true); }} disabled={cart.length === 0}
              className="w-full py-3 rounded-lg text-white text-sm font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
              Checkout
            </motion.button>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Checkout</h2>
              <button onClick={() => setShowCheckout(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
            <div className="text-center mb-6"><p className="text-3xl font-bold" style={{ color: '#8B5CF6' }}>₹{total.toFixed(2)}</p><p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{cart.length} items</p></div>
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ method: 'cash', label: 'Cash', icon: Banknote }, { method: 'card', label: 'Card', icon: CreditCard }, { method: 'upi', label: 'UPI', icon: Smartphone }].map(pm => (
                  <button key={pm.method} onClick={() => setPaymentMethod(pm.method)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${paymentMethod === pm.method ? 'text-white border-purple-500' : ''}`}
                    style={paymentMethod === pm.method ? { background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', borderColor: '#8B5CF6' } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                    <pm.icon className="w-5 h-5" />{pm.label}
                  </button>))}
              </div>
            </div>
            <div className="mb-4"><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Amount Paid (₹)</label>
              <input type="number" value={amountPaid} onChange={e => setAmountPaid(+e.target.value)} className="w-full px-3 py-2 rounded-lg border text-lg font-bold text-center" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
            {change >= 0 && <div className="flex justify-between text-sm mb-4 p-3 rounded-lg" style={{ background: '#10b98120' }}><span style={{ color: '#10b981' }}>Change</span><span className="font-bold" style={{ color: '#10b981' }}>₹{change.toFixed(2)}</span></div>}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={processOrder} disabled={processing || amountPaid < total}
              className="w-full py-3 rounded-lg text-white text-sm font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
              {processing ? 'Processing...' : 'Complete Order'}
            </motion.button>
          </motion.div>
        </div>)}
    </div>
  );
}
