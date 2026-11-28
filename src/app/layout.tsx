import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/lib/toast";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { KeepAppAlive } from "@/components/KeepAppAlive";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Kept under ~60 characters so Google shows it untruncated.
const DEFAULT_TITLE = "AINOS Business Suite — GST, CRM, HR & AI in One";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Short suffix: a 24-character brand tail pushed most page titles past the
  // ~60-character SERP cutoff, so pages truncated mid-word.
  title: { default: DEFAULT_TITLE, template: "%s | AINOS" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AINOS", "AINOS Business Suite", "business suite", "all-in-one business suite",
    "business software India", "GST billing software", "CRM software", "HR and payroll software",
    "inventory management", "POS software India", "AI marketing tools", "Tally integration",
    "ERP for small business",
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
// Search engines and AI answer engines resolve "AINOS", "AINOS Business Suite"
// and "ainossuite.com" to this one entity, so a brand mention anywhere in the
// world reinforces the same listing.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AINOS",
      alternateName: ["AINOS Business Suite", "AINOS Suite", "ainossuite"],
      legalName: "Yurekh Solutions Private Limited",
      url: SITE_URL,
      foundingDate: "2018",
      numberOfEmployees: { "@type": "QuantitativeValue", minValue: 51, maxValue: 200 },
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
        caption: "AINOS Business Suite",
      },
      image: `${SITE_URL}/icon.png`,
      description: SITE_DESCRIPTION,
      slogan: "One login. Every business workspace.",
      brand: { "@id": `${SITE_URL}/#brand` },
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
      // Built in India, sold everywhere. areaServed tells a search engine that
      // a query from outside India is still in scope for this business.
      foundingLocation: { "@type": "Place", name: "Mumbai, Maharashtra, India" },
      areaServed: [
        { "@type": "Country", name: "India" },
        { "@type": "Place", name: "Worldwide" },
      ],
      knowsAbout: [
        "Business suite software",
        "GST invoicing",
        "Accounting and bookkeeping",
        "Customer relationship management",
        "Inventory and warehouse management",
        "Human resources and payroll",
        "Point of sale billing",
        "eCommerce operations",
        "Marketing automation",
        "Artificial intelligence for business",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info.ainosio@gmail.com",
        availableLanguage: ["en", "hi"],
        areaServed: "Worldwide",
      },
    },
    {
      "@type": "Brand",
      "@id": `${SITE_URL}/#brand`,
      name: "AINOS",
      alternateName: "AINOS Business Suite",
      slogan: "One login. Every business workspace.",
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: ["AINOS", "ainossuite"],
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: ["en-IN", "en"],
      about: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      alternateName: "AINOS",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "All-in-one business suite",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      brand: { "@id": `${SITE_URL}/#brand` },
      // Published prices, so the product entity carries an offer instead of
      // making a crawler infer one.
      offers: [
        {
          "@type": "Offer",
          name: "AINOS One — full app set",
          price: "3999",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          name: "Individual business apps, from",
          price: "799",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
        {
          "@type": "Offer",
          name: "AINOS AI Studio",
          price: "1499",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/pricing`,
        },
      ],
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
        {/* Mounted once at the root so the public marketing pages, the account
            screens and the dashboard all keep the Render instances awake. A
            visitor reading the home page for two minutes is enough to stop the
            next person from hitting a cold start. */}
        <KeepAppAlive />
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
