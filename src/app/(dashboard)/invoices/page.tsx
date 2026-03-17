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
    const primaryColor = [193, 122, 71]; // Terracotta
    const secondaryColor = [245, 241, 235]; // Light beige
    
    // Header Background
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Header with Company Logo or Name
    if (company?.logoUrl) {
      try {
        doc.addImage(company.logoUrl, 'JPEG', 20, 10, 40, 25);
      } catch {
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(company?.name?.substring(0, 20) || 'AIONS', 20, 30);
      }
    } else {
      doc.setFontSize(28);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(company?.name?.substring(0, 20) || 'AIONS', 20, 30);
    }
    
    // Company Details - Right side
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    let companyY = 15;
    
    if (company) {
      if (company.address) {
        doc.text(company.address, pageWidth - 80, companyY);
        companyY += 5;
        doc.text(`${company.city || ''} - ${company.pincode || ''}`, pageWidth - 80, companyY);
        companyY += 5;
      }
      if (company.phone) {
        doc.text(`Phone: ${company.phone}`, pageWidth - 80, companyY);
        companyY += 5;
      }
      if (company.gstNumber) {
        doc.text(`GSTIN: ${company.gstNumber}`, pageWidth - 80, companyY);
      }
    }
    
    // Invoice Title Box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(pageWidth - 70, 55, 60, 25, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth - 65, 67);
    
    // Invoice Details Box
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(pageWidth - 70, 82, 60, 35, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No:`, pageWidth - 65, 92);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.invoiceNumber}`, pageWidth - 65, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 65, 108);
    if (invoice.dueDate) {
      doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, pageWidth - 65, 113);
    }
    
    // Bill To Section
    const billToY = 60;
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.roundedRect(15, billToY, 80, 55, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, billToY + 10);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.customerName || 'Customer', 20, billToY + 22);
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    let customerY = billToY + 32;
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, 20, customerY);
      customerY += 5;
    }
    if (invoice.customerAddress) {
      const addressLines = doc.splitTextToSize(invoice.customerAddress, 70);
      addressLines.forEach((line: string) => {
        doc.text(line, 20, customerY);
        customerY += 5;
      });
    }
    if (invoice.customerGst) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${invoice.customerGst}`, 20, customerY);
    }
    
    // Items Table Header
    const tableY = 130;
    const hasTax = (invoice.taxRate || 0) > 0;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(15, tableY, 180, 12, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('No.', 20, tableY + 8);
    doc.text('Item Description', 35, tableY + 8);
    doc.text('Qty', 100, tableY + 8);
    doc.text('Rate', 120, tableY + 8);
    if (hasTax) {
      doc.text('GST', 145, tableY + 8);
    }
    doc.text('Amount', hasTax ? 175 : 165, tableY + 8);
    
    // Items with alternating background
    let y = tableY + 18;
    invoice.items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 6, 180, 10, 'F');
      }
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.text((index + 1).toString(), 20, y);
      doc.text(item.description || 'Item', 35, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(item.price.toFixed(2), 120, y);
      if (hasTax) {
        doc.text(`${item.taxAmount.toFixed(2)}`, 145, y);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(item.total.toFixed(2), hasTax ? 175 : 165, y);
      y += 12;
    });
    
    // Totals Section Box
    const totalsY = y + 10;
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.roundedRect(110, totalsY, 85, hasTax ? 50 : 40, 3, 3, 'F');
    
    const actualSubtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const actualTaxTotal = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const actualTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 115, totalsY + 12);
    doc.text(actualSubtotal.toFixed(2), 185, totalsY + 12, { align: 'right' });
    
    if (hasTax) {
      doc.text(`GST (${invoice.taxRate}%):`, 115, totalsY + 22);
      doc.text(actualTaxTotal.toFixed(2), 185, totalsY + 22, { align: 'right' });
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(115, hasTax ? totalsY + 28 : totalsY + 18, 190, hasTax ? totalsY + 28 : totalsY + 18);
    
    doc.setFontSize(13);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 115, hasTax ? totalsY + 40 : totalsY + 30);
    doc.text(actualTotal.toFixed(2), 185, hasTax ? totalsY + 40 : totalsY + 30, { align: 'right' });
    
    // Amount in words box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(15, totalsY, 90, 35, 3, 3, 'FD');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount in Words:', 20, totalsY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const words = numberToWords(actualTotal);
    const wordsLines = doc.splitTextToSize(`${words} Only`, 80);
    doc.text(wordsLines, 20, totalsY + 20);
    
    // Bank Details
    if (company?.bankName) {
      const bankY = totalsY + 55;
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, bankY, 180, 30, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('BANK DETAILS', 20, bankY + 10);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bank: ${company.bankName}`, 20, bankY + 18);
      if (company.bankAccount) {
        doc.text(`Account: ${company.bankAccount}`, 20, bankY + 25);
      }
      if (company.ifscCode) {
        doc.text(`IFSC: ${company.ifscCode}`, 100, bankY + 25);
      }
    }
    
    // Footer with line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 15, pageHeight - 15);
    if (company?.name) {
      doc.text(`This is a computer generated invoice by ${company.name}`, pageWidth - 15, pageHeight - 15, { align: 'right' });
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
