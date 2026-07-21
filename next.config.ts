import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.acasa.ae https://www.google-analytics.com wss:",
  "frame-src 'self' https://www.google.com",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",

  serverExternalPackages: ["knex", "mysql2", "mysql"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "www.gravatar.com", pathname: "/**" },
      { protocol: "https", hostname: "graph.facebook.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "acasa.ae", pathname: "/**" },
      { protocol: "https", hostname: "www.acasa.ae", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/property/:path*",
        has: [{ type: "host", value: "www.acasa.ae" }],
        destination: "https://acasa.ae/property/:path*",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/session/validate",
        destination: "/api/v1/auth/admin/verify",
      },
      {
        source: "/api/v1/session/login",
        destination: "/api/v1/auth/login",
      },
    ];
  },

  compress: true,
  generateEtags: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@mui/material", "@mui/icons-material"],
    scrollRestoration: true,
  },

  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  productionBrowserSourceMaps: false,

  turbopack: {},
};

export default nextConfig;