"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
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
  Award,
  Building,
  Users,
  Mail,
  Eye,
  Copy,
  TrendingUp,
  Clock,
  Link2,
} from "lucide-react";

const API_URL = "/api/v1/developers";
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

interface Developer {
  id: number;
  name: string;
  country: string | null;
  website: string | null;
  image: string | null;
  image_url: string;
  image_variations: string[];
  total_project: string | null;
  total_project_withus: string | null;
  informations: string | null;
  seo_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
  project_count: number;
  property_count: number;
  year_established: string | null;
  ceo_name: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  upload_base_url: string;
  projects?: any[];
  properties?: any[];
  responsible_agent?: string | null;
}

function getCountryFlag(country: string | null): string {
  if (!country) return "🌍";
  const flags: Record<string, string> = {
    "United Arab Emirates": "🇦🇪",
    UAE: "🇦🇪",
    "USA": "🇺🇸",
    "United States": "🇺🇸",
    "UK": "🇬🇧",
    "United Kingdom": "🇬🇧",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Australia": "🇦🇺",
    "Singapore": "🇸🇬",
    "Canada": "🇨🇦",
    "Germany": "🇩🇪",
    "Switzerland": "🇨🇭",
  };
  return flags[country] || "🌍";
}

function formatDate(date: string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
          Loading Developer
        </motion.p>
      </div>
    </div>
  );
}

function PropertyCard({ property, index }: { property: any; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const img = !imgErr
    ? property.featured_image || property.gallery_urls?.[0] || property.images?.[0]?.url || null
    : null;

  const priceDisplay = property.price?.display || "Price on Request";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => router.push(`/properties/${property.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={property.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Building2 className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="mt-4 space-y-1">
        <h3
          className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#C9A96E]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {property.name || "Property"}
        </h3>
        <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
          {priceDisplay}
        </p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: THEME.muted }}>
          {property.bedrooms && <span>{property.bedrooms}</span>}
          {property.bathrooms && (
            <>
              <span>·</span>
              <span>{property.bathrooms}</span>
            </>
          )}
          {property.area?.display && (
            <>
              <span>·</span>
              <span>{property.area.display}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DeveloperDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?slug=${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Developer not found");
        setDeveloper(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!developer) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: developer.name || "Developer",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [developer]);

  if (loading) return <PageLoader />;

  if (error || !developer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Developer not found"}</p>
          <Link
            href="/developers"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Developers
          </Link>
        </div>
      </div>
    );
  }

  const totalProjects = parseInt(developer.total_project || "0") || developer.project_count || 0;
  const totalProperties = developer.property_count || 0;
  const imageSrc = developer.image_url && developer.image_url !== "https://acasa.ae/upload/no-image.png"
    ? developer.image_url
    : "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

  const similarDevelopers: Developer[] = [];

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
              <Link href="/developers" className="hover:text-gray-600 transition-colors">
                Developers
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {developer.name || "Developer"}
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
              {developer.country && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-gray-100 text-gray-700 border border-gray-200">
                  <Globe className="h-2.5 w-2.5" />
                  {developer.country} {getCountryFlag(developer.country)}
                </span>
              )}
              {developer.year_established && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-blue-50 text-blue-700 border border-blue-200">
                  <Calendar className="h-2.5 w-2.5" />
                  Est. {developer.year_established}
                </span>
              )}
              {developer.status === 1 && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="h-2.5 w-2.5" />
                  Active
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {developer.name || "Developer"}
            </h1>

            {developer.ceo_name && (
              <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color: THEME.muted }}>
                <Users className="h-3.5 w-3.5" />
                <span>CEO: {developer.ceo_name}</span>
              </div>
            )}

            {developer.responsible_agent && (
              <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: THEME.muted }}>
                <Users className="h-3.5 w-3.5" />
                <span>Agent: {developer.responsible_agent}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center gap-6">
              {totalProjects > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>Projects</p>
                  <p className="text-[24px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    {totalProjects}
                  </p>
                </div>
              )}
              {totalProperties > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>Properties</p>
                  <p className="text-[24px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    {totalProperties}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {developer.website && (
          <div className="mt-4 flex items-center gap-2">
            <a
              href={developer.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] underline hover:no-underline"
              style={{ color: THEME.primary }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {developer.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/6]">
          <img
            src={imageSrc}
            alt={developer.name || "Developer"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {developer.informations && (
              <div>
                <h2
                  className="text-[20px] sm:text-[24px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  About {developer.name}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: developer.informations }}
                />
              </div>
            )}

            {(developer.email || developer.mobile || developer.address) && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h3
                  className="text-[16px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Contact Information
                </h3>
                <div className="space-y-2 text-[13px]" style={{ color: "#4A5462" }}>
                  {developer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#6B7A8D]" />
                      <a href={`mailto:${developer.email}`} className="hover:underline">
                        {developer.email}
                      </a>
                    </div>
                  )}
                  {developer.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#6B7A8D]" />
                      <a href={`tel:${developer.mobile}`} className="hover:underline">
                        {developer.mobile}
                      </a>
                    </div>
                  )}
                  {developer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#6B7A8D]" />
                      <span>{developer.address}</span>
                    </div>
                  )}
                  {developer.website && (
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[#6B7A8D]" />
                      <a
                        href={developer.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {developer.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {developer.projects && developer.projects.length > 0 && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h3
                  className="text-[16px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Projects by {developer.name}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {developer.projects.slice(0, 6).map((project, i) => (
                    <div
                      key={i}
                      className="border p-4 transition-colors hover:bg-gray-50"
                      style={{ borderColor: THEME.border }}
                    >
                      <h4 className="text-[13px] font-medium" style={{ color: THEME.primary }}>
                        {project.name || project.ProjectName || "Project"}
                      </h4>
                      {project.price && (
                        <p className="text-[11px] text-[#6B7A8D]">{project.price}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {developer.properties && developer.properties.length > 0 && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h3
                  className="text-[16px] mb-4"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Properties by {developer.name}
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {developer.properties.slice(0, 4).map((property, i) => (
                    <PropertyCard key={i} property={property} index={i} />
                  ))}
                </div>
              </div>
            )}

            {developer.created_at && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <p className="text-[10px] text-[#6B7A8D]">
                  Last updated: {formatDate(developer.updated_at || developer.created_at)}
                </p>
              </div>
            )}
          </div>

          <aside>
            <div className="sticky top-6">
              <div className="border bg-white" style={{ borderColor: THEME.border }}>
                <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
                  <h3
                    className="text-[16px] font-normal text-white"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Contact Developer
                  </h3>
                  <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
                    Get in touch with {developer.name}
                  </p>
                </div>

                <div className="p-5">
                  <form className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+971 50 000 0000"
                        className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Message
                      </label>
                      <textarea
                        rows={3}
                        placeholder={`I'm interested in properties by ${developer.name}...`}
                        className="mt-1.5 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Send Enquiry
                    </button>
                  </form>
                </div>
              </div>

              {developer.mobile && (
                <a
                  href={`tel:${developer.mobile}`}
                  className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Developer
                </a>
              )}

              <a
                href="https://wa.me/971502590071"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-emerald-50"
                style={{ borderColor: "#10b981", color: "#10b981" }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>

              <Link
                href="/developers"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Developers
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 pb-16 md:px-6">
        <div className="flex items-baseline gap-3 mb-6">
          <h2
            className="text-[20px] sm:text-[24px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Quick Stats
          </h2>
          <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border p-6 text-center" style={{ borderColor: THEME.border }}>
            <p className="text-[28px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {totalProjects}
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: THEME.muted }}>
              Total Projects
            </p>
          </div>
          <div className="border p-6 text-center" style={{ borderColor: THEME.border }}>
            <p className="text-[28px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {totalProperties}
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: THEME.muted }}>
              Properties
            </p>
          </div>
          <div className="border p-6 text-center" style={{ borderColor: THEME.border }}>
            <p className="text-[28px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {developer.country ? getCountryFlag(developer.country) : "🌍"}
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: THEME.muted }}>
              Country
            </p>
          </div>
          <div className="border p-6 text-center" style={{ borderColor: THEME.border }}>
            <p className="text-[28px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {developer.status === 1 ? "✅" : "⏸️"}
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] mt-1" style={{ color: THEME.muted }}>
              Status
            </p>
          </div>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}