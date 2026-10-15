'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, ShieldCheck, Building2, CreditCard, Users, Globe, AlertTriangle, RefreshCw, Mail } from 'lucide-react';

export default function TermsOfService() {
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms of Service</h1>
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
              <Building2 className="w-5 h-5" style={{ color: '#4c1d95' }} /> 1. Acceptance of Terms
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Welcome to AINOS (&ldquo;AINOS,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing or using the AINOS business management platform located at ainos-ywu0.onrender.com and related services (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              You must be at least 18 years old and capable of forming a binding contract to use the Service. By registering a company on AINOS, you represent that you are authorized to act on behalf of that business entity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: '#4c1d95' }} /> 2. Account Registration &amp; Approval
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              To access the Service, you must complete our company registration process, which includes providing accurate business information and uploading required verification documents. All registrations are subject to administrative review and approval.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>You agree to provide truthful, accurate, and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized access to your account.</li>
              <li>We reserve the right to reject, suspend, or terminate accounts that provide false information or violate these Terms.</li>
              <li>Google sign-in is available only for email addresses already registered and approved on AINOS.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: '#4c1d95' }} /> 3. Subscription &amp; Credits
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              AINOS operates on a credit-based subscription model. Upon registration, your company receives welcome credits to explore the platform. Additional credits may be purchased through subscription plans.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Credits are consumed when using AI-powered tools and premium features.</li>
              <li>Credits are non-transferable between accounts and non-refundable except as required by law.</li>
              <li>We reserve the right to modify credit pricing and consumption rates with reasonable notice.</li>
              <li>Unused credits from subscription plans follow the validity period of your active plan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#4c1d95' }} /> 4. Acceptable Use Policy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You agree to use the Service only for lawful business purposes. You shall not:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose.</li>
              <li>Upload malicious software, viruses, or harmful content.</li>
              <li>Attempt to gain unauthorized access to other accounts, systems, or data.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use AI-generated content for deception, misinformation, or harmful purposes.</li>
              <li>Resell or redistribute the Service without our written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#4c1d95' }} /> 5. Data &amp; Document Privacy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your business data, including uploaded documents, financial records, and customer information, is strictly private and isolated. Each company&apos;s data is tenant-isolated and accessible only to authorized users of that company.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Uploaded verification documents are stored securely and used solely for onboarding verification.</li>
              <li>Legal and compliance documents are treated with strict confidentiality.</li>
              <li>We do not sell, share, or monetize your business data.</li>
              <li>Administrative access to company data is limited to verification and support purposes only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#4c1d95' }} /> 6. Intellectual Property
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Service, including its software, design, trademarks, and content, is owned by AINOS and protected by intellectual property laws. You retain ownership of the data and content you upload. You grant us a limited license to process your data solely to provide the Service.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              AI-generated content (blogs, captions, invoices, etc.) created through the Service may be used by your business for its intended commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" style={{ color: '#4c1d95' }} /> 7. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; While we strive for high availability and accuracy, we do not warrant that the Service will be uninterrupted, error-free, or that AI-generated outputs will be completely accurate.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>AI-generated content should be reviewed before business use.</li>
              <li>Financial and legal outputs are informational and not professional advice.</li>
              <li>To the maximum extent permitted by law, our aggregate liability shall not exceed the amount paid by you in the 12 months preceding the claim.</li>
              <li>We are not liable for indirect, incidental, or consequential damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" style={{ color: '#4c1d95' }} /> 8. Termination
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You may terminate your account at any time by contacting us. We may suspend or terminate your access immediately for breach of these Terms, fraudulent activity, or extended inactivity. Upon termination, your data will be handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" style={{ color: '#4c1d95' }} /> 9. Modifications to Terms
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update these Terms from time to time. Material changes will be communicated via email or a notice on the platform. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" style={{ color: '#4c1d95' }} /> 10. Contact
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed mt-3 space-y-1.5">
              <li>Email: info.ainosio@gmail.com</li>
              <li>Platform: ainos-ywu0.onrender.com</li>
            </ul>
          </section>

        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <Link href="/privacy" className="hover:underline" style={{ color: '#6d28d9' }}>Privacy Policy</Link>
          <Link href="/auth/register" className="hover:underline" style={{ color: '#6d28d9' }}>Back to Register</Link>
        </div>
      </div>
    </div>
  );
}
