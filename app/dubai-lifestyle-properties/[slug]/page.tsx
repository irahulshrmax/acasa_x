"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Maximize2,
  Loader2,
  MapPin,
  Plus,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Play,
  Grid3x3,
  Map as MapIcon,
  Bath,
  Maximize,
  BedDouble,
  Star,
  Eye,
  Copy,
  TrendingUp,
  Clock,
  Award,
  Crown,
  Gem,
  Sparkles,
} from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";

const API_URL = "/api/v1/properties/lifestyle";
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

interface PropertyDetail {
  id: number;
  property_name: string;
  property_slug: string;
  listing_type: string;
  occupancy: string | null;
  status: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  ref_number: string | null;
  rera_number: string | null;
  price: {
    amount: number | null;
    display: string;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
    sale_price: number | null;
    rental_price: number | null;
  };
  bedrooms: string;
  bathrooms: string;
  area: {
    value: number | null;
    display: string;
    size: string | null;
  };
  location: {
    community: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    community_id: number | null;
    city_id: number | null;
  };
  developer: {
    id: number | null;
    name: string | null;
    logo_url: string | null;
    country: string | null;
    website: string | null;
  };
  agent: {
    id: number | null;
    name: string | null;
    phone: string | null;
    photo_url: string | null;
    rera_brn: string | null;
    email: string | null;
    mobile: string | null;
    about: string | null;
  };
  featured_image: string;
  images: Array<{ id: number; url: string; title: string | null; featured: number }>;
  gallery_images: string[];
  gallery_urls: string[];
  gallery_preview: string[];
  media_base_url: string;
  description: string | null;
  amenities: string[];
  furnishing: string | null;
  flooring: string | null;
  parking: string | null;
  video_url: string | null;
  payment_plans: Array<{
    id: number;
    name: string;
    percentage: string;
    item_id: number;
    item_type: string | null;
  }>;
  display_title: string;
  facilities: any;
  location_data: any;
  is_off_plan: boolean;
  seo: {
    title: string;
    description: string | null;
    keywords: string | null;
    slug: string;
  };
  similar_properties: any[];
  project_id: number | null;
  amenities_list?: {
    swimming_pool: boolean;
    gymnasium: boolean;
    sauna: boolean;
    jacuzzi: boolean;
    tennis_court: boolean;
    golf_course: boolean;
    concierge: boolean;
    valet_parking: boolean;
    steam_room: boolean;
    bbo: boolean;
    child_play_area: boolean;
  };
}

// ─── Image URL Helper ──────────────────────────────────────────────────

function fixImageUrl(url: string | null): string {
  if (!url) return '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    return `https://acasa.ae${url}`;
  }
  
  if (url.includes('.')) {
    return `https://acasa.ae/upload/media/${url}`;
  }
  
  if (/^\d+$/.test(url)) {
    return `https://acasa.ae/upload/media/${url}`;
  }
  
  if (url.includes('/')) {
    return `https://acasa.ae/upload/${url}`;
  }
  
  return `https://acasa.ae/upload/media/${url}`;
}

function getDisplayName(property: any): string {
  if (!property) return 'Property';
  if (property.property_name && property.property_name !== 'Null' && property.property_name !== 'null') {
    return property.property_name;
  }
  if (property.property_slug) {
    return property.property_slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase())
      .replace(/\bLn\d+\b/g, '')
      .trim() || `Property ${property.id}`;
  }
  return `Property ${property.id}`;
}

// ─── LOADER ───────────────────────────────────────────────────────────────

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
          Loading Lifestyle Property
        </motion.p>
      </div>
    </div>
  );
}

// ─── GALLERY MODAL ──────────────────────────────────────────────────────

function GalleryModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentIndex] as HTMLElement;
    activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/97"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-[11px] tracking-[0.2em] text-white/50">
          {currentIndex + 1} <span className="text-white/25">/</span> {images.length}
        </span>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-16">
        <button
          onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-105"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <AnimatePresence mode="sync">
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            src={images[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </AnimatePresence>

        <button
          onClick={() => onNavigate((currentIndex + 1) % images.length)}
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-105"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="pb-6 pt-4">
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                i === currentIndex
                  ? "ring-2 ring-white opacity-100 scale-105"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PAYMENT PLANS ──────────────────────────────────────────────────────

function PaymentPlans({ plans }: { plans: any[] }) {
  if (!plans?.length) return null;
  const sorted = [...plans].sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-[22px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
          Payment Plans
        </h2>
        <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden border p-6 text-center transition-shadow hover:shadow-md"
            style={{ borderColor: THEME.border }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ backgroundColor: THEME.accent }}
            />
            <p
              className="text-[40px] font-light leading-none"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {plan.percentage}
              <span className="text-[24px]">%</span>
            </p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: THEME.muted }}>
              {plan.name}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── PROPERTY MAP ──────────────────────────────────────────────────────

function PropertyMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50">
        <MapIcon className="h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">Map unavailable</p>
      </div>
    );
  }
  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`}
      allowFullScreen
      onError={() => setErr(true)}
    />
  );
}

// ─── SIMILAR CARD ──────────────────────────────────────────────────────

function SimilarCard({ property, index }: { property: any; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const img = !imgErr
    ? property.featured_image || property.gallery_urls?.[0] || property.images?.[0]?.url || null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/lifestyle-properties/${property.slug}`)}
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
        {property.featured && (
          <span
            className="absolute left-0 top-3 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
            style={{ backgroundColor: THEME.accent }}
          >
            Featured
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <h3
          className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#C9A96E]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {property.name}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <MapPin className="h-3 w-3" />
          {property.location?.community || property.location?.city || "Dubai"}
        </p>
        <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
          {property.price?.is_price_on_request ? "On Request" : property.price?.display || "On Request"}
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

// ─── SIMILAR PROPERTIES ───────────────────────────────────────────────

function SimilarProperties({ currentId, similarList }: { currentId: number; similarList?: any[] }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (similarList && similarList.length > 0) {
      setList(similarList);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}?page=1&limit=6&sort_by=newest&status=5`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setList(data.data.filter((p: any) => p.id !== currentId).slice(0, 3));
        }
      } catch {}
      setLoading(false);
    })();
  }, [currentId, similarList]);

  if (loading || !list.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t mt-16 pt-16"
      style={{ borderColor: THEME.border }}
    >
      <div className="mx-auto max-w-[1180px] px-4 pb-16 md:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: THEME.accent }}>
              Explore More
            </p>
            <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              Similar Lifestyle Properties
            </h2>
          </div>
          <Link
            href="/lifestyle-properties"
            className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
            style={{ color: THEME.primary }}
          >
            View All
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <SimilarCard key={p.id} property={p} index={i} />
          ))}
        </div>
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/lifestyle-properties"
            className="inline-block border px-8 py-3 text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-gray-50"
            style={{ borderColor: THEME.border, color: THEME.primary }}
          >
            View All Lifestyle Properties
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function LifestylePropertyDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "amenities" | "plans">("overview");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Lifestyle property not found");
        setProperty(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!property) return;
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist_lifestyle") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("property_wishlist_lifestyle") || "[]");
        const updated = next
          ? [...saved, property.id]
          : saved.filter((id: number) => id !== property.id);
        localStorage.setItem("property_wishlist_lifestyle", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.property_name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [property]);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    const seen = new Set<string>();
    const add = (url: string) => {
      if (url && !seen.has(url)) seen.add(url);
    };
    if (property.featured_image) add(property.featured_image);
    property.gallery_urls?.forEach(add);
    property.images?.forEach((i) => add(i.url));
    property.gallery_images?.forEach(add);
    property.gallery_preview?.forEach(add);
    return [...seen];
  }, [property]);

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Crown className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Lifestyle property not found"}</p>
          <Link
            href="/lifestyle-properties"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Lifestyle Properties
          </Link>
        </div>
      </div>
    );
  }

  const location = property.location?.community || property.location?.city || "Dubai";
  const refNumber = property.ref_number || `LN${property.id}`;
  const lat = property.location?.latitude ?? 25.0657;
  const lng = property.location?.longitude ?? 55.1713;
  const displayName = getDisplayName(property);

  const specs = [
    { icon: BedDouble, label: property.bedrooms || "Studio" },
    { icon: Bath, label: property.bathrooms },
    { icon: Maximize, label: property.area?.display || "N/A" },
  ].filter((s) => s.label);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* ─── Breadcrumb ── */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/lifestyle-properties" className="hover:text-gray-600 transition-colors">
                Lifestyle Properties
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {property.property_name}
              </span>
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

              <button
                onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })}
                className="hidden sm:flex items-center gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Header ── */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.featured && (
                <span
                  className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.accent }}
                >
                  Featured
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-amber-50 text-amber-700 border border-amber-200">
                <Crown className="h-2.5 w-2.5" />
                Lifestyle
              </span>
              {property.exclusive_status && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-purple-50 text-purple-700 border border-purple-200">
                  <Award className="h-2.5 w-2.5" />
                  {property.exclusive_status}
                </span>
              )}
              {property.completion_date && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-blue-50 text-blue-700 border border-blue-200">
                  <Calendar className="h-2.5 w-2.5" />
                  Completion: {property.completion_date}
                </span>
              )}
              {property.dld_permit && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-orange-50 text-orange-700 border border-orange-200">
                  <Shield className="h-2.5 w-2.5" />
                  DLD: {property.dld_permit}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {property.property_name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {property.location?.address
                    ? `${property.location.address}, ${location}`
                    : location}
                </span>
              </div>
              {property.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Listed {new Date(property.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {property.developer?.name && (
              <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: THEME.muted }}>
                <Building2 className="h-3.5 w-3.5" />
                <span>by {property.developer.name}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              Price
            </p>
            <p
              className="text-[26px] sm:text-[32px] font-light leading-none"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {property.price?.is_price_on_request ? "On Request" : property.price?.display || "On Request"}
            </p>
            {!property.price?.is_price_on_request && property.price?.currency && (
              <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: THEME.muted }}>
                {property.price.currency}
              </p>
            )}
            {property.price?.rental_price && (
              <p className="mt-1 text-[11px]" style={{ color: THEME.muted }}>
                Rental: {property.price.currency} {property.price.rental_price.toLocaleString()}
              </p>
            )}
            <p className="mt-2 text-[9px]" style={{ color: THEME.muted }}>
              Ref: {refNumber}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {specs.map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2"
              style={{ borderColor: THEME.border }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {label}
              </span>
            </div>
          ))}
          {property.occupancy && (
            <div
              className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2"
              style={{ borderColor: THEME.border }}
            >
              <Clock className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {property.occupancy}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Gallery ── */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div
          className="relative overflow-hidden bg-gray-100 aspect-[16/9] group cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <AnimatePresence mode="sync">
            {galleryImages.length > 0 ? (
              <motion.img
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={galleryImages[activeIndex]}
                alt={property.property_name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex gap-2">
            {galleryImages.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 bg-white/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-800 backdrop-blur-sm transition-colors hover:bg-white"
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                All Photos ({galleryImages.length})
              </button>
            )}
            {property.video_url && (
              <a
                href={property.video_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Play className="h-3.5 w-3.5" />
                Video Tour
              </a>
            )}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-[3px] bg-black/50 px-3 py-1.5 text-[9px] uppercase tracking-widest text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
            View Gallery
          </div>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % galleryImages.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(showAllPhotos ? galleryImages : galleryImages.slice(0, 10)).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                    i === activeIndex ? "opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                  style={
                    i === activeIndex
                      ? { outline: `2px solid ${THEME.primary}`, outlineOffset: "-1px" }
                      : {}
                  }
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
              {!showAllPhotos && galleryImages.length > 10 && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="flex h-16 w-24 flex-shrink-0 items-center justify-center border text-[9px] uppercase tracking-widest transition-colors hover:bg-gray-50"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {galleryImages.length - 10}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Content Grid ── */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left Column */}
          <div>
            <div className="flex border-b mb-8" style={{ borderColor: THEME.border }}>
              {(["overview", "amenities", "plans"] as const)
                .filter((tab) => {
                  if (tab === "amenities") return property.amenities?.length > 0;
                  if (tab === "plans") return property.payment_plans?.length > 0;
                  return true;
                })
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? "border-current"
                        : "border-transparent hover:text-gray-700"
                    }`}
                    style={
                      activeTab === tab
                        ? { color: THEME.primary, borderColor: THEME.primary }
                        : { color: THEME.muted }
                    }
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "amenities" && `Amenities (${property.amenities?.length || 0})`}
                    {tab === "plans" && `Payment Plans (${property.payment_plans?.length || 0})`}
                  </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2
                    className="text-[20px] sm:text-[24px] leading-snug mb-4"
                    style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                  >
                    {property.display_title || property.property_name}
                  </h2>

                  {property.description ? (
                    <div
                      className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                      style={{ color: "#4A5462" }}
                      dangerouslySetInnerHTML={{ __html: property.description }}
                    />
                  ) : (
                    <p className="text-[13px] leading-relaxed" style={{ color: "#4A5462" }}>
                      Welcome to {property.property_name}, a premium lifestyle development
                      in {location}, Dubai. This exceptional property offers world-class
                      amenities and stunning views.
                    </p>
                  )}

                  <div
                    className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3"
                    style={{ borderColor: THEME.border }}
                  >
                    {[
                      { label: "Property Type", value: property.listing_type },
                      { label: "Bedrooms", value: property.bedrooms },
                      { label: "Bathrooms", value: property.bathrooms },
                      { label: "Area", value: property.area?.display },
                      { label: "Furnishing", value: property.furnishing },
                      { label: "Flooring", value: property.flooring },
                      { label: "Parking", value: property.parking },
                      { label: "DLD Permit", value: property.dld_permit },
                      { label: "RERA No.", value: property.rera_number },
                      { label: "Completion", value: property.completion_date },
                      { label: "Occupancy", value: property.occupancy },
                      { label: "Ref Number", value: refNumber },
                    ]
                      .filter((item) => item.value)
                      .map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: THEME.muted }}>
                            {label}
                          </p>
                          <p className="text-[12px] font-medium" style={{ color: THEME.primary }}>
                            {value}
                          </p>
                        </div>
                      ))}
                  </div>

                  {property.developer?.name && (
                    <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Developer
                      </p>
                      <div className="flex items-center gap-4">
                        {property.developer.logo_url && (
                          <div
                            className="flex h-14 w-20 items-center justify-center border rounded-[3px] p-2"
                            style={{ borderColor: THEME.border }}
                          >
                            <img
                              src={fixImageUrl(property.developer.logo_url)}
                              alt={property.developer.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-[15px] font-medium" style={{ color: THEME.primary }}>
                            {property.developer.name}
                          </p>
                          {property.developer.country && (
                            <p className="text-[11px] mt-0.5" style={{ color: THEME.muted }}>
                              {property.developer.country}
                            </p>
                          )}
                          {property.developer.website && (
                            <a
                              href={property.developer.website}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] underline hover:no-underline"
                              style={{ color: THEME.primary }}
                            >
                              Visit Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {property.agent?.name && (
                    <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Listing Agent
                      </p>
                      <div className="flex items-center gap-4">
                        {property.agent.photo_url ? (
                          <img
                            src={fixImageUrl(property.agent.photo_url)}
                            alt={property.agent.name}
                            className="h-14 w-14 rounded-full object-cover border-2"
                            style={{ borderColor: THEME.border }}
                          />
                        ) : (
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${THEME.primary}10` }}
                          >
                            <span
                              className="text-[18px] font-medium"
                              style={{ color: THEME.primary }}
                            >
                              {property.agent.name[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] font-medium" style={{ color: THEME.primary }}>
                            {property.agent.name}
                          </p>
                          {property.agent.phone && (
                            <a
                              href={`tel:${property.agent.phone}`}
                              className="mt-1 flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-70"
                              style={{ color: THEME.muted }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {property.agent.phone}
                            </a>
                          )}
                          {property.agent.rera_brn && (
                            <p className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: THEME.muted }}>
                              <Shield className="h-3 w-3" />
                              BRN: {property.agent.rera_brn}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "amenities" && property.amenities?.length > 0 && (
                <motion.div
                  key="amenities"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities.map((amenity, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 border rounded-[3px] px-4 py-3"
                        style={{ borderColor: THEME.border }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: THEME.accent }}
                        />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>
                          {amenity}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {property.amenities_list && (
                    <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Premium Amenities
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(property.amenities_list)
                          .filter(([_, value]) => value === true)
                          .map(([key]) => (
                            <div key={key} className="flex items-center gap-2 text-[11px]" style={{ color: THEME.primary }}>
                              <span className="h-1 w-1 rounded-full bg-amber-500" />
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "plans" && property.payment_plans?.length > 0 && (
                <motion.div
                  key="plans"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <PaymentPlans plans={property.payment_plans} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right Column - Enquiry Form ── */}
          <aside id="enquiry">
            <div className="sticky top-6">
              {/* ✅ Updated EnquiryForm with proper props */}
              <EnquiryForm
                propertyName={displayName}
                refNumber={refNumber}
                propertyId={property.id}
                agentId={property.agent?.id}
                agentName={property.agent?.name}
                agentPhone={property.agent?.phone}
                agentPhoto={property.agent?.photo_url ? fixImageUrl(property.agent.photo_url) : null}
                agentEmail={property.agent?.email}
                listingType={property.listing_type || "For Sale"}
                whatsappNumber="971502590071"
              />

              {property.agent?.phone && (
                <a
                  href={`tel:${property.agent.phone}`}
                  className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call Agent
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Map ── */}
      <div className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
        <div className="mb-6 flex items-baseline gap-3">
          <h2
            className="text-[20px] sm:text-[24px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Location
          </h2>
          <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
        </div>
        <div className="overflow-hidden rounded-[3px] border" style={{ borderColor: THEME.border }}>
          <div className="h-[300px] sm:h-[400px]">
            <PropertyMap lat={lat} lng={lng} name={property.property_name} />
          </div>
          {property.location?.address && (
            <div
              className="flex items-center gap-2 px-4 py-3 border-t"
              style={{ borderColor: THEME.border }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.accent }} />
              <p className="text-[12px]" style={{ color: THEME.muted }}>
                {property.location.address}
                {property.location.city && `, ${property.location.city}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Similar Properties ── */}
      <SimilarProperties currentId={property.id} similarList={property.similar_properties} />

      {/* ─── Gallery Modal ── */}
      <AnimatePresence>
        {showModal && (
          <GalleryModal
            images={galleryImages}
            currentIndex={activeIndex}
            onClose={() => setShowModal(false)}
            onNavigate={setActiveIndex}
          />
        )}
      </AnimatePresence>

      {/* ─── Mobile CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden"
        style={{ borderColor: THEME.border }}
      >
        <div className="flex gap-2">
          <a
            href="https://wa.me/971502590071"
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-colors hover:bg-emerald-50"
            style={{ borderColor: "#10b981" }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-1 items-center justify-center py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white"
            style={{ backgroundColor: THEME.primary }}
          >
            Enquire Now
          </button>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}