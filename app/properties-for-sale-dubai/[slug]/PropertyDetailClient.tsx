"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, ChevronLeft, ChevronRight, X,
  Loader2, MapPin, Phone,
  Calendar, Building2, Check,
  MessageCircle, Play, Grid3x3, Bath, BedDouble,
  Maximize, Star,
} from "lucide-react";
import BrochureDownload from "@/components/Brochure";
import EnquiryForm from "@/components/EnquiryForm";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

interface PropertyLocation {
  community: string | null;
  city: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
}

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
    display: string;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  bedrooms: string;
  bathrooms: string;
  area: {
    value: number | null;
    display: string;
    size: string | null;
  };
  location: PropertyLocation;
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
  };
  featured_image: string | null;
  images: Array<{ id: number; url: string; title: string | null; featured: number }>;
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
  similar_properties: any[];
}

function safeString(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return fallback;
  return fallback;
}

function getLocationString(location: PropertyLocation | null | undefined): string {
  if (!location) return 'Dubai';
  if (typeof location !== 'object') return safeString(location, 'Dubai');
  return safeString(location.community) || safeString(location.city) || 'Dubai';
}

function getDisplayPrice(price: any): string {
  if (!price) return 'AED On Request';
  if (price.is_price_on_request) return 'AED On Request';
  if (price.display) return safeString(price.display, 'AED On Request');
  if (price.amount) return `AED ${Number(price.amount).toLocaleString()}`;
  return 'AED On Request';
}

function getBedroomDisplay(bedroom: string | null | undefined): string {
  if (!bedroom) return 'Studio';
  const t = String(bedroom).toLowerCase().trim();
  if (t.includes('studio')) return 'Studio';
  const match = String(bedroom).match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return 'Studio';
    if (num === 1) return '1 Bedroom';
    return `${num} Bedrooms`;
  }
  return safeString(bedroom, 'Studio');
}

function getBathroomDisplay(bathrooms: string | null | undefined): string {
  if (!bathrooms) return '1 Bath';
  const match = String(bathrooms).match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return '1 Bath';
    return `${num} Bath${num > 1 ? 's' : ''}`;
  }
  return safeString(bathrooms, '1 Bath');
}

function getAreaDisplay(area: any): string {
  if (!area) return '';
  if (area.display) return safeString(area.display);
  if (area.value) return `${area.value} sq.ft`;
  return '';
}

function getOccupancyLabel(occupancy: string | null | undefined): string {
  if (!occupancy) return 'Available';
  const map: Record<string, string> = {
    'under construction': 'Under Construction',
    'ready to move': 'Ready to Move',
    'vacant': 'Vacant',
    'ready': 'Ready to Move',
    'off plan': 'Off Plan',
  };
  const key = String(occupancy).toLowerCase().trim();
  return map[key] || safeString(occupancy, 'Available');
}

function getCompletionStatus(date: string | null | undefined): string {
  if (!date) return 'Date TBC';
  try {
    const now = new Date();
    const comp = new Date(date);
    if (isNaN(comp.getTime())) return 'Date TBC';
    const diffMonths =
      (comp.getFullYear() - now.getFullYear()) * 12 +
      (comp.getMonth() - now.getMonth());
    if (diffMonths < 0) return 'Ready to Move';
    if (diffMonths <= 3) return 'Handover in 3 Months';
    if (diffMonths <= 6) return 'Handover in 6 Months';
    return `Handover ${comp.getFullYear()}`;
  } catch {
    return 'Date TBC';
  }
}

function fixImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/upload/') && !url.includes('/media/')) {
    return url.replace('/upload/', 'https://acasa.ae/upload/media/');
  }
  if (url.startsWith('upload/')) {
    return `https://acasa.ae/upload/media/${url.replace('upload/', '')}`;
  }
  if (url.startsWith('media/')) {
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
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${THEME.accent}30` }} />
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
          Loading Property
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
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')
        onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight')
        onNavigate((currentIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentIndex] as HTMLElement;
    activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
                  ? 'ring-2 ring-white opacity-100 scale-105'
                  : 'opacity-40 hover:opacity-70'
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
  const sorted = [...plans].sort(
    (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage)
  );

  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3 mb-6">
        <h2
          className="text-[22px]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
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
              {safeString(plan.percentage)}
              <span className="text-[24px]">%</span>
            </p>
            <p
              className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em]"
              style={{ color: THEME.muted }}
            >
              {safeString(plan.name)}
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
        <Building2 className="h-10 w-10 text-gray-300" />
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
    ? property.featured_image ||
      property.gallery_urls?.[0] ||
      property.images?.[0]?.url ||
      null
    : null;

  const cardLocation =
    typeof property.location === 'object' && property.location !== null
      ? safeString(property.location.community) || safeString(property.location.city) || 'Dubai'
      : safeString(property.location, 'Dubai');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/properties-for-sale-dubai/${property.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={safeString(property.name, 'Property')}
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
          {safeString(property.name, 'Property')}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <MapPin className="h-3 w-3" /> {cardLocation}
        </p>
        <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
          {getDisplayPrice(property.price)}
        </p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: THEME.muted }}>
          {property.bedrooms && <span>{safeString(property.bedrooms)}</span>}
          {property.bathrooms && (
            <>
              <span>·</span>
              <span>{safeString(property.bathrooms)}</span>
            </>
          )}
          {property.area?.display && (
            <>
              <span>·</span>
              <span>{safeString(property.area.display)}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SIMILAR PROPERTIES ───────────────────────────────────────────────

function SimilarProperties({
  currentId,
  similarList,
}: {
  currentId: number;
  similarList?: any[];
}) {
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
        const res = await fetch(`/api/v1/properties?page=1&limit=6&sort_by=newest&status=5`);
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
      className="mt-16 border-t pt-16"
      style={{ borderColor: THEME.border }}
    >
      <div className="mx-auto max-w-[1180px] px-4 pb-16 md:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p
              className="mb-2 text-[9px] uppercase tracking-[0.25em]"
              style={{ color: THEME.accent }}
            >
              Explore More
            </p>
            <h2
              className="text-[28px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              Similar Properties
            </h2>
          </div>
          <Link
            href="/properties-for-sale-dubai"
            className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
            style={{ color: THEME.primary }}
          >
            View All <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <SimilarCard key={p.id ?? i} property={p} index={i} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function PropertyDetailClient() {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'plans'>('overview');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!slug || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/properties/${slug}`);
        if (!res.ok) throw new Error(`API returned ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (!data.success || !data.data) throw new Error(data.message || 'Property not found');
        setProperty(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [slug]);

  useEffect(() => {
    if (!property) return;
    try {
      const saved = JSON.parse(localStorage.getItem('property_wishlist') || '[]');
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted(prev => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem('property_wishlist') || '[]');
        const updated = next
          ? [...saved, property.id]
          : saved.filter((id: number) => id !== property.id);
        localStorage.setItem('property_wishlist', JSON.stringify(updated));
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
    const add = (url: string) => { if (url && !seen.has(url)) seen.add(url); };
    if (property.featured_image) add(fixImageUrl(property.featured_image));
    property.gallery_urls?.forEach((url: string) => add(fixImageUrl(url)));
    property.images?.forEach((img: any) => { if (img.url) add(fixImageUrl(img.url)); });
    property.gallery_preview?.forEach((url: string) => add(fixImageUrl(url)));
    if (seen.size === 0) add('https://acasa.ae/upload/no-image.png');
    return [...seen];
  }, [property]);

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md px-4 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h1
            className="text-2xl font-light"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Property Not Found
          </h1>
          <p className="my-4 text-sm text-red-500">{error || 'Property not found'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                fetchedRef.current = false;
                window.location.reload();
              }}
              className="bg-[#192334] px-6 py-2.5 text-[11px] tracking-widest text-white hover:bg-[#2a3a4a]"
            >
              Retry
            </button>
            <Link
              href="/properties-for-sale-dubai"
              className="bg-gray-200 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 hover:bg-gray-300"
            >
              All Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const locationStr = getLocationString(property.location);
  const refNumber = safeString(property.ref_number) || `LN${property.id}`;
  const priceDisplay = getDisplayPrice(property.price);
  const bedroomDisplay = getBedroomDisplay(property.bedrooms);
  const bathroomDisplay = getBathroomDisplay(property.bathrooms);
  const areaDisplay = getAreaDisplay(property.area);
  const occupancyLabel = getOccupancyLabel(property.occupancy);
  const completionStatus = getCompletionStatus(property.completion_date);
  const propertyName = getDisplayName(property);
  const addressStr = safeString(property.location?.address) || propertyName;

  const lat = property.location?.latitude ? parseFloat(property.location.latitude) : 25.0657;
  const lng = property.location?.longitude ? parseFloat(property.location.longitude) : 55.1713;

  const specs = [
    { icon: BedDouble, label: bedroomDisplay },
    { icon: Bath, label: bathroomDisplay },
    { icon: Maximize, label: areaDisplay },
  ].filter(s => s.label);

  const hasGallery = galleryImages.length > 0;
  const mainImage = hasGallery ? galleryImages[activeIndex % galleryImages.length] : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>

      {/* ─── Breadcrumb ── */}
      <div
        className="border-b"
        style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}
      >
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]"
              style={{ color: THEME.muted }}
            >
              <Link href="/" className="transition-colors hover:text-gray-600">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/properties-for-sale-dubai" className="transition-colors hover:text-gray-600">
                Properties
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="max-w-[120px] truncate text-gray-500 sm:max-w-none">
                {propertyName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleWishlist}
                className={`flex h-9 w-9 items-center justify-center border transition-all ${
                  isWishlisted
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })}
                className="hidden items-center gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 sm:flex"
                style={{ backgroundColor: THEME.primary }}
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Property Header ── */}
      <div className="mx-auto max-w-[1180px] px-4 pb-6 pt-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              {property.featured && (
                <span
                  className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.accent }}
                >
                  Featured
                </span>
              )}
              {property.listing_type && (
                <span
                  className="border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  {safeString(property.listing_type)}
                </span>
              )}
              {property.exclusive_status && (
                <span className="flex items-center gap-1 border border-purple-200 bg-purple-50 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-purple-700">
                  <Star className="h-2.5 w-2.5" />
                  {safeString(property.exclusive_status)}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {propertyName}
            </h1>

            <div
              className="mt-2 flex items-center gap-1.5 text-[12px]"
              style={{ color: THEME.muted }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{locationStr}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className="mb-1 text-[9px] uppercase tracking-[0.2em]"
              style={{ color: THEME.muted }}
            >
              {property.price?.is_price_on_request ? 'Price' : 'Starting Price'}
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
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
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
              <Calendar className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {completionStatus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Gallery ── */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div
          className="group relative aspect-[16/9] cursor-pointer overflow-hidden bg-gray-100"
          onClick={() => setShowModal(true)}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt={propertyName}
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
                onClick={e => { e.stopPropagation(); setShowModal(true); }}
                className="flex items-center gap-1.5 bg-white/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-800 backdrop-blur-sm transition-colors hover:bg-white"
              >
                <Grid3x3 className="h-3.5 w-3.5" /> All Photos ({galleryImages.length})
              </button>
            )}
            {property.video_url && (
              <a
                href={safeString(property.video_url)}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Play className="h-3.5 w-3.5" /> Video Tour
              </a>
            )}
          </div>
          {hasGallery && galleryImages.length > 1 && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setActiveIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setActiveIndex(i => (i + 1) % galleryImages.length);
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
                    i === activeIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={
                    i === activeIndex
                      ? { outline: `2px solid ${THEME.primary}`, outlineOffset: '-1px' }
                      : {}
                  }
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Content Grid ── */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">

          {/* Left Column */}
          <div>
            <div className="mb-8 flex border-b" style={{ borderColor: THEME.border }}>
              {(['overview', 'amenities', 'plans'] as const)
                .filter(tab => {
                  if (tab === 'amenities') return (property.amenities?.length ?? 0) > 0;
                  if (tab === 'plans') return (property.payment_plans?.length ?? 0) > 0;
                  return true;
                })
                .map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`-mb-px border-b-2 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-colors ${
                      activeTab === tab ? 'border-current' : 'border-transparent hover:text-gray-700'
                    }`}
                    style={
                      activeTab === tab
                        ? { color: THEME.primary, borderColor: THEME.primary }
                        : { color: THEME.muted }
                    }
                  >
                    {tab === 'overview' && 'Overview'}
                    {tab === 'amenities' && `Amenities (${property.amenities?.length ?? 0})`}
                    {tab === 'plans' && `Payment Plans (${property.payment_plans?.length ?? 0})`}
                  </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
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
                    {safeString(property.display_title) || propertyName}
                  </h2>

                  {property.description ? (
                    <div
                      className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                      style={{ color: '#4A5462' }}
                      dangerouslySetInnerHTML={{ __html: property.description }}
                    />
                  ) : (
                    <p className="text-[13px] leading-relaxed" style={{ color: '#4A5462' }}>
                      Welcome to {propertyName}, a distinguished residential development
                      in {locationStr}, Dubai.
                    </p>
                  )}

                  <div
                    className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3"
                    style={{ borderColor: THEME.border }}
                  >
                    {[
                      { label: 'Property Type', value: safeString(property.listing_type) },
                      { label: 'Bedrooms', value: bedroomDisplay },
                      { label: 'Bathrooms', value: bathroomDisplay },
                      { label: 'Area', value: areaDisplay },
                      { label: 'Furnishing', value: safeString(property.furnishing) },
                      { label: 'Parking', value: safeString(property.parking) },
                      { label: 'DLD Permit', value: safeString(property.dld_permit) },
                      { label: 'RERA No.', value: safeString(property.rera_number) },
                      { label: 'Completion', value: completionStatus },
                      { label: 'Occupancy', value: occupancyLabel },
                      { label: 'Ref Number', value: refNumber },
                    ]
                      .filter(item => item.value && item.value.trim() !== '')
                      .map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <p
                            className="text-[9px] uppercase tracking-[0.18em]"
                            style={{ color: THEME.muted }}
                          >
                            {label}
                          </p>
                          <p
                            className="text-[12px] font-medium"
                            style={{ color: THEME.primary }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                  </div>

                  {property.developer?.name && (
                    <div
                      className="mt-8 border-t pt-8"
                      style={{ borderColor: THEME.border }}
                    >
                      <p
                        className="mb-4 text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: THEME.muted }}
                      >
                        Developer
                      </p>
                      <div className="flex items-center gap-4">
                        {property.developer.logo_url && (
                          <img
                            src={fixImageUrl(property.developer.logo_url)}
                            alt={safeString(property.developer.name)}
                            className="h-14 w-20 object-contain"
                          />
                        )}
                        <p
                          className="text-[15px] font-medium"
                          style={{ color: THEME.primary }}
                        >
                          {safeString(property.developer.name)}
                        </p>
                      </div>
                    </div>
                  )}

                  {property.agent?.name && (
                    <div
                      className="mt-8 border-t pt-8"
                      style={{ borderColor: THEME.border }}
                    >
                      <p
                        className="mb-4 text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: THEME.muted }}
                      >
                        Listing Agent
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p
                            className="text-[14px] font-medium"
                            style={{ color: THEME.primary }}
                          >
                            {safeString(property.agent.name)}
                          </p>
                          {property.agent.phone && (
                            <a
                              href={`tel:${safeString(property.agent.phone)}`}
                              className="mt-1 flex items-center gap-1.5 text-[12px]"
                              style={{ color: THEME.muted }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {safeString(property.agent.phone)}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="mt-8 border-t pt-8"
                    style={{ borderColor: THEME.border }}
                  >
                    <BrochureDownload
                      propertyId={property.id}
                      propertyName={propertyName}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'amenities' && (property.amenities?.length ?? 0) > 0 && (
                <motion.div
                  key="amenities"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities.map((amenity, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-[3px] border px-4 py-3"
                        style={{ borderColor: THEME.border }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: THEME.accent }}
                        />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>
                          {safeString(amenity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'plans' && (property.payment_plans?.length ?? 0) > 0 && (
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
              <EnquiryForm
                propertyName={propertyName}
                refNumber={refNumber}
                propertyId={property.id}
                agentId={property.agent?.id}
                agentName={property.agent?.name}
                agentPhone={property.agent?.phone}
                agentPhoto={property.agent?.photo_url ? fixImageUrl(property.agent.photo_url) : null}
                agentEmail={property.agent?.email}
                listingType={property.listing_type || "For Sale"}
                whatsappNumber="971502590071"
                itemType="property"
              />

              {property.agent?.phone && (
                <a
                  href={`tel:${safeString(property.agent.phone)}`}
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
        <div
          className="overflow-hidden rounded-[3px] border"
          style={{ borderColor: THEME.border }}
        >
          <div className="h-[300px] sm:h-[400px]">
            <PropertyMap lat={lat} lng={lng} name={propertyName} />
          </div>
          <div
            className="flex items-center gap-2 border-t px-4 py-3"
            style={{ borderColor: THEME.border }}
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.accent }} />
            <p className="text-[12px]" style={{ color: THEME.muted }}>
              {addressStr}, {locationStr}, Dubai
            </p>
          </div>
        </div>
      </div>

      {/* ─── Similar Properties ── */}
      <SimilarProperties
        currentId={property.id}
        similarList={property.similar_properties}
      />

      {/* ─── Gallery Modal ── */}
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

      {/* ─── Mobile CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden"
        style={{ borderColor: THEME.border }}
      >
        <div className="flex gap-2">
          <a
            href={`https://wa.me/971502590071?text=I'm%20interested%20in%20${encodeURIComponent(propertyName)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700"
            style={{ borderColor: '#10b981' }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <button
            onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })}
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