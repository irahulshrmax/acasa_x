"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
  Star,
  Home,
  Plus,
  MapPin,
  Globe,
  Clock,
  Search,
  Check,
  Users,
  Download,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Maximize2,
  X,
  Menu,
  Grid3x3,
  List,
  BedDouble,
  Bath,
  Maximize,
  DollarSign,
  Eye,
  Award,
  TrendingUp,
  Calendar,
} from "lucide-react";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0A2540",
  secondary: "#1B3A5F",
  accent: "#0A2540",
  accentLight: "#E8EEF5",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

interface Property {
  id: number;
  property_name: string;
  property_slug: string;
  price: number | null;
  bedroom: string | null;
  bathrooms: string | null;
  area: string | null;
  area_size: string | null;
  featured_image: string | null;
  listing_type: string | null;
  status: number;
}

interface CommunityDetail {
  id: number;
  community_id: number;
  name: string;
  slug: string;
  seo_slug: string | null;
  description: string | null;
  img: string | null;
  image_url: string | null;
  image_variations: string[];
  school_img: string | null;
  hotel_img: string | null;
  hospital_img: string | null;
  train_img: string | null;
  bus_img: string | null;
  latitude: string;
  longitude: string;
  featured: number;
  status: number;
  property_count: number;
  city_name: string;
  city_slug: string;
  country_name: string;
  state_name: string;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  similar_location: string | null;
  properties_list?: Property[];
  similar_communities?: CommunityDetail[];
  sales_diretor?: string | null;
  top_community?: string | null;
  top_projects?: string | null;
  featured_project?: string | null;
  related_blog?: string | null;
}

function fixImageUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/upload/") || url.startsWith("/uploads/")) {
    return `https://acasa.ae${url}`;
  }
  if (url.startsWith("upload/")) {
    return `https://acasa.ae/${url}`;
  }
  return `https://acasa.ae/upload/locations/${url}`;
}

function getDisplayPrice(price: any): string {
  if (!price) return "Price on Request";
  if (typeof price === 'number') return `AED ${price.toLocaleString()}`;
  if (price.amount) return `AED ${price.amount.toLocaleString()}`;
  if (price.display) return price.display;
  return "Price on Request";
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return "Studio";
  const t = bedroom.toLowerCase().trim();
  if (t.includes("studio")) return "Studio";
  if (t.includes("1 bed") || t === "1") return "1 Bedroom";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio";
    if (num === 1) return "1 Bedroom";
    return `${num} Bedrooms`;
  }
  return bedroom;
}

function getBathroomDisplay(bathrooms: string | null): string {
  if (!bathrooms) return "1 Bath";
  const match = bathrooms.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "1 Bath";
    return `${num} Bath${num > 1 ? "s" : ""}`;
  }
  return bathrooms || "1 Bath";
}

function getAreaDisplay(area: any): string {
  if (!area) return "N/A";
  if (typeof area === 'string') return area;
  if (area.display) return area.display;
  if (area.value) return `${area.value} sq.ft`;
  return "N/A";
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${THEME.primary}30` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: THEME.primary, borderRightColor: THEME.primary }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[6px] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: THEME.secondary, borderLeftColor: THEME.secondary }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-5 text-[10px] uppercase tracking-[0.3em] text-[#6B7A8D]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Community...
        </motion.p>
      </div>
    </div>
  );
}

function PropertyCard({ property, router }: { property: Property; router: any }) {
  const [imgErr, setImgErr] = useState(false);

  const img = !imgErr
    ? property.featured_image || null
    : null;

  const priceDisplay = getDisplayPrice(property.price);
  const bedroomDisplay = getBedroomDisplay(property.bedroom);
  const bathroomDisplay = getBathroomDisplay(property.bathrooms);
  const areaDisplay = getAreaDisplay(property.area || property.area_size);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onClick={() => router.push(`/featured-explore-properties/${property.property_slug}`)}
      className="group cursor-pointer rounded-[3px] border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: THEME.border }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={property.property_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Home className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {property.listing_type && (
          <span className="absolute right-3 top-3 rounded-[3px] bg-black/70 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            {property.listing_type}
          </span>
        )}
        {property.status === 5 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-emerald-600/90 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Clock className="h-3 w-3" />
            Off Plan
          </div>
        )}
      </div>
      <div className="p-4">
        <h4
          className="truncate text-[13px] font-medium uppercase tracking-wide"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {property.property_name}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8A94A3]">
          {bedroomDisplay && <span>{bedroomDisplay}</span>}
          {bedroomDisplay && bathroomDisplay && <span>•</span>}
          {bathroomDisplay && <span>{bathroomDisplay}</span>}
          {(bedroomDisplay || bathroomDisplay) && areaDisplay && <span>•</span>}
          {areaDisplay && <span>{areaDisplay}</span>}
        </div>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: THEME.primary }}>
          {priceDisplay}
        </p>
      </div>
    </motion.div>
  );
}

function SimilarCommunityCard({ community, index, router }: { community: CommunityDetail; index: number; router: any }) {
  const [imgErr, setImgErr] = useState(false);

  const img = !imgErr
    ? community.image_url || community.img || null
    : null;

  const linkSlug = community.seo_slug || community.slug;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/dubai/${linkSlug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={community.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Building2 className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {community.featured === 1 && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-[#0A2540] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Star className="h-3 w-3" />
            Featured
          </span>
        )}
        {community.property_count > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Building2 className="h-3 w-3" />
            {community.property_count} Properties
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <h3
          className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#1B3A5F]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {community.name}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <MapPin className="h-3 w-3" /> {community.city_name || "Dubai"}, {community.country_name || "UAE"}
        </p>
        <p className="text-[11px]" style={{ color: THEME.muted }}>
          {community.property_count || 0} properties
        </p>
      </div>
    </motion.div>
  );
}

export default function CommunityDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const fetchedRef = useRef(false);

  // ─── RESOLVE PARAMS ───────────────────────────────────────────────────
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setSlug(resolved.slug);
      } catch (err) {
        console.error("Error resolving params:", err);
        setError("Failed to load page parameters");
        setLoading(false);
      }
    };
    resolveParams();
  }, [params]);

  // ─── FETCH COMMUNITY ─────────────────────────────────────────────────
  useEffect(() => {
    if (!slug || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchCommunity = async () => {
      setLoading(true);
      setError(null);

      try {
        const timestamp = Date.now();
        const apiUrl = `/api/v1/communities/${slug}?include_properties=true&include_related=true&no_cache=true&_=${timestamp}`;

        const res = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Community not found");
          }
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Community not found");
        }

        setCommunity(data.data);
      } catch (err: any) {
        console.error("Error fetching community:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [slug]);

  // ─── WISHLIST ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!community) return;
    try {
      const saved = JSON.parse(localStorage.getItem("community_wishlist") || "[]");
      setIsWishlisted(saved.includes(community.id));
    } catch {}
  }, [community]);

  const toggleWishlist = useCallback(() => {
    if (!community) return;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("community_wishlist") || "[]");
        const updated = next
          ? [...saved, community.id]
          : saved.filter((id: number) => id !== community.id);
        localStorage.setItem("community_wishlist", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [community]);

  const handleShare = useCallback(async () => {
    if (!community) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: community.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [community]);

  // ─── IMAGES ───────────────────────────────────────────────────────────
  const images = useMemo(() => {
    if (!community) return [];
    const seen = new Set<string>();
    const add = (url: string) => {
      if (url && !seen.has(url)) {
        const fixed = fixImageUrl(url);
        seen.add(fixed);
      }
    };

    if (community.image_url) add(community.image_url);
    if (community.image_variations) {
      community.image_variations.forEach((url: string) => add(url));
    }
    if (community.img) add(community.img);

    if (community.school_img) add(community.school_img);
    if (community.hotel_img) add(community.hotel_img);
    if (community.hospital_img) add(community.hospital_img);
    if (community.train_img) add(community.train_img);
    if (community.bus_img) add(community.bus_img);

    if (seen.size === 0) {
      add("https://acasa.ae/upload/no-image.png");
    }
    return [...seen];
  }, [community]);

  // ─── LOADING ──────────────────────────────────────────────────────────
  if (loading) {
    return <PageLoader />;
  }

  // ─── ERROR ────────────────────────────────────────────────────────────
  if (error || !community) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md px-4 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h1 className="text-2xl font-light text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
            Not Found
          </h1>
          <p className="my-4 text-sm text-red-500">{error || "Community not found"}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                fetchedRef.current = false;
                setLoading(true);
                setError(null);
                window.location.reload();
              }}
              className="bg-[#0A2540] px-6 py-2.5 text-[11px] tracking-widest text-white hover:bg-[#1B3A5F]"
            >
              <ArrowLeft className="mr-2 inline h-4 w-4" /> RETRY
            </button>
            <Link
              href="/dubai"
              className="bg-gray-200 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 hover:bg-gray-300"
            >
              All Communities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────────────────
  const location = community.city_name || "Dubai";
  const country = community.country_name || "UAE";
  const isFeatured = community.featured === 1;
  const propertyCount = community.properties_list?.length || community.property_count || 0;
  const displayProperties = community.properties_list || [];
  const hasLocation = community.latitude && community.longitude;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="transition-colors hover:text-[#0A2540]">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/dubai" className="transition-colors hover:text-[#0A2540]">Dubai</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="max-w-[120px] truncate text-gray-500 sm:max-w-none">{community.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleWishlist}
                className={`flex h-9 w-9 items-center justify-center border transition-all ${
                  isWishlisted
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
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

      {/* Header */}
      <div className="mx-auto max-w-[1180px] px-4 pb-6 pt-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              {isFeatured && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white" style={{ backgroundColor: THEME.primary }}>
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {community.status === 1 && (
                <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-emerald-700">
                  <Shield className="h-2.5 w-2.5" /> Active
                </span>
              )}
              {propertyCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]" style={{ backgroundColor: THEME.accentLight, color: THEME.primary }}>
                  <Building2 className="h-2.5 w-2.5" /> {propertyCount} Properties
                </span>
              )}
            </div>

            <h1 className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {community.name}
            </h1>

            <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: THEME.muted }}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> 
              <span>{location}, {country}</span>
            </div>

            {community.seo_slug && (
              <div className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: THEME.muted }}>
                <Globe className="h-3 w-3" /> 
                <span>{community.seo_slug}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          {images.length > 0 ? (
            <img src={images[0]} alt={community.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-300" />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.slice(0, 10).map((img, i) => (
              <div key={i} className="h-16 w-24 flex-shrink-0 overflow-hidden">
                <img src={img} alt={`${community.name} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
            {images.length > 10 && (
              <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center border text-[9px] uppercase tracking-widest" style={{ borderColor: THEME.border, color: THEME.muted }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {images.length - 10}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <div>
            {/* Description */}
            {community.description && (
              <div className="mb-10">
                <h2 className="mb-4 text-[20px] leading-snug sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  About {community.name}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: community.description }}
                />
              </div>
            )}

            {/* Amenities */}
            {(community.school_img || community.hotel_img || community.hospital_img || community.train_img || community.bus_img) && (
              <div className="mb-10">
                <h2 className="mb-4 text-[20px] leading-snug sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Community Amenities
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {community.school_img && (
                    <div className="rounded-[3px] border p-4 text-center" style={{ borderColor: THEME.border }}>
                      <img src={fixImageUrl(community.school_img)} alt="Schools" className="mx-auto h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>Schools</p>
                    </div>
                  )}
                  {community.hotel_img && (
                    <div className="rounded-[3px] border p-4 text-center" style={{ borderColor: THEME.border }}>
                      <img src={fixImageUrl(community.hotel_img)} alt="Hotels" className="mx-auto h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>Hotels</p>
                    </div>
                  )}
                  {community.hospital_img && (
                    <div className="rounded-[3px] border p-4 text-center" style={{ borderColor: THEME.border }}>
                      <img src={fixImageUrl(community.hospital_img)} alt="Hospitals" className="mx-auto h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>Hospitals</p>
                    </div>
                  )}
                  {community.train_img && (
                    <div className="rounded-[3px] border p-4 text-center" style={{ borderColor: THEME.border }}>
                      <img src={fixImageUrl(community.train_img)} alt="Transport" className="mx-auto h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>Transport</p>
                    </div>
                  )}
                  {community.bus_img && (
                    <div className="rounded-[3px] border p-4 text-center" style={{ borderColor: THEME.border }}>
                      <img src={fixImageUrl(community.bus_img)} alt="Buses" className="mx-auto h-12 w-12 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>Buses</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── MAP ─────────────────────────────────────────────────── */}
            {hasLocation && (
              <div className="mb-10">
                <div className="mb-6 flex items-baseline gap-3">
                  <h2 className="text-[20px] leading-snug sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    Location Map
                  </h2>
                  <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="text-[10px] uppercase tracking-[0.15em] transition-colors hover:opacity-70"
                    style={{ color: THEME.primary }}
                  >
                    {showMap ? "Hide Map" : "View Map"}
                  </button>
                </div>

                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden rounded-[3px] border"
                      style={{ borderColor: THEME.border }}
                    >
                      <div className="h-[400px] w-full">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${community.latitude},${community.longitude}&zoom=15`}
                          allowFullScreen
                        />
                      </div>
                      <div className="flex items-center gap-2 border-t px-4 py-3" style={{ borderColor: THEME.border }}>
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.primary }} />
                        <p className="text-[12px]" style={{ color: THEME.muted }}>{community.name}, {location}, {country}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ─── PROPERTIES ──────────────────────────────────────────── */}
            {displayProperties.length > 0 && (
              <div className="mb-10">
                <div className="mb-6 flex items-baseline gap-3">
                  <h2 className="text-[20px] leading-snug sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    Properties in {community.name}
                  </h2>
                  <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {(showAllProperties ? displayProperties : displayProperties.slice(0, 6)).map((property) => (
                    <PropertyCard key={property.id} property={property} router={router} />
                  ))}
                </div>

                {displayProperties.length > 6 && (
                  <button
                    onClick={() => setShowAllProperties(!showAllProperties)}
                    className="mt-6 flex items-center justify-center gap-2 border px-6 py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-colors hover:bg-gray-50"
                    style={{ borderColor: THEME.border, color: THEME.primary }}
                  >
                    {showAllProperties ? "Show Less" : `View All ${displayProperties.length} Properties`}
                  </button>
                )}
              </div>
            )}

            {/* ─── BROCHURE ────────────────────────────────────────────── */}
            <div className="mb-10">
              <div className="mb-6 flex items-baseline gap-3">
                <h2 className="text-[20px] leading-snug sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Community Brochure
                </h2>
                <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => {
                    const brochureUrl = `https://acasa.ae/brochures/community-${community.id}.pdf`;
                    window.open(brochureUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-3 border py-4 transition-colors hover:bg-gray-50"
                  style={{ borderColor: THEME.border }}
                >
                  <FileText className="h-5 w-5" style={{ color: THEME.primary }} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.primary }}>
                    Download Brochure
                  </span>
                  <Download className="h-4 w-4" style={{ color: THEME.muted }} />
                </button>

                <button
                  onClick={() => {
                    const communityUrl = `https://acasa.ae/dubai/${community.seo_slug || community.slug}`;
                    window.open(communityUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-3 border py-4 transition-colors hover:bg-gray-50"
                  style={{ borderColor: THEME.border }}
                >
                  <ExternalLink className="h-5 w-5" style={{ color: THEME.primary }} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.primary }}>
                    View on Website
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ────────────────────────────────────────── */}
          <aside>
            <div className="sticky top-6 space-y-4">
              <div className="border bg-white p-5" style={{ borderColor: THEME.border }}>
                <h3 className="text-[16px] font-normal" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>Community Overview</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: THEME.border }}>
                    <span className="text-[11px]" style={{ color: THEME.muted }}>Properties</span>
                    <span className="text-[14px] font-medium" style={{ color: THEME.primary }}>{propertyCount}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: THEME.border }}>
                    <span className="text-[11px]" style={{ color: THEME.muted }}>Location</span>
                    <span className="text-[12px] font-medium" style={{ color: THEME.primary }}>{location}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: THEME.border }}>
                    <span className="text-[11px]" style={{ color: THEME.muted }}>Status</span>
                    <span className={`text-[11px] font-medium ${community.status === 1 ? "text-emerald-600" : "text-gray-400"}`}>
                      {community.status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {community.featured === 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: THEME.muted }}>Featured</span>
                      <span className="text-[11px] font-medium text-[#0A2540]"><Star className="inline h-3.5 w-3.5" /> Yes</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border bg-white p-5" style={{ borderColor: THEME.border }}>
                <h3 className="text-[14px] font-normal" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>Quick Links</h3>
                <div className="mt-3 space-y-2">
                  <Link href={`/dubai/${slug}/properties`} className="flex items-center gap-2 text-[11px] transition-colors hover:opacity-70" style={{ color: THEME.primary }}>
                    <Building2 className="h-3.5 w-3.5" />
                    View All Properties
                  </Link>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2 text-[11px] transition-colors hover:opacity-70"
                    style={{ color: THEME.primary }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {showMap ? "Hide Map" : "View on Map"}
                  </button>
                  <button
                    onClick={() => {
                      const brochureUrl = `https://acasa.ae/brochures/community-${community.id}.pdf`;
                      window.open(brochureUrl, '_blank');
                    }}
                    className="flex items-center gap-2 text-[11px] transition-colors hover:opacity-70"
                    style={{ color: THEME.primary }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Download Brochure
                  </button>
                </div>
              </div>

              <div className="border bg-white p-5" style={{ borderColor: THEME.border }}>
                <h3 className="text-[14px] font-normal" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>Contact</h3>
                <div className="mt-3 space-y-2">
                  {community.sales_diretor && (
                    <p className="text-[11px] flex items-center gap-2" style={{ color: THEME.muted }}>
                      <Users className="h-3.5 w-3.5" />
                      <span>Sales Director: {community.sales_diretor}</span>
                    </p>
                  )}
                  <button className="flex w-full items-center justify-center gap-2 bg-[#0A2540] py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#1B3A5F]">
                    <Phone className="h-3.5 w-3.5" />
                    Contact Agent
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ─── SIMILAR COMMUNITIES ──────────────────────────────────────── */}
      {community.similar_communities && community.similar_communities.length > 0 && (
        <div className="border-t pb-16 pt-16" style={{ borderColor: THEME.border }}>
          <div className="mx-auto max-w-[1180px] px-4 md:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[9px] uppercase tracking-[0.25em]" style={{ color: THEME.primary }}>Explore More</p>
                <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>Similar Communities</h2>
                <p className="mt-1 text-[12px]" style={{ color: THEME.muted }}>
                  Discover other premium communities in Dubai
                </p>
              </div>
              <Link href="/dubai" className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex" style={{ color: THEME.primary }}>
                View All <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {community.similar_communities.slice(0, 4).map((c, i) => (
                <SimilarCommunityCard key={c.id} community={c} index={i} router={router} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}