'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Filter, Download, ArrowUpRight, Eye, Building2, CheckCircle2, TrendingUp, Bell, Mail, MessageCircle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { useToast } from '@/lib/toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerGst?: string;
  customerGstNumber?: string;
  customerPhone?: string;
  totalAmount: number;
  subtotal: number;
  taxTotal: number;
  taxRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  profitAmount?: number;
  supplyType?: string;
  billingType?: string;
  paidAmount?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    hsnCode?: string;
  }[];
}

interface Company {
  id: string;
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

interface InvoiceTemplate {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: string;
  layout: string;
  showLogo: boolean;
  logoSize: string;
  logoPosition: string;
  showBankDetails: boolean;
  showTerms: boolean;
  showQrCode: boolean;
  terms?: string;
  notes?: string;
  headerText?: string;
  footerText?: string;
  accentWidth: string;
  borderRadius: string;
  headerLayout?: string;
  showDocInfoTable?: boolean;
  paymentTermsLayout?: string;
  termsNumbering?: string;
  showValidityDate?: boolean;
  signatureStyle?: string;
  tableColumns?: Array<{ label: string; key: string; width?: string }>;
  formFields?: Array<{ label: string; key: string; type: string; required?: boolean; placeholder?: string; options?: string[] }>;
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const { error: toastError } = toast;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [chasing, setChasing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, companyRes, templateRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/company'),
        fetch('/api/invoice-templates'),
      ]);

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      } else {
        toastError('Failed to load invoices');
      }
      
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      if (templateRes.ok) {
        const templates = await templateRes.json();
        const defaultTpl = Array.isArray(templates) ? templates.find((t: InvoiceTemplate & { isDefault: boolean }) => t.isDefault) || templates[0] : null;
        if (defaultTpl) setTemplate(defaultTpl);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toastError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
      draft: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
      sent: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      overdue: 'bg-red-500/20 text-red-600 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-600 border-gray-500/30';
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const downloadPDF = async (invoice: Invoice) => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 15;
    const contentW = W - 2 * M;

    // Template settings
    const primaryColor = template?.primaryColor ? hexToRgb(template.primaryColor) : { r: 30, g: 30, b: 30 };
    const accentColor = template?.primaryColor ? hexToRgb(template.primaryColor) : { r: 0, g: 100, b: 180 };
    const fontFamily = 'helvetica';
    const showLogo = template?.showLogo !== false;
    const showBankDetails = template?.showBankDetails !== false;
    const showTerms = template?.showTerms !== false;
    const footerText = template?.footerText || 'Thank you for your business!';

    let y = 10;

    // ── HEADER: Company Info (left) + Document Info (right) ──
    // Company Logo
    if (showLogo && company?.logoUrl) {
      try {
        doc.addImage(company.logoUrl, 'JPEG', M, y, 22, 18);
      } catch { /* logo failed */ }
    }

    // Company Name & Details (left)
    const compX = showLogo && company?.logoUrl ? M + 26 : M;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont(fontFamily, 'bold');
    doc.text(company?.name?.substring(0, 35) || 'AINOS', compX, y + 6);

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.setFont(fontFamily, 'normal');
    let compY = y + 12;
    if (company?.address) { doc.text(company.address.substring(0, 70), compX, compY); compY += 4; }
    if (company?.city || company?.pincode) { doc.text(`${company.city || ''}${company.pincode ? ' - ' + company.pincode : ''}`, compX, compY); compY += 4; }
    if (company?.state) { doc.text(company.state, compX, compY); compY += 4; }
    if (company?.phone) { doc.text(`+91 ${company.phone}`, compX, compY); compY += 4; }
    if (company?.email) { doc.text(company.email, compX, compY); compY += 4; }
    if (company?.gstNumber) { doc.text(`GSTIN: ${company.gstNumber}`, compX, compY); }

    // Document Info Box (right)
    const boxX = W - M - 70;
    const boxY = y;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, 70, 30);

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontFamily, 'normal');
    doc.text('TYPE OF DOCUMENT', boxX + 3, boxY + 6);
    doc.setFontSize(10);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setFont(fontFamily, 'bold');
    doc.text('INVOICE', boxX + 3, boxY + 13);

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontFamily, 'normal');
    doc.text('DATE', boxX + 3, boxY + 19);
    doc.text('DOCUMENT NO.', boxX + 38, boxY + 19);

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.setFont(fontFamily, 'bold');
    doc.text(new Date(invoice.createdAt).toLocaleDateString('en-IN'), boxX + 3, boxY + 25);
    doc.text(invoice.invoiceNumber, boxX + 38, boxY + 25);

    y += 38;

    // ─ Separator Line ──
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(0.8);
    doc.line(M, y, W - M, y);
    y += 8;

    // ── CUSTOMER SECTION ──
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontFamily, 'normal');
    doc.text('MSSRS', M, y);
    y += 5;

    doc.setFontSize(11);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont(fontFamily, 'bold');
    doc.text(invoice.customerName || 'Customer', M, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(fontFamily, 'normal');
    if (invoice.customerAddress) {
      const addrLines = doc.splitTextToSize(invoice.customerAddress, contentW);
      addrLines.forEach((line: string) => { doc.text(line, M, y); y += 4; });
    }
    if (invoice.customerEmail) { doc.text(invoice.customerEmail, M, y); y += 4; }
    if (invoice.customerGst || invoice.customerGstNumber) { doc.text(`GSTIN: ${invoice.customerGst || invoice.customerGstNumber}`, M, y); y += 4; }
    y += 4;

    // ── PAYMENT CONDITIONS BOX ──
    if (showBankDetails && company?.bankName) {
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 248, 248);
      doc.setLineWidth(0.3);
      doc.rect(M, y, contentW, 22, 'FD');

      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont(fontFamily, 'bold');
      doc.text('PAYMENT CONDITIONS', M + 3, y + 5);
      doc.text('A/C NAME', M + 3, y + 12);
      doc.text('BANK NAME', M + 3, y + 18);

      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text('Anticipated wire transfer', M + 30, y + 5);
      doc.text(company.bankName, M + 30, y + 12);
      doc.text(`${company.city || ''} - Main Branch`, M + 30, y + 18);

      doc.setFont(fontFamily, 'bold');
      doc.text('A/C NUMBER', M + 100, y + 5);
      doc.text('IFSC CODE', M + 100, y + 12);
      doc.text('SWIFT CODE', M + 100, y + 18);

      doc.setFont(fontFamily, 'normal');
      doc.text(company.bankAccount || '-', M + 125, y + 5);
      doc.text(company.ifscCode || '-', M + 125, y + 12);
      doc.text('-', M + 125, y + 18);

      y += 28;
    }

    // ── SHIPPING INFO ──
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 248, 248);
    doc.rect(M, y, contentW, 12, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontFamily, 'bold');
    doc.text('TYPE OF TRANSPORT', M + 3, y + 5);
    doc.text('SHIPPING ADDRESS', M + 3, y + 10);

    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('DAP - Delivered At Place', M + 35, y + 5);
    const shipAddr = `${company?.city || ''}, ${company?.state || ''}${company?.pincode ? ', ZIP: ' + company.pincode : ''}`;
    doc.text(shipAddr, M + 35, y + 10);

    y += 18;

    // ─ ITEMS TABLE ──
    const tableHeaderH = 8;
    const rowH = 7;
    const templateCols = template?.tableColumns;

    // Table header background
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    doc.rect(M, y, contentW, tableHeaderH, 'F');

    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont(fontFamily, 'bold');

    if (templateCols && templateCols.length > 0) {
      // Dynamic columns from template
      let colX = M;
      templateCols.forEach((col, idx) => {
        const colWidth = (contentW * (parseFloat(col.width || '20') / 100));
        const isLast = idx === templateCols.length - 1;
        doc.text((col.label || col.key || '').toUpperCase(), isLast ? colX + colWidth - 2 : colX + 2, y + 5, isLast ? { align: 'right' } : undefined);
        if (!isLast) colX += colWidth;
      });
    } else {
      // Default columns
      const colNo = M;
      const colCode = M + 8;
      const colDesc = M + 28;
      const colQty = W - M - 45;
      const colAmt = W - M - 15;
      doc.text('No.', colNo + 2, y + 5);
      doc.text('ITEM CODE', colCode, y + 5);
      doc.text('DESCRIPTION', colDesc, y + 5);
      doc.text('QTY', colQty, y + 5);
      doc.text('AMOUNT(Rs)', colAmt, y + 5, { align: 'right' });
    }

    y += tableHeaderH;

    // Table border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(M, y - tableHeaderH, contentW, tableHeaderH);

    // Items rows
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    invoice.items.forEach((item, index) => {
      const rowBg = index % 2 === 0 ? [252, 252, 252] as [number, number, number] : [255, 255, 255] as [number, number, number];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.rect(M, y, contentW, rowH, 'F');

      if (templateCols && templateCols.length > 0) {
        // Dynamic column rendering
        let colX = M;
        const itemValues: Record<string, string> = {
          'sr.no': `${index + 1}`, 'srno': `${index + 1}`, 'sno': `${index + 1}`,
          'description': item.description || 'Item', 'desc': item.description || 'Item',
          'qty': item.quantity.toString(), 'quantity': item.quantity.toString(),
          'rate': item.price.toFixed(2), 'price': item.price.toFixed(2),
          'amount': item.total.toFixed(2), 'total': item.total.toFixed(2),
          'hsn': item.hsnCode || '-', 'hsncode': item.hsnCode || '-',
          'itemcode': '-', 'item': item.description || 'Item',
        };
        templateCols.forEach((col, idx) => {
          const colWidth = (contentW * (parseFloat(col.width || '20') / 100));
          const isLast = idx === templateCols.length - 1;
          const key = (col.key || col.label || '').toLowerCase().replace(/[^a-z]/g, '');
          const val = itemValues[key] || itemValues[key.split('.')[0]] || '-';
          doc.setTextColor(key === 'amount' || key === 'total' || key === 'rate' || key === 'price' ? 50 : 80, key === 'amount' || key === 'total' || key === 'rate' || key === 'price' ? 50 : 80, key === 'amount' || key === 'total' || key === 'rate' || key === 'price' ? 50 : 80);
          if (key === 'amount' || key === 'total') doc.setFont(fontFamily, 'bold');
          const textX = isLast ? colX + colWidth - 2 : colX + 2;
          const maxW = colWidth - 4;
          const textContent = doc.splitTextToSize(val, maxW);
          doc.text(textContent[0], textX, y + 5, isLast ? { align: 'right' } : undefined);
          doc.setFont(fontFamily, 'normal');
          if (!isLast) colX += colWidth;
        });
      } else {
        // Default column rendering
        const colNo = M;
        const colCode = M + 8;
        const colDesc = M + 28;
        const colQty = W - M - 45;
        const colAmt = W - M - 15;
        doc.setTextColor(80, 80, 80);
        doc.text(`${index + 1}`, colNo + 2, y + 5);
        doc.text('-', colCode, y + 5);
        const descText = doc.splitTextToSize(item.description || 'Item', 55);
        doc.setTextColor(50, 50, 50);
        doc.text(descText[0], colDesc, y + 5);
        doc.setTextColor(80, 80, 80);
        doc.text(item.quantity.toString(), colQty, y + 5);
        doc.setTextColor(50, 50, 50);
        doc.setFont(fontFamily, 'bold');
        doc.text(item.total.toFixed(2), colAmt, y + 5, { align: 'right' });
        doc.setFont(fontFamily, 'normal');
      }

      // Row separator
      doc.setDrawColor(230, 230, 230);
      doc.line(M, y + rowH, W - M, y + rowH);
      y += rowH;
    });

    // Table bottom border
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 8;

    // ── TOTALS ──
    const actualSubtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const actualTaxTotal = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const actualTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const discount = 0;

    const totalsX = W - M - 70;
    const totalsW = 70;

    // Net Total
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(fontFamily, 'normal');
    doc.text('NET TOTAL AMOUNT(Rs)', M, y);
    doc.text(actualSubtotal.toFixed(2), W - M, y, { align: 'right' });
    y += 6;

    // Discount
    if (discount > 0) {
      doc.text('DISCOUNT(Rs)', M, y);
      doc.text(`-${discount.toFixed(2)}`, W - M, y, { align: 'right' });
      y += 6;
    }

    // GST
    doc.text('GST(Rs)', M, y);
    if (invoice.cgstAmount && invoice.sgstAmount) {
      doc.text(`CGST: ${invoice.cgstAmount.toFixed(2)} + SGST: ${invoice.sgstAmount.toFixed(2)}`, W - M - 50, y);
    } else if (invoice.igstAmount) {
      doc.text(`IGST: ${invoice.igstAmount.toFixed(2)}`, W - M - 50, y);
    } else {
      doc.text(actualTaxTotal.toFixed(2), W - M - 50, y);
    }
    doc.text(actualTaxTotal.toFixed(2), W - M, y, { align: 'right' });
    y += 6;

    // Shipping
    doc.text('SHIPPING COST(Rs)', M, y);
    doc.text('0.00', W - M, y, { align: 'right' });
    y += 6;

    // Separator
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(0.5);
    doc.line(totalsX, y - 2, W - M, y - 2);

    // Final Amount
    doc.setFontSize(11);
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setFont(fontFamily, 'bold');
    doc.text('FINAL AMOUNT(Rs)', M, y + 2);
    doc.text(actualTotal.toFixed(2), W - M, y + 2, { align: 'right' });
    y += 12;

    // Amount in words
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont(fontFamily, 'normal');
    const words = numberToWords(actualTotal);
    doc.text(`Amount in words: ${words} Only`, M, y);
    y += 10;

    // ── TERMS & CONDITIONS ──
    if (showTerms && template?.terms) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 5;

      doc.setFontSize(8);
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.setFont(fontFamily, 'bold');
      doc.text('TERMS & CONDITIONS', M, y);
      y += 5;

      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.setFont(fontFamily, 'normal');
      const termsText = template?.terms || 'Payment due within 30 days.';
      const termsNumbering = template?.termsNumbering || 'numbered';
      
      // Split terms by newlines or numbers
      const termsArray = termsText.split(/\n|\d+\)[\s]*/).filter(t => t.trim());
      
      if (termsNumbering === 'numbered') {
        // Numbered format: 1), 2), 3)...
        termsArray.forEach((term, idx) => {
          const line = `${idx + 1}) ${term.trim()}`;
          const lines = doc.splitTextToSize(line, contentW - 5);
          lines.forEach((l: string) => {
            if (y < H - 40) { doc.text(l, M, y); y += 3.5; }
          });
        });
      } else if (termsNumbering === 'bullets') {
        // Bullet format
        termsArray.forEach((term) => {
          const line = `• ${term.trim()}`;
          const lines = doc.splitTextToSize(line, contentW - 5);
          lines.forEach((l: string) => {
            if (y < H - 40) { doc.text(l, M, y); y += 3.5; }
          });
        });
      } else {
        // Plain format
        const termsLines = doc.splitTextToSize(termsText, contentW - 5);
        termsLines.forEach((line: string) => {
          if (y < H - 40) { doc.text(line, M, y); y += 3.5; }
        });
      }
      y += 4;
    }

    // ── SIGNATURES ──
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    const sigStyle = template?.signatureStyle || 'simple';
    const sigY = H - 35;

    if (sigStyle === 'detailed') {
      // Detailed signature: signature lines + company name, designation, place & date
      doc.line(M, sigY, M + 60, sigY);
      doc.line(W - M - 60, sigY, W - M, sigY);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Buyer\'s Signature', M + 15, sigY + 4);
      doc.text('Seller\'s Signature', W - M - 50, sigY + 4);
      // Company name under seller signature
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      if (company?.name) {
        doc.text(`For ${company.name}`, W - M - 60, sigY + 9);
      }
      doc.text('Place & Date', W - M - 60, sigY + 13);
      doc.text('Place & Date', M, sigY + 9);
    } else {
      // Simple signature style: Just signature lines
      doc.line(M, sigY, M + 50, sigY);
      doc.line(W - M - 50, sigY, W - M, sigY);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Buyer', M + 20, sigY + 4);
      doc.text('Seller', W - M - 30, sigY + 4);
    }

    // ── FOOTER ───
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(0.8);
    doc.line(0, H - 10, W, H - 10);

    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(footerText, M, H - 5);
    if (company?.name) {
      doc.text(`Powered by ${company.name}`, W - M, H - 5, { align: 'right' });
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  // Mark invoice as paid (supports partial payment)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const handleMarkPaid = async (invoice: Invoice, amount?: number) => {
    try {
      const paidAmt = amount ?? invoice.totalAmount;
      const isFullyPaid = paidAmt >= invoice.totalAmount;
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, status: isFullyPaid ? 'paid' : 'sent', paidAmount: paidAmt }),
      });
      if (res.ok) {
        toast.success(isFullyPaid ? `Invoice ${invoice.invoiceNumber} marked as paid!` : `Payment of Rs.${paidAmt.toLocaleString('en-IN')} recorded!`);
        setPayInvoice(null);
        setPayAmount('');
        fetchData();
      } else {
        toast.error('Failed to update invoice');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // Send invoice via email
  const handleSendEmail = (invoice: Invoice) => {
    const subject = `Invoice ${invoice.invoiceNumber} from ${company?.name || 'AINOS'}`;
    const body = `Hi ${invoice.customerName},\n\nPlease find invoice ${invoice.invoiceNumber} for Rs. ${invoice.totalAmount.toLocaleString('en-IN')}.\n\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}\n\nThank you!`;
    window.open(`mailto:${invoice.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Send WhatsApp reminder
  const handleWhatsApp = (invoice: Invoice) => {
    const phone = invoice.customerPhone || '';
    const msg = `Hi ${invoice.customerName}, reminder: Invoice ${invoice.invoiceNumber} for Rs. ${invoice.totalAmount.toLocaleString('en-IN')} is ${invoice.status === 'overdue' ? 'overdue' : 'due'}. Please pay at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
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

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalProfit = invoices.reduce((s, i) => s + (i.profitAmount || 0), 0);

  // Row actions are shared by the desktop table and the mobile cards.
  const exportBulkPdf = async () => {
    const ids = filteredInvoices.map(i => i.id).filter(Boolean);
    if (!ids.length) return;
    const res = await fetch('/api/invoices/bulk-pdf', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `ainos-invoices-${ids.length}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  };

  const runPaymentChase = async () => {
    setChasing(true);
    try {
      // Dry run first so nothing emails until the user confirms.
      const preview = await fetch('/api/finance/ai/payment-chase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dryRun: true }),
      });
      const pData = await preview.json();
      if (!preview.ok) throw new Error(pData.error || 'Failed to scan overdue invoices');
      if (!pData.overdueCount) { toast.info('No overdue invoices to chase right now.'); return; }
      const names = (pData.candidates as { invoiceNumber: string }[]).slice(0, 5).map(c => c.invoiceNumber).join(', ');
      const ok = window.confirm(`Send payment reminders for ${pData.overdueCount} overdue invoice(s) totalling ₹${Number(pData.totalOutstanding).toLocaleString('en-IN')}?\n\n${names}${pData.overdueCount > 5 ? '…' : ''}`);
      if (!ok) return;
      const res = await fetch('/api/finance/ai/payment-chase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment chase failed');
      toast.success(`Chased ${data.sent?.length ?? 0} invoice(s)${data.failed?.length ? `, ${data.failed.length} failed` : ''}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment chase failed');
    } finally { setChasing(false); }
  };

  const renderActions = (invoice: Invoice) => (
    <div className="flex items-center gap-1">
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <button onClick={() => { setPayInvoice(invoice); setPayAmount(String(invoice.totalAmount - (invoice.paidAmount || 0))); }}
          className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
          title={invoice.paidAmount ? 'Record Payment' : 'Mark as Paid'}>
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        </button>
      )}
      <button onClick={() => handleSendEmail(invoice)}
        className="p-1.5 rounded-lg transition-colors hover:bg-blue-50"
        title="Send via Email">
        <Mail className="w-3.5 h-3.5 text-blue-600" />
      </button>
      {invoice.customerPhone && invoice.status !== 'paid' && (
        <button onClick={() => handleWhatsApp(invoice)}
          className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
          title="WhatsApp Reminder">
          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
        </button>
      )}
      <button onClick={() => downloadPDF(invoice)}
        className="p-1.5 rounded-lg transition-colors hover:bg-[hsl(var(--primary)/0.1)]"
        title="Download PDF">
        <Download className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
      </button>
    </div>
  );

  return (
    <>
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
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
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
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all border-2 hover:opacity-80"
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
            {company?.name && filteredInvoices.length > 0 && (
              <button
                onClick={exportBulkPdf}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all border-2 hover:opacity-80"
                style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))', background: 'transparent' }}
                title="Download all filtered invoices as one PDF"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Bulk PDF</span>
              </button>
            )}
            {company?.name && (
              <button
                onClick={runPaymentChase}
                disabled={chasing}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all border-2 hover:opacity-80 disabled:opacity-60"
                style={{ borderColor: 'hsl(280 60% 55%)', color: 'hsl(280 60% 55%)', background: 'hsl(280 60% 55% / 0.05)' }}
                title="Email reminders to all overdue customers"
              >
                {chasing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Bell className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span>Chase Payments</span>
              </button>
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(142 76% 36% / 0.1)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'hsl(142 76% 36%)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Collected</p>
                <p className="text-lg font-bold" style={{ color: 'hsl(142 76% 36%)' }}>₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                <Bell className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Pending</p>
                <p className="text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(280 60% 55% / 0.1)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'hsl(280 60% 55%)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Profit</p>
                <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>₹{totalProfit.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>
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
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
              style={{ 
                background: 'hsl(var(--card-bg))',
                border: '1px solid hsl(var(--border) / 0.5)',
                color: 'hsl(var(--foreground))'
              }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium focus:outline-none"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Invoices List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-t-[hsl(var(--primary))] rounded-full animate-spin mx-auto" 
                style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Invoice</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Customer</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>GST</th>
                    <th className="text-right py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Profit</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Date</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => {
                    const gstAmt = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);
                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-t transition-colors hover:bg-[hsl(var(--muted))]"
                        style={{ borderColor: 'hsl(var(--border))' }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                            </div>
                            <div>
                              <span className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                                {invoice.invoiceNumber}
                              </span>
                              {invoice.supplyType && (
                                <span className="block text-[10px] px-1.5 py-0.5 rounded mt-0.5 w-fit"
                                  style={{ background: invoice.supplyType === 'inter' ? 'hsl(280 60% 55% / 0.1)' : 'hsl(var(--primary) / 0.1)', color: invoice.supplyType === 'inter' ? 'hsl(280 60% 70%)' : 'hsl(var(--primary))' }}>
                                  {invoice.supplyType === 'inter' ? 'IGST' : 'CGST+SGST'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{invoice.customerName || 'N/A'}</div>
                          {(invoice.customerGstNumber || invoice.customerGst) && (
                            <div className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              GST: {invoice.customerGstNumber || invoice.customerGst}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            ₹{invoice.totalAmount?.toLocaleString('en-IN') || '0'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {gstAmt > 0 ? `₹${gstAmt.toLocaleString('en-IN')}` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-xs font-medium ${
                            (invoice.profitAmount || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {invoice.profitAmount !== undefined && invoice.profitAmount !== null
                              ? `₹${invoice.profitAmount.toLocaleString('en-IN')}` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">{renderActions(invoice)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Eight columns never fit below lg, so phones and tablets get cards */}
            <div className="space-y-3 p-3 lg:hidden">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="rounded-2xl border p-4"
                  style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words" style={{ color: 'hsl(var(--foreground))' }}>
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs break-words mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {invoice.customerName || 'N/A'}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium capitalize border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        ₹{invoice.totalAmount?.toLocaleString('en-IN') || '0'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {renderActions(invoice)}
                  </div>
                </div>
              ))}
            </div>
            </>
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

    {/* Partial Payment Dialog */}
    <AnimatePresence>
      {payInvoice && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ background: 'hsl(var(--card))' }}>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'hsl(var(--foreground))' }}>Record Payment</h3>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice {payInvoice.invoiceNumber} — {payInvoice.customerName}</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Total Amount</span>
                <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>₹{payInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              {(payInvoice.paidAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Already Paid</span>
                  <span className="font-semibold text-green-600">₹{(payInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2" style={{ borderColor: 'hsl(var(--border))' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Balance Due</span>
                <span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{(payInvoice.totalAmount - (payInvoice.paidAmount || 0)).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment Amount</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }} placeholder="Enter amount" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleMarkPaid(payInvoice, Number(payAmount) || 0)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>
                  Record Payment
                </button>
                <button onClick={() => handleMarkPaid(payInvoice, payInvoice.totalAmount)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-green-200 text-green-700 hover:bg-green-50">
                  Full Pay
                </button>
              </div>
              <button onClick={() => { setPayInvoice(null); setPayAmount(''); }}
                className="w-full py-2 text-sm hover:opacity-80" style={{ color: 'hsl(var(--muted-foreground))' }}>Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
