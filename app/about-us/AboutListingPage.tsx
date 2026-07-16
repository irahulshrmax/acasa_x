"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";
import {
  Home,
  Users,
  Target,
  Sparkle,
  Star,
  Heart,
  Shield,
  Zap,
  Globe,
  Clock,
  MessageCircle,
} from "lucide-react";

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

// Real property images from Pexels CDN (highly reliable, no rate limits)
const ABOUT_IMAGES: AboutImage[] = [
  {
    id: 1,
    url: "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Luxury Villa",
  },
  {
    id: 2,
    url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Modern Home",
  },
  {
    id: 3,
    url: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Elegant Interior",
  },
  {
    id: 4,
    url: "https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Premium Living",
  },
  {
    id: 5,
    url: "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Contemporary Design",
  },
  {
    id: 6,
    url: "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1200",
    label: "Dream Home",
  },
];

// Fallback: Picsum with property-related seeds
const FALLBACK_IMAGES = [
  "https://picsum.photos/seed/luxury-villa/1200/800",
  "https://picsum.photos/seed/modern-house/1200/800",
  "https://picsum.photos/seed/interior-design/1200/800",
  "https://picsum.photos/seed/property-view/1200/800",
  "https://picsum.photos/seed/real-estate/1200/800",
  "https://picsum.photos/seed/home-interior/1200/800",
];

const values = [
  {
    icon: Home,
    title: "Client-First Approach",
    description: "Every decision we make starts with our clients.",
    longDescription:
      "We believe in building lasting relationships by putting our clients' needs first. Our team goes above and beyond to ensure every client finds their perfect property.",
    iconBg: "#5B7FBF",
  },
  {
    icon: Users,
    title: "Community Building",
    description: "Creating lasting relationships, not just transactions.",
    longDescription:
      "ACASA is more than a real estate platform — we're community builders. We foster connections that strengthen neighborhoods and create vibrant living spaces.",
    iconBg: "#C8AA78",
  },
  {
    icon: Sparkle,
    title: "Innovation & Excellence",
    description: "Cutting-edge technology and data-driven insights.",
    longDescription:
      "Our team leverages AI-powered matching, virtual tours, and real-time market data to provide an unmatched property discovery experience.",
    iconBg: "#577C8E",
  },
  {
    icon: Target,
    title: "Growth Mindset",
    description: "Adapting to stay ahead in real estate.",
    longDescription:
      "We invest in continuous learning and development, ensuring our team stays at the forefront of industry trends and market insights.",
    iconBg: "#192334",
  },
  {
    icon: Shield,
    title: "Trust & Integrity",
    description: "Verified listings and ethical practices.",
    longDescription:
      "Trust is the foundation of everything we do. Every property is verified, and every transaction is conducted with complete transparency.",
    iconBg: "#5B7FBF",
  },
  {
    icon: Heart,
    title: "Passion for Homes",
    description: "A home is where life happens.",
    longDescription:
      "Our passion extends beyond transactions. We understand the emotional significance of finding the perfect home and the joy it brings to families.",
    iconBg: "#C8AA78",
  },
];

const features = [
  { icon: Zap, text: "AI-powered property matching" },
  { icon: Globe, text: "Real-time market insights" },
  { icon: Star, text: "Virtual tours and 3D experiences" },
  { icon: Clock, text: "Seamless transaction management" },
  { icon: MessageCircle, text: "Advanced search filters" },
  { icon: Shield, text: "24/7 customer support" },
];

const stats = [
  { label: "Properties Sold", value: "2,500+", icon: HiOutlineBuildingOffice2 },
  { label: "Happy Clients", value: "3,200+", icon: HiOutlineUserGroup },
  { label: "Years of Excellence", value: "15+", icon: HiOutlineCalendar },
  { label: "Prime Locations", value: "25+", icon: HiOutlineMapPin },
];

function getDisplayImages(apiImages?: AboutImage[]): AboutImage[] {
  if (apiImages && apiImages.length > 0) {
    const validImages = apiImages.filter(
      (img) => img.url && !img.url.includes("no-image")
    );
    if (validImages.length > 0) {
      return validImages.slice(0, 6);
    }
  }
  return ABOUT_IMAGES;
}

function SafeImage({
  src,
  alt,
  className = "",
  priority = false,
  index = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  index?: number;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setImgSrc(src);
    setErrorCount(0);
  }, [src]);

  const handleError = () => {
    if (errorCount === 0) {
      // Fallback 1: Try another Pexels image
      setImgSrc(ABOUT_IMAGES[index % ABOUT_IMAGES.length].url);
      setErrorCount(1);
    } else if (errorCount === 1) {
      // Fallback 2: Picsum (always works)
      setImgSrc(FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]);
      setErrorCount(2);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={handleError}
    />
  );
}

function ImageBadge({ label }: { label: string }) {
  return (
    <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
      <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-medium text-white backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

function ImageGallery({
  images,
  title,
}: {
  images: AboutImage[];
  title: string;
}) {
  if (images.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-gray-100">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  if (images.length >= 6) {
    return (
      <div className="grid grid-cols-2 grid-rows-3 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
        {/* Main large image */}
        <div className="relative col-span-2 row-span-2 h-[300px] overflow-hidden rounded-2xl sm:h-[380px] lg:h-full lg:min-h-[420px]">
          <SafeImage
            src={images[0].url}
            alt={images[0].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            priority
            index={0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
            <span className="mb-2 inline-block rounded-full bg-[#5B7FBF] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {title}
            </span>
            <p className="text-sm font-medium text-white/80">
              {images[0].label}
            </p>
          </div>
        </div>

        {/* 4 smaller images */}
        {images.slice(1, 5).map((img, i) => (
          <div
            key={img.id}
            className="relative h-[160px] overflow-hidden rounded-2xl sm:h-[200px]"
          >
            <SafeImage
              src={img.url}
              alt={img.label}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              index={i + 1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <ImageBadge label={img.label} />
          </div>
        ))}

        {/* Bottom wide image */}
        <div className="relative col-span-2 h-[160px] overflow-hidden rounded-2xl sm:h-[200px] lg:col-span-2">
          <SafeImage
            src={images[5].url}
            alt={images[5].label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            index={5}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={images[5].label} />
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
            <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">
              {images.length} Photos
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((img, i) => (
        <div
          key={img.id}
          className="relative h-[220px] overflow-hidden rounded-2xl sm:h-[280px]"
        >
          <SafeImage
            src={img.url}
            alt={img.label}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            index={i}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <ImageBadge label={img.label} />
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto h-6 w-28 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto mt-4 h-12 w-80 max-w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="mx-auto mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`animate-pulse rounded-2xl bg-gray-200 ${
                i === 1
                  ? "col-span-2 h-[280px] lg:row-span-2 lg:col-span-1 lg:h-full"
                  : "h-[180px] lg:h-[200px]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

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

function ValueCard({
  value,
  index,
}: {
  value: (typeof values)[0];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = value.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.3) }}
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.7s",
          transform: isHovered ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
        }}
      >
        {/* Front Face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-6 h-full">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300"
              style={{ backgroundColor: `${value.iconBg}15` }}
            >
              <Icon className="h-6 w-6" style={{ color: value.iconBg }} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#192334] sm:text-lg">
              {value.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {value.description}
            </p>
          </div>
        </div>

        {/* Back Face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
            width: "100%",
          }}
        >
          <div className="h-full w-full rounded-2xl bg-[#192334] p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl mb-3"
                style={{ backgroundColor: `${value.iconBg}30` }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {value.longDescription}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[8px] text-[#C8AA78] uppercase tracking-widest text-center">
                Hover to flip back
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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

  const displayImages = getDisplayImages(about.all_images);
  const title = about.title || "About Us";
  const secondaryHtml = about.descriptions_other || "";

  return (
    <section className="w-full overflow-hidden bg-white">
      {/* Hero Section */}
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

      {/* Image Gallery */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ImageGallery images={displayImages} title={title} />
        </div>
      </section>

      {/* Stats */}
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
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
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

      {/* Descriptions Section */}
      {secondaryHtml && (
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-5 lg:gap-14">
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

              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl bg-[#F7F3EF] p-6">
                  <h3
                    className="text-lg font-semibold text-[#192334]"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
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
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm text-gray-700"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5B7FBF] text-[10px] text-white">
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#192334] p-6 text-center">
                  <p className="text-[11px] uppercase tracking-[3px] text-gray-400">
                    Get in Touch
                  </p>
                  <h3
                    className="mt-2 text-xl font-semibold text-white"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    Ready to find your dream home?
                  </h3>
                  <Link
                    href="/contact-us"
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[#5B7FBF] px-6 py-2.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#4a6a9f]"
                  >
                    CONTACT US
                    <HiOutlineArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </div>

                {displayImages.length >= 5 && (
                  <div className="relative h-[200px] overflow-hidden rounded-2xl">
                    <SafeImage
                      src={displayImages[4].url}
                      alt={displayImages[4].label}
                      className="h-full w-full object-cover"
                      index={4}
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

      {/* Values Section */}
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
            {values.map((value, index) => (
              <ValueCard key={index} value={value} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl sm:h-[380px] lg:h-[440px]">
              <SafeImage
                src={
                  displayImages.length >= 2
                    ? displayImages[1].url
                    : ABOUT_IMAGES[1].url
                }
                alt="Our Team"
                className="h-full w-full object-cover"
                index={1}
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

      {/* Technology Section */}
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
                We&apos;ve invested millions in building the smartest real
                estate platform in the region.
              </p>
              <ul className="mt-6 space-y-3">
                {features.map((item, i) => {
                  const FeatureIcon = item.icon;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-700 sm:text-base"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#192334] text-white">
                        <FeatureIcon className="h-3.5 w-3.5" />
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
                src={
                  displayImages.length >= 3
                    ? displayImages[2].url
                    : ABOUT_IMAGES[2].url
                }
                alt="Technology"
                className="h-full w-full object-cover"
                index={2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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