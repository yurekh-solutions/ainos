'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Filter, Download, ArrowUpRight, Eye, Building2 } from 'lucide-react';
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let headerY = 15;
    
    // Company Logo - if available
    if (company?.logoUrl) {
      try {
        doc.addImage(company.logoUrl, 'JPEG', margin, 10, 30, 25);
        headerY = 40; // Move company name down if logo exists
      } catch {
        // If logo fails, just show company name
      }
    }
    
    // Clean minimalist design - no heavy colors
    // Header with simple line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, headerY + 10, pageWidth - margin, headerY + 10);
    
    // Company Name - Large and bold on left
    doc.setFontSize(22);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name?.substring(0, 25) || 'AIONS', margin, headerY);
    
    // Company details below name
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    let companyY = headerY + 15;
    if (company?.address) {
      doc.text(company.address, margin, companyY);
      companyY += 5;
    }
    if (company?.city || company?.pincode) {
      doc.text(`${company.city || ''} ${company.pincode ? '- ' + company.pincode : ''}`, margin, companyY);
      companyY += 5;
    }
    if (company?.phone) {
      doc.text(`Phone: ${company.phone}`, margin, companyY);
    }
    
    // INVOICE label on right - simple text
    doc.setFontSize(28);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, headerY, { align: 'right' });
    
    // Invoice details - simple list on right
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`# ${invoice.invoiceNumber}`, pageWidth - margin, 40, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, pageWidth - margin, 48, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, pageWidth - margin, 56, { align: 'right' });
    }
    
    // Bill To Section - simple heading
    const billToY = 75;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('BILL TO', margin, billToY);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerName || 'Customer', margin, billToY + 10);
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    let customerY = billToY + 18;
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, margin, customerY);
      customerY += 5;
    }
    if (invoice.customerAddress) {
      const addressLines = doc.splitTextToSize(invoice.customerAddress, 80);
      addressLines.forEach((line: string) => {
        doc.text(line, margin, customerY);
        customerY += 5;
      });
    }
    if (invoice.customerGst) {
      doc.text(`GSTIN: ${invoice.customerGst}`, margin, customerY);
    }
    
    // Items Table - clean lines
    const tableY = 125;
    const hasTax = (invoice.taxRate || invoice.items[0]?.taxRate || 0) > 0;
    const displayTaxRate = invoice.taxRate || invoice.items[0]?.taxRate || 0;
    
    // Table header line
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, tableY, pageWidth - margin, tableY);
    
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('No.', margin + 5, tableY + 7);
    doc.text('Item', margin + 20, tableY + 7);
    doc.text('Qty', 95, tableY + 7);
    doc.text('Rate', 115, tableY + 7);
    if (hasTax) {
      doc.text('Tax', 140, tableY + 7);
    }
    doc.text('Amount', hasTax ? 170 : 160, tableY + 7, { align: 'right' });
    
    // Table header bottom line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, tableY + 12, pageWidth - margin, tableY + 12);
    
    // Items
    let y = tableY + 20;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    invoice.items.forEach((item, index) => {
      doc.text((index + 1).toString(), margin + 5, y);
      doc.text(item.description || 'Item', margin + 20, y);
      doc.text(item.quantity.toString(), 95, y);
      doc.text(item.price.toFixed(2), 115, y);
      if (hasTax) {
        doc.text(item.taxAmount.toFixed(2), 140, y);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(item.total.toFixed(2), hasTax ? 170 : 160, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 10;
    });
    
    // Table bottom line
    doc.setDrawColor(50, 50, 50);
    doc.line(margin, y + 5, pageWidth - margin, y + 5);
    
    // Totals Section - right aligned
    const totalsY = y + 20;
    const actualSubtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const actualTaxTotal = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const actualTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 130, totalsY);
    doc.text(actualSubtotal.toFixed(2), pageWidth - margin, totalsY, { align: 'right' });
    
    if (hasTax) {
      doc.text(`Tax (${displayTaxRate}%)`, 130, totalsY + 10);
      doc.text(actualTaxTotal.toFixed(2), pageWidth - margin, totalsY + 10, { align: 'right' });
    }
    
    // Total line
    doc.setDrawColor(200, 200, 200);
    doc.line(130, totalsY + 15, pageWidth - margin, totalsY + 15);
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', 130, totalsY + 25);
    doc.text(actualTotal.toFixed(2), pageWidth - margin, totalsY + 25, { align: 'right' });
    
    // Amount in words - simple text below
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const words = numberToWords(actualTotal);
    doc.text(`Amount in words: ${words} Only`, margin, totalsY + 40);
    
    // Bank Details - if available
    if (company?.bankName) {
      const bankY = totalsY + 55;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('BANK DETAILS', margin, bankY);
      doc.setTextColor(80, 80, 80);
      doc.text(`${company.bankName} | A/C: ${company.bankAccount || '-'} | IFSC: ${company.ifscCode || '-'}`, margin, bankY + 8);
    }
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', margin, pageHeight - 20);
    if (company?.name) {
      doc.text(`Generated by ${company.name}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
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
          <div className="flex flex-col sm:flex-row gap-3">
            {!company?.name ? (
              <Link
                href="/company"
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-white text-sm font-medium transition-all shadow-lg overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #C17A47, #8B5A3C)',
                  boxShadow: '0 10px 30px -10px rgba(193, 122, 71, 0.6)'
                }}
              >
                {/* Animated shimmer effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                <span className="relative z-10">Setup Company Profile First</span>
              </Link>
            ) : (
              <Link
                href="/company"
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all border-2 hover:bg-[#C17A47]/5"
                style={{ 
                  borderColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary))',
                  background: 'transparent'
                }}
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                <span>Company Profile</span>
              </Link>
            )}
            {company?.name ? (
              <Link
                href="/invoices/new"
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95 hover:shadow-xl"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
                  boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.4)'
                }}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
                <span>New Invoice</span>
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all opacity-50 cursor-not-allowed border-2 border-dashed"
                style={{ 
                  borderColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  background: 'transparent'
                }}
                title="Please setup Company Profile first"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>New Invoice</span>
              </button>
            )}
          </div>
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
            
               
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
