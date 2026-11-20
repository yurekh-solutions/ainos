import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/lib/toast";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Kept under ~60 characters so Google shows it untruncated.
const DEFAULT_TITLE = "AINOS — GST Billing, CRM, HR & AI Business Suite";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s | AINOS" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "business software India", "GST billing software", "CRM software", "HR and payroll software",
    "inventory management", "AI marketing tools", "Tally integration", "ERP for small business",
  ],
  authors: [{ name: "AINOS" }],
  creator: "AINOS",
  publisher: "AINOS",
  // No canonical / og:url here: children inherit unset fields, and a root canonical
  // would point every page at the home page. Each public page sets its own.
  alternates: {
    types: { "application/rss+xml": "/api/blog-rss" },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

// Site-wide structured data: who publishes the site and what the product is.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AINOS",
      legalName: "Yurekh Solutions Private Limited",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      // sameAs is what lets Google and AI answers treat these profiles as the
      // same company, so brand mentions off-site reinforce one entity.
      sameAs: [
        "https://www.linkedin.com/company/yurekh-solutions-private-limited/",
        "https://www.instagram.com/yurekhsolutions",
        "https://yurekh.com/",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mumbai",
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-IN",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <JsonLd data={ORG_JSON_LD} />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
