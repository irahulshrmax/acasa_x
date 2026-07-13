"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";
import {
  Home, Users, Target, Sparkle, Star, Heart,
  Shield, Zap, Globe, Clock, MessageCircle,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface AboutImage {
  id: number;
  url: string;
  label: string;
  filename?: string;
}

interface AboutData {
  id: number;
  title: string;
  slug: string;
  heading: string | null;
  imageurl: string | null;
  descriptions: string | null;
  descriptions_other: string | null;
  enable_modules: string | null;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  status: number;
  primary_image?: string;
  image_url?: string;
  all_images?: AboutImage[];
}

// ============================================================
// ✅ REAL 6 IMAGES - No dummy
// ============================================================
const REAL_ABOUT_IMAGES: AboutImage[] = [
  { id: 1, url: "https://www.acasa.ae/upload/about/about.png",  label: "Our Office", filename: "about.png" },
  { id: 2, url: "https://www.acasa.ae/upload/about/about2.png", label: "Our Team",   filename: "about2.png" },
  { id: 3, url: "https://www.acasa.ae/upload/about/about3.png", label: "Our Work",   filename: "about3.png" },
  { id: 4, url: "https://www.acasa.ae/upload/about/about4.png", label: "Our Vision", filename: "about4.png" },
  { id: 5, url: "https://www.acasa.ae/upload/about/about5.png", label: "Our Values", filename: "about5.png" },
  { id: 6, url: "https://www.acasa.ae/upload/about/about6.png", label: "Our Story",  filename: "about6.png" },
];
// ============================================================
// CONSTANTS
// ============================================================
const values = [
  { icon: Home,    title: "Client-First Approach",  description: "Every decision we make starts with our clients. We prioritize transparency, honesty, and delivering exceptional value." },
  { icon: Users,   title: "Community Building",      description: "We believe in creating lasting relationships and building communities, not just facilitating transactions." },
  { icon: Sparkle, title: "Innovation & Excellence", description: "We continuously push boundaries with cutting-edge technology and data-driven insights." },
  { icon: Target,  title: "Growth Mindset",          description: "Constantly learning, adapting, and improving to stay ahead in the ever-evolving real estate landscape." },
  { icon: Shield,  title: "Trust & Integrity",       description: "100% verified listings, rigorous quality standards, and unwavering commitment to ethical practices." },
  { icon: Heart,   title: "Passion for Homes",       description: "We understand that a home is more than four walls — it's where life happens." },
];

const features = [
  { icon: Zap,           text: "AI-powered property matching" },
  { icon: Globe,         text: "Real-time market insights" },
  { icon: Star,          text: "Virtual tours and 3D experiences" },
  { icon: Clock,         text: "Seamless transaction management" },
  { icon: MessageCircle, text: "Advanced search filters" },
  { icon: Shield,        text: "24/7 customer support" },
];

const stats = [
  { label: "Properties Sold",     value: "2,500+", icon: HiOutlineBuildingOffice2 },
  { label: "Happy Clients",       value: "3,200+", icon: HiOutlineUserGroup },
  { label: "Years of Excellence", value: "15+",    icon: HiOutlineCalendar },
  { label: "Prime Locations",     value: "25+",    icon: HiOutlineMapPin },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * ✅ Image URL ko proxy se route karta hai - HTTP2 fix
 */
function getProxiedUrl(url: string | null | undefined): string {
  if (!url) return "";

  // Local file
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  // www. hatao
  const cleanUrl = url
    .replace("https://www.acasa.ae", "https://acasa.ae")
    .replace("http://www.acasa.ae", "https://acasa.ae");

  return `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`;
}

/**
 * ✅ API images + fallback real images merge karta hai
 */
function getDisplayImages(apiImages?: AboutImage[]): AboutImage[] {
  // API se images aayi hain
  if (apiImages && apiImages.length > 0) {
    const normalized = apiImages.map((img) => ({
      ...img,
      url: img.url
        .replace("https://www.acasa.ae", "https://acasa.ae")
        .replace("http://www.acasa.ae", "https://acasa.ae"),
    }));

    // Agar API se 6 se kam images hain, real images se fill karo
    if (normalized.length < 6) {
      const existingIds = new Set(normalized.map((img) => img.id));
      const extras = REAL_ABOUT_IMAGES.filter(
        (img) => !existingIds.has(img.id)
      );
      return [...normalized, ...extras].slice(0, 6);
    }

    return normalized.slice(0, 6);
  }

  // Koi API image nahi - sab real use karo
  return REAL_ABOUT_IMAGES;
}

// ============================================================
// COMPONENTS
// ============================================================

/** ✅ Safe Image with Proxy + Multi-level fallback */
function SafeImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const proxiedSrc = getProxiedUrl(src);
  const [imgSrc, setImgSrc] = useState(proxiedSrc);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const newSrc = getProxiedUrl(src);
    setImgSrc(newSrc);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#192334]/5 to-[#5B7FBF]/5">
        <div className="text-center p-4">
          <HiOutlineBuildingOffice2 className="mx-auto h-10 w-10 text-[#5B7FBF]/30" />
          <p className="mt-2 text-xs text-gray-400 font-medium">ACASA</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (retryCount === 0) {
          // Retry 1: Direct URL (without proxy)
          const directUrl = src
            ?.replace("https://www.acasa.ae", "https://acasa.ae")
            ?.replace("http://www.acasa.ae", "https://acasa.ae");

          if (directUrl && directUrl.startsWith("http")) {
            setImgSrc(directUrl);
            setRetryCount(1);
            return;
          }
        }
        // Final: Error UI
        setHasError(true);
      }}
    />
  );
}

/** Image Badge */
function ImageBadge({ label }: { label: string }) {
  return (
    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
      <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-medium text-white backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

/** Loading Skeleton */
function LoadingSkeleton() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto h-6 w-28 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto mt-4 h-12 w-80 max-w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="mx-auto mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        {/* 6 image skeleton */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`animate-pulse rounded-2xl bg-gray-200 ${
                i === 1 ? "col-span-2 h-[280px] lg:row-span-2 lg:col-span-1 lg:h-full" : "h-[180px] lg:h-[200px]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Error State */
function ErrorState({ error }: { error: string }) {
  return (
    <section className="flex min-h-[60vh] w-full items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-gray-800">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[#192334] px-8 py-3 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#2a3a52]"
        >
          GO BACK HOME
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// ✅ 6-IMAGE BENTO GALLERY
// ============================================================
function ImageGallery({ images, title }: { images: AboutImage[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-gray-100">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  // ✅ 6 IMAGES - Premium Bento Grid
  if (images.length >= 6) {
    return (
      <div className="grid grid-cols-2 grid-rows-3 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
        {/* Image 1 - Large (2 cols, 2 rows on desktop) */}
        <div className="relative col-span-2 row-span-2 h-[300px] overflow-hidden rounded-2xl sm:h-[380px] lg:h-full lg:min-h-[420px]">
          <SafeImage
            src={images[0].url}
            alt={images[0].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
            <span className="mb-2 inline-block rounded-full bg-[#5B7FBF] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {title}
            </span>
            <p className="text-sm font-medium text-white/80">{images[0].label}</p>
          </div>
        </div>

        {/* Image 2 */}
        <div className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px]">
          <SafeImage
            src={images[1].url}
            alt={images[1].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[1].label} />
        </div>

        {/* Image 3 */}
        <div className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px]">
          <SafeImage
            src={images[2].url}
            alt={images[2].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[2].label} />
        </div>

        {/* Image 4 */}
        <div className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px]">
          <SafeImage
            src={images[3].url}
            alt={images[3].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[3].label} />
        </div>

        {/* Image 5 */}
        <div className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px]">
          <SafeImage
            src={images[4].url}
            alt={images[4].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[4].label} />
        </div>

        {/* Image 6 - Mobile pe hidden, Desktop pe visible */}
        <div className="relative col-span-2 h-[160px] overflow-hidden rounded-2xl sm:h-[200px] lg:col-span-2">
          <SafeImage
            src={images[5].url}
            alt={images[5].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[5].label} />
          {/* Image count badge */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
            <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
              {images.length} Photos
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4-5 images
  if (images.length >= 4) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        <div className="relative col-span-2 h-[220px] overflow-hidden rounded-2xl sm:h-[300px] lg:h-[360px]">
          <SafeImage
            src={images[0].url}
            alt={images[0].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <ImageBadge label={images[0].label} />
        </div>
        {images.slice(1, 4).map((img, i) => (
          <div key={img.id} className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px] lg:h-[360px]">
            <SafeImage
              src={img.url}
              alt={img.label || `About ${i + 2}`}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <ImageBadge label={img.label} />
          </div>
        ))}
      </div>
    );
  }

  // 1-3 images
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((img) => (
        <div key={img.id} className="relative h-[220px] overflow-hidden rounded-2xl sm:h-[280px]">
          <SafeImage
            src={img.url}
            alt={img.label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={img.label} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/about");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to load");

      setAbout(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AboutPage]", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  if (loading) return <LoadingSkeleton />;
  if (error || !about) return <ErrorState error={error || "Page not found"} />;

  // ✅ Real images - API + fallback merge
  const displayImages = getDisplayImages(about.all_images);
  const title = about.title || "About Us";
  const secondaryHtml = about.descriptions_other || "";

  return (
    <section className="w-full overflow-hidden bg-white">

      {/* ══════════ HERO ══════════ */}
      <section className="pb-6 pt-12 sm:pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-[#5B7FBF]/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[3px] text-[#5B7FBF]">
            About Us
          </span>
          <h1
            className="mt-5 text-4xl font-bold leading-tight text-[#192334] sm:text-5xl md:text-6xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {title}
          </h1>
          {about.seo_description && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
              {about.seo_description}
            </p>
          )}
        </div>
      </section>

      {/* ══════════ 6-IMAGE GALLERY ══════════ */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ImageGallery images={displayImages} title={title} />
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-gray-100 bg-gray-50/80 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#5B7FBF]/20 hover:shadow-lg sm:p-6"
              >
                <stat.icon className="mx-auto h-6 w-6 text-[#5B7FBF] transition-transform duration-300 group-hover:scale-110" />
                <p
                  className="mt-3 text-2xl font-bold text-[#192334] sm:text-3xl"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[2px] text-gray-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CONTENT ══════════ */}
      {secondaryHtml && (
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-5 lg:gap-14">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div
                  className="prose prose-gray max-w-none
                    prose-headings:font-semibold prose-headings:text-[#192334]
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-strong:font-semibold prose-strong:text-[#192334]
                    prose-a:text-[#5B7FBF] prose-a:no-underline hover:prose-a:underline
                    [&>p]:mb-4 [&>p:empty]:hidden text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: secondaryHtml }}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6 lg:col-span-2">
                {/* Why Choose Card */}
                <div className="rounded-2xl bg-[#F7F3EF] p-6">
                  <h3
                    className="text-lg font-semibold text-[#192334]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Why Choose ACASA?
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {[
                      "Exclusive off-market properties",
                      "Bespoke client service",
                      "Expert negotiation skills",
                      "Cutting-edge technology",
                      "Deep local knowledge",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5B7FBF] text-[10px] text-white">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Card */}
                <div className="rounded-2xl bg-[#192334] p-6 text-center">
                  <p className="text-[11px] uppercase tracking-[3px] text-gray-400">
                    Get in Touch
                  </p>
                  <h3
                    className="mt-2 text-xl font-semibold text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Ready to find your dream home?
                  </h3>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[#5B7FBF] px-6 py-2.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#4a6a9f]"
                  >
                    CONTACT US
                    <HiOutlineArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Image Sidebar Card */}
                {displayImages.length >= 5 && (
                  <div className="relative h-[200px] overflow-hidden rounded-2xl">
                    <SafeImage
                      src={displayImages[4].url}
                      alt={displayImages[4].label}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <ImageBadge label={displayImages[4].label} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ VALUES ══════════ */}
      <section className="bg-[#FAFAFA] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full bg-[#5B7FBF]/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[3px] text-[#5B7FBF]">
              Our Values
            </span>
            <h2
              className="mt-4 text-3xl font-bold text-[#192334] sm:text-4xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              What Drives Us
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5B7FBF]/10 text-[#5B7FBF] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#192334] sm:text-lg">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ TEAM ══════════ */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl sm:h-[380px] lg:h-[440px]">
              <SafeImage
                src={displayImages.length >= 2 ? displayImages[1].url : REAL_ABOUT_IMAGES[1].url}
                alt="Our Team"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-[#5B7FBF]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[3px] text-[#5B7FBF]">
                Our Team
              </span>
              <h2
                className="mt-4 text-3xl font-bold leading-tight text-[#192334] sm:text-4xl lg:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Our award-winning team of experts
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                As real estate experts, our negotiation skills and bespoke
                service give us the edge crucial in a highly competitive market.
              </p>
              <Link
                href="/team"
                className="mt-6 inline-flex items-center text-sm font-medium text-[#5B7FBF] transition-colors hover:text-[#192334]"
              >
                Meet the team
                <HiOutlineArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TECHNOLOGY ══════════ */}
      <section className="bg-[#F7F3EF] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <span className="inline-block rounded-full bg-[#5B7FBF]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[3px] text-[#5B7FBF]">
                Technology
              </span>
              <h2
                className="mt-4 text-3xl font-bold leading-tight text-[#192334] sm:text-4xl lg:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Built for the brightest minds
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                We&apos;ve invested millions in building the smartest real estate
                platform in the region.
              </p>
              <ul className="mt-6 space-y-3">
                {features.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-700 sm:text-base"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#192334] text-white">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {item.text}
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/properties"
                className="mt-8 inline-flex items-center justify-center rounded-full border-2 border-[#192334] px-7 py-3 text-xs font-semibold uppercase tracking-wide text-[#192334] transition-all duration-300 hover:bg-[#192334] hover:text-white"
              >
                Explore Properties
                <HiOutlineArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="relative order-1 h-[260px] w-full overflow-hidden rounded-2xl sm:h-[380px] lg:order-2 lg:h-[440px]">
              <SafeImage
                src={displayImages.length >= 3 ? displayImages[2].url : REAL_ABOUT_IMAGES[2].url}
                alt="Technology"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="bg-[#0D1520] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <HiOutlineSparkles className="mx-auto h-10 w-10 text-[#5B7FBF]" />
          <h2
            className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Want to join ACASA?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            We are always looking for talent who are passionate about property
            and committed to outstanding service.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/20 px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-[#0D1520]"
            >
              Explore Opportunities
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[#5B7FBF] px-8 py-3.5 text-xs font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:bg-[#4a6a9f]"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}