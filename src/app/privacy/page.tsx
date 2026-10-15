'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, Database, FileText, Globe, UserCheck, Mail, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8f7fc] overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/auth/register" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Register
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#4c1d95' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mt-0.5">Last updated: October 15, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: '#4c1d95' }} /> 1. Introduction
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              AINOS (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business management platform (the &ldquo;Service&rdquo;).
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              By using the Service, you consent to the data practices described in this policy. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5" style={{ color: '#4c1d95' }} /> 2. Information We Collect
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We collect the following categories of information:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li><strong>Account Information:</strong> Name, email address, password (hashed), and role.</li>
              <li><strong>Company Information:</strong> Company name, type, address, country, GST number, phone, and email.</li>
              <li><strong>Verification Documents:</strong> Business registration documents, PAN cards, certificates of incorporation, and other KYC documents uploaded during onboarding.</li>
              <li><strong>Business Data:</strong> Invoices, customer records, employee data, inventory, blog posts, and other content you create or upload.</li>
              <li><strong>Usage Data:</strong> Feature interactions, credit consumption, and platform activity.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5" style={{ color: '#4c1d95' }} /> 3. How We Use Your Information
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>To provide, operate, and maintain the Service.</li>
              <li>To verify your business identity during onboarding.</li>
              <li>To process transactions and manage credit balances.</li>
              <li>To send account-related communications (approvals, rejections, security alerts).</li>
              <li>To improve and personalize the platform experience.</li>
              <li>To detect, prevent, and address fraud and security issues.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5" style={{ color: '#4c1d95' }} /> 4. Data Isolation &amp; Document Privacy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Data privacy is a core architectural principle of AINOS:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li><strong>Tenant Isolation:</strong> Each company&apos;s data is logically isolated. Your data is never visible to other companies on the platform.</li>
              <li><strong>Document Confidentiality:</strong> Uploaded legal and verification documents are stored securely via encrypted cloud storage (Cloudinary). These documents are accessible only to your company&apos;s authorized users and designated platform administrators for verification purposes.</li>
              <li><strong>No Data Selling:</strong> We never sell, rent, or trade your business data or personal information to third parties.</li>
              <li><strong>AI Processing:</strong> Data sent to AI models (for blog generation, captions, etc.) is processed transiently and not retained by AI providers for training.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Server className="w-5 h-5" style={{ color: '#4c1d95' }} /> 5. Data Storage &amp; Security
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your data is stored on secure cloud infrastructure:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Database: PostgreSQL hosted on Aiven Cloud with encryption at rest and in transit.</li>
              <li>Documents: Encrypted storage on Cloudinary with access-controlled delivery.</li>
              <li>Authentication: Passwords are hashed using industry-standard bcrypt. OAuth tokens are stored securely.</li>
              <li>Access Control: Role-based access ensures users only see data appropriate to their role within their company.</li>
              <li>We implement industry-standard security measures including HTTPS, input sanitization, and SQL injection prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#4c1d95' }} /> 6. Data Sharing &amp; Third Parties
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We do not sell or share your personal information with third parties except in the following limited circumstances:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li><strong>Service Providers:</strong> Cloud hosting (Render, Aiven), document storage (Cloudinary), email delivery (Resend), and AI processing (Google Gemini, Groq) — each bound by their own privacy commitments.</li>
              <li><strong>Legal Requirements:</strong> If required by law, regulation, or valid legal process.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with prior notice.</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#4c1d95' }} /> 7. Your Rights
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
              <li><strong>Portability:</strong> Request export of your business data in a standard format.</li>
              <li><strong>Objection:</strong> Object to certain processing of your data.</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, please contact us at info.ainosio@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#4c1d95' }} /> 8. Data Retention
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active. Upon account termination, we will delete or anonymize your personal data within 30 days, except where retention is required for legal, regulatory, or legitimate business purposes (e.g., financial transaction records).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#4c1d95' }} /> 9. Cookies
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies and similar technologies for session management, authentication, and platform functionality. These are essential for the Service to function and cannot be disabled. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: '#4c1d95' }} /> 10. Changes to This Policy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform notice. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" style={{ color: '#4c1d95' }} /> 11. Contact Us
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Email: info.ainosio@gmail.com</li>
              <li>Platform: ainos-ywu0.onrender.com</li>
            </ul>
          </section>

        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <Link href="/terms" className="hover:underline" style={{ color: '#6d28d9' }}>Terms of Service</Link>
          <Link href="/auth/register" className="hover:underline" style={{ color: '#6d28d9' }}>Back to Register</Link>
        </div>
      </div>
    </div>
  );
}
