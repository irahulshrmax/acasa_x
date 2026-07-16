// app/archive-projects/[slug]/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  CheckCircle,
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
  Clock,
  Award,
  Archive,
  RotateCcw,
  Trash2,
  Home,
  Square,
  BedDouble,
  Download,
  FileText,
} from "lucide-react";

const API_URL = "/api/v1/archive-projects";
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

interface PaymentPlan {
  id: number;
  name: string;
  percentage: string;
  item_id: number;
  item_type: string | null;
}

interface ArchiveProjectDetail {
  id: number;
  title: string;
  slug: string;
  location: string;
  price: string;
  featured_image: string | null;
  gallery_images: string[];
  beds: string;
  sqft: string;
  handover: string;
  listingType: string;
  description: string;
  amenities: string[];
  refNo: string;
  developer: string;
  developer_logo: string | null;
  developer_website: string | null;
  developer_description: string | null;
  map_latitude: string | null;
  map_longitude: string | null;
  video_url: string | null;
  brochure_url: string | null;
  occupancy: string | null;
  exclusive_status: string | null;
  property_type: string | null;
  status: number;
  status_label?: string;
  verified: number;
  featured_project: string;
  views: string;
  created_at: string;
  updated_at: string;
  developer_id: number | null;
  payment_plans?: PaymentPlan[];
  can_restore?: boolean;
  can_permanently_delete?: boolean;
  related_projects: Array<{
    id: number;
    title: string;
    slug: string;
    image: string;
    price: string;
    location: string;
  }>;
}

function getUnsplashFallback(): string {
  return `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80`;
}

function ArchiveImage({
  src,
  alt,
  className = "",
  fill = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  const [error, setError] = useState(false);
  const imageUrl = error ? getUnsplashFallback() : src || getUnsplashFallback();

  if (fill) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        onError={() => setError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
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
          Loading Archive Project
        </motion.p>
      </div>
    </div>
  );
}

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

  if (images.length === 0) return null;

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
            onError={(e) => {
              e.currentTarget.src = getUnsplashFallback();
            }}
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
                i === currentIndex ? "ring-2 ring-white opacity-100 scale-105" : "opacity-40 hover:opacity-70"
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

function PaymentPlans({ plans }: { plans: PaymentPlan[] }) {
  if (!plans?.length) return null;
  const sorted = [...plans].sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {sorted.map((plan, i) => (
        <motion.div
          key={plan.id ?? i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden border p-6 text-center transition-shadow hover:shadow-md"
          style={{ borderColor: THEME.border }}
        >
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: THEME.accent }} />
          <p className="text-[40px] font-light leading-none" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
            {plan.percentage}
            <span className="text-[24px]">%</span>
          </p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: THEME.muted }}>
            {plan.name}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function PropertyMap({ lat, lng, name }: { lat: string | null; lng: string | null; name: string }) {
  const [err, setErr] = useState(false);

  if (!lat || !lng || err) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50">
        <MapIcon className="h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">Location not available</p>
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

function EnquiryForm({ projectName, refNumber }: { projectName: string; refNumber: string }) {
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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!agreed || submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setForm({ name: "", phone: "", email: "", message: "" });
      setErrors({});
    }, 6000);
  };

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => {
          setForm((p) => ({ ...p, [key]: e.target.value }));
          if (errors[key])
            setErrors((p) => {
              const n = { ...p };
              delete n[key];
              return n;
            });
        }}
        className={`mt-1.5 w-full border px-3 py-2.5 text-[12px] transition-all focus:outline-none ${
          errors[key] ? "border-red-300 bg-red-50 focus:border-red-400" : "border-gray-200 bg-white focus:border-gray-400"
        }`}
        style={{ fontFamily: FONT_BODY }}
      />
      {errors[key] && <p className="mt-1 text-[10px] text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="border bg-white" style={{ borderColor: THEME.border }}>
      <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
        <h3 className="text-[16px] font-normal text-white" style={{ fontFamily: FONT_DISPLAY }}>
          Request Information
        </h3>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">Get in touch about {projectName}</p>
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
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
                  {projectName} • Ref: {refNumber}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-3.5">
              {field("name", "Full Name", "text", "Your full name")}
              {field("phone", "Phone Number", "tel", "+971 50 000 0000")}
              {field("email", "Email Address", "email", "you@email.com")}

              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder="I'm interested in this project..."
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="mt-1.5 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
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

function RelatedProjectCard({ project, index }: { project: any; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const img = !imgErr ? project.image : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group cursor-pointer"
    >
      <Link href={`/archive-projects/${project.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {img ? (
            <img
              src={img}
              alt={project.title}
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
            {project.title}
          </h3>
          <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
            <MapPin className="h-3 w-3" />
            {project.location || "Dubai"}
          </p>
          <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
            {project.price || "On Request"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ArchiveProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [project, setProject] = useState<ArchiveProjectDetail | null>(null);
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
        if (!res.ok || !data.success) throw new Error(data.message || "Project not found");
        setProject(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    try {
      const saved = JSON.parse(localStorage.getItem("project_wishlist") || "[]");
      setIsWishlisted(saved.includes(project.id));
    } catch {}
  }, [project]);

  const toggleWishlist = useCallback(() => {
    if (!project) return;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("project_wishlist") || "[]");
        const updated = next ? [...saved, project.id] : saved.filter((id: number) => id !== project.id);
        localStorage.setItem("project_wishlist", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [project]);

  const handleShare = useCallback(async () => {
    if (!project) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [project]);

  const galleryImages = useMemo(() => {
    if (!project) return [];
    const seen = new Set<string>();
    const add = (url: string | null) => {
      if (url && !seen.has(url)) seen.add(url);
    };
    add(project.featured_image);
    project.gallery_images?.forEach(add);
    return [...seen];
  }, [project]);

  if (loading) return <PageLoader />;

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Archive className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1 className="text-2xl font-light mb-2" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
            Project Not Found
          </h1>
          <p className="text-sm text-red-500 mb-6">{error || "This archived project does not exist."}</p>
          <Link
            href="/archive-projects"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Archive Projects
          </Link>
        </div>
      </div>
    );
  }

  const refNumber = project.refNo || `PRJ${project.id}`;
  const lat = project.map_latitude;
  const lng = project.map_longitude;
  const hasMap = Boolean(lat && lng);
  const hasRelated = project.related_projects && project.related_projects.length > 0;
  const hasPlans = Boolean(project.payment_plans && project.payment_plans.length > 0);

  const specs = [
    { icon: BedDouble, label: project.beds && project.beds !== "N/A" ? project.beds : "" },
    { icon: Square, label: project.sqft && project.sqft !== "N/A" ? project.sqft : "" },
    { icon: Home, label: project.property_type || "" },
  ].filter((s) => s.label);

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
              <Link href="/archive-projects" className="hover:text-gray-600 transition-colors">
                Archive Projects
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">{project.title}</span>
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

      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-white bg-red-600">
                {project.status_label || "Archived"}
              </span>
              {project.featured_project === "1" && (
                <span
                  className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.accent }}
                >
                  Featured
                </span>
              )}
              {project.listingType && (
                <span
                  className={`px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] border ${
                    project.listingType === "Off plan"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {project.listingType}
                </span>
              )}
              {project.verified === 1 && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Verified
                </span>
              )}
              {project.handover && project.handover !== "TBA" && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-blue-50 text-blue-700 border border-blue-200">
                  <Calendar className="h-2.5 w-2.5" />
                  Handover: {project.handover}
                </span>
              )}
            </div>

            <h1 className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {project.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              {project.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{project.location}</span>
                </div>
              )}
              {project.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Archived {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {project.developer && (
              <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: THEME.muted }}>
                <Building2 className="h-3.5 w-3.5" />
                <span>by {project.developer}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              Starting From
            </p>
            <p className="text-[26px] sm:text-[32px] font-light leading-none" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {project.price}
            </p>
            <p className="mt-2 text-[9px]" style={{ color: THEME.muted }}>
              Ref: {refNumber}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {specs.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2" style={{ borderColor: THEME.border }}>
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {label}
              </span>
            </div>
          ))}
          {project.occupancy && (
            <div className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2" style={{ borderColor: THEME.border }}>
              <Clock className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {project.occupancy}
              </span>
            </div>
          )}
          {project.brochure_url && (
            <a
              href={project.brochure_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: THEME.accent, color: THEME.primary }}
            >
              <Download className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium">Download Brochure</span>
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/9] group cursor-pointer" onClick={() => setShowModal(true)}>
          <AnimatePresence mode="sync">
            {galleryImages.length > 0 ? (
              <motion.div key={activeIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ArchiveImage src={galleryImages[activeIndex]} alt={project.title} fill className="transition-transform duration-700 group-hover:scale-[1.02]" />
              </motion.div>
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
            {project.video_url && (
              <a
                href={project.video_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <Play className="h-3.5 w-3.5" />
                Video Tour
              </a>
            )}
            {project.brochure_url && (
              <a
                href={project.brochure_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <FileText className="h-3.5 w-3.5" />
                Brochure
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
                  style={i === activeIndex ? { outline: `2px solid ${THEME.primary}`, outlineOffset: "-1px" } : {}}
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

      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex border-b mb-8" style={{ borderColor: THEME.border }}>
              {(["overview", "amenities", "plans"] as const)
                .filter((tab) => {
                  if (tab === "amenities") return project.amenities?.length > 0;
                  if (tab === "plans") return hasPlans;
                  return true;
                })
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? "border-current" : "border-transparent hover:text-gray-700"
                    }`}
                    style={activeTab === tab ? { color: THEME.primary, borderColor: THEME.primary } : { color: THEME.muted }}
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "amenities" && `Amenities (${project.amenities?.length || 0})`}
                    {tab === "plans" && `Payment Plans (${project.payment_plans?.length || 0})`}
                  </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h2 className="text-[20px] sm:text-[24px] leading-snug mb-4" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    {project.title}
                  </h2>

                  {project.description ? (
                    <div
                      className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                      style={{ color: "#4A5462" }}
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  ) : (
                    <p className="text-[13px] leading-relaxed" style={{ color: "#4A5462" }}>
                      Welcome to {project.title}, a project in {project.location || "Dubai"}.
                    </p>
                  )}

                  <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: THEME.border }}>
                    {[
                      { label: "Property Type", value: project.property_type },
                      { label: "Status", value: project.status_label || "Archived" },
                      { label: "Bedrooms", value: project.beds !== "N/A" ? project.beds : null },
                      { label: "Area", value: project.sqft !== "N/A" ? project.sqft : null },
                      { label: "Listing Type", value: project.listingType },
                      { label: "Handover", value: project.handover !== "TBA" ? project.handover : null },
                      { label: "Occupancy", value: project.occupancy },
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

                  {project.developer && (
                    <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                      <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                        Developer
                      </p>
                      <div className="flex items-center gap-4">
                        {project.developer_logo && (
                          <div className="flex h-14 w-20 items-center justify-center border rounded-[3px] p-2" style={{ borderColor: THEME.border }}>
                            <ArchiveImage src={project.developer_logo} alt={project.developer} className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <div>
                          <p className="text-[15px] font-medium" style={{ color: THEME.primary }}>
                            {project.developer}
                          </p>
                          {project.developer_description && (
                            <p className="mt-1 text-[11px]" style={{ color: THEME.muted }}>
                              {project.developer_description}
                            </p>
                          )}
                          {project.developer_website && (
                            <a
                              href={project.developer_website}
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
                </motion.div>
              )}

              {activeTab === "amenities" && project.amenities?.length > 0 && (
                <motion.div key="amenities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {project.amenities.map((amenity, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 border rounded-[3px] px-4 py-3"
                        style={{ borderColor: THEME.border }}
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: THEME.accent }} />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>
                          {amenity}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "plans" && hasPlans && (
                <motion.div key="plans" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PaymentPlans plans={project.payment_plans as PaymentPlan[]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside id="enquiry">
            <div className="sticky top-6">
              <EnquiryForm projectName={project.title} refNumber={refNumber} />

              {project.brochure_url && (
                <a
                  href={project.brochure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: THEME.accent }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Brochure
                </a>
              )}

              {project.can_restore && (
                <button
                  onClick={async () => {
                    if (confirm("Restore this project?")) {
                      try {
                        const res = await fetch(`${API_URL}/${project.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: 5 }),
                        });
                        if (res.ok) {
                          router.push("/archive-projects");
                        }
                      } catch {}
                    }
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-emerald-500 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-600 transition-all hover:bg-emerald-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Project
                </button>
              )}

              {project.can_permanently_delete && (
                <button
                  onClick={async () => {
                    if (confirm("Permanently delete this project? This cannot be undone.")) {
                      try {
                        const res = await fetch(`${API_URL}/${project.id}?confirm=true`, { method: "DELETE" });
                        if (res.ok) {
                          router.push("/archive-projects");
                        }
                      } catch {}
                    }
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-red-500 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-red-600 transition-all hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Permanently Delete
                </button>
              )}

              <Link
                href="/archive-projects"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Archive Projects
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {hasMap && (
        <div className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="text-[20px] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              Location
            </h2>
            <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
          </div>
          <div className="overflow-hidden rounded-[3px] border" style={{ borderColor: THEME.border }}>
            <div className="h-[300px] sm:h-[400px]">
              <PropertyMap lat={lat} lng={lng} name={project.title} />
            </div>
            {project.location && (
              <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: THEME.border }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: THEME.accent }} />
                <p className="text-[12px]" style={{ color: THEME.muted }}>
                  {project.location}, Dubai
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasRelated && (
        <div className="mx-auto max-w-[1180px] px-4 pb-16 md:px-6">
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="text-[20px] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              Similar Projects
            </h2>
            <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {project.related_projects.map((proj, idx) => (
              <RelatedProjectCard key={proj.id} project={proj} index={idx} />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <GalleryModal images={galleryImages} currentIndex={activeIndex} onClose={() => setShowModal(false)} onNavigate={setActiveIndex} />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden" style={{ borderColor: THEME.border }}>
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