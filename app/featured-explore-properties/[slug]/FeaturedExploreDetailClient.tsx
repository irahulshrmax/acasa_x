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
  X,
  Maximize2,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Play,
  Grid3x3,
  Bath,
  BedDouble,
  Maximize,
  Star,
  Eye,
  Home,
  Plus,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import BrochureDownload from "@/components/Brochure";
import EnquiryForm from "@/components/EnquiryForm";

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

interface PropertyDetail {
  id: number;
  property_name: string;
  property_slug: string;
  listing_type: string;
  occupancy: string | null;
  status: number;
  featured: boolean;
  created_at: string;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  ref_number: string | null;
  rera_number: string | null;
  price: {
    amount: number | null;
    display: string | null;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  bedrooms: string;
  bathrooms: string;
  area: {
    value: number | null;
    display: string | null;
    size: string | null;
  };
  location: {
    community: string | null;
    city: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    community_id: number | null;
  };
  developer: {
    id: number | null;
    name: string | null;
    logo: string | null;
    country: string | null;
    website: string | null;
  };
  agent: {
    id: number | null;
    name: string | null;
    phone: string | null;
    photo: string | null;
    rera_brn: string | null;
    email: string | null;
  };
  featured_image: string | null;
  images: Array<{ id: number; url: string; title: string | null; featured: number }>;
  gallery_images: string[];
  gallery_urls: string[];
  gallery_preview: string[];
  description: string | null;
  amenities: string[];
  furnishing: string | null;
  flooring: string | null;
  parking: string | null;
  video_url: string | null;
  payment_plans: Array<{ id: number; name: string; percentage: string }>;
  display_title: string | null;
}

// ─── Image URL Helper ──────────────────────────────────────────────────

function fixImageUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/upload/") && !url.includes("/media/")) {
    return url.replace("/upload/", "https://acasa.ae/upload/media/");
  }
  if (url.startsWith("upload/")) {
    return `https://acasa.ae/upload/media/${url.replace("upload/", "")}`;
  }
  if (url.startsWith("media/")) {
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

function getDisplayPrice(price: any): string {
  if (!price) return "Price on Request";
  if (price.is_price_on_request) return "Price on Request";
  if (price.display) return price.display;
  if (price.amount) return `AED ${price.amount.toLocaleString()}`;
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
  if (area.display) return area.display;
  if (area.value) return `${area.value} sq.ft`;
  return "N/A";
}

function getOccupancyLabel(occupancy: string | null): string {
  if (!occupancy) return "Available";
  const map: Record<string, string> = {
    "under construction": "Under Construction",
    "ready to move": "Ready to Move",
    vacant: "Vacant",
    ready: "Ready to Move",
    "off plan": "Off Plan",
  };
  const key = occupancy.toLowerCase().trim();
  return map[key] || occupancy;
}

function getCompletionStatus(date: string | null): string {
  if (!date) return "Date TBC";
  try {
    const now = new Date();
    const comp = new Date(date);
    if (isNaN(comp.getTime())) return "Date TBC";
    const diffMonths =
      (comp.getFullYear() - now.getFullYear()) * 12 + (comp.getMonth() - now.getMonth());
    if (diffMonths < 0) return "Ready to Move";
    if (diffMonths <= 3) return "Handover in 3 Months";
    if (diffMonths <= 6) return "Handover in 6 Months";
    return `Handover ${comp.getFullYear()}`;
  } catch {
    return "Date TBC";
  }
}

// ─── LOADER ───────────────────────────────────────────────────────────────

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
          className="mt-5 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: THEME.muted }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Property
        </motion.p>
      </div>
    </div>
  );
}

// ─── SIMILAR CARD ──────────────────────────────────────────────────────

function SimilarCard({ property, index }: { property: any; index: number }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);

  const img = !imgErr
    ? property.featured_image || property.image_url || property.gallery_urls?.[0] || null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() =>
        router.push(`/featured-explore-properties/${property.property_slug || property.slug}`)
      }
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={property.property_name || property.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Building2 className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="mt-4 space-y-1">
        <h3
          className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#1B3A5F]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {property.property_name || property.name}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <MapPin className="h-3 w-3" /> {property.location?.city || "Dubai"}
        </p>
        <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
          {getDisplayPrice(property.price)}
        </p>
      </div>
    </motion.div>
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
      if (e.key === "ArrowLeft")
        onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        onNavigate((currentIndex + 1) % images.length);
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
                  ? "scale-105 opacity-100 ring-2 ring-white"
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

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function FeaturedExploreDetailClient({ slug }: { slug: string }) {
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
  const [similarProperties, setSimilarProperties] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!slug || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `/api/v1/properties/${slug}`;
        console.log("🔍 [Detail] Fetching:", apiUrl);
        
        const res = await fetch(apiUrl);
        console.log("📡 [Detail] Response status:", res.status);

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ [Detail] Data received:", data);

        if (!data.success || !data.data) {
          throw new Error(data.message || "Property not found");
        }

        setProperty(data.data);
      } catch (err: any) {
        console.error("❌ [Detail] Error:", err);
        setError(err.message);
        toast.error(err.message || "Failed to load property");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [slug]);

  useEffect(() => {
    if (!property) return;

    const fetchSimilar = async () => {
      setSimilarLoading(true);
      try {
        const res = await fetch(
          `/api/v1/properties?page=1&limit=6&sort_by=newest&listing_type=Off plan&status=5&show_all=true`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setSimilarProperties(
            data.data.filter((p: any) => p.id !== property.id).slice(0, 3)
          );
        }
      } catch (err) {
        console.error("Similar properties error:", err);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilar();
  }, [property]);

  useEffect(() => {
    if (!property) return;
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
        const updated = next
          ? [...saved, property.id]
          : saved.filter((id: number) => id !== property.id);
        localStorage.setItem("property_wishlist", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.property_name, url: window.location.href });
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

    if (property.featured_image) add(fixImageUrl(property.featured_image));
    if (property.gallery_urls) property.gallery_urls.forEach((url: string) => add(fixImageUrl(url)));
    if (property.gallery_images)
      property.gallery_images.forEach((url: string) => add(fixImageUrl(url)));
    if (property.images) property.images.forEach((img: any) => {
      if (img.url) add(fixImageUrl(img.url));
    });
    if (property.gallery_preview)
      property.gallery_preview.forEach((url: string) => add(fixImageUrl(url)));

    if (seen.size === 0) add("https://acasa.ae/upload/no-image.png");
    return [...seen];
  }, [property]);

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md px-4 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h1 className="text-2xl font-light text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
            Not Found
          </h1>
          <p className="my-4 text-sm text-red-500">{error || "Property not found"}</p>
          <div className="mt-4 max-h-32 overflow-auto rounded border border-gray-200 bg-gray-50 p-4 text-left font-mono text-xs">
            <p>
              <strong>Slug:</strong> {slug}
            </p>
            <p>
              <strong>API:</strong> /api/v1/properties/{slug}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
              href="/featured-explore-properties"
              className="bg-gray-200 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 hover:bg-gray-300"
            >
              All Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const location = property.location?.community || property.location?.city || "Dubai";
  const refNumber = property.ref_number || `LN${property.id}`;
  const lat = property.location?.latitude ?? 25.0657;
  const lng = property.location?.longitude ?? 55.1713;
  const displayName = getDisplayName(property);
  const priceDisplay = getDisplayPrice(property.price);
  const bedroomDisplay = getBedroomDisplay(property.bedrooms);
  const bathroomDisplay = getBathroomDisplay(property.bathrooms);
  const areaDisplay = getAreaDisplay(property.area);
  const occupancyLabel = getOccupancyLabel(property.occupancy);
  const completionStatus = getCompletionStatus(property.completion_date);

  const specs = [
    { icon: BedDouble, label: bedroomDisplay },
    { icon: Bath, label: bathroomDisplay },
    { icon: Maximize, label: areaDisplay },
  ].filter((s) => s.label);

  const hasGallery = galleryImages.length > 0;
  const mainImage = hasGallery ? galleryImages[activeIndex % galleryImages.length] : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]"
              style={{ color: THEME.muted }}
            >
              <Link href="/" className="transition-colors hover:text-[#0A2540]">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link
                href="/featured-explore-properties"
                className="transition-colors hover:text-[#0A2540]"
              >
                Featured
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="max-w-[120px] truncate text-gray-500 sm:max-w-none">
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
                className="hidden items-center gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 sm:flex"
                style={{ backgroundColor: THEME.primary }}
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Property Header */}
      <div className="mx-auto max-w-[1180px] px-4 pb-6 pt-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              {property.featured && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.primary }}
                >
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {property.listing_type && (
                <span
                  className="border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  {property.listing_type}
                </span>
              )}
              {property.exclusive_status && (
                <span className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-emerald-700">
                  <Star className="h-2.5 w-2.5" /> {property.exclusive_status}
                </span>
              )}
              {property.occupancy && (
                <span
                  className="px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]"
                  style={{ backgroundColor: THEME.accentLight, color: THEME.primary }}
                >
                  {occupancyLabel}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {property.property_name}
            </h1>

            <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: THEME.muted }}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> <span>{location}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className="mb-1 text-[9px] uppercase tracking-[0.2em]"
              style={{ color: THEME.muted }}
            >
              {property.price?.is_price_on_request ? "Price" : "Starting Price"}
            </p>
            <p
              className="text-[26px] font-light leading-none sm:text-[32px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {priceDisplay}
            </p>
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
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.primary }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {label}
              </span>
            </div>
          ))}
          {property.completion_date && (
            <div
              className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2"
              style={{ borderColor: THEME.border }}
            >
              <Calendar className="h-3.5 w-3.5" style={{ color: THEME.primary }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {completionStatus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div
          className="group relative aspect-[16/9] overflow-hidden bg-gray-100 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt={property.property_name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex gap-2">
            {hasGallery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 bg-white/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[#0A2540] backdrop-blur-sm transition-colors hover:bg-white"
              >
                <Grid3x3 className="h-3.5 w-3.5" /> All Photos ({galleryImages.length})
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
                <Play className="h-3.5 w-3.5" /> Video Tour
              </a>
            )}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-[3px] bg-black/50 px-3 py-1.5 text-[9px] uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" /> View Gallery
          </div>

          {hasGallery && galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % galleryImages.length);
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {hasGallery && galleryImages.length > 1 && (
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
                  <Plus className="mr-1 h-3.5 w-3.5" /> {galleryImages.length - 10}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Brochure Download Section */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 md:px-6">
        <div
          className="border p-6 sm:p-8"
          style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[3px]"
                style={{ backgroundColor: THEME.primary }}
              >
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3
                  className="text-[18px] sm:text-[20px]"
                  style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                >
                  Download Property Brochure
                </h3>
                <p className="mt-1 text-[12px]" style={{ color: THEME.muted }}>
                  Get complete property details, floor plans & payment plans
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <BrochureDownload
                propertyId={property.id}
                propertyName={property.property_name}
                propertyData={{
                  id: property.id,
                  property_name: property.property_name,
                  property_slug: property.property_slug,
                  description: property.description,
                  price: property.price?.amount,
                  bedroom: property.bedrooms,
                  bathroom: property.bathrooms,
                  area: property.area?.value,
                  area_size: property.area?.size,
                  completion_date: property.completion_date,
                  occupancy: property.occupancy,
                  listing_type: property.listing_type,
                  featured: property.featured,
                  featured_image: property.featured_image,
                  image_url: property.featured_image,
                  gallery_images: galleryImages,
                  gallery: galleryImages,
                  rera_number: property.rera_number,
                  dld_permit: property.dld_permit,
                  exclusive_status: property.exclusive_status,
                  developer_name: property.developer?.name,
                  developer_logo: property.developer?.logo,
                  developer_country: property.developer?.country,
                  developer_website: property.developer?.website,
                  community_name: property.location?.community,
                  city_name: property.location?.city,
                  address: property.location?.address,
                  map_latitude: property.location?.latitude,
                  map_longitude: property.location?.longitude,
                  amenities: property.amenities,
                  payment_plans: property.payment_plans,
                  agent_name: property.agent?.name,
                  agent_phone: property.agent?.phone,
                  agent_photo: property.agent?.photo,
                  agent_rera: property.agent?.rera_brn,
                }}
                variant="property"
                showStats={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <div>
            <div className="mb-8 flex border-b" style={{ borderColor: THEME.border }}>
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
                    className={`-mb-px border-b-2 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-colors ${
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
                    {tab}
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
                    className="mb-4 text-[20px] leading-snug sm:text-[24px]"
                    style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                  >
                    {property.display_title || property.property_name}
                    {property.developer?.name && (
                      <span className="mt-1 block text-[16px]" style={{ color: THEME.muted }}>
                        by {property.developer.name}
                      </span>
                    )}
                  </h2>

                  {property.description ? (
                    <div
                      className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                      style={{ color: "#4A5462" }}
                      dangerouslySetInnerHTML={{ __html: property.description }}
                    />
                  ) : (
                    <p className="text-[13px] leading-relaxed" style={{ color: "#4A5462" }}>
                      Welcome to {property.property_name}, a distinguished residential development in{" "}
                      {location}, Dubai.
                    </p>
                  )}

                  <div
                    className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3"
                    style={{ borderColor: THEME.border }}
                  >
                    {[
                      { label: "Property Type", value: property.listing_type },
                      { label: "Bedrooms", value: bedroomDisplay },
                      { label: "Bathrooms", value: bathroomDisplay },
                      { label: "Area", value: areaDisplay },
                      { label: "Furnishing", value: property.furnishing || "N/A" },
                      { label: "Parking", value: property.parking || "N/A" },
                      { label: "DLD Permit", value: property.dld_permit || "N/A" },
                      { label: "RERA No.", value: property.rera_number || "N/A" },
                      { label: "Completion", value: completionStatus },
                      { label: "Occupancy", value: occupancyLabel },
                      { label: "Ref Number", value: refNumber },
                    ]
                      .filter((item) => item.value && item.value !== "N/A")
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
                      <p className="mb-4 text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>
                        Developer
                      </p>
                      <div className="flex items-center gap-4">
                        {property.developer.logo && (
                          <div
                            className="flex h-14 w-20 items-center justify-center rounded-[3px] border p-2"
                            style={{ borderColor: THEME.border }}
                          >
                            <img
                              src={fixImageUrl(property.developer.logo)}
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
                            <p className="mt-0.5 text-[11px]" style={{ color: THEME.muted }}>
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
                              Visit Website <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {property.agent?.name && (
                    <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                      <p className="mb-4 text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>
                        Listing Agent
                      </p>
                      <div className="flex items-center gap-4">
                        {property.agent.photo ? (
                          <img
                            src={fixImageUrl(property.agent.photo)}
                            alt={property.agent.name}
                            className="h-14 w-14 rounded-full border-2 object-cover"
                            style={{ borderColor: THEME.border }}
                          />
                        ) : (
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${THEME.primary}10` }}
                          >
                            <span className="text-[18px] font-medium" style={{ color: THEME.primary }}>
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
                              <Phone className="h-3.5 w-3.5" /> {property.agent.phone}
                            </a>
                          )}
                          {property.agent.rera_brn && (
                            <p className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: THEME.muted }}>
                              <Shield className="h-3 w-3" /> BRN: {property.agent.rera_brn}
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
                        className="flex items-center gap-3 rounded-[3px] border px-4 py-3"
                        style={{ borderColor: THEME.border }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: THEME.primary }}
                        />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>
                          {amenity}
                        </span>
                      </motion.div>
                    ))}
                  </div>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {[...property.payment_plans]
                      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage))
                      .map((plan, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          whileHover={{ y: -2 }}
                          className="relative overflow-hidden border p-6 text-center transition-shadow hover:shadow-md"
                          style={{ borderColor: THEME.border }}
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-0.5"
                            style={{ backgroundColor: THEME.primary }}
                          />
                          <p
                            className="text-[40px] font-light leading-none"
                            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                          >
                            {plan.percentage}
                            <span className="text-[24px]">%</span>
                          </p>
                          <p
                            className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: THEME.muted }}
                          >
                            {plan.name}
                          </p>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right - Enquiry Form ── */}
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
                agentPhoto={property.agent?.photo ? fixImageUrl(property.agent.photo) : null}
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
                  <Phone className="h-3.5 w-3.5" /> Call Agent
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Map */}
      <div className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
        <div className="mb-6 flex items-baseline gap-3">
          <h2 className="text-[20px] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
            Location
          </h2>
          <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
        </div>
        <div className="overflow-hidden rounded-[3px] border" style={{ borderColor: THEME.border }}>
          <div className="h-[300px] sm:h-[400px]">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`}
              allowFullScreen
            />
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-3" style={{ borderColor: THEME.border }}>
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.primary }} />
            <p className="text-[12px]" style={{ color: THEME.muted }}>
              {property.location?.address || property.property_name}, {location}, Dubai
            </p>
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <div className="border-t pb-16 pt-16" style={{ borderColor: THEME.border }}>
          <div className="mx-auto max-w-[1180px] px-4 md:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[9px] uppercase tracking-[0.25em]" style={{ color: THEME.primary }}>
                  Explore More
                </p>
                <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Similar Properties
                </h2>
              </div>
              <Link
                href="/featured-explore-properties"
                className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
                style={{ color: THEME.primary }}
              >
                View All <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {similarProperties.map((p, i) => (
                <SimilarCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <AnimatePresence>
        {showModal && hasGallery && (
          <GalleryModal
            images={galleryImages}
            currentIndex={activeIndex}
            onClose={() => setShowModal(false)}
            onNavigate={setActiveIndex}
          />
        )}
      </AnimatePresence>

      {/* Mobile CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden"
        style={{ borderColor: THEME.border }}
      >
        <div className="flex gap-2">
          <a
            href={`https://wa.me/971502590071?text=I'm%20interested%20in%20${encodeURIComponent(
              property.property_name
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-colors hover:bg-emerald-50"
            style={{ borderColor: "#10b981" }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <button
            onClick={() =>
              document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })
            }
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