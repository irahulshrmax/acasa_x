// ===================== APARTMENT DETAIL PAGE =====================
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, ChevronLeft, ChevronRight, X,
  Maximize2, CheckCircle, Loader2, MapPin, Plus, Phone,
  Calendar, Building2, Shield, ExternalLink, Check,
  MessageCircle, Play, Grid3x3, Map as MapIcon, Bath,
  Maximize, BedDouble, Star, Eye, Copy,
} from "lucide-react";
import BrochureDownload from "@/components/Brochure";

const API_URL = "/api/v1/properties/apartments";
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
    display: string;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  bedrooms: string;
  bathrooms: string;
  area: { value: number | null; display: string; size: string | null };
  location: {
    community: string | null;
    city: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    community_id: number | null;
  };
  developer: {
    id: number | null; name: string | null; logo: string | null;
    country: string | null; website: string | null;
  };
  agent: {
    id: number | null; name: string | null; phone: string | null;
    photo: string | null; rera_brn: string | null;
  };
  featured_image: string;
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
  display_title: string;
}

// ── Loader ─────────────────────────────────────────────────
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
          Loading Property
        </motion.p>
      </div>
    </div>
  );
}

// ── Gallery Modal ──────────────────────────────────────────
function GalleryModal({
  images, currentIndex, onClose, onNavigate,
}: {
  images: string[]; currentIndex: number;
  onClose: () => void; onNavigate: (i: number) => void;
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
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [currentIndex, images.length, onClose, onNavigate]);

  // Scroll active thumb into view
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
      {/* Top Bar */}
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

      {/* Main Image */}
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

      {/* Thumbnails */}
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

// ── Payment Plans ──────────────────────────────────────────
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

// ── Enquiry Form ───────────────────────────────────────────
function EnquiryForm({ propertyName, refNumber }: { propertyName: string; refNumber: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!agreed || submitting) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setForm({ name: "", phone: "", email: "", message: "" });
      setErrors({});
    }, 6000);
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={e => {
          setForm(p => ({ ...p, [key]: e.target.value }));
          if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
        }}
        className={`mt-1.5 w-full border px-3 py-2.5 text-[12px] transition-all focus:outline-none ${
          errors[key]
            ? "border-red-300 bg-red-50 focus:border-red-400"
            : "border-gray-200 bg-white focus:border-gray-400"
        }`}
        style={{ fontFamily: FONT_BODY }}
      />
      {errors[key] && (
        <p className="mt-1 text-[10px] text-red-500">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="border bg-white" style={{ borderColor: THEME.border }}>
      {/* Header */}
      <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
        <h3
          className="text-[16px] font-normal text-white"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          Request Information
        </h3>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
          Get in touch about {propertyName}
        </p>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
              </motion.div>
              <p className="mt-4 text-[17px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                Message Sent!
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: THEME.muted }}>
                We'll get back to you within 24 hours.
              </p>
              <div className="mt-4 rounded-[3px] bg-gray-50 p-3">
                <p className="text-[10px]" style={{ color: THEME.muted }}>
                  {propertyName} • Ref: {refNumber}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-3.5"
            >
              {field("name", "Full Name", "text", "Your full name")}
              {field("phone", "Phone Number", "tel", "+971 50 000 0000")}
              {field("email", "Email Address", "email", "you@email.com")}

              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder="I'm interested in this property..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  className="mt-1.5 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <div
                    className={`h-4 w-4 border-2 flex items-center justify-center transition-colors ${
                      agreed ? "border-transparent" : "border-gray-300 bg-white"
                    }`}
                    style={agreed ? { backgroundColor: THEME.primary } : {}}
                  >
                    {agreed && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
                <span className="text-[10px] leading-relaxed" style={{ color: THEME.muted }}>
                  I agree to the{" "}
                  <Link href="/terms" className="underline hover:no-underline" style={{ color: THEME.primary }}>
                    Terms & Conditions
                  </Link>{" "}
                  and consent to being contacted.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="https://wa.me/971502590071"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>

                <button
                  type="submit"
                  disabled={!agreed || submitting}
                  className="py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Property Map ───────────────────────────────────────────
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
      width="100%" height="100%"
      style={{ border: 0 }}
      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`}
      allowFullScreen
      onError={() => setErr(true)}
    />
  );
}

// ── Similar Property Card ──────────────────────────────────
function SimilarCard({ property, index }: { property: any; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const img = !imgErr
    ? (property.featured_image || property.gallery_urls?.[0] || property.images?.[0]?.url || null)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/apartments-for-sale-in-dubai/${property.slug}`)}
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
          {property.bathrooms && <><span>·</span><span>{property.bathrooms}</span></>}
          {property.area?.display && <><span>·</span><span>{property.area.display}</span></>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Similar Properties ─────────────────────────────────────
function SimilarProperties({ currentId }: { currentId: number }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/properties/apartments?page=1&limit=8&sort_by=newest&listing_type=Off plan&status=5`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setList(data.data.filter((p: any) => p.id !== currentId).slice(0, 3));
        }
      } catch {}
      setLoading(false);
    })();
  }, [currentId]);

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
              Similar Apartments
            </h2>
          </div>
          <Link
            href="/apartments-for-sale-in-dubai"
            className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
            style={{ color: THEME.primary }}
          >
            View All
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => <SimilarCard key={p.id} property={p} index={i} />)}
        </div>
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/apartments-for-sale-in-dubai"
            className="inline-block border px-8 py-3 text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-gray-50"
            style={{ borderColor: THEME.border, color: THEME.primary }}
          >
            View All Apartments
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// ── Main Detail Page ───────────────────────────────────────
export default function ApartmentDetailPage() {
  const { slug } = useParams() as { slug: string };
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
      try {
        const res = await fetch(`${API_URL}/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Not found");
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
      const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted(prev => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const updated = next
          ? [...saved, property.id]
          : saved.filter((id: number) => id !== property.id);
        localStorage.setItem("wishlist", JSON.stringify(updated));
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
    if (property.featured_image) add(property.featured_image);
    property.gallery_urls?.forEach(add);
    property.images?.forEach(i => add(i.url));
    property.gallery_images?.forEach(add);
    property.gallery_preview?.forEach(add);
    return [...seen];
  }, [property]);

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Property not found"}</p>
          <Link
            href="/apartments-for-sale-in-dubai"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Apartments
          </Link>
        </div>
      </div>
    );
  }

  const location = property.location?.community || property.location?.city || "Dubai";
  const refNumber = property.ref_number || `LN${property.id}`;
  const lat = property.location?.latitude ?? 25.0657;
  const lng = property.location?.longitude ?? 55.1713;

  const specs = [
    { icon: BedDouble, label: property.bedrooms || "Studio" },
    { icon: Bath, label: property.bathrooms },
    { icon: Maximize, label: property.area?.display || "N/A" },
  ].filter(s => s.label);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>

      {/* ── Breadcrumb & Actions ── */}
      <div
        className="border-b"
        style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}
      >
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/apartments-for-sale-in-dubai" className="hover:text-gray-600 transition-colors">
                Apartments
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {property.property_name}
              </span>
            </div>

            {/* Action buttons */}
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

      {/* ── Property Header ── */}
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
              {property.listing_type && (
                <span
                  className="px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] border"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  {property.listing_type}
                </span>
              )}
              {property.exclusive_status && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700">
                  <Star className="h-2.5 w-2.5" />
                  {property.exclusive_status}
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
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {property.location?.address
                  ? `${property.location.address}, ${location}`
                  : location}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              Starting Price
            </p>
            <p
              className="text-[26px] sm:text-[32px] font-light leading-none"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {property.price?.is_price_on_request
                ? "On Request"
                : property.price?.display || "On Request"}
            </p>
            {!property.price?.is_price_on_request && property.price?.currency && (
              <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: THEME.muted }}>
                {property.price.currency}
              </p>
            )}
            <p className="mt-2 text-[9px]" style={{ color: THEME.muted }}>Ref: {refNumber}</p>
          </div>
        </div>

        {/* Spec chips */}
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
                Completion: {property.completion_date}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Gallery ── */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/9] group cursor-pointer"
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

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Bottom actions */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {galleryImages.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setShowModal(true); }}
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
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Play className="h-3.5 w-3.5" />
                Video Tour
              </a>
            )}
          </div>

          {/* Expand hint */}
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-[3px] bg-black/50 px-3 py-1.5 text-[9px] uppercase tracking-widest text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
            View Gallery
          </div>

          {/* Nav arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActiveIndex(i => (i - 1 + galleryImages.length) % galleryImages.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveIndex(i => (i + 1) % galleryImages.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {galleryImages.length > 1 && (
          <div className="mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(showAllPhotos ? galleryImages : galleryImages.slice(0, 10)).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                    i === activeIndex
                      ? "opacity-100"
                      : "opacity-50 hover:opacity-80"
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

      {/* ── Content Grid ── */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">

          {/* Left Column */}
          <div>
            {/* Tab Navigation */}
            <div
              className="flex border-b mb-8"
              style={{ borderColor: THEME.border }}
            >
              {(["overview", "amenities", "plans"] as const)
                .filter(tab => {
                  if (tab === "amenities") return property.amenities?.length > 0;
                  if (tab === "plans") return property.payment_plans?.length > 0;
                  return true;
                })
                .map(tab => (
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
                    {tab}
                  </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Description */}
                  <h2
                    className="text-[20px] sm:text-[24px] leading-snug mb-4"
                    style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                  >
                    {property.display_title || property.property_name}
                    {property.developer?.name && (
                      <span className="block text-[16px] mt-1" style={{ color: THEME.muted }}>
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
                      Welcome to {property.property_name}, a distinguished residential development
                      in {location}, Dubai. This premium property offers an exceptional living
                      experience with world-class amenities and stunning views.
                    </p>
                  )}

                  {/* Property Details Grid */}
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
                      .filter(item => item.value)
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

                  {/* Developer */}
                  {property.developer?.name && (
                    <div
                      className="mt-8 border-t pt-8"
                      style={{ borderColor: THEME.border }}
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Developer
                      </p>
                      <div className="flex items-center gap-4">
                        {property.developer.logo && (
                          <div className="flex h-14 w-20 items-center justify-center border rounded-[3px] p-2" style={{ borderColor: THEME.border }}>
                            <img
                              src={property.developer.logo}
                              alt={property.developer.name}
                              className="max-h-full max-w-full object-contain"
                              onError={e => (e.currentTarget.style.display = "none")}
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

                  {/* Agent */}
                  {property.agent?.name && (
                    <div
                      className="mt-8 border-t pt-8"
                      style={{ borderColor: THEME.border }}
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Listing Agent
                      </p>
                      <div className="flex items-center gap-4">
                        {property.agent.photo ? (
                          <img
                            src={property.agent.photo}
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

                  {/* Brochure */}
                  <div
                    className="mt-8 border-t pt-8"
                    style={{ borderColor: THEME.border }}
                  >
                    <BrochureDownload propertyId={property.id} propertyName={property.property_name} />
                  </div>
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

          {/* Right Column – Enquiry */}
          <aside id="enquiry">
            <div className="sticky top-6">
              <EnquiryForm propertyName={property.property_name} refNumber={refNumber} />

              {/* Quick Call CTA */}
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

      {/* ── Map ── */}
      <div
        className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6"
      >
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

      {/* ── Similar ── */}
      <SimilarProperties currentId={property.id} />

      {/* ── Gallery Modal ── */}
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

      {/* ── Mobile Sticky CTA ── */}
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

      {/* Bottom padding for mobile CTA */}
      <div className="h-20 sm:hidden" />
    </div>
  );
}