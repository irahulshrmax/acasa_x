"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Loader2,
  MapPin,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Bath,
  BedDouble,
  Maximize,
  Star,
  Eye,
  Home,
  Plus,
  Minus,
  Globe,
  Mail,
  User,
  Briefcase,
  Clock,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  CircleX,
  CircleSlash,
  Grid3x3,
  List,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

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

// ─── TYPES ──────────────────────────────────────────────────────────────

interface Project {
  id: number;
  name: string;
  slug: string;
  featured_image: string | null;
  price: string | null;
  property_type: string | null;
  status: number;
  bedrooms: string | null;
  area: string | null;
  area_size: string | null;
  developer_id: number;
  created_at: string | null;
  updated_at: string | null;
}

interface Property {
  id: number;
  name: string;
  slug: string;
  featured_image: string | null;
  price: number | null;
  property_type: string | null;
  status: number;
  bedrooms: string | null;
  bathrooms: string | null;
  area: string | null;
  area_size: string | null;
  developer_id: number;
  created_at: string | null;
  updated_at: string | null;
}

interface Developer {
  id: number;
  name: string;
  country: string | null;
  website: string | null;
  image: string | null;
  image_url: string;
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
  projects?: Project[];
  properties?: Property[];
}

// ─── HELPERS ──────────────────────────────────────────────────────────

function fixImageUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/upload/")) {
    return `https://acasa.ae${url}`;
  }
  return `https://acasa.ae/upload/developers/${url}`;
}

function getDeveloperImage(developer: Developer): string {
  if (developer.image_url && developer.image_url !== "https://acasa.ae/upload/no-image.png") {
    return developer.image_url;
  }
  if (developer.image) {
    return fixImageUrl(developer.image);
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(developer.name || "Developer")}&size=400&background=0A2540&color=fff&font-size=0.5&bold=true`;
}

function getProjectImage(project: Project): string {
  if (project.featured_image) {
    return `https://acasa.ae/upload/projects/${project.featured_image}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name || "Project")}&size=400&background=1B3A5F&color=fff&font-size=0.5&bold=true`;
}

function getCountryFlag(country: string | null): string {
  if (!country) return "🌍";
  const flags: Record<string, string> = {
    "United Arab Emirates": "🇦🇪",
    UAE: "🇦🇪",
    "USA": "🇺🇸",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Australia": "🇦🇺",
    "Singapore": "🇸🇬",
    "Canada": "🇨🇦",
    "Germany": "🇩🇪",
    "Switzerland": "🇨🇭",
    "India": "🇮🇳",
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

function getStatusText(status: number): string {
  switch (status) {
    case 1: return "Active";
    case 0: return "Inactive";
    default: return "Unknown";
  }
}

function getStatusIcon(status: number): React.ElementType {
  switch (status) {
    case 1: return CheckCircle;
    case 0: return CircleX;
    default: return CircleSlash;
  }
}

function getStatusColor(status: number): string {
  switch (status) {
    case 1: return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 0: return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// ─── LOADER ────────────────────────────────────────────────────────────

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
          Loading Developer
        </motion.p>
      </div>
    </div>
  );
}

// ─── ENQUIRY FORM ──────────────────────────────────────────────────────

function DeveloperEnquiryForm({ developerName }: { developerName: string }) {
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
          if (errors[key]) setErrors((p) => {
            const n = { ...p };
            delete n[key];
            return n;
          });
        }}
        className={`mt-1.5 w-full border px-3 py-2.5 text-[12px] transition-all focus:outline-none ${
          errors[key]
            ? "border-red-300 bg-red-50 focus:border-red-400"
            : "border-gray-200 bg-white focus:border-[#0A2540]"
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
          Contact Developer
        </h3>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
          Get in touch with {developerName}
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
              </motion.div>
              <p className="mt-4 text-[17px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                Message Sent!
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: THEME.muted }}>
                We'll get back to you within 24 hours.
              </p>
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
                  placeholder={`I'm interested in properties by ${developerName}...`}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="mt-1.5 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-[#0A2540] focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <div
                    className={`flex h-4 w-4 items-center justify-center border-2 transition-colors ${
                      agreed ? "border-transparent" : "border-gray-300 bg-white"
                    }`}
                    style={agreed ? { backgroundColor: THEME.primary } : {}}
                  >
                    {agreed && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
                <span className="text-[10px] leading-relaxed" style={{ color: THEME.muted }}>
                  I agree to the <Link href="/terms" className="underline hover:no-underline" style={{ color: THEME.primary }}>Terms & Conditions</Link> and consent to being contacted.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/971502590071?text=I'm%20interested%20in%20${encodeURIComponent(developerName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <button
                  type="submit"
                  disabled={!agreed || submitting}
                  className="py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
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

// ─── PROJECT CARD ──────────────────────────────────────────────────────

function DeveloperProjectCard({ project, index }: { project: Project; index: number }) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  
  const imageSrc = !imgError ? getProjectImage(project) : `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name || "Project")}&size=400&background=1B3A5F&color=fff&font-size=0.5&bold=true`;

  const handleClick = () => {
    router.push(`/projects/${project.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={handleClick}
      className="group cursor-pointer border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={project.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded-[3px] text-white text-[8px] uppercase tracking-[0.1em] backdrop-blur-sm">
          {project.status === 1 ? <CheckCircle className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
          <span>{getStatusText(project.status || 1)}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-[13px] uppercase tracking-wide truncate" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
          {project.name}
        </h3>
        
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: THEME.muted }}>
          {project.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {project.bedrooms}
            </span>
          )}
          {(project.area || project.area_size) && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              {project.area || project.area_size} sqft
            </span>
          )}
        </div>

        {project.price && (
          <p className="mt-2 text-[14px] font-semibold" style={{ color: THEME.primary }}>
            AED {parseInt(project.price).toLocaleString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── PROPERTY CARD ──────────────────────────────────────────────────────

function DeveloperPropertyCard({ property, index }: { property: Property; index: number }) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  
  const imageSrc = !imgError && property.featured_image 
    ? `https://acasa.ae/upload/properties/${property.featured_image}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(property.name || "Property")}&size=400&background=1B3A5F&color=fff&font-size=0.5&bold=true`;

  const handleClick = () => {
    router.push(`/properties/${property.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={handleClick}
      className="group cursor-pointer border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={property.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded-[3px] text-white text-[8px] uppercase tracking-[0.1em] backdrop-blur-sm">
          {property.status === 5 ? <CheckCircle className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
          <span>{property.status === 5 ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-[13px] uppercase tracking-wide truncate" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
          {property.name}
        </h3>
        
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: THEME.muted }}>
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" />
              {property.bathrooms}
            </span>
          )}
          {(property.area || property.area_size) && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              {property.area || property.area_size} sqft
            </span>
          )}
        </div>

        {property.price && (
          <p className="mt-2 text-[14px] font-semibold" style={{ color: THEME.primary }}>
            AED {property.price.toLocaleString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── SIMILAR DEVELOPER CARD ────────────────────────────────────────────

function SimilarDeveloperCard({ developer, index }: { developer: any; index: number }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);

  const img = !imgErr ? developer.image_url || developer.image : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/developers/${developer.seo_slug || developer.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={developer.name}
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
        <h3 className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#1B3A5F]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
          {developer.name}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <Briefcase className="h-3 w-3" /> {developer.project_count || 0} Projects
        </p>
        {developer.country && (
          <p className="text-[10px]" style={{ color: THEME.muted }}>
            {getCountryFlag(developer.country)} {developer.country}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── STATS CARD ──────────────────────────────────────────────────────────

function StatsCard({ icon: Icon, label, value, subtext }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtext?: string;
}) {
  return (
    <div className="border p-5 text-center hover:border-gray-300 transition-colors bg-white" style={{ borderColor: THEME.border }}>
      <Icon className="mx-auto h-6 w-6" style={{ color: THEME.primary }} />
      <p className="mt-2 text-[24px] font-light" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-[0.15em] mt-0.5" style={{ color: THEME.muted }}>
        {label}
      </p>
      {subtext && (
        <p className="text-[8px] uppercase tracking-[0.1em] mt-1" style={{ color: THEME.muted }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────

export default function DeveloperDetailPage() {
  const router = useRouter();
  // ✅ Fix: params ko sahi se handle karo
  const slug = window.location.pathname.split('/').pop() || '';

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "properties">("projects");
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllProperties, setShowAllProperties] = useState(false);
  const [similarDevelopers, setSimilarDevelopers] = useState<any[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!slug || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchDeveloper = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `/api/v1/developers/${slug}`;
        console.log("🔍 [Detail] Fetching:", apiUrl);
        
        const res = await fetch(apiUrl);
        console.log("📡 [Detail] Response status:", res.status);

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ [Detail] Data received:", data);

        if (!data.success || !data.data) {
          throw new Error(data.message || "Developer not found");
        }

        setDeveloper(data.data);
      } catch (err: any) {
        console.error("❌ [Detail] Error:", err);
        setError(err.message);
        toast.error(err.message || "Failed to load developer");
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloper();
  }, [slug]);

  useEffect(() => {
    if (!developer) return;

    const fetchSimilar = async () => {
      try {
        const res = await fetch(
          `/api/v1/developers?limit=4&sort_by=project_count&status=1`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setSimilarDevelopers(
            data.data.filter((d: any) => d.id !== developer.id).slice(0, 3)
          );
        }
      } catch (err) {
        console.error("Similar developers error:", err);
      }
    };

    fetchSimilar();
  }, [developer]);

  const handleShare = useCallback(async () => {
    if (!developer) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: developer.name || "Developer", url: window.location.href });
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
        <div className="max-w-md px-4 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h1 className="text-2xl font-light text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
            Not Found
          </h1>
          <p className="my-4 text-sm text-red-500">{error || "Developer not found"}</p>
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
              href="/developers"
              className="bg-gray-200 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 hover:bg-gray-300"
            >
              All Developers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalProjects = developer.project_count || 0;
  const totalProperties = developer.property_count || 0;
  const imageSrc = getDeveloperImage(developer);

  const displayProjects = showAllProjects ? developer.projects || [] : (developer.projects || []).slice(0, 6);
  const displayProperties = showAllProperties ? developer.properties || [] : (developer.properties || []).slice(0, 6);

  const hasMoreProjects = (developer.projects || []).length > 6;
  const hasMoreProperties = (developer.properties || []).length > 6;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="transition-colors hover:text-[#0A2540]">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/developers" className="transition-colors hover:text-[#0A2540]">Developers</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="max-w-[120px] truncate text-gray-500 sm:max-w-none">
                {developer.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
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

      {/* Developer Header */}
      <div className="mx-auto max-w-[1180px] px-4 pb-6 pt-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              {developer.country && (
                <span className="flex items-center gap-1.5 border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]" style={{ borderColor: THEME.border, color: THEME.muted }}>
                  <Globe className="h-3 w-3" />
                  {developer.country} {getCountryFlag(developer.country)}
                </span>
              )}
              {developer.year_established && (
                <span className="flex items-center gap-1.5 border px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]" style={{ borderColor: THEME.border, color: THEME.muted }}>
                  <Calendar className="h-3 w-3" />
                  Est. {developer.year_established}
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] border ${getStatusColor(developer.status)}`}>
                {developer.status === 1 ? <CheckCircle className="h-3 w-3" /> : <CircleX className="h-3 w-3" />}
                {getStatusText(developer.status)}
              </span>
              {developer.total_project_withus && parseInt(developer.total_project_withus) > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em]" style={{ backgroundColor: THEME.primary, color: "white" }}>
                  <Star className="h-3 w-3" />
                  {developer.total_project_withus} Projects with us
                </span>
              )}
            </div>

            <h1 className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {developer.name}
            </h1>

            {developer.ceo_name && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: THEME.muted }}>
                <User className="h-3.5 w-3.5" />
                <span>CEO: {developer.ceo_name}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center gap-6">
              {totalProjects > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>Total Projects</p>
                  <p className="text-[28px] font-light leading-none" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    {totalProjects}
                  </p>
                </div>
              )}
              {totalProperties > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: THEME.muted }}>Properties</p>
                  <p className="text-[28px] font-light leading-none" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
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
              <Globe className="h-3.5 w-3.5" />
              {developer.website.replace(/^https?:\/\//, '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Hero Image */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative aspect-[16/6] overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={developer.name || "Developer"}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left */}
          <div>
            {/* About */}
            {developer.informations && (
              <div className="mb-10">
                <h2 className="text-[20px] sm:text-[24px] mb-4" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  About {developer.name}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: developer.informations }}
                />
              </div>
            )}

            {/* Projects & Properties Tabs */}
            {(developer.projects && developer.projects.length > 0) || (developer.properties && developer.properties.length > 0) ? (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`text-[11px] font-medium uppercase tracking-[0.15em] pb-2 border-b-2 transition-all ${
                      activeTab === 'projects'
                        ? 'border-[#0A2540] text-[#0A2540]'
                        : 'border-transparent text-[#6B7A8D] hover:text-gray-600'
                    }`}
                  >
                    <Building2 className="inline h-3.5 w-3.5 mr-1.5" />
                    Projects ({developer.projects?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('properties')}
                    className={`text-[11px] font-medium uppercase tracking-[0.15em] pb-2 border-b-2 transition-all ${
                      activeTab === 'properties'
                        ? 'border-[#0A2540] text-[#0A2540]'
                        : 'border-transparent text-[#6B7A8D] hover:text-gray-600'
                    }`}
                  >
                    <Home className="inline h-3.5 w-3.5 mr-1.5" />
                    Properties ({developer.properties?.length || 0})
                  </button>
                </div>

                {activeTab === 'projects' && developer.projects && developer.projects.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {displayProjects.map((project, i) => (
                        <DeveloperProjectCard key={project.id || i} project={project} index={i} />
                      ))}
                    </div>
                    {hasMoreProjects && (
                      <button
                        onClick={() => setShowAllProjects(!showAllProjects)}
                        className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-[10px] font-medium uppercase tracking-[0.15em] border transition-all hover:bg-gray-50"
                        style={{ borderColor: THEME.border, color: THEME.primary }}
                      >
                        {showAllProjects ? (
                          <><Minus className="h-3.5 w-3.5" /> Show Less</>
                        ) : (
                          <><Plus className="h-3.5 w-3.5" /> View All {developer.projects.length} Projects</>
                        )}
                      </button>
                    )}
                  </>
                )}

                {activeTab === 'properties' && developer.properties && developer.properties.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {displayProperties.map((property, i) => (
                        <DeveloperPropertyCard key={property.id || i} property={property} index={i} />
                      ))}
                    </div>
                    {hasMoreProperties && (
                      <button
                        onClick={() => setShowAllProperties(!showAllProperties)}
                        className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-[10px] font-medium uppercase tracking-[0.15em] border transition-all hover:bg-gray-50"
                        style={{ borderColor: THEME.border, color: THEME.primary }}
                      >
                        {showAllProperties ? (
                          <><Minus className="h-3.5 w-3.5" /> Show Less</>
                        ) : (
                          <><Plus className="h-3.5 w-3.5" /> View All {developer.properties.length} Properties</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {/* Contact Information */}
            {(developer.email || developer.mobile || developer.address) && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <h3 className="text-[16px] mb-4" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Contact Information
                </h3>
                <div className="space-y-2 text-[13px]" style={{ color: "#4A5462" }}>
                  {developer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" style={{ color: THEME.muted }} />
                      <a href={`mailto:${developer.email}`} className="hover:underline">
                        {developer.email}
                      </a>
                    </div>
                  )}
                  {developer.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" style={{ color: THEME.muted }} />
                      <a href={`tel:${developer.mobile}`} className="hover:underline">
                        {developer.mobile}
                      </a>
                    </div>
                  )}
                  {developer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: THEME.muted }} />
                      <span>{developer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {developer.created_at && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                <p className="text-[10px]" style={{ color: THEME.muted }}>
                  <Clock className="inline h-3 w-3 mr-1.5" />
                  Last updated: {formatDate(developer.updated_at || developer.created_at)}
                </p>
              </div>
            )}
          </div>

          {/* Right - Enquiry */}
          <aside id="enquiry">
            <div className="sticky top-6">
              <DeveloperEnquiryForm developerName={developer.name} />
              {developer.mobile && (
                <a
                  href={`tel:${developer.mobile}`}
                  className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <Phone className="h-3.5 w-3.5" /> Call Developer
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
        <div className="mb-6 flex items-baseline gap-3">
          <h2 className="text-[20px] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
            Quick Stats
          </h2>
          <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <StatsCard icon={Building2} label="Total Projects" value={totalProjects} />
          <StatsCard icon={Home} label="Properties" value={totalProperties} />
          <StatsCard icon={Globe} label="Country" value={developer.country ? getCountryFlag(developer.country) : "🌍"} subtext={developer.country || "Unknown"} />
          <StatsCard icon={Calendar} label="Established" value={developer.year_established || "N/A"} />
          <StatsCard icon={CheckCircle} label="Status" value={developer.status === 1 ? "Active" : "Inactive"} />
          <StatsCard icon={Star} label="Projects with us" value={developer.total_project_withus || "0"} />
        </div>
      </div>

      {/* Similar Developers */}
      {similarDevelopers.length > 0 && (
        <div className="border-t pb-16 pt-16" style={{ borderColor: THEME.border }}>
          <div className="mx-auto max-w-[1180px] px-4 md:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[9px] uppercase tracking-[0.25em]" style={{ color: THEME.primary }}>
                  Explore More
                </p>
                <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Similar Developers
                </h2>
              </div>
              <Link
                href="/developers"
                className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
                style={{ color: THEME.primary }}
              >
                View All <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {similarDevelopers.map((d, i) => (
                <SimilarDeveloperCard key={d.id} developer={d} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden" style={{ borderColor: THEME.border }}>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/971502590071?text=I'm%20interested%20in%20${encodeURIComponent(developer.name)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-colors hover:bg-emerald-50"
            style={{ borderColor: "#10b981" }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
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