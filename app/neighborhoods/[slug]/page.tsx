"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Globe,
  Home,
  Eye,
  Copy,
  TrendingUp,
  Clock,
  Map as MapIcon,
  Heart,
  Star,
} from "lucide-react";

const API_URL = "/api/v1/neighborhoods";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  accentLight: "#F5ECD7",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  image: string;
  latitude: string;
  longitude: string;
  description: string;
  city_id: number;
  city_name: string;
  status: number;
  featured: number;
  property_count: number;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${THEME.accent}30` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[6px] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: THEME.primary, borderLeftColor: THEME.primary }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-5 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: THEME.muted }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Neighborhood
        </motion.p>
      </div>
    </div>
  );
}

export default function NeighborhoodDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Neighborhood not found");
        setNeighborhood(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!neighborhood) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: neighborhood.name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [neighborhood]);

  if (loading) return <PageLoader />;

  if (error || !neighborhood) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <MapIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Neighborhood not found"}</p>
          <Link
            href="/neighborhoods"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Neighborhoods
          </Link>
        </div>
      </div>
    );
  }

  const description = stripHtml(neighborhood.description);
  const imageSrc = neighborhood.image || "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&h=600&fit=crop";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/neighborhoods" className="hover:text-gray-600 transition-colors">
                Neighborhoods
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {neighborhood.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {neighborhood.featured === 1 && (
                <span className="rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
                  Featured
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-gray-100 text-gray-700 border border-gray-200">
                <Globe className="h-2.5 w-2.5" />
                {neighborhood.city_name || "Dubai"}
              </span>
              {neighborhood.property_count > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Home className="h-2.5 w-2.5" />
                  {neighborhood.property_count} properties
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {neighborhood.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{neighborhood.city_name || "Dubai"}, UAE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/7] rounded-[4px]">
          <img
            src={imageSrc}
            alt={neighborhood.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-4 py-10 md:px-6">
        {description && (
          <div className="prose prose-lg max-w-none text-[15px] leading-relaxed" style={{ color: "#333" }}>
            <div dangerouslySetInnerHTML={{ __html: neighborhood.description }} />
          </div>
        )}

        {neighborhood.latitude && neighborhood.longitude && (
          <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
            <h3
              className="text-[18px] mb-4"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              Location
            </h3>
            <div className="overflow-hidden rounded-[4px] border" style={{ borderColor: THEME.border }}>
              <div className="h-[300px]">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${neighborhood.latitude},${neighborhood.longitude}&zoom=13`}
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t pt-8" style={{ borderColor: THEME.border }}>
          <div className="flex items-center gap-4 text-[13px] text-[#6B7A8D]">
            <span className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              {neighborhood.property_count || 0} properties
            </span>
          </div>
          <Link
            href="/neighborhoods"
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-70"
            style={{ color: THEME.primary }}
          >
            All Neighborhoods
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}