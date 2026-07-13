"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Bed, Ruler, Calendar, Tag } from "lucide-react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const THEME = {
  primary: "#192334",
  accent: "#C8AA78",
};

const FALLBACK_IMAGE = "/placeholder-property.jpg";

function formatPrice(price: string | number | null | undefined): string {
  if (!price || price === "NULL" || price === "null" || price === "") {
    return "Price on Request";
  }
  const num = typeof price === "string" ? parseFloat(price.replace(/,/g, "")) : price;
  if (isNaN(num) || num === 0) return "Price on Request";
  if (num >= 1000000) {
    return `AED ${(num / 1000000).toFixed(1)}M`;
  }
  return `AED ${num.toLocaleString("en-AE")}`;
}

function truncateText(text: string | null | undefined, maxLength: number = 200): string {
  if (!text) return "";
  const clean = text.replace(/<[^>]*>/g, "").trim();
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength).trim() + "...";
}

function getPropertyKey(property: any, index: number): string {
  return String(property?.id || property?.slug || index);
}

function getPropertyHref(property: any): string {
  return `/property-details/${property?.slug || property?.id}`;
}

function getImageUrl(property: any): string {
  const img = property.featured_image || property.image || property.thumbnail;
  if (img && img !== "NULL" && img !== "null" && img !== "" && img !== "undefined") {
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("/")) return img;
    return img;
  }
  if (property.gallery_preview && property.gallery_preview.length > 0) {
    return property.gallery_preview[0];
  }
  if (property.image_variations && property.image_variations.length > 0) {
    return property.image_variations[0];
  }
  return FALLBACK_IMAGE;
}

function getDisplayBedroom(property: any): string {
  if (property.bedroom) return property.bedroom;
  const count = parseInt(property.bedrooms || property.beds || "0");
  if (count > 0) return `${count} Bed${count > 1 ? "s" : ""}`;
  return "Studio";
}

function getDisplayArea(property: any): string {
  const area = property.area || property.size || property.sqft;
  if (area) return `${area} Sq.Ft.`;
  return "Various Sizes";
}

function getCompletionYear(property: any): string {
  const date = property.completion_date || property.completion || property.handover_date;
  if (date) return new Date(date).getFullYear().toString();
  if (property.listing_type === "Ready to move" || property.status === "Ready") {
    return "Ready to move";
  }
  return "TBA";
}

function ImageClickLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-[3px]"
      style={{ background: "rgba(25, 35, 52, 0.75)" }}
    >
      <div className="relative h-12 w-12">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "rgba(255,255,255,0.7)",
            borderLeftColor: "rgba(255,255,255,0.7)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        className="mt-3 text-[8px] uppercase text-white"
        style={{
          fontFamily: "var(--font-inter)",
          letterSpacing: "0.3em",
          fontWeight: 500,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Opening
      </motion.p>
    </motion.div>
  );
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openingPropertyKey, setOpeningPropertyKey] = useState<string | null>(null);
  const [learnHover, setLearnHover] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/v1/featured-properties", {
          method: "GET",
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch featured properties");
        }
        setProperties(json.data || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  useEffect(() => {
    if (properties.length > 0 && activeSlide >= properties.length) {
      setActiveSlide(0);
    }
  }, [properties.length, activeSlide]);

  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (properties.length <= 1 || openingPropertyKey) return;
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % properties.length);
    }, 5000);
  }, [properties.length, openingPropertyKey]);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isHovered && properties.length > 1 && !openingPropertyKey) {
      startAutoSlide();
    } else {
      stopAutoSlide();
    }
    return () => stopAutoSlide();
  }, [isHovered, properties.length, openingPropertyKey, startAutoSlide, stopAutoSlide]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === activeSlide || openingPropertyKey !== null) return;
    setIsTransitioning(true);
    setActiveSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [activeSlide, isTransitioning, openingPropertyKey]);

  const nextSlide = useCallback(() => {
    if (isTransitioning || properties.length <= 1 || openingPropertyKey !== null) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev + 1) % properties.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, properties.length, openingPropertyKey]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || properties.length <= 1 || openingPropertyKey !== null) return;
    setIsTransitioning(true);
    setActiveSlide((prev) => (prev - 1 + properties.length) % properties.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning, properties.length, openingPropertyKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleImageLoad = (propertyKey: string) => {
    setImageLoaded((prev) => ({ ...prev, [propertyKey]: true }));
  };

  const handleImageError = (propertyKey: string) => {
    setImageError((prev) => ({ ...prev, [propertyKey]: true }));
    setImageLoaded((prev) => ({ ...prev, [propertyKey]: false }));
  };

  const handleNavigate = useCallback((e: React.MouseEvent, targetProperty: any, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (openingPropertyKey) return;
    const key = getPropertyKey(targetProperty, index);
    const href = getPropertyHref(targetProperty);
    setOpeningPropertyKey(key);
    stopAutoSlide();
    setTimeout(() => {
      window.location.href = href;
    }, 850);
  }, [openingPropertyKey, stopAutoSlide]);

  if (loading) {
    return (
      <section className="bg-[#f5f5f5] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 md:mb-12 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-36 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-60" />
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-gray-200 aspect-[4/3] w-full" />
              <div className="p-6 md:p-8 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-16 bg-gray-200 rounded w-full" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-10 bg-gray-200 rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-[#f5f5f5] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-500">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[#1a1a1a] text-white rounded">
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="bg-[#f5f5f5] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">No featured properties available</p>
        </div>
      </section>
    );
  }

  const property = properties[activeSlide];
  const propertyKey = getPropertyKey(property, activeSlide);
  const imageUrl = getImageUrl(property);
  const isImageReady = imageLoaded[propertyKey];
  const displayBedroom = getDisplayBedroom(property);
  const displayArea = getDisplayArea(property);
  const completionYear = getCompletionYear(property);
  const propertyPrice = property.price || property.starting_price || property.min_price;
  const isLearnOpening = openingPropertyKey === propertyKey;
  const propertyHref = getPropertyHref(property);

  return (
    <section className={`${inter.variable} font-sans bg-[#f5f5f5] py-16 md:py-24`} ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 md:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-gray-400 mb-2">
              Featured Properties
            </p>
            <h2 className={`${playfair.variable} font-serif text-[28px] sm:text-[32px] md:text-[36px] leading-[1.2] text-[#1a1a1a]`}>
              Discover your dream home with our handpicked selection.
            </h2>
          </div>
          <Link href="/properties" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1a1a1a] transition-colors">
            View All
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          {/* Navigation Arrows */}
          {properties.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                disabled={isTransitioning || openingPropertyKey !== null}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-[#1a1a1a] rounded-full shadow-lg border border-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                disabled={isTransitioning || openingPropertyKey !== null}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-[#1a1a1a] rounded-full shadow-lg border border-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid md:grid-cols-[1.3fr_1fr] gap-0">
              {/* Image */}
              <Link
                href={propertyHref}
                onClick={(e) => handleNavigate(e, property, activeSlide)}
                className="relative block bg-gray-100 overflow-hidden cursor-pointer aspect-[4/3] md:aspect-auto md:min-h-[420px]"
              >
                {!isImageReady && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                )}

                <Image
                  key={`img-${propertyKey}`}
                  src={imageUrl}
                  alt={property.name || "Featured Property"}
                  fill
                  className={`object-cover transition-all duration-700 ${
                    isImageReady ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  } hover:scale-105 transition-transform duration-700`}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onLoad={() => handleImageLoad(propertyKey)}
                  onError={() => handleImageError(propertyKey)}
                  unoptimized
                />

                <AnimatePresence>{isLearnOpening && <ImageClickLoader />}</AnimatePresence>

                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="bg-[#1a1a1a] text-white text-[10px] font-semibold px-4 py-2 tracking-[0.2em] uppercase">
                    Featured
                  </span>
                </div>
                {property.listing_type && (
                  <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm text-[#1a1a1a] text-[10px] font-semibold px-4 py-2 tracking-[0.15em] uppercase">
                    {property.listing_type}
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <Link
                  href={propertyHref}
                  onClick={(e) => handleNavigate(e, property, activeSlide)}
                  className="group/title inline-block"
                >
                  <h2 className={`${playfair.variable} font-serif text-[24px] sm:text-[28px] leading-[1.2] mb-2 text-[#1a1a1a] transition-colors duration-300 group-hover/title:text-[#C8AA78]`}>
                    {property.name || "Untitled Property"}
                  </h2>
                </Link>

                <p className="text-gray-500 text-[13px] mb-4 font-light">
                  {[property.city_name || property.city || "Dubai", "UAE"].filter(Boolean).join(", ")}
                </p>

                <p className="text-gray-600 text-[14px] leading-[1.7] font-light mb-5">
                  {truncateText(property.description || property.short_description, 180)}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80">
                    <Bed size={18} className="text-gray-500" />
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-[0.18em] font-medium">Beds</p>
                      <p className="text-[#1a1a1a] font-medium text-sm">{displayBedroom}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80">
                    <Ruler size={18} className="text-gray-500" />
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-[0.18em] font-medium">Size</p>
                      <p className="text-[#1a1a1a] font-medium text-sm">{displayArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80">
                    <Calendar size={18} className="text-gray-500" />
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-[0.18em] font-medium">Completion</p>
                      <p className="text-[#1a1a1a] font-medium text-sm">{completionYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80">
                    <Tag size={18} className="text-gray-500" />
                    <div>
                      <p className="text-[8px] text-gray-400 uppercase tracking-[0.18em] font-medium">Price</p>
                      <p className="text-[#1a1a1a] font-medium text-sm">{formatPrice(propertyPrice)}</p>
                    </div>
                  </div>
                </div>

                <motion.a
                  href={propertyHref}
                  onClick={(e) => handleNavigate(e, property, activeSlide)}
                  onMouseEnter={() => setLearnHover(true)}
                  onMouseLeave={() => setLearnHover(false)}
                  whileTap={{ scale: 0.97 }}
                  className="group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden px-6 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-white rounded-lg w-full sm:w-auto"
                  style={{
                    backgroundColor: THEME.primary,
                    boxShadow: learnHover && !isLearnOpening
                      ? "0 12px 32px rgba(25,35,52,0.25)"
                      : "0 4px 12px rgba(25,35,52,0.1)",
                    transform: learnHover && !isLearnOpening ? "translateY(-2px)" : "translateY(0)",
                    transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <span
                    className="absolute inset-0 origin-left"
                    style={{
                      background: `linear-gradient(90deg, ${THEME.accent} 0%, #D4B888 100%)`,
                      transform: learnHover && !isLearnOpening ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />

                  {isLearnOpening && (
                    <motion.span
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(200,170,120,0.4), transparent)",
                      }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  <span
                    className="relative z-10 transition-colors"
                    style={{ color: learnHover && !isLearnOpening ? THEME.primary : "#fff" }}
                  >
                    {isLearnOpening ? "Opening" : "Learn More"}
                  </span>

                  <span
                    className="relative z-10 flex items-center"
                    style={{ color: learnHover && !isLearnOpening ? THEME.primary : "#fff" }}
                  >
                    {isLearnOpening ? (
                      <motion.svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="30 60"
                          strokeLinecap="round"
                        />
                      </motion.svg>
                    ) : (
                      <motion.div animate={learnHover ? { x: 6 } : { x: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                        <ArrowRight size={16} />
                      </motion.div>
                    )}
                  </span>
                </motion.a>
              </div>
            </div>
          </div>

          {/* Dots */}
          {properties.length > 1 && (
            <div className="flex justify-center items-center gap-2 py-6">
              {properties.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  disabled={isTransitioning || openingPropertyKey !== null}
                  className={`h-[3px] rounded-full transition-all duration-500 ease-out ${
                    idx === activeSlide ? "w-8 bg-[#1a1a1a]" : "w-2.5 bg-gray-300 hover:bg-gray-500"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
              <span className="ml-4 text-[11px] text-gray-400 tracking-wider font-medium">
                {String(activeSlide + 1).padStart(2, "0")} / {String(properties.length).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}