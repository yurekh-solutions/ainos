'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Search, X, DollarSign, Tag, TrendingUp, Grid3X3, List, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Product } from '@/types/product';

const chartData = [
  { category: 'Electronics', sales: 45 },
  { category: 'Services', sales: 32 },
  { category: 'Software', sales: 28 },
  { category: 'Hardware', sales: 18 },
  { category: 'Other', sales: 12 },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', taxRate: '0', sku: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          taxRate: parseFloat(formData.taxRate),
        }),
      });
      if (res.ok) {
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      taxRate: product.taxRate?.toString() || '0',
      sku: product.sku || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', taxRate: '0', sku: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = products.length > 0 ? totalValue / products.length : 0;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Products</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your product catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: viewMode === 'grid' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: viewMode === 'list' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
              }}
            >
              <Plus className="w-4 h-4" /> Add Product
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: products.length, icon: Package, gradient: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/10' },
            { label: 'Avg Price', value: `₹${avgPrice.toFixed(2)}`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-600', bgGlow: 'bg-emerald-500/10' },
            { label: 'Total Value', value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', bgGlow: 'bg-violet-500/10' },
            { label: 'Categories', value: '5', icon: Tag, gradient: 'from-rose-500 to-pink-600', bgGlow: 'bg-rose-500/10' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bgGlow} flex items-center justify-center`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Sales by Category
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card-bg))', 
                  border: '1px solid hsl(var(--border) / 0.5)', 
                  borderRadius: '0.75rem',
                  color: 'hsl(var(--foreground))'
                }} 
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.95 }}
                className="w-full max-w-md glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <button 
                    onClick={resetForm} 
                    className="p-1.5 rounded-lg transition-colors hover:bg-[hsl(var(--muted))]"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Product Name *" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="SKU" 
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      placeholder="Price (₹) *" 
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 text-sm"
                      required min="0" step="0.01" 
                    />
                    <input 
                      type="number" 
                      placeholder="Tax Rate %" 
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 text-sm"
                      min="0" max="100" 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Description" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit" 
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                        boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
                      }}
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                    <button 
                      type="button" 
                      onClick={resetForm} 
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.95 }}
                className="w-full max-w-sm glass-card p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Delete Product?
                </h3>
                <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  This action cannot be undone. The product will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ 
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" 
              style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 glass-card">
                <Package className="w-12 h-12 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p style={{ color: 'hsl(var(--foreground))' }}>No products found</p>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first product to get started</p>
              </div>
            ) : (
              filteredProducts.map((product, index) => (
                <motion.div 
                  key={product._id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 group hover:shadow-lg transition-all ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
                >
                  <div className={`${viewMode === 'list' ? 'flex items-center gap-4 flex-1' : ''}`}>
                    <div 
                      className={`rounded-xl flex items-center justify-center shadow-lg ${viewMode === 'list' ? 'w-12 h-12' : 'w-14 h-14 mb-3'}`}
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}
                    >
                      <Package className={`text-white ${viewMode === 'list' ? 'w-6 h-6' : 'w-7 h-7'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{product.name}</p>
                          {product.sku && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>SKU: {product.sku}</p>}
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>₹{product.price.toFixed(2)}</span>
                      </div>
                      {product.description && <p className="text-sm mt-1 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{product.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Tax: {product.taxRate || 0}%</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ 
                              background: 'hsl(142 76% 36% / 0.1)',
                              color: 'hsl(142 76% 36%)'
                            }}>
                            Active
                          </span>
                        </div>
                        {/* Edit/Delete Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[hsl(var(--primary)/0.1)]"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(product._id || '')}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
