import { LegalPage, LEGAL_CONTACT_EMAIL, type LegalSection } from '@/components/legal/LegalPage';

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Who we are and scope of this policy',
    content: (
      <>
        <p>
          This Privacy Policy explains how AINOS Business Suite (&ldquo;AINOS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or
          &ldquo;our&rdquo;) collects, uses, shares, stores and protects personal data when you visit ainossuite.com, create an
          account, or use any AINOS application, tool or related service (together, the &ldquo;Service&rdquo;).
        </p>
        <p>
          It is published in accordance with the Information Technology Act, 2000, the Information Technology (Reasonable Security
          Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data
          Protection Act, 2023 (&ldquo;DPDP Act&rdquo;), to the extent each applies.
        </p>
        <ul>
          <li>
            <strong>Account and website data:</strong> for data about you as an account holder or visitor, AINOS decides why and
            how it is processed and acts as the <strong>Data Fiduciary</strong>.
          </li>
          <li>
            <strong>Business data you store in AINOS:</strong> invoices, customer, vendor, lead and employee records and similar
            content are processed by AINOS <strong>on your behalf</strong>, as a Data Processor. Your business remains the Data
            Fiduciary for that data and is responsible for having a lawful basis and giving any notice required to the people it
            relates to.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'collect',
    title: 'Information we collect',
    content: (
      <>
        <p>We collect only what we need to provide and secure the Service:</p>
        <ul>
          <li><strong>Account information:</strong> name, email address, phone number, role, and a password stored only as a one-way hash.</li>
          <li><strong>Company information:</strong> company name, business type, address, country, GSTIN, PAN and contact details.</li>
          <li><strong>Verification (KYC) documents:</strong> registration certificates, PAN, partnership deeds, incorporation documents and similar records you upload during onboarding.</li>
          <li><strong>Business data:</strong> invoices, quotations, expenses, inventory, customer and employee records, blog posts, social posts and other content you create or upload.</li>
          <li><strong>Payment and billing data:</strong> plan, credit balance, order and transaction references. Card, UPI and bank details are entered on our payment partner&rsquo;s page and are not stored by AINOS.</li>
          <li><strong>Sign-in data from third parties:</strong> if you use Google sign-in, we receive your name, email address and profile picture from Google.</li>
          <li><strong>Usage and technical data:</strong> features used, credit consumption, log records, IP address, browser, device type and cookies described in section 11.</li>
          <li><strong>Communications:</strong> messages you send to our support team and your communication preferences.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How and why we use your information',
    content: (
      <>
        <p>We process personal data on the basis of your consent, or for legitimate uses permitted by law, for these purposes:</p>
        <ul>
          <li>Creating your account, verifying your business and operating the features you use.</li>
          <li>Processing subscriptions, credit purchases, invoices and tax records for your plan.</li>
          <li>Sending service messages such as approvals, OTPs, password resets, security alerts and billing notices.</li>
          <li>Providing support, and improving the reliability, performance and usability of the Service.</li>
          <li>Detecting and preventing fraud, abuse, security incidents and violations of our Terms.</li>
          <li>Complying with legal obligations, including tax, accounting and law-enforcement requests made under applicable law.</li>
        </ul>
        <p>We do not use your business data for advertising, and we do not sell, rent or trade personal data.</p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI features',
    content: (
      <>
        <p>
          When you use an AI feature (for example writing a blog post, a caption or reading an invoice), the text, files or prompts
          needed for that request are sent to our AI service providers to generate the result. We send only what the request needs.
        </p>
        <ul>
          <li>AINOS does not use your business data to train AI models.</li>
          <li>AI output can be incomplete or wrong. Please review it before you rely on it or publish it.</li>
          <li>Avoid entering sensitive personal data into AI tools unless it is necessary for the task.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'isolation',
    title: 'Data isolation and document confidentiality',
    content: (
      <ul>
        <li><strong>Tenant isolation:</strong> each company&rsquo;s data is logically separated and is not visible to other companies on the platform.</li>
        <li><strong>Role-based access:</strong> users inside your company see only what their role permits.</li>
        <li><strong>KYC documents:</strong> verification documents are kept in access-controlled cloud storage and are available only to your authorised users and to the AINOS staff who verify accounts.</li>
        <li><strong>Staff access:</strong> AINOS personnel access customer data only where needed for verification, support you request, security, or legal compliance.</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'Sharing with service providers and others',
    content: (
      <>
        <p>We share personal data only in the following cases:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that run parts of the Service for us under contract, such as cloud hosting (Render),
            database hosting (Aiven), file storage (Cloudinary), email delivery (Brevo), AI processing (Google Gemini, Groq), sign-in
            (Google) and payment processing (Razorpay, where payments are enabled). They may use the data only to provide their service to us.
          </li>
          <li><strong>Integrations you connect:</strong> when you connect a website, social account or other service, we send it the data needed for the action you choose.</li>
          <li><strong>Legal reasons:</strong> where required by law, court order or a lawful request from a government authority, or to protect the rights, safety and property of our users or AINOS.</li>
          <li><strong>Business transfers:</strong> in a merger, acquisition or sale of assets, subject to this policy, with notice to you.</li>
          <li><strong>With your consent:</strong> in any other case where you have asked us to share it.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'Where your data is processed',
    content: (
      <p>
        Some of our service providers store or process data on servers located outside India. Where this happens, we transfer data
        only as permitted under the DPDP Act and any restrictions notified by the Government of India, and we choose providers that
        apply appropriate security safeguards.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'How we protect your data',
    content: (
      <>
        <p>We follow reasonable security practices suited to the nature of the data, including:</p>
        <ul>
          <li>Encryption in transit using HTTPS/TLS, and encryption at rest provided by our hosting and storage providers.</li>
          <li>Hashed passwords, one-time passwords for sensitive actions, and session controls.</li>
          <li>Role-based access, company-level data separation, and input validation.</li>
          <li>Restricted, need-to-know access for AINOS personnel.</li>
        </ul>
        <p>
          No method of transmission or storage is completely secure. If a personal data breach occurs, we will inform the Data
          Protection Board of India and affected users as required by law, and take steps to contain it.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep data',
    content: (
      <ul>
        <li>We keep account and business data for as long as your account is active.</li>
        <li>After you close your account, we delete or anonymise personal data within 30 days, unless we must keep it longer.</li>
        <li>Records we are required to keep under tax, accounting or other laws, such as our billing records, are retained for the period those laws require.</li>
        <li>Please export any data you need before closing your account.</li>
      </ul>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: (
      <>
        <p>Subject to applicable law, you have the right to:</p>
        <ul>
          <li><strong>Access:</strong> obtain a summary of the personal data we process about you and the processing activities.</li>
          <li><strong>Correction and updating:</strong> correct inaccurate data and complete or update incomplete data.</li>
          <li><strong>Erasure:</strong> ask us to delete personal data that is no longer needed, unless we must keep it by law.</li>
          <li><strong>Withdraw consent:</strong> withdraw consent at any time. This does not affect processing already done, and some features may stop working.</li>
          <li><strong>Grievance redressal:</strong> raise a complaint with our Grievance Officer (section 14).</li>
          <li><strong>Nomination:</strong> nominate a person to exercise your rights in the event of your death or incapacity.</li>
        </ul>
        <p>
          You can update most account details from Settings in your dashboard. For other requests, email {mail}. We may need to verify your
          identity before acting on a request. If the data belongs to a company that uses AINOS, we may refer your request to that
          company, as it controls that data.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <p>
        We use essential cookies and browser storage to keep you signed in, protect your session and remember basic preferences. The
        Service cannot work properly without them. We do not use advertising cookies. You can block cookies in your browser settings,
        but sign-in and other features may then stop working.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        The Service is meant for businesses and is not intended for anyone under 18 years of age. We do not knowingly collect personal
        data from children. If you believe a child has given us personal data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'communications',
    title: 'Emails and notifications',
    content: (
      <p>
        We send service emails that are needed to run your account, such as OTPs, approvals and billing notices. If we send product
        updates or newsletters, you can opt out at any time using the link in the email or by contacting us. Service emails will continue
        while your account is active.
      </p>
    ),
  },
  {
    id: 'grievance',
    title: 'Grievance Officer',
    content: (
      <>
        <p>
          If you have a concern or complaint about how your personal data is handled, contact our Grievance Officer. Please include your
          name, registered email and a description of the issue.
        </p>
        <ul>
          <li>Grievance Officer, AINOS Business Suite</li>
          <li>Email: {mail}</li>
        </ul>
        <p>
          We will acknowledge your complaint and respond within the time required by applicable law. If you are not satisfied with our
          response, you may approach the Data Protection Board of India in accordance with the DPDP Act.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this Privacy Policy when our practices or the law change. The date at the top of this page shows the latest
        revision. For material changes, we will notify you by email or through the Service before they take effect.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <ul>
        <li>Email: {mail}</li>
        <li>Website: <a href="https://ainossuite.com">ainossuite.com</a></li>
      </ul>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      related={{ href: '/terms', label: 'Terms' }}
      sections={sections}
      intro={
        <p>
          Your business data is yours. This policy explains, in plain terms, what we collect, why we collect it, who we share it with,
          how long we keep it, and the rights you have. By using the Service you acknowledge that you have read this policy.
        </p>
      }
    />
  );
}
