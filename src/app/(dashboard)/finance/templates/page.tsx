'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Type, Layout, FileText, Save, Check, Trash2, Copy, Eye, ChevronDown, ChevronUp, Star, Plus,
  Utensils, Code, Store, Factory, PenTool, Truck, ShoppingBag, Building2, Pill, GraduationCap, Navigation } from 'lucide-react';

interface TableColumn {
  label: string;
  key: string;
  width: string;
}

interface FormField {
  label: string;
  key: string;
  type: 'text' | 'date' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Template {
  id?: string;
  name: string;
  isDefault: boolean;
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
  showQrCode: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  terms: string;
  notes: string;
  headerText: string;
  footerText: string;
  accentWidth: string;
  borderRadius: string;
  tableColumns: TableColumn[];
  formFields: FormField[];
  headerLayout: string;
  showDocInfoTable: boolean;
  paymentTermsLayout: string;
  termsNumbering: string;
  showValidityDate: boolean;
  signatureStyle: string;
}

const defaultTemplate: Template = {
  name: 'My Template',
  isDefault: true,
  primaryColor: '#6D28D9',
  secondaryColor: '#8B5CF6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontFamily: 'Helvetica',
  fontSize: 'medium',
  layout: 'standard',
  showLogo: true,
  logoSize: 'medium',
  logoPosition: 'left',
  showQrCode: false,
  showBankDetails: true,
  showTerms: true,
  terms: 'Payment due within 30 days. Late payments may attract interest charges.',
  notes: 'Thank you for your business!',
  headerText: '',
  footerText: 'Powered by AINOS',
  accentWidth: 'thin',
  borderRadius: 'medium',
  tableColumns: [
    { label: 'Item', key: 'name', width: '40%' },
    { label: 'HSN', key: 'hsn', width: '12%' },
    { label: 'Qty', key: 'qty', width: '10%' },
    { label: 'Rate', key: 'rate', width: '14%' },
    { label: 'GST', key: 'gst', width: '10%' },
    { label: 'Total', key: 'total', width: '14%' },
  ],
  formFields: [],
  headerLayout: 'stacked',
  showDocInfoTable: false,
  paymentTermsLayout: 'text',
  termsNumbering: 'numbered',
  showValidityDate: false,
  signatureStyle: 'simple',
};

const PRESETS: Record<string, Partial<Template>> = {
  Standard: {
    primaryColor: '#6D28D9', secondaryColor: '#8B5CF6', backgroundColor: '#FFFFFF',
    textColor: '#1F2937', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Modern: {
    primaryColor: '#2563EB', secondaryColor: '#3B82F6', backgroundColor: '#F8FAFC',
    textColor: '#0F172A', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Compact: {
    primaryColor: '#059669', secondaryColor: '#10B981', backgroundColor: '#FFFFFF',
    textColor: '#374151', layout: 'compact', fontSize: 'small', borderRadius: 'small',
  },
  Minimal: {
    primaryColor: '#1F2937', secondaryColor: '#6B7280', backgroundColor: '#FFFFFF',
    textColor: '#111827', layout: 'minimal', fontSize: 'small', borderRadius: 'small',
  },
  Bold: {
    primaryColor: '#DC2626', secondaryColor: '#F87171', backgroundColor: '#FFFFFF',
    textColor: '#1F2937', layout: 'standard', fontSize: 'large', borderRadius: 'medium',
  },
  Elegant: {
    primaryColor: '#7C3AED', secondaryColor: '#A78BFA', backgroundColor: '#FAFAF9',
    textColor: '#292524', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Corporate: {
    primaryColor: '#1E3A5F', secondaryColor: '#2D5A8E', backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E', layout: 'standard', fontSize: 'medium', borderRadius: 'small',
  },
  Ocean: {
    primaryColor: '#0EA5E9', secondaryColor: '#38BDF8', backgroundColor: '#F0F9FF',
    textColor: '#0C4A6E', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Sunset: {
    primaryColor: '#EA580C', secondaryColor: '#FB923C', backgroundColor: '#FFF7ED',
    textColor: '#431407', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Forest: {
    primaryColor: '#15803D', secondaryColor: '#4ADE80', backgroundColor: '#F0FDF4',
    textColor: '#14532D', layout: 'modern', fontSize: 'medium', borderRadius: 'medium',
  },
  Rose: {
    primaryColor: '#E11D48', secondaryColor: '#FB7185', backgroundColor: '#FFF1F2',
    textColor: '#4C0519', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Royal: {
    primaryColor: '#4F46E5', secondaryColor: '#818CF8', backgroundColor: '#EEF2FF',
    textColor: '#1E1B4B', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Teal: {
    primaryColor: '#0D9488', secondaryColor: '#2DD4BF', backgroundColor: '#F0FDFA',
    textColor: '#134E4A', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Amber: {
    primaryColor: '#D97706', secondaryColor: '#FBBF24', backgroundColor: '#FFFBEB',
    textColor: '#451A03', layout: 'standard', fontSize: 'medium', borderRadius: 'medium',
  },
  Slate: {
    primaryColor: '#475569', secondaryColor: '#94A3B8', backgroundColor: '#F8FAFC',
    textColor: '#0F172A', layout: 'minimal', fontSize: 'small', borderRadius: 'small',
  },
  Midnight: {
    primaryColor: '#0F172A', secondaryColor: '#334155', backgroundColor: '#FFFFFF',
    textColor: '#1E293B', layout: 'minimal', fontSize: 'medium', borderRadius: 'none',
  },
  Candy: {
    primaryColor: '#DB2777', secondaryColor: '#F472B6', backgroundColor: '#FDF2F8',
    textColor: '#500724', layout: 'modern', fontSize: 'medium', borderRadius: 'large',
  },
  Sky: {
    primaryColor: '#0284C7', secondaryColor: '#7DD3FC', backgroundColor: '#F0F9FF',
    textColor: '#082F49', layout: 'standard', fontSize: 'medium', borderRadius: 'large',
  },
};

// ── Business-type presets (full structure: columns + formFields + terms + layout) ──
const BUSINESS_ICONS: Record<string, React.ReactNode> = {
  restaurant: <Utensils className="w-5 h-5" />,
  it: <Code className="w-5 h-5" />,
  retail: <Store className="w-5 h-5" />,
  manufacturing: <Factory className="w-5 h-5" />,
  freelancer: <PenTool className="w-5 h-5" />,
  wholesale: <Truck className="w-5 h-5" />,
  ecommerce: <ShoppingBag className="w-5 h-5" />,
  construction: <Building2 className="w-5 h-5" />,
  medical: <Pill className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  transport: <Navigation className="w-5 h-5" />,
};

interface BusinessPreset {
  key: string;
  label: string;
  description: string;
  config: Partial<Template>;
}

const BUSINESS_PRESETS: BusinessPreset[] = [
  {
    key: 'restaurant', label: 'Restaurant / Cafe',
    description: 'Item, Qty, Rate columns; Order No, Table No fields; MRP-based',
    config: {
      name: 'Restaurant Invoice', primaryColor: '#EA580C', secondaryColor: '#FB923C',
      backgroundColor: '#FFF7ED', textColor: '#431407', layout: 'compact', fontSize: 'medium',
      borderRadius: 'large', showLogo: true, showQrCode: true, showBankDetails: false,
      terms: 'All prices are inclusive of applicable taxes. FSSAI Licence: [ADD YOURS].',
      footerText: 'Thank you for dining with us!', signatureStyle: 'simple',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'plain',
      tableColumns: [
        { label: 'Item', key: 'name', width: '40%' },
        { label: 'Qty', key: 'qty', width: '12%' },
        { label: 'Unit', key: 'unit', width: '12%' },
        { label: 'Rate', key: 'rate', width: '18%' },
        { label: 'Amount', key: 'total', width: '18%' },
      ],
      formFields: [
        { label: 'Order No', key: 'orderNo', type: 'text', required: true, placeholder: 'e.g. ORD-045' },
        { label: 'Table No', key: 'tableNo', type: 'text', required: false, placeholder: 'e.g. T-12' },
        { label: 'Service Type', key: 'serviceType', type: 'select', required: false, options: ['Dine-In', 'Takeaway', 'Delivery', 'Catering'] },
      ],
    },
  },
  {
    key: 'it', label: 'IT Services / Agency',
    description: 'Description, Period/Hours, Rate; Project Name, PO Number; SLA terms',
    config: {
      name: 'IT Services Invoice', primaryColor: '#2563EB', secondaryColor: '#3B82F6',
      backgroundColor: '#F8FAFC', textColor: '#0F172A', layout: 'modern', fontSize: 'medium',
      borderRadius: 'large', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. Payment due within 30 days of invoice date.\n2. Scope changes may require a revised estimate.\n3. Support SLA: P1 — 4 hrs, P2 — 8 hrs, P3 — 24 hrs.',
      footerText: '', signatureStyle: 'detailed', paymentTermsLayout: 'text',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'numbered',
      tableColumns: [
        { label: 'Description', key: 'name', width: '42%' },
        { label: 'Period / Hrs', key: 'qty', width: '16%' },
        { label: 'Rate', key: 'rate', width: '18%' },
        { label: 'Amount', key: 'total', width: '24%' },
      ],
      formFields: [
        { label: 'Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'e.g. Mobile App v2' },
        { label: 'PO Number', key: 'poNumber', type: 'text', required: false, placeholder: 'Client PO ref' },
        { label: 'Service Period Start', key: 'serviceStart', type: 'date', required: false },
        { label: 'Service Period End', key: 'serviceEnd', type: 'date', required: false },
      ],
    },
  },
  {
    key: 'retail', label: 'Retail / Shop',
    description: 'Product, SKU, Qty, Rate, Disc, GST; Counter No, Loyalty Card',
    config: {
      name: 'Retail Invoice', primaryColor: '#059669', secondaryColor: '#10B981',
      backgroundColor: '#FFFFFF', textColor: '#374151', layout: 'compact', fontSize: 'small',
      borderRadius: 'small', showLogo: true, showQrCode: true, showBankDetails: true,
      terms: 'Goods once sold will not be taken back. Exchange within 7 days with bill.',
      footerText: 'Powered by AINOS', signatureStyle: 'simple',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'bullets',
      tableColumns: [
        { label: 'Product', key: 'name', width: '30%' },
        { label: 'SKU', key: 'sku', width: '12%' },
        { label: 'Qty', key: 'qty', width: '8%' },
        { label: 'Rate', key: 'rate', width: '14%' },
        { label: 'Disc', key: 'disc', width: '8%' },
        { label: 'GST%', key: 'gst', width: '8%' },
        { label: 'Total', key: 'total', width: '20%' },
      ],
      formFields: [
        { label: 'Shop/Counter No', key: 'counterNo', type: 'text', required: false, placeholder: 'e.g. Counter 2' },
        { label: 'Loyalty Card No', key: 'loyaltyCard', type: 'text', required: false, placeholder: 'Membership #)' },
      ],
    },
  },
  {
    key: 'manufacturing', label: 'Manufacturing',
    description: 'Item, HSN(8), Qty, Unit, Rate, Taxable, GST; Job Order, Batch, Vehicle',
    config: {
      name: 'Manufacturing Invoice', primaryColor: '#1E3A5F', secondaryColor: '#2D5A8E',
      backgroundColor: '#FFFFFF', textColor: '#1A1A2E', layout: 'standard', fontSize: 'medium',
      borderRadius: 'small', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. E-Way Bill mandatory for consignments exceeding Rs 50,000.\n2. Delivery as per purchase order schedule.\n3. Quality inspection at buyer end within 7 days.',
      footerText: '', signatureStyle: 'detailed',
      showDocInfoTable: true, showValidityDate: true, termsNumbering: 'numbered', headerLayout: 'side-by-side',
      tableColumns: [
        { label: 'Item', key: 'name', width: '22%' },
        { label: 'HSN', key: 'hsn', width: '10%' },
        { label: 'Qty', key: 'qty', width: '8%' },
        { label: 'Unit', key: 'unit', width: '8%' },
        { label: 'Rate', key: 'rate', width: '12%' },
        { label: 'Taxable', key: 'taxable', width: '12%' },
        { label: 'GST', key: 'gst', width: '8%' },
        { label: 'Total', key: 'total', width: '12%' },
      ],
      formFields: [
        { label: 'Job Order No', key: 'jobOrder', type: 'text', required: true, placeholder: 'JO-YYYY-NNN' },
        { label: 'Batch No', key: 'batchNo', type: 'text', required: false },
        { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: false, placeholder: 'MH 01 AB 1234' },
        { label: 'LR No', key: 'lrNo', type: 'text', required: false, placeholder: 'Lorry Receipt' },
        { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit E-Way Bill' },
      ],
    },
  },
  {
    key: 'freelancer', label: 'Freelancer / Consultant',
    description: 'Description, Hours, Rate; Client Ref, Due Date; Minimal, no GST',
    config: {
      name: 'Freelancer Invoice', primaryColor: '#1F2937', secondaryColor: '#6B7280',
      backgroundColor: '#FFFFFF', textColor: '#111827', layout: 'minimal', fontSize: 'small',
      borderRadius: 'small', showLogo: false, showQrCode: false, showBankDetails: true,
      terms: 'Payment due within 14 days. Please include invoice number as reference.',
      footerText: '', signatureStyle: 'simple',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'plain',
      tableColumns: [
        { label: 'Description', key: 'name', width: '48%' },
        { label: 'Hours', key: 'qty', width: '14%' },
        { label: 'Rate', key: 'rate', width: '18%' },
        { label: 'Amount', key: 'total', width: '20%' },
      ],
      formFields: [
        { label: 'Client Reference', key: 'clientRef', type: 'text', required: false, placeholder: 'Their PO or project code' },
        { label: 'Due Date', key: 'dueDate', type: 'date', required: true },
        { label: 'Payment Method', key: 'payMethod', type: 'select', required: false, options: ['Bank Transfer', 'UPI', 'PayPal', 'Wise'] },
      ],
    },
  },
  {
    key: 'wholesale', label: 'Wholesale / Distribution',
    description: 'Product, HSN, Qty, Unit, Rate, Disc, GST, Total; Transport, Vehicle, EWB',
    config: {
      name: 'Wholesale Invoice', primaryColor: '#0D9488', secondaryColor: '#2DD4BF',
      backgroundColor: '#F0FDFA', textColor: '#134E4A', layout: 'standard', fontSize: 'medium',
      borderRadius: 'medium', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. E-Way Bill required for inter-state movement > Rs 50,000.\n2. Goods in transit at consignee risk.\n3. Payment: 30 days from invoice date.',
      footerText: '', signatureStyle: 'detailed',
      showDocInfoTable: true, showValidityDate: true, termsNumbering: 'numbered', headerLayout: 'side-by-side',
      tableColumns: [
        { label: 'Product', key: 'name', width: '22%' },
        { label: 'HSN', key: 'hsn', width: '10%' },
        { label: 'Qty', key: 'qty', width: '8%' },
        { label: 'Unit', key: 'unit', width: '8%' },
        { label: 'Rate', key: 'rate', width: '12%' },
        { label: 'Disc', key: 'disc', width: '8%' },
        { label: 'GST%', key: 'gst', width: '8%' },
        { label: 'Amount', key: 'total', width: '14%' },
      ],
      formFields: [
        { label: 'Transport Mode', key: 'transportMode', type: 'select', required: false, options: ['Road', 'Rail', 'Air', 'Courier'] },
        { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: false, placeholder: 'MH 01 AB 1234' },
        { label: 'Lorry Receipt No', key: 'lrNo', type: 'text', required: false },
        { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit' },
        { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: false },
      ],
    },
  },
  {
    key: 'ecommerce', label: 'E-Commerce / D2C',
    description: 'Product, SKU, Platform, Qty, Price; Order ID, COD/Prepaid, Shipping',
    config: {
      name: 'E-Commerce Invoice', primaryColor: '#7C3AED', secondaryColor: '#A78BFA',
      backgroundColor: '#FAFAF9', textColor: '#292524', layout: 'modern', fontSize: 'medium',
      borderRadius: 'large', showLogo: true, showQrCode: true, showBankDetails: true,
      terms: '1. Returns accepted within 7 days of delivery in original packaging.\n2. Shipping charges as applicable at checkout.\n3. COD orders: please keep exact change ready.',
      footerText: '', signatureStyle: 'simple',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'numbered',
      tableColumns: [
        { label: 'Product', key: 'name', width: '28%' },
        { label: 'SKU', key: 'sku', width: '14%' },
        { label: 'Qty', key: 'qty', width: '10%' },
        { label: 'Price', key: 'rate', width: '18%' },
        { label: 'Amount', key: 'total', width: '18%' },
      ],
      formFields: [
        { label: 'Order ID', key: 'orderId', type: 'text', required: true, placeholder: 'e.g. ORD-2026-00456' },
        { label: 'Platform', key: 'platform', type: 'select', required: true, options: ['Amazon', 'Flipkart', 'Meesho', 'Own Website', 'Shopify', 'Instagram', 'WhatsApp'] },
        { label: 'Payment Mode', key: 'payMode', type: 'select', required: true, options: ['Prepaid (UPI/Card/NetBanking)', 'COD'] },
        { label: 'Shipping Charges', key: 'shipping', type: 'number', required: false, placeholder: '\u20B9' },
      ],
    },
  },
  {
    key: 'construction', label: 'Construction / Real Estate',
    description: 'Work Item, Unit, Qty, Rate; Site Name, MB Ref, TDS 194C, Location',
    config: {
      name: 'Construction Invoice', primaryColor: '#D97706', secondaryColor: '#FBBF24',
      backgroundColor: '#FFFBEB', textColor: '#451A03', layout: 'standard', fontSize: 'medium',
      borderRadius: 'medium', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. TDS u/s 194C will be deducted at applicable rate.\n2. Payments linked to measurement book certification.\n3. Work as per approved drawings and specifications.',
      footerText: '', signatureStyle: 'detailed',
      showDocInfoTable: true, showValidityDate: true, termsNumbering: 'numbered', headerLayout: 'side-by-side',
      tableColumns: [
        { label: 'Description of Work', key: 'name', width: '32%' },
        { label: 'Unit', key: 'unit', width: '10%' },
        { label: 'Qty', key: 'qty', width: '10%' },
        { label: 'Rate', key: 'rate', width: '16%' },
        { label: 'Amount', key: 'total', width: '16%' },
      ],
      formFields: [
        { label: 'Site / Project Name', key: 'projectName', type: 'text', required: true, placeholder: 'e.g. Sunrise Apartments Phase 2' },
        { label: 'MB Reference', key: 'mbRef', type: 'text', required: false, placeholder: 'Measurement Book Page/Ledger' },
        { label: 'Period', key: 'period', type: 'text', required: false, placeholder: 'e.g. Jan\u2013Mar 2026' },
        { label: 'TDS Section', key: 'tdsSection', type: 'select', required: false, options: ['194C', '194J', '194H', 'None'] },
        { label: 'Location', key: 'location', type: 'text', required: false },
      ],
    },
  },
  {
    key: 'medical', label: 'Medical / Pharmacy',
    description: 'Drug, Batch, Expiry, Strip, MRP, GST%; Prescription No, Schedule, License',
    config: {
      name: 'Pharmacy Invoice', primaryColor: '#0891B2', secondaryColor: '#22D3EE',
      backgroundColor: '#FFFFFF', textColor: '#164E63', layout: 'compact', fontSize: 'small',
      borderRadius: 'small', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. Store below 25\u00B0C, protect from light.\n2. SCHEDULE H/H1 drugs dispensed against valid prescription only.\n3. Goods once sold are not returnable (Drug Licence conditions).',
      footerText: 'Drug Licence No: [ADD YOURS] | Pharmacist: [NAME]',
      signatureStyle: 'detailed',
      showDocInfoTable: false, showValidityDate: false, termsNumbering: 'numbered',
      tableColumns: [
        { label: 'Drug / Item', key: 'name', width: '24%' },
        { label: 'Batch', key: 'batch', width: '10%' },
        { label: 'Expiry', key: 'expiry', width: '10%' },
        { label: 'Pack', key: 'unit', width: '10%' },
        { label: 'MRP', key: 'rate', width: '12%' },
        { label: 'GST%', key: 'gst', width: '8%' },
        { label: 'Amount', key: 'total', width: '14%' },
      ],
      formFields: [
        { label: 'Prescription No', key: 'prescNo', type: 'text', required: false },
        { label: 'Doctor Name', key: 'doctorName', type: 'text', required: false },
        { label: 'Schedule', key: 'schedule', type: 'select', required: false, options: ['H', 'H1', 'X', 'C', 'Non-Schedule'] },
        { label: 'Drug Licence No', key: 'licenceNo', type: 'text', required: true, placeholder: 'MH/DR/...' },
      ],
    },
  },
  {
    key: 'education', label: 'Education / Coaching',
    description: 'Fee Head, Session/Term, Amount; Student, Course, Admission, Installments',
    config: {
      name: 'Fee Receipt', primaryColor: '#4F46E5', secondaryColor: '#818CF8',
      backgroundColor: '#EEF2FF', textColor: '#1E1B4B', layout: 'standard', fontSize: 'medium',
      borderRadius: 'medium', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. Fees once paid are non-refundable except as per institution policy.\n2. Installment default attracts late fee of \u20B9500/month.\n3. Identity card must be produced at examination hall.',
      footerText: 'This is a computer-generated receipt.',
      signatureStyle: 'detailed',
      showDocInfoTable: false, showValidityDate: true, termsNumbering: 'bullets',
      tableColumns: [
        { label: 'Fee Head', key: 'name', width: '44%' },
        { label: 'Session / Term', key: 'qty', width: '22%' },
        { label: 'Amount', key: 'total', width: '22%' },
      ],
      formFields: [
        { label: 'Student Name', key: 'studentName', type: 'text', required: true },
        { label: 'Course / Batch', key: 'course', type: 'text', required: true, placeholder: 'e.g. JEE 2026 Batch-A' },
        { label: 'Admission No', key: 'admissionNo', type: 'text', required: true, placeholder: 'ADM-2026-XXX' },
        { label: 'Session', key: 'session', type: 'text', required: false, placeholder: 'e.g. 2025-26' },
        { label: 'Payment Mode', key: 'payMode', type: 'select', required: false, options: ['Cash', 'UPI', 'Cheque', 'NEFT/RTGS', 'Card'] },
      ],
    },
  },
  {
    key: 'transport', label: 'Transport / Logistics',
    description: 'Consignment, Origin-Dest, Weight, Freight; Trip No, Vehicle, EWB, LR/GR',
    config: {
      name: 'Freight Invoice', primaryColor: '#0F172A', secondaryColor: '#334155',
      backgroundColor: '#FFFFFF', textColor: '#1E293B', layout: 'minimal', fontSize: 'medium',
      borderRadius: 'none', showLogo: true, showQrCode: false, showBankDetails: true,
      terms: '1. E-Way Bill mandatory for inter-state goods movement (\u20B950,000+).\n2. Goods in transit at owner risk; insurance at additional charge.\n3. Freight payable before delivery unless credit terms agreed.',
      footerText: '', signatureStyle: 'detailed',
      showDocInfoTable: true, showValidityDate: false, termsNumbering: 'numbered', headerLayout: 'side-by-side',
      tableColumns: [
        { label: 'Consignment', key: 'name', width: '22%' },
        { label: 'Origin', key: 'origin', width: '12%' },
        { label: 'Destination', key: 'dest', width: '12%' },
        { label: 'Wt/Vol', key: 'qty', width: '12%' },
        { label: 'Freight', key: 'rate', width: '14%' },
        { label: 'Amount', key: 'total', width: '14%' },
      ],
      formFields: [
        { label: 'Trip / Consignment No', key: 'tripNo', type: 'text', required: true, placeholder: 'e.g. TRP-2026-0789' },
        { label: 'Vehicle No', key: 'vehicleNo', type: 'text', required: true, placeholder: 'MH 01 AB 1234' },
        { label: 'LR / GR No', key: 'lrNo', type: 'text', required: false, placeholder: 'Lorry Receipt / Goods Receipt' },
        { label: 'EWB No', key: 'ewbNo', type: 'text', required: false, placeholder: '12-digit' },
        { label: 'Delivery Date', key: 'deliveryDate', type: 'date', required: false },
        { label: 'Origin', key: 'originCity', type: 'text', required: false },
        { label: 'Destination', key: 'destCity', type: 'text', required: false },
      ],
    },
  },
];

// Individual color swatches for quick color picking
const COLOR_SWATCHES: { name: string; primary: string; secondary: string }[] = [
  { name: 'Purple', primary: '#6D28D9', secondary: '#8B5CF6' },
  { name: 'Blue', primary: '#2563EB', secondary: '#3B82F6' },
  { name: 'Indigo', primary: '#4F46E5', secondary: '#818CF8' },
  { name: 'Sky', primary: '#0284C7', secondary: '#7DD3FC' },
  { name: 'Cyan', primary: '#0891B2', secondary: '#22D3EE' },
  { name: 'Teal', primary: '#0D9488', secondary: '#2DD4BF' },
  { name: 'Green', primary: '#15803D', secondary: '#4ADE80' },
  { name: 'Emerald', primary: '#059669', secondary: '#10B981' },
  { name: 'Lime', primary: '#65A30D', secondary: '#A3E635' },
  { name: 'Yellow', primary: '#CA8A04', secondary: '#FDE047' },
  { name: 'Amber', primary: '#D97706', secondary: '#FBBF24' },
  { name: 'Orange', primary: '#EA580C', secondary: '#FB923C' },
  { name: 'Red', primary: '#DC2626', secondary: '#F87171' },
  { name: 'Rose', primary: '#E11D48', secondary: '#FB7185' },
  { name: 'Pink', primary: '#DB2777', secondary: '#F472B6' },
  { name: 'Fuchsia', primary: '#C026D3', secondary: '#E879F9' },
  { name: 'Navy', primary: '#1E3A5F', secondary: '#2D5A8E' },
  { name: 'Slate', primary: '#475569', secondary: '#94A3B8' },
  { name: 'Dark', primary: '#0F172A', secondary: '#334155' },
  { name: 'Charcoal', primary: '#1F2937', secondary: '#6B7280' },
];

const FONT_OPTIONS = ['Helvetica', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'];
const FONT_SIZES = { small: '12px', medium: '14px', large: '16px' };
const BORDER_RADII = { small: '4px', medium: '8px', large: '16px', none: '0px' };
const ACCENT_WIDTHS = { thin: '3px', medium: '5px', thick: '8px', none: '0px' };

export default function TemplateDesignerPage() {
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('branding');
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/invoice-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0) {
          const def = data.find((t: Template) => t.isDefault) || data[0];
          setTemplate(def);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const update = (key: keyof Template, value: string | boolean) => {
    setTemplate(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const applyPreset = (name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setTemplate(prev => ({ ...prev, ...preset, name: `${name} Template` }));
      setSaved(false);
    }
  };

  const applyBusinessPreset = (preset: BusinessPreset) => {
    setTemplate(prev => ({ ...prev, ...preset.config } as Template));
    setSaved(false);
  };

  const saveTemplate = async () => {
    try {
      const method = template.id ? 'PUT' : 'POST';
      const res = await fetch('/api/invoice-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const saved = await res.json();
        setTemplate(prev => ({ ...prev, id: saved.id }));
        setSaved(true);
        fetchTemplates();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/invoice-templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplate(defaultTemplate);
        fetchTemplates();
      }
    } catch { /* ignore */ }
  };

  const duplicateTemplate = () => {
    const { id, ...copy } = template;
    setTemplate({ ...copy, name: `${template.name} (Copy)`, isDefault: false } as Template);
    setSaved(false);
  };

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);

  // Table column management
  const addColumn = () => {
    const newCol: TableColumn = { label: 'New Column', key: `col_${Date.now()}`, width: '15%' };
    setTemplate(prev => ({ ...prev, tableColumns: [...(prev.tableColumns || []), newCol] }));
    setSaved(false);
  };

  const removeColumn = (idx: number) => {
    setTemplate(prev => ({ ...prev, tableColumns: (prev.tableColumns || []).filter((_, i) => i !== idx) }));
    setSaved(false);
  };

  const updateColumn = (idx: number, field: keyof TableColumn, value: string) => {
    setTemplate(prev => {
      const cols = [...(prev.tableColumns || [])];
      cols[idx] = { ...cols[idx], [field]: value };
      return { ...prev, tableColumns: cols };
    });
    setSaved(false);
  };

  const moveColumn = (idx: number, dir: -1 | 1) => {
    setTemplate(prev => {
      const cols = [...(prev.tableColumns || [])];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= cols.length) return prev;
      [cols[idx], cols[newIdx]] = [cols[newIdx], cols[idx]];
      return { ...prev, tableColumns: cols };
    });
    setSaved(false);
  };

  // Form field management
  const addFormField = () => {
    const newField: FormField = {
      label: 'New Field',
      key: `field_${Date.now()}`,
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
    };
    setTemplate(prev => ({ ...prev, formFields: [...(prev.formFields || []), newField] }));
    setSaved(false);
  };

  const removeFormField = (idx: number) => {
    setTemplate(prev => ({ ...prev, formFields: (prev.formFields || []).filter((_, i) => i !== idx) }));
    setSaved(false);
  };

  const updateFormField = (idx: number, field: keyof FormField, value: string | boolean | string[]) => {
    setTemplate(prev => {
      const fields = [...(prev.formFields || [])];
      fields[idx] = { ...fields[idx], [field]: value };
      return { ...prev, formFields: fields };
    });
    setSaved(false);
  };

  const moveFormField = (idx: number, dir: -1 | 1) => {
    setTemplate(prev => {
      const fields = [...(prev.formFields || [])];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= fields.length) return prev;
      [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
      return { ...prev, formFields: fields };
    });
    setSaved(false);
  };

  const fs = FONT_SIZES[template.fontSize as keyof typeof FONT_SIZES] || '14px';
  const br = BORDER_RADII[template.borderRadius as keyof typeof BORDER_RADII] || '8px';
  const aw = ACCENT_WIDTHS[template.accentWidth as keyof typeof ACCENT_WIDTHS] || '3px';

  const sampleItems = [
    { name: 'Web Development Service', hsn: '998314', qty: 1, rate: 50000, gst: 18 },
    { name: 'SEO Package', hsn: '998313', qty: 1, rate: 25000, gst: 18 },
  ];
  const subtotal = 75000;
  const tax = 13500;
  const total = 88500;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-gradient)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--page-gradient)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Invoice Template Designer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Customize colors, fonts, layout — make invoices match your brand
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={duplicateTemplate} className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
            <Copy size={15} /> Duplicate
          </button>
          <button onClick={saveTemplate} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Template</>}
          </button>
        </div>
      </div>

      {/* Business Type Presets */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Layout size={16} /> Start with your business type
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>Pre-fills columns, fields, terms &amp; layout. You can customise after selecting.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BUSINESS_PRESETS.map((bp) => (
            <button
              key={bp.key}
              onClick={() => applyBusinessPreset(bp)}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] hover:border-primary/40"
              style={{ borderColor: (bp.config.primaryColor || '#6D28D9') + '40', background: (bp.config.primaryColor || '#6D28D9') + '06' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: (bp.config.primaryColor || '#6D28D9') + '18', color: bp.config.primaryColor }}>
                {BUSINESS_ICONS[bp.key]}
              </div>
              <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>{bp.label}</span>
              <span className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{bp.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Templates (color/style only) */}
      <div className="glass-card rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Palette size={16} /> Quick Presets — Click to Apply
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: preset.primaryColor,
                background: `${preset.primaryColor}10`,
              }}
            >
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-full" style={{ background: preset.primaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ background: preset.secondaryColor }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-3">
          {/* Template Name */}
          <div className="glass-card rounded-xl p-4">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--muted-foreground)' }}>Template Name</label>
            <input
              value={template.name}
              onChange={e => update('name', e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
              style={{ color: 'var(--foreground)' }}
            />
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={template.isDefault} onChange={e => update('isDefault', e.target.checked)} className="rounded" />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                <Star size={14} className="inline mr-1" /> Set as default template
              </span>
            </label>
          </div>

          {/* Branding Colors */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Palette size={16} /> Branding Colors
              </span>
              {expandedSection === 'branding' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'branding' && (
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Primary Color', key: 'primaryColor' as const },
                  { label: 'Secondary Color', key: 'secondaryColor' as const },
                  { label: 'Background', key: 'backgroundColor' as const },
                  { label: 'Text Color', key: 'textColor' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template[key]}
                        onChange={e => update(key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      <input
                        value={template[key]}
                        onChange={e => update(key, e.target.value)}
                        className="glass-input flex-1 px-2 py-1 rounded text-xs font-mono"
                        style={{ color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('typography')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Type size={16} /> Typography & Size
              </span>
              {expandedSection === 'typography' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'typography' && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Font Family</label>
                  <select
                    value={template.fontFamily}
                    onChange={e => update('fontFamily', e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--foreground)', fontFamily: template.fontFamily }}
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Font Size</label>
                  <div className="flex gap-2">
                    {Object.entries(FONT_SIZES).map(([key, size]) => (
                      <button
                        key={key}
                        onClick={() => update('fontSize', key)}
                        className="flex-1 py-2 rounded-lg text-sm border transition-all"
                        style={{
                          borderColor: template.fontSize === key ? template.primaryColor : 'var(--border)',
                          background: template.fontSize === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.fontSize === key ? 600 : 400,
                        }}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)} ({size})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layout */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('layout')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Layout size={16} /> Layout & Style
              </span>
              {expandedSection === 'layout' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'layout' && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Layout Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['standard', 'modern', 'compact', 'minimal'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('layout', l)}
                        className="py-2 rounded-lg text-sm border transition-all capitalize"
                        style={{
                          borderColor: template.layout === l ? template.primaryColor : 'var(--border)',
                          background: template.layout === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.layout === l ? 600 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Border Radius</label>
                  <div className="flex gap-2">
                    {Object.entries(BORDER_RADII).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => update('borderRadius', key)}
                        className="flex-1 py-2 rounded-lg text-xs border capitalize"
                        style={{
                          borderColor: template.borderRadius === key ? template.primaryColor : 'var(--border)',
                          background: template.borderRadius === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Accent Bar Width</label>
                  <div className="flex gap-2">
                    {Object.entries(ACCENT_WIDTHS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => update('accentWidth', key)}
                        className="flex-1 py-2 rounded-lg text-xs border capitalize"
                        style={{
                          borderColor: template.accentWidth === key ? template.primaryColor : 'var(--border)',
                          background: template.accentWidth === key ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Logo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={template.showLogo} onChange={e => update('showLogo', e.target.checked)} />
                      <span className="text-sm" style={{ color: 'var(--foreground)' }}>Show Logo</span>
                    </label>
                    {template.showLogo && (
                      <>
                        <select value={template.logoSize} onChange={e => update('logoSize', e.target.value)} className="glass-input px-2 py-1 rounded text-xs">
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                        <select value={template.logoPosition} onChange={e => update('logoPosition', e.target.value)} className="glass-input px-2 py-1 rounded text-xs">
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="center">Center</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Columns */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('columns')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Layout size={16} /> Table Columns
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${template.primaryColor}15`, color: template.primaryColor }}>
                  {template.tableColumns?.length || 0} columns
                </span>
                {expandedSection === 'columns' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSection === 'columns' && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Customize invoice table columns — add, remove, rename, reorder
                </p>
                {(template.tableColumns || []).map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">▲</button>
                      <button onClick={() => moveColumn(idx, 1)} disabled={idx === (template.tableColumns?.length || 1) - 1} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">▼</button>
                    </div>
                    <input
                      value={col.label}
                      onChange={e => updateColumn(idx, 'label', e.target.value)}
                      className="flex-1 px-2 py-1 rounded text-xs border-0 bg-transparent"
                      style={{ color: 'var(--foreground)' }}
                      placeholder="Column label"
                    />
                    <input
                      value={col.key}
                      onChange={e => updateColumn(idx, 'key', e.target.value)}
                      className="w-20 px-2 py-1 rounded text-xs font-mono border-0 bg-transparent"
                      style={{ color: 'var(--muted-foreground)' }}
                      placeholder="key"
                    />
                    <input
                      value={col.width}
                      onChange={e => updateColumn(idx, 'width', e.target.value)}
                      className="w-14 px-2 py-1 rounded text-xs border-0 bg-transparent"
                      style={{ color: 'var(--muted-foreground)' }}
                      placeholder="width"
                    />
                    <button onClick={() => removeColumn(idx)} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addColumn}
                  className="w-full py-2 rounded-lg text-xs font-medium border-2 border-dashed transition-all hover:scale-[1.01]"
                  style={{ borderColor: template.primaryColor, color: template.primaryColor, background: `${template.primaryColor}05` }}
                >
                  <Plus size={13} className="inline mr-1" /> Add Column
                </button>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('customFields')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Custom Fields
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${template.primaryColor}15`, color: template.primaryColor }}>
                  {template.formFields?.length || 0} fields
                </span>
                {expandedSection === 'customFields' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expandedSection === 'customFields' && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Add custom input fields for invoice creation — PO Number, Validity Date, Payment Terms, etc.
                </p>
                {(template.formFields || []).map((field, idx) => (
                  <div key={idx} className="p-3 rounded-lg border space-y-2" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveFormField(idx, -1)} disabled={idx === 0} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">▲</button>
                        <button onClick={() => moveFormField(idx, 1)} disabled={idx === (template.formFields?.length || 1) - 1} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20">▼</button>
                      </div>
                      <input
                        value={field.label}
                        onChange={e => updateFormField(idx, 'label', e.target.value)}
                        className="flex-1 px-2 py-1 rounded text-xs border bg-transparent"
                        style={{ color: 'var(--foreground)' }}
                        placeholder="Field label"
                      />
                      <button onClick={() => removeFormField(idx)} className="p-1 rounded hover:bg-red-500/10">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-8">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Type</label>
                        <select
                          value={field.type}
                          onChange={e => updateFormField(idx, 'type', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs border bg-transparent"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Key</label>
                        <input
                          value={field.key}
                          onChange={e => updateFormField(idx, 'key', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs font-mono border bg-transparent"
                          style={{ color: 'var(--muted-foreground)' }}
                          placeholder="fieldKey"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Placeholder</label>
                        <input
                          value={field.placeholder || ''}
                          onChange={e => updateFormField(idx, 'placeholder', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs border bg-transparent"
                          style={{ color: 'var(--foreground)' }}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--foreground)' }}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => updateFormField(idx, 'required', e.target.checked)}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                      {field.type === 'select' && (
                        <div className="col-span-2">
                          <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Options (comma-separated)</label>
                          <input
                            value={(field.options || []).join(', ')}
                            onChange={e => updateFormField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            className="w-full px-2 py-1 rounded text-xs border bg-transparent"
                            style={{ color: 'var(--foreground)' }}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={addFormField}
                  className="w-full py-2 rounded-lg text-xs font-medium border-2 border-dashed transition-all hover:scale-[1.01]"
                  style={{ borderColor: template.primaryColor, color: template.primaryColor, background: `${template.primaryColor}05` }}
                >
                  <Plus size={13} className="inline mr-1" /> Add Custom Field
                </button>
              </div>
            )}
          </div>

          {/* Professional Layout */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('professional')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Professional Layout
              </span>
              {expandedSection === 'professional' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'professional' && (
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  MB Crusher-level professional invoice features
                </p>
                
                {/* Header Layout */}
                <div>
                  <label className="text-xs mb-2 block font-medium" style={{ color: 'var(--foreground)' }}>Header Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['stacked', 'side-by-side'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('headerLayout', l)}
                        className="py-2 rounded-lg text-xs border transition-all capitalize"
                        style={{
                          borderColor: template.headerLayout === l ? template.primaryColor : 'var(--border)',
                          background: template.headerLayout === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.headerLayout === l ? 600 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={template.showDocInfoTable} onChange={e => update('showDocInfoTable', e.target.checked)} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>Show Document Info Table (Page No, P.O. No, etc.)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={template.showValidityDate} onChange={e => update('showValidityDate', e.target.checked)} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>Show Validity Date</span>
                  </label>
                </div>

                {/* Payment Terms Layout */}
                <div>
                  <label className="text-xs mb-2 block font-medium" style={{ color: 'var(--foreground)' }}>Payment Terms Display</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['text', 'table'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('paymentTermsLayout', l)}
                        className="py-2 rounded-lg text-xs border transition-all capitalize"
                        style={{
                          borderColor: template.paymentTermsLayout === l ? template.primaryColor : 'var(--border)',
                          background: template.paymentTermsLayout === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.paymentTermsLayout === l ? 600 : 400,
                        }}
                      >
                        {l === 'text' ? 'Plain Text' : 'Table Format'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terms Numbering */}
                <div>
                  <label className="text-xs mb-2 block font-medium" style={{ color: 'var(--foreground)' }}>Terms Numbering</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['numbered', 'bullets', 'plain'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('termsNumbering', l)}
                        className="py-2 rounded-lg text-xs border transition-all capitalize"
                        style={{
                          borderColor: template.termsNumbering === l ? template.primaryColor : 'var(--border)',
                          background: template.termsNumbering === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.termsNumbering === l ? 600 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signature Style */}
                <div>
                  <label className="text-xs mb-2 block font-medium" style={{ color: 'var(--foreground)' }}>Signature Block Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['simple', 'detailed'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('signatureStyle', l)}
                        className="py-2 rounded-lg text-xs border transition-all capitalize"
                        style={{
                          borderColor: template.signatureStyle === l ? template.primaryColor : 'var(--border)',
                          background: template.signatureStyle === l ? `${template.primaryColor}15` : 'transparent',
                          color: 'var(--foreground)',
                          fontWeight: template.signatureStyle === l ? 600 : 400,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Toggles */}
          <div className="glass-card rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('content')} className="w-full flex items-center justify-between p-4">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Content Sections
              </span>
              {expandedSection === 'content' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSection === 'content' && (
              <div className="px-4 pb-4 space-y-3">
                {[
                  { label: 'Show Bank Details', key: 'showBankDetails' as const },
                  { label: 'Show Terms & Conditions', key: 'showTerms' as const },
                  { label: 'Show QR Code', key: 'showQrCode' as const },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={template[key]} onChange={e => update(key, e.target.checked)} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{label}</span>
                  </label>
                ))}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Header Text</label>
                  <input value={template.headerText || ''} onChange={e => update('headerText', e.target.value)} placeholder="Optional header text" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Notes</label>
                  <textarea value={template.notes} onChange={e => update('notes', e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
                </div>
                {template.showTerms && (
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Terms & Conditions</label>
                    <textarea value={template.terms || ''} onChange={e => update('terms', e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ color: 'var(--foreground)' }} />
                  </div>
                )}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Footer Text</label>
                  <input value={template.footerText || ''} onChange={e => update('footerText', e.target.value)} placeholder="Footer text" className="glass-input w-full px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--foreground)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Saved Templates List */}
          {templates.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <FileText size={16} /> Saved Templates ({templates.length})
              </h3>
              <div className="space-y-2">
                {templates.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]"
                    style={{
                      borderColor: t.isDefault ? template.primaryColor : 'var(--border)',
                      background: template.id === t.id ? `${template.primaryColor}08` : 'transparent',
                    }}
                    onClick={() => setTemplate(t)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.primaryColor }} />
                        <div className="w-3 h-3 rounded-full" style={{ background: t.secondaryColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{t.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.layout} · {t.fontFamily}</p>
                      </div>
                      {t.isDefault && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${template.primaryColor}20`, color: template.primaryColor }}>Default</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id!); }} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Live Preview */}
        <div className="sticky top-6">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Eye size={14} /> LIVE PREVIEW
              </span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: template.primaryColor }} />
                <div className="w-3 h-3 rounded-full" style={{ background: template.secondaryColor }} />
              </div>
            </div>

            {/* Invoice Preview */}
            <div
              style={{
                background: template.backgroundColor,
                borderRadius: br,
                fontFamily: template.fontFamily,
                fontSize: fs,
                color: template.textColor,
                borderLeft: `${aw} solid ${template.primaryColor}`,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`, padding: template.layout === 'compact' ? '12px 16px' : '20px 24px' }}>
                <div className="flex items-center justify-between">
                  <div>
                    {template.showLogo && (
                      <div
                        style={{
                          width: template.logoSize === 'small' ? 32 : template.logoSize === 'large' ? 56 : 44,
                          height: template.logoSize === 'small' ? 32 : template.logoSize === 'large' ? 56 : 44,
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: br,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>LOGO</span>
                      </div>
                    )}
                    <h2 style={{ color: '#fff', fontSize: template.layout === 'compact' ? 14 : 18, fontWeight: 700, margin: 0 }}>
                      Your Company Name
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: fs === '12px' ? 10 : 12, margin: '2px 0 0' }}>
                      GSTIN: 27AABCU9603R1ZM
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ color: '#fff', fontSize: template.layout === 'compact' ? 16 : 22, fontWeight: 800, margin: 0, letterSpacing: 1 }}>
                      INVOICE
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: fs === '12px' ? 10 : 12, margin: '2px 0 0' }}>
                      AIN-0001-2026
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ padding: template.layout === 'compact' ? '10px 16px' : '16px 24px' }}>
                <div className="flex justify-between" style={{ marginBottom: template.layout === 'compact' ? 8 : 12 }}>
                  <div>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Bill To</p>
                    <p style={{ fontWeight: 700, fontSize: fs, margin: 0 }}>Rajesh Enterprises</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7, margin: '2px 0' }}>GSTIN: 27AABCU9603R1ZM</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7, margin: 0 }}>Mumbai, Maharashtra</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Details</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Date: 01/10/2026</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Due: 31/10/2026</p>
                    <p style={{ fontSize: fs === '12px' ? 10 : 12, margin: '2px 0' }}>Type: Intra-State</p>
                  </div>
                </div>

                {template.headerText && (
                  <div style={{ background: `${template.primaryColor}08`, padding: '8px 12px', borderRadius: br, marginBottom: 10, fontSize: fs === '12px' ? 10 : 12, borderLeft: `2px solid ${template.primaryColor}` }}>
                    {template.headerText}
                  </div>
                )}

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: `${template.primaryColor}10` }}>
                      {(template.tableColumns || []).map((col, ci) => (
                        <th key={ci} style={{ padding: template.layout === 'compact' ? '6px 8px' : '8px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: template.primaryColor, fontWeight: 600, textAlign: ci === 0 ? 'left' : 'right', borderBottom: `2px solid ${template.primaryColor}30`, width: col.width }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleItems.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                        {(template.tableColumns || []).map((col, ci) => {
                          const val = col.key === 'name' ? item.name : col.key === 'hsn' ? item.hsn : col.key === 'qty' ? item.qty : col.key === 'rate' ? `₹${item.rate.toLocaleString('en-IN')}` : col.key === 'gst' ? `${item.gst}%` : col.key === 'total' ? `₹${(item.rate * 1.18).toLocaleString('en-IN')}` : '—';
                          return (
                            <td key={ci} style={{ padding: template.layout === 'compact' ? '6px 8px' : '10px 12px', textAlign: ci === 0 ? 'left' : 'right', fontWeight: ci === (template.tableColumns?.length || 1) - 1 ? 600 : 400, fontSize: col.key === 'hsn' ? (fs === '12px' ? 10 : 12) : undefined, opacity: col.key === 'hsn' ? 0.6 : 1 }}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '55%' }}>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>Subtotal</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>CGST (9%)</span>
                      <span>₹{(tax / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{ padding: '4px 0', fontSize: fs === '12px' ? 10 : 12 }}>
                      <span style={{ opacity: 0.7 }}>SGST (9%)</span>
                      <span>₹{(tax / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between" style={{
                      padding: template.layout === 'compact' ? '8px 12px' : '10px 16px',
                      marginTop: 6,
                      background: template.primaryColor,
                      borderRadius: br,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: template.layout === 'compact' ? 14 : 16,
                    }}>
                      <span>Grand Total</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {template.showBankDetails && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: `${template.primaryColor}06`, borderRadius: br, border: `1px dashed ${template.primaryColor}30` }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 6px' }}>Bank Details</p>
                    <div style={{ fontSize: fs === '12px' ? 10 : 12, opacity: 0.7 }}>
                      <p style={{ margin: '2px 0' }}>Bank: HDFC Bank, Mumbai Branch</p>
                      <p style={{ margin: '2px 0' }}>A/C: 1234567890 | IFSC: HDFC0001234</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {template.notes && (
                  <p style={{ marginTop: 12, fontSize: fs === '12px' ? 10 : 12, opacity: 0.6, fontStyle: 'italic' }}>{template.notes}</p>
                )}

                {/* Terms */}
                {template.showTerms && template.terms && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border, #e5e7eb)' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: template.primaryColor, fontWeight: 600, margin: '0 0 4px' }}>Terms & Conditions</p>
                    <p style={{ fontSize: fs === '12px' ? 9 : 11, opacity: 0.6, margin: 0 }}>{template.terms}</p>
                  </div>
                )}

                {/* Footer */}
                {template.footerText && (
                  <div style={{ marginTop: 12, textAlign: 'center', padding: '8px 0', borderTop: `2px solid ${template.primaryColor}20` }}>
                    <p style={{ fontSize: 10, opacity: 0.5, margin: 0 }}>{template.footerText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
