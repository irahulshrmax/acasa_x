// app/layout.tsx

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// ─── FONTS ──────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

// ─── CONSTANTS ───────────────────────────────────────────────────────────

const siteUrl = "https://www.acasa.ae";
const siteName = "ACASA";
const defaultTitle = "ACASA | Buy, Rent, Sell & Off-Plan Properties in Dubai";
const description =
  "Discover luxury apartments, villas, penthouses, plots, and off-plan properties in Dubai with ACASA. Explore featured projects, premium properties, top developers, and expert real estate guides to find your dream home.";

// ─── VIEWPORT ───────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F1C2E",
  colorScheme: "light",
};

// ─── METADATA ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | ACASA",
  },
  description,
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
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description,
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
    locale: "en_AE",
    countryName: "United Arab Emirates",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: [`${siteUrl}/logo.png`],
    site: "@acasa",
    creator: "@acasa",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "your-google-verification-code",
  },
};

// ─── JSON-LD SCHEMA ────────────────────────────────────────────────────

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": `${siteUrl}#organization`,
      name: siteName,
      url: siteUrl,
      description,
      logo: `${siteUrl}/logo.png`,
      image: `${siteUrl}/logo.png`,
      areaServed: ["Dubai", "United Arab Emirates"],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressCountry: "AE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+971-58-164-5714",
        contactType: "sales",
        availableLanguage: ["English", "Arabic"],
      },
      sameAs: [
        "https://www.facebook.com/acasa",
        "https://www.instagram.com/acasa",
        "https://www.linkedin.com/company/acasa",
        "https://twitter.com/acasa",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      name: siteName,
      url: siteUrl,
      description,
      inLanguage: "en-AE",
      about: {
        "@type": "Thing",
        name: "Real Estate",
        description: "Dubai Real Estate Marketplace",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/properties?keyword={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Buy Properties in Dubai",
          url: `${siteUrl}/buy`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Off Plan Properties",
          url: `${siteUrl}/offplan-properties`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Luxury Villas",
          url: `${siteUrl}/luxury-villas`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Real Estate Developers",
          url: `${siteUrl}/developers`,
        },
      ],
    },
  ],
};

// ─── GOOGLE ANALYTICS ──────────────────────────────────────────────────

const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-AE"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      {/* ✅ HEAD - Sab head elements yahan */}
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://acasa.ae" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://acasa.ae" />
        <link rel="dns-prefetch" href="https://api.acasa.ae" />
        <link rel="dns-prefetch" href="https://images.acasa.ae" />

        {/* Favicon */}
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Meta tags */}
        <meta name="msapplication-TileColor" content="#0F1C2E" />
        <meta name="theme-color" content="#0F1C2E" />
        <meta property="fb:app_id" content="your-fb-app-id" />

        {/* ✅ JSON-LD Schema - Plain script tag, head ke andar */}
        {/* next/script nahi, seedha <script> tag use karo */}
        <script
          id="schema-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>

      <body
        className={`${inter.className} min-h-screen bg-white text-[#0F1C2E] antialiased`}
      >
        {/* ✅ Google Analytics - next/script, body mein, afterInteractive */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
              });
            `,
          }}
        />

        {/* ─── Skip to Content ────────────────────────────────────── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#0F1C2E] focus:shadow-lg focus:ring-2 focus:ring-[#C9A96E]"
        >
          Skip to main content
        </a>

        {/* ─── Main Content ───────────────────────────────────────── */}
        <div id="main-content" className="min-h-screen">
          {children}
        </div>

        {/* ─── Toast Notifications ────────────────────────────────── */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0F1C2E",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "12px 16px",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              style: {
                background: "#10B981",
                color: "#FFFFFF",
              },
              iconTheme: {
                primary: "#FFFFFF",
                secondary: "#10B981",
              },
            },
            error: {
              style: {
                background: "#EF4444",
                color: "#FFFFFF",
              },
              iconTheme: {
                primary: "#FFFFFF",
                secondary: "#EF4444",
              },
            },
          }}
        />
      </body>
    </html>
  );
}