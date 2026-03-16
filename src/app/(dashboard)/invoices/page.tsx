'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Download, ArrowUpRight, Eye } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerGst?: string;
  totalAmount: number;
  subtotal: number;
  taxTotal: number;
  taxRate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  }[];
}

interface Company {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  logoUrl?: string;
}

// Format currency in Indian Rupees
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, companyRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/company'),
      ]);

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }
      
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
      draft: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
      sent: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      overdue: 'bg-red-500/20 text-red-600 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-600 border-gray-500/30';
  };

  const downloadPDF = async (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with Company Logo or Name
    if (company?.logoUrl) {
      try {
        // Add logo image
        doc.addImage(company.logoUrl, 'JPEG', 20, 10, 40, 20);
      } catch {
        // Fallback to text if image fails
        doc.setFontSize(24);
        doc.setTextColor(193, 122, 71);
        doc.text(company?.name?.substring(0, 20) || 'AIONS', 20, 25);
      }
    } else {
      doc.setFontSize(24);
      doc.setTextColor(193, 122, 71);
      doc.text(company?.name?.substring(0, 20) || 'AIONS', 20, 25);
    }
    
    // Company Details
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    let companyY = company?.logoUrl ? 35 : 32;
    
    if (company) {
      doc.text(company.name || 'Smart Billing Platform', 20, companyY);
      if (company.address) {
        companyY += 5;
        doc.text(`${company.address}, ${company.city || ''} - ${company.pincode || ''}`, 20, companyY);
      }
      if (company.gstNumber) {
        companyY += 5;
        doc.text(`GST: ${company.gstNumber}`, 20, companyY);
      }
      if (company.phone) {
        companyY += 5;
        doc.text(`Phone: ${company.phone}`, 20, companyY);
      }
    } else {
      doc.text('Smart Billing Platform', 20, companyY);
    }
    
    // Invoice Details (Right side)
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('TAX INVOICE', pageWidth - 60, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 60, 28);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 60, 35);
    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, pageWidth - 60, 42);
    }
    
    // Bill To Section
    let billToY = companyY + 15;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 20, billToY);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    billToY += 7;
    doc.text(invoice.customerName || 'Customer', 20, billToY);
    
    if (invoice.customerEmail) {
      billToY += 5;
      doc.text(invoice.customerEmail, 20, billToY);
    }
    if (invoice.customerAddress) {
      billToY += 5;
      doc.text(invoice.customerAddress, 20, billToY);
    }
    if (invoice.customerGst) {
      billToY += 5;
      doc.text(`GST: ${invoice.customerGst}`, 20, billToY);
    }
    
    // Items Table Header
    const tableY = billToY + 20;
    doc.setFillColor(245, 241, 235);
    doc.rect(20, tableY, 170, 10, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('No.', 25, tableY + 7);
    doc.text('Description', 35, tableY + 7);
    doc.text('Qty', 100, tableY + 7);
    doc.text('Price', 120, tableY + 7);
    doc.text(`GST (${invoice.taxRate || 18}%)`, 150, tableY + 7);
    doc.text('Total', 180, tableY + 7);
    
    // Items
    let y = tableY + 20;
    invoice.items.forEach((item, index) => {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text((index + 1).toString(), 25, y);
      doc.text(item.description || 'Item', 35, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(item.price.toFixed(2), 120, y);
      doc.text(item.taxAmount.toFixed(2), 150, y);
      doc.text(item.total.toFixed(2), 180, y);
      y += 10;
    });
    
    // Totals Section
    const totalsY = y + 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(120, totalsY - 5, 190, totalsY - 5);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    // Calculate actual values from items
    const actualSubtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const actualTaxTotal = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const actualTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
    doc.text('Subtotal:', 130, totalsY);
    doc.text(actualSubtotal.toFixed(2), 180, totalsY);
    
    doc.text(`GST (${invoice.taxRate || 18}%):`, 130, totalsY + 8);
    doc.text(actualTaxTotal.toFixed(2), 180, totalsY + 8);
    
    doc.setFontSize(12);
    doc.setTextColor(193, 122, 71);
    doc.text('Total:', 130, totalsY + 20);
    doc.text(actualTotal.toFixed(2), 180, totalsY + 20);
    
    // Amount in words
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Amount in words: ${numberToWords(actualTotal)} Only`, 20, totalsY + 35);
    
    // Bank Details
    if (company?.bankName) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Bank Details:', 20, totalsY + 50);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Bank: ${company.bankName}`, 20, totalsY + 58);
      if (company.bankAccount) {
        doc.text(`A/C: ${company.bankAccount}`, 20, totalsY + 65);
      }
      if (company.ifscCode) {
        doc.text(`IFSC: ${company.ifscCode}`, 20, totalsY + 72);
      }
    }
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 20, 280);
    if (company?.name) {
      doc.text(`Powered by ${company.name}`, 20, 288);
    }
    
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  // Helper function to convert number to words
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
    };
    
    if (num === 0) return 'Zero';
    
    let rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = '';
    
    if (rupees > 0) {
      if (rupees >= 10000000) {
        result += convertLessThanOneThousand(Math.floor(rupees / 10000000)) + ' Crore ';
        rupees %= 10000000;
      }
      if (rupees >= 100000) {
        result += convertLessThanOneThousand(Math.floor(rupees / 100000)) + ' Lakh ';
        rupees %= 100000;
      }
      if (rupees >= 1000) {
        result += convertLessThanOneThousand(Math.floor(rupees / 1000)) + ' Thousand ';
        rupees %= 1000;
      }
      result += convertLessThanOneThousand(rupees);
      result += ' Rupees';
    }
    
    if (paise > 0) {
      result += (result ? ' and ' : '') + convertLessThanOneThousand(paise) + ' Paise';
    }
    
    return result.trim();
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Invoices</h1>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Manage and track your invoices
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
              boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.4)'
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Invoice</span>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#C17A47]/20"
              style={{ 
                background: 'hsl(var(--card-bg))',
                border: '1px solid hsl(var(--border) / 0.5)',
                color: 'hsl(var(--foreground))'
              }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ 
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))'
            }}>
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Invoices List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-t-[hsl(var(--primary))] rounded-full animate-spin mx-auto" 
                style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th className="text-left py-4 px-6 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Invoice</th>
                    <th className="text-left py-4 px-6 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Customer</th>
                    <th className="text-left py-4 px-6 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Amount (INR)</th>
                    <th className="text-left py-4 px-6 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Date</th>
                    <th className="py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t transition-colors hover:bg-[hsl(var(--muted))]"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                            <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                          </div>
                          <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6" style={{ color: 'hsl(var(--foreground))' }}>
                        {invoice.customerName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        ₹{invoice.totalAmount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => downloadPDF(invoice)}
                            className="p-2 rounded-lg transition-colors hover:bg-[hsl(var(--primary)/0.1)]"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>No invoices yet</h3>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Create your first invoice to get started
              </p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                  boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.4)'
                }}
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
