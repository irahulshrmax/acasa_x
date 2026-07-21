// app/layout.tsx

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// ─── FONTS ──────────────────────────────────────────────────────────────

const inter = Inter({
  subsets : ["latin"],
  display : "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets : ["latin"],
  display : "swap",
  variable: "--font-playfair",
  weight  : ["400", "500", "600", "700"],
});

// ─── CONSTANTS ───────────────────────────────────────────────────────────

const SITE_URL     = "https://www.acasa.ae";
const SITE_NAME    = "ACASA";
const SITE_TITLE   = "ACASA | Buy, Rent, Sell & Off-Plan Properties in Dubai";
const SITE_DESC    = "Discover luxury apartments, villas, penthouses, plots, and off-plan properties in Dubai with ACASA. Explore featured projects, premium properties, top developers, and expert real estate guides.";
const SITE_THEME   = "#0F1C2E";
const GA_ID        = "G-XXXXXXXXXX";

// ─── VIEWPORT ───────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width       : "device-width",
  initialScale: 1,
  themeColor  : SITE_THEME,
  colorScheme : "light",
};

// ─── METADATA ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default : SITE_TITLE,
    template: "%s | ACASA",
  },
  description: SITE_DESC,
  keywords: [
    "Dubai real estate",
    "buy property Dubai",
    "rent property Dubai",
    "off plan properties Dubai",
    "luxury villas Dubai",
    "luxury apartments Dubai",
    "ACASA",
    "ACASA real estate",
    "Dubai properties",
    "real estate agent Dubai",
  ],
  authors   : [{ name: SITE_NAME, url: SITE_URL }],
  creator   : SITE_NAME,
  publisher : SITE_NAME,
  alternates: { canonical: "/" },
  robots: {
    index : true,
    follow: true,
    googleBot: {
      index             : true,
      follow            : true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet"      : -1,
    },
  },
  openGraph: {
    type       : "website",
    url        : SITE_URL,
    siteName   : SITE_NAME,
    title      : SITE_TITLE,
    description: SITE_DESC,
    locale     : "en_AE",
    countryName: "United Arab Emirates",
    images     : [{
      url   : `${SITE_URL}/logo.png`,
      width : 1200,
      height: 630,
      alt   : SITE_NAME,
    }],
  },
  twitter: {
    card       : "summary_large_image",
    title      : SITE_TITLE,
    description: SITE_DESC,
    images     : [`${SITE_URL}/logo.png`],
    site       : "@acasa",
    creator    : "@acasa",
  },
  icons: {
    icon: [
      { url: "/favicon.ico",        sizes: "any" },
      { url: "/favicon-16x16.png",  sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest    : "/site.webmanifest",
  verification: { google: "your-google-verification-code" },
};

// ─── JSON-LD ───────────────────────────────────────────────────────────

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type"      : "RealEstateAgent",
      "@id"        : `${SITE_URL}#organization`,
      name         : SITE_NAME,
      url          : SITE_URL,
      description  : SITE_DESC,
      logo         : `${SITE_URL}/logo.png`,
      image        : `${SITE_URL}/logo.png`,
      areaServed   : ["Dubai", "United Arab Emirates"],
      address      : {
        "@type"          : "PostalAddress",
        addressLocality  : "Dubai",
        addressCountry   : "AE",
      },
      contactPoint: {
        "@type"           : "ContactPoint",
        telephone         : "+971-58-164-5714",
        contactType       : "sales",
        availableLanguage : ["English", "Arabic"],
      },
      sameAs: [
        "https://www.facebook.com/acasa",
        "https://www.instagram.com/acasa",
        "https://www.linkedin.com/company/acasa",
        "https://twitter.com/acasa",
      ],
    },
    {
      "@type"      : "WebSite",
      "@id"        : `${SITE_URL}#website`,
      name         : SITE_NAME,
      url          : SITE_URL,
      description  : SITE_DESC,
      inLanguage   : "en-AE",
      potentialAction: {
        "@type": "SearchAction",
        target : {
          "@type"     : "EntryPoint",
          urlTemplate : `${SITE_URL}/properties?keyword={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type"          : "ItemList",
      itemListElement  : [
        { "@type": "ListItem", position: 1, name: "Buy Properties in Dubai",  url: `${SITE_URL}/buy` },
        { "@type": "ListItem", position: 2, name: "Off Plan Properties",      url: `${SITE_URL}/offplan-properties` },
        { "@type": "ListItem", position: 3, name: "Luxury Villas",            url: `${SITE_URL}/luxury-villas` },
        { "@type": "ListItem", position: 4, name: "Real Estate Developers",   url: `${SITE_URL}/developers` },
      ],
    },
  ],
};

// ─── LAYOUT ────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-AE"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link rel="dns-prefetch" href="https://acasa.ae" />
        <link rel="dns-prefetch" href="https://api.acasa.ae" />

        <meta name="msapplication-TileColor" content={SITE_THEME} />

        <script
          id="schema-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      <body className={`${inter.className} min-h-screen bg-white text-[#0F1C2E] antialiased`}>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${GA_ID}',{page_path:window.location.pathname});
            `,
          }}
        />

        {/* Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Content */}
        <div id="main-content" className="min-h-screen">
          {children}
        </div>

        {/* Toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background  : "#1a1a1a",
              color       : "#fff",
              borderRadius: "8px",
              padding     : "12px 16px",
              fontSize    : "14px",
            },
            success: {
              style    : { background: "#10B981" },
              iconTheme: { primary: "#fff", secondary: "#10B981" },
            },
            error: {
              style    : { background: "#EF4444" },
              iconTheme: { primary: "#fff", secondary: "#EF4444" },
            },
          }}
        />
      </body>
    </html>
  );
}