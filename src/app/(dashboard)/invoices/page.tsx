'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, Filter, Download, ArrowUpRight, Eye, Building2, CheckCircle2, AlertCircle, TrendingUp, Bell, Mail, MessageCircle, CheckCircle, Upload, Zap, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

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

interface ExtractedTemplate {
  companyName?: string;
  tagline?: string;
  headerText?: string;
  addressBlock?: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  website?: string;
  gstNumber?: string;
  panNumber?: string;
  colorScheme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  extractedColors?: string[];
  isMonochrome?: boolean;
  fontFamily?: string;
  rawFontName?: string;
  allFonts?: string[];
  fontSize?: string | Record<string, number>;
  fontWeight?: string;
  layout?: string;
  headerLayout?: string;
  hasAccentBar?: boolean;
  hasBorder?: boolean;
  tableColumns?: Array<{ name: string; key: string; width: number }>;
  formFields?: Array<{
    label: string;
    key: string;
    type: 'text' | 'date' | 'select' | 'number';
    required?: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  termsText?: string;
  signatureText?: string;
  bankDetails?: Record<string, string>;
  sections?: Record<string, boolean>;
}

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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Invoice extraction state
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTemplate | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [templateLogo, setTemplateLogo] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvoiceExtract = async () => {
    if (!invoiceFile) return;
    setExtracting(true);
    try {
      // Send PDF to Python template extractor service via proxy
      const formData = new FormData();
      formData.append('file', invoiceFile);

      const res = await fetch('/api/template-extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.template) {
        setExtractedData(data.template);
        showToast('Template design extracted successfully');
      } else {
        showToast(data.error || 'Failed to extract template', 'error');
      }
      setExtracting(false);
    } catch (error) {
      console.error('Extraction error:', error);
      showToast('Failed to extract template', 'error');
      setExtracting(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!extractedData) return;
    try {
      // Auto-create company if user doesn't have one
      let currentCompany = company;
      if (!currentCompany?.id) {
        showToast('Setting up company profile...');
        const createRes = await fetch('/api/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: extractedData.companyName || 'My Company',
            taxId: extractedData.gstNumber || extractedData.panNumber || '',
            email: extractedData.email || '',
            phone: extractedData.phone || '',
            address: extractedData.addressBlock || '',
            website: extractedData.website || '',
          }),
        });
        if (createRes.ok) {
          currentCompany = await createRes.json();
          setCompany(currentCompany);
          showToast('Company profile created!');
        } else {
          const errData = await createRes.json().catch(() => ({}));
          showToast(errData.error || 'Failed to create company profile', 'error');
          return;
        }
      }

      // If a logo was uploaded, attach it to the company profile
      if (templateLogo) {
        await fetch('/api/company', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: templateLogo }),
        });
      }

      // Map extracted font family to API-accepted values
      const rawFont = extractedData.fontFamily || '';
      let fontFamily = 'Helvetica';
      if (rawFont.toLowerCase().includes('times')) fontFamily = 'Times';
      else if (rawFont.toLowerCase().includes('courier')) fontFamily = 'Courier';
      else if (rawFont.toLowerCase().includes('georgia')) fontFamily = 'Georgia';
      else if (rawFont.toLowerCase().includes('verdana')) fontFamily = 'Verdana';
      else if (rawFont.toLowerCase().includes('arial')) fontFamily = 'Arial';
      else if (rawFont.toLowerCase().includes('dejavu')) fontFamily = 'Helvetica';

      // Map font size from extracted object to API enum
      const extractedFontSize = extractedData.fontSize;
      let fontSize = 'medium';
      if (typeof extractedFontSize === 'object' && extractedFontSize !== null) {
        const fsObj = extractedFontSize as Record<string, number>;
        const bodySize = fsObj.body || 11;
        if (bodySize <= 8) fontSize = 'small';
        else if (bodySize >= 14) fontSize = 'large';
      } else if (typeof extractedFontSize === 'string') {
        fontSize = extractedFontSize;
      }

      // Map layout
      const rawLayout = extractedData.layout || 'standard';
      const layoutMap: Record<string, string> = {
        'modern': 'standard', 'classic': 'standard', 'framed': 'bordered-table',
        'professional': 'standard',
      };
      const layout = layoutMap[rawLayout] || 'standard';

      // Map header layout
      const headerLayoutMap: Record<string, string> = {
        'left': 'side-by-side', 'centered': 'stacked', 'right': 'side-by-side',
      };
      const headerLayout = headerLayoutMap[extractedData.headerLayout || ''] || 'stacked';

      // Extract sections flags
      const sections = extractedData.sections || {};
      const hasBankDetails = sections.hasBankDetails ?? sections.hasGST ?? false;
      const hasTerms = sections.hasTerms ?? !!extractedData.termsText;
      const hasSignature = sections.hasSignature ?? !!extractedData.signatureText;

      const res = await fetch('/api/invoice-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extractedData.companyName || 'Uploaded Template',
          primaryColor: extractedData.primaryColor || '#1f2937',
          secondaryColor: extractedData.secondaryColor || '#6b7280',
          backgroundColor: extractedData.backgroundColor || '#ffffff',
          textColor: '#1f2937',
          fontFamily,
          fontSize,
          layout,
          showLogo: !!templateLogo,
          logoSize: 'medium',
          logoPosition: 'left',
          showBankDetails: hasBankDetails,
          showTerms: hasTerms,
          showQrCode: sections.hasQRCode ?? false,
          terms: extractedData.termsText || '',
          notes: '',
          headerText: extractedData.tagline || extractedData.companyName || '',
          footerText: extractedData.signatureText || '',
          accentWidth: extractedData.hasAccentBar ? 'medium' : 'thin',
          borderRadius: 'medium',
          headerLayout,
          showDocInfoTable: sections.hasInvoiceNumber ?? true,
          termsNumbering: 'numbered',
          signatureStyle: hasSignature ? 'detailed' : 'simple',
          tableColumns: extractedData.tableColumns || undefined,
          formFields: extractedData.formFields || undefined,
          isDefault: true,
        }),
      });
      if (res.ok) {
        showToast('Template saved! New invoices will use this design.');
        setShowExtractModal(false);
        setExtractedData(null);
        setInvoiceFile(null);
        setTemplateLogo('');
        fetchData(); // Refresh company (logo) + template
      } else {
        showToast('Failed to save template', 'error');
      }
    } catch {
      showToast('Failed to save template', 'error');
    }
  };

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
        showToast('Failed to load invoices', 'error');
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
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Mark invoice as paid
  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (res.ok) {
        showToast(`Invoice ${invoice.invoiceNumber} marked as paid!`, 'success');
        fetchData();
      } else {
        showToast('Failed to update invoice', 'error');
      }
    } catch {
      showToast('Network error', 'error');
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
            <button
              onClick={() => setShowExtractModal(true)}
              className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm font-medium transition-all border-2 hover:opacity-80"
              style={{ 
                borderColor: 'hsl(280 60% 55%)',
                color: 'hsl(280 60% 55%)',
                background: 'hsl(280 60% 55% / 0.05)'
              }}
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-y-1" />
              <span>Upload Template</span>
            </button>
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
            <div className="overflow-x-auto">
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
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <button onClick={() => handleMarkPaid(invoice)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                                title="Mark as Paid">
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
                        </td>
                      </motion.tr>
                    );
                  })}
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

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl"
              style={{ background: toast.type === 'success' ? 'hsl(142 76% 36%)' : 'hsl(0 72% 51%)', color: 'white' }}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invoice Extraction Modal */}
        <AnimatePresence>
          {showExtractModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowExtractModal(false);
                setExtractedData(null);
                setInvoiceFile(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload Invoice Template</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Upload your company&apos;s invoice template — we&apos;ll replicate it for all your invoices</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowExtractModal(false);
                      setExtractedData(null);
                      setInvoiceFile(null);
                    }}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-6">
                  {!extractedData ? (
                    <div className="space-y-4">
                      {/* Upload Area */}
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center transition-all hover:border-purple-300 hover:bg-purple-50/30">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="invoice-file-upload"
                        />
                        <label htmlFor="invoice-file-upload" className="cursor-pointer">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.08)' }}>
                            <Upload className="w-8 h-8" style={{ color: '#4c1d95' }} />
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {invoiceFile ? invoiceFile.name : 'Click to upload your invoice template'}
                          </p>
                          <p className="text-xs text-gray-500">Upload your existing invoice design (PDF, PNG, JPG)</p>
                        </label>
                      </div>
                      
                      {/* Extract Button */}
                      <button
                        onClick={handleInvoiceExtract}
                        disabled={!invoiceFile || extracting}
                        className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
                          boxShadow: '0 10px 30px -10px rgba(76,29,149,0.4)'
                        }}
                      >
                        {extracting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Extract Template Design</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Template Preview */}
                      <div className="rounded-2xl border border-gray-200 overflow-hidden">
                        {/* Mini Invoice Preview */}
                        <div className="p-5 space-y-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-base font-bold" style={{ color: extractedData.primaryColor || '#1f2937' }}>
                                {extractedData.companyName || 'Company Name'}
                              </p>
                              {extractedData.tagline && (
                                <p className="text-xs" style={{ color: extractedData.primaryColor || '#6b7280' }}>{extractedData.tagline}</p>
                              )}
                            </div>
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center gap-1">
                              {templateLogo ? (
                                <img src={templateLogo} alt="Logo" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                              ) : (
                                <label htmlFor="template-logo-upload" className="cursor-pointer">
                                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-purple-400 hover:bg-purple-50/30 transition-all">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-[9px] text-gray-400 mt-0.5">Logo</span>
                                  </div>
                                </label>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  const reader = new FileReader();
                                  reader.onload = () => setTemplateLogo(reader.result as string);
                                  reader.readAsDataURL(f);
                                }}
                                className="hidden"
                                id="template-logo-upload"
                              />
                              {templateLogo && (
                                <button
                                  onClick={() => setTemplateLogo('')}
                                  className="text-[10px] text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {extractedData.addressBlock && (
                            <p className="text-[10px] text-gray-500 leading-relaxed">{extractedData.addressBlock}</p>
                          )}
                          
                          {/* Color + Font indicators */}
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: extractedData.primaryColor || '#1f2937' }} />
                              <span className="text-[10px] text-gray-500">{extractedData.colorScheme || 'Default'}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">|</span>
                            <span className="text-[10px] text-gray-500">{extractedData.fontFamily || 'helvetica'}</span>
                            <span className="text-[10px] text-gray-400">|</span>
                            <span className="text-[10px] text-gray-500">{extractedData.layout || 'bordered-table'}</span>
                          </div>
                        </div>
                        
                        {/* Design Details */}
                        <div className="p-5 space-y-4 bg-gray-50/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Company Name</p>
                              <p className="text-sm font-semibold text-gray-900">{extractedData.companyName || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Tagline</p>
                              <p className="text-sm font-semibold text-gray-900">{extractedData.tagline || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Color Scheme</p>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md border border-gray-200" style={{ background: extractedData.primaryColor || '#1f2937' }} />
                                <p className="text-sm font-semibold text-gray-900">{extractedData.colorScheme || '—'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Font</p>
                              <p className="text-sm font-semibold text-gray-900">{extractedData.fontFamily || '—'}</p>
                            </div>
                          </div>
                          
                          {Array.isArray(extractedData.tableColumns) && extractedData.tableColumns.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Table Columns</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extractedData.tableColumns.map((col, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700">
                                    {typeof col === 'string' ? col : col.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {Array.isArray(extractedData.formFields) && extractedData.formFields.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Custom Fields</p>
                              <div className="flex flex-wrap gap-1.5">
                                {extractedData.formFields.map((field, idx: number) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                                    {field.label} ({field.type})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {extractedData.termsText && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Terms & Conditions</p>
                              <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{extractedData.termsText}</p>
                            </div>
                          )}
                          
                          {extractedData.signatureText && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Signature Block</p>
                              <p className="text-xs text-gray-600 whitespace-pre-line">{extractedData.signatureText}</p>
                            </div>
                          )}
                          
                          {/* Sections */}
                          {extractedData.sections && typeof extractedData.sections === 'object' && !Array.isArray(extractedData.sections) && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Sections Detected</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(extractedData.sections)
                                  .filter(([_, v]) => v === true)
                                  .map(([key]) => (
                                    <span key={key} className="px-2 py-1 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-medium text-purple-700">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveTemplate}
                          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
                            boxShadow: '0 10px 30px -10px rgba(76,29,149,0.4)'
                          }}
                        >
                          <Check className="w-4 h-4" />
                          <span>Save as Template</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowExtractModal(false);
                            setExtractedData(null);
                            setInvoiceFile(null);
                            setTemplateLogo('');
                          }}
                          className="px-6 py-3 rounded-xl text-sm font-semibold transition-all border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
