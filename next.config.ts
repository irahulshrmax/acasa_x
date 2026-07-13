// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["knex", "mysql2", "mysql"],

  images: {
    remotePatterns: [
      // ── Google OAuth avatars ────────────────────────────
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // ── Gravatar ────────────────────────────────────────
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "/**",
      },
      // ── Facebook ────────────────────────────────────────
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        pathname: "/**",
      },
      // ── Self-hosted uploads ─────────────────────────────
      {
        protocol: "https",
        hostname: "acasa.ae",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;