"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Check,
  MapPin,
  Calendar,
  Building2,
  Shield,
  Clock,
  Award,
  Users,
  BedDouble,
  Maximize,
  Grid3x3,
} from "lucide-react";

// Import the EnquiryForm component
import EnquiryForm from "@/components/EnquiryForm";

const API_URL = "/api/v1/projects/new-project";
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

interface Project {
  id: number;
  ProjectName: string;
  project_slug: string;
  listing_type: string | null;
  property_type: string | null;
  bedroom: string | null;
  price: number | null;
  price_end: number | null;
  area: number | null;
  area_end: number | null;
  city_id: number | null;
  community_id: number | null;
  developer_id: number | null;
  featured_project: string | null;
  status: number;
  description: string | null;
  keyword: string | null;
  seo_title: string | null;
  meta_description: string | null;
  gallery_media_ids: string | null;
  featured_image: string | null;
  CityName: string | null;
  CommunityName: string | null;
  created_at: string | null;
  updated_at: string | null;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  occupancy: string | null;
  total_units: number | null;
  image_url: string;
  gallery_images: string[];
  price_display: string;
  bedrooms_label: string;
  area_display: string;
  formatted_price: string;
  media_records: Array<{
    id: number;
    path: string;
    title: string | null;
    featured: number | null;
    media_order: number | null;
    full_url: string;
  }>;
  logo_url: string | null;
  specs: any | null;
  developer_name?: string;
  // Agent fields
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  agent_photo?: string | null;
  agent_id?: string;
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
          Loading Project
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

function SimilarProjectCard({ project, index }: { project: any; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();
  const img = !imgErr ? project.image_url || project.gallery_images?.[0] || null : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={() => router.push(`/new-projects-in-dubai/${project.project_slug || project.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={project.ProjectName || "Project"}
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
        {project.featured_project === "1" && (
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
          {project.ProjectName || "Project"}
        </h3>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
          <MapPin className="h-3 w-3" />
          {project.CommunityName || project.CityName || "Dubai"}
        </p>
        <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
          {project.price_display || "Price on Request"}
        </p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: THEME.muted }}>
          {project.bedrooms_label && <span>{project.bedrooms_label}</span>}
          {project.area_display && project.area_display !== "Area on Request" && (
            <>
              <span>·</span>
              <span>{project.area_display}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?slug=${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Project not found");
        setProject(data.data);
      } catch (err: any) {
        setError(err.message);
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
        await navigator.share({
          title: project.ProjectName || "Project",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [project]);

  const galleryImages = useMemo(() => {
    if (!project) return [];
    const images: string[] = [];
    if (project.image_url && !project.image_url.includes("no-image")) {
      images.push(project.image_url);
    }
    if (project.gallery_images) {
      project.gallery_images.forEach((img) => {
        if (!images.includes(img) && !img.includes("no-image")) {
          images.push(img);
        }
      });
    }
    if (project.media_records) {
      project.media_records.forEach((record) => {
        if (record.full_url && !images.includes(record.full_url) && !record.full_url.includes("no-image")) {
          images.push(record.full_url);
        }
      });
    }
    if (images.length === 0) {
      images.push("https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop");
    }
    return images;
  }, [project]);

  if (loading) return <PageLoader />;

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Project not found"}</p>
          <Link
            href="/new-projects-in-dubai"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Projects
          </Link>
        </div>
      </div>
    );
  }

  const location = project.CommunityName || project.CityName || "Dubai";
  const isPriceOnRequest = !project.price;
  const priceDisplay = project.price_display || "Price on Request";
  const isOffPlan = project.listing_type === "Off plan";

  const specs = [
    { icon: BedDouble, label: project.bedrooms_label || "Studio" },
    { icon: Maximize, label: project.area_display || "Area on Request" },
  ].filter((s) => s.label);

  // Agent data with fallbacks
  const agentData = {
    name: project.agent_name || "Ahmed Al Maktoum",
    phone: project.agent_phone || "+971 50 259 0071",
    email: project.agent_email || "ahmed@acasa.ae",
    photo: project.agent_photo || null,
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/new-projects-in-dubai" className="hover:text-gray-600 transition-colors">
                Projects
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {project.ProjectName || "Project"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleWishlist}
                className={`flex h-9 w-9 items-center justify-center border transition-all ${
                  isWishlisted ? "border-red-500 bg-red-500 text-white" : "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500"
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
                onClick={() => document.getElementById("enquiry-form")?.scrollIntoView({ behavior: "smooth" })}
                className="hidden sm:flex items-center gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Header */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {project.featured_project === "1" && (
                <span
                  className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.accent }}
                >
                  Featured
                </span>
              )}
              {project.listing_type && (
                <span
                  className={`px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] border ${
                    isOffPlan ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {project.listing_type}
                </span>
              )}
              {project.exclusive_status && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-purple-50 text-purple-700 border border-purple-200">
                  <Award className="h-2.5 w-2.5" />
                  {project.exclusive_status}
                </span>
              )}
              {project.completion_date && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-blue-50 text-blue-700 border border-blue-200">
                  <Calendar className="h-2.5 w-2.5" />
                  Completion: {project.completion_date}
                </span>
              )}
              {project.dld_permit && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-orange-50 text-orange-700 border border-orange-200">
                  <Shield className="h-2.5 w-2.5" />
                  DLD: {project.dld_permit}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {project.ProjectName || "Project"}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{location}</span>
              </div>
              {project.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Launched {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              {isOffPlan ? "Starting Price" : "Price"}
            </p>
            <p
              className="text-[26px] sm:text-[32px] font-light leading-none"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
            {project.total_units && project.total_units > 0 && (
              <p className="mt-1 text-[10px]" style={{ color: THEME.muted }}>
                <Users className="inline h-3 w-3 mr-1" />
                {project.total_units} units
              </p>
            )}
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
        </div>
      </div>

      {/* Gallery */}
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
                alt={project.ProjectName || "Project"}
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
                  <span className="text-[11px] font-medium">+{galleryImages.length - 10}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left Column - Overview */}
          <div>
            <div className="border-b mb-8" style={{ borderColor: THEME.border }}>
              <button
                className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors"
                style={{ color: THEME.primary, borderColor: THEME.primary }}
              >
                Overview
              </button>
            </div>

            <div>
              <h2
                className="text-[20px] sm:text-[24px] leading-snug mb-4"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {project.ProjectName || "Project"}
              </h2>

              {project.description ? (
                <div
                  className="prose prose-sm max-w-none text-[13px] leading-relaxed"
                  style={{ color: "#4A5462" }}
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              ) : (
                <p className="text-[13px] leading-relaxed" style={{ color: "#4A5462" }}>
                  Welcome to {project.ProjectName}, a premium development in {location}, Dubai. This exceptional project
                  offers world-class amenities and stunning views.
                </p>
              )}

              <div
                className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3"
                style={{ borderColor: THEME.border }}
              >
                {[
                  { label: "Listing Type", value: project.listing_type },
                  { label: "Bedrooms", value: project.bedrooms_label },
                  { label: "Area", value: project.area_display },
                  { label: "DLD Permit", value: project.dld_permit },
                  { label: "Completion", value: project.completion_date },
                  { label: "Occupancy", value: project.occupancy },
                  { label: "Total Units", value: project.total_units ? `${project.total_units} units` : null },
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

              {project.specs && (
                <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                  <h3 className="text-[16px] mb-4" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(project.specs)
                      .filter(([_, value]) => value === "1" || value === "yes" || value === "true")
                      .slice(0, 12)
                      .map(([key]) => (
                        <div key={key} className="flex items-center gap-2 text-[11px]" style={{ color: THEME.primary }}>
                          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: THEME.accent }} />
                          {key.replace(/_/g, " ").toUpperCase()}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Right Column - Enquiry Form (FIXED PROPS) */}
          <aside id="enquiry-form">
            <div className="sticky top-6">
         <EnquiryForm
  propertyName={project.ProjectName || "Project"}
  refNumber={project.project_slug || String(project.id)}
  projectId={project.id}  // ✅ Ye pass kar rahe ho?
  propertyId={null}       // ✅ Property page nahi hai toh null
  agentId={null}
  agentName={agentData.name}
  agentPhone={agentData.phone}
  agentEmail={agentData.email}
  agentPhoto={agentData.photo}
  listingType={project.listing_type || "For Sale"}
  itemType="project"       // ✅ Explicitly set karo
  whatsappNumber="971502590071"
/>

              <Link
                href="/new-projects-in-dubai"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Projects
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Gallery Modal */}
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

      <div className="h-20 sm:hidden" />
    </div>
  );
}