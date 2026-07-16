"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { HiOutlineXMark, HiOutlineScale, HiPlus } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

interface Property {
  id: number;
  name: string;
  slug: string;
  listing_type: string;
  price: {
    amount: number | null;
    display: string | null;
    currency: string;
    is_price_on_request: boolean;
  };
  bedrooms: string;
  bathrooms: string;
  area: { value: number | null; display: string };
  location: {
    community: string | null;
    city: string | null;
    sub_community: string | null;
  } | null;
  status: number;
  featured: boolean;
  created_at: string;
  ref_number: string | null;
  featured_image: string;
  gallery_urls: string[];
  description: string | null;
  amenities: string[];
  developer: { name: string | null };
}

const FONT_DISPLAY = "'Display Pro', 'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  secondary: "#577C8E",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
};

function getDisplayName(property: any): string {
  if (!property) return 'Property';
  if (property.name && property.name !== 'Null' && property.name !== 'null' && property.name.trim() !== '') {
    return property.name;
  }
  if (property.slug) {
    return property.slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase())
      .replace(/\bLn\d+\b/g, '')
      .replace(/\bFor\b/g, 'for')
      .replace(/\bIn\b/g, 'in')
      .replace(/\bOf\b/g, 'of')
      .trim() || `Property ${property.id}`;
  }
  return `Property ${property.id}`;
}

function getLocation(property: Property): string {
  const loc = property.location;
  if (loc?.community && loc.community !== 'Null' && loc.community !== 'null') {
    return loc.community;
  }
  return loc?.city || "Dubai";
}

function getActualImageUrl(property: Property): string {
  if (!property) return '';
  if (property.featured_image && property.featured_image !== 'Null' && property.featured_image !== 'null') {
    return property.featured_image;
  }
  if (property.gallery_urls?.length > 0) {
    return property.gallery_urls[0];
  }
  return '';
}

function getSpecsString(property: Property): string {
  const parts: string[] = [];
  if (property.bedrooms) parts.push(property.bedrooms);
  if (property.bathrooms && property.bathrooms !== "0 Bath") {
    parts.push(property.bathrooms);
  }
  if (property.area?.display && property.area.display !== "Area on Request") {
    parts.push(property.area.display);
  }
  return parts.join(" | ");
}

function SmartImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setLoaded(false);
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#F2F0EC]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#E8E6E1] flex items-center justify-center">
              <svg className="h-6 w-6 text-[#8A94A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 text-[10px] text-[#8A94A3] font-medium">No Image</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F2F0EC]">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setHasError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="space-y-3 py-4">
        <div className="flex justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-px w-full bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  index,
  onCompare,
  isCompared,
}: {
  property: Property;
  index: number;
  onCompare: (id: number) => void;
  isCompared: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const location = getLocation(property);
  const isPriceOnRequest = property.price?.is_price_on_request || !property.price?.amount;
  const priceDisplay = property.price?.display || "Price on Request";
  const specs = getSpecsString(property);
  const displayName = getDisplayName(property);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.3) }}
      className="group bg-white hover:shadow-lg transition-shadow duration-300"
      style={{ fontFamily: FONT_BODY }}
    >
      <Link href={`/featured-explore-properties/${property.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden cursor-pointer">
          <SmartImage
            src={getActualImageUrl(property)}
            alt={displayName}
            className="transition-transform duration-700 group-hover:scale-[1.04]"
          />

          {(property.featured || property.listing_type === "Off plan") && (
            <span
              className="absolute left-3 top-3 z-10 rounded-[3px] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white"
              style={{
                backgroundColor: "rgba(25,35,52,0.9)",
                fontFamily: FONT_BODY,
              }}
            >
              {property.featured ? "Featured" : property.listing_type}
            </span>
          )}
        </div>
      </Link>

      <div className="pt-4 pb-4 px-1">
        <Link href={`/featured-explore-properties/${property.slug}`}>
          <div className="block w-full text-left cursor-pointer">
            <h3
              className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] hover:text-[#C8AA78] transition-colors"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {displayName}
            </h3>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: THEME.muted, fontFamily: FONT_BODY }}
            >
              {location}
            </p>
          </div>
        </Link>

        <div
          className="mt-3 h-px w-full"
          style={{ backgroundColor: THEME.border }}
        />

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p
              className="text-[9px] font-medium uppercase tracking-[0.14em]"
              style={{ color: THEME.muted, fontFamily: FONT_BODY }}
            >
              Price
            </p>
            <p
              className="text-[14px] font-bold leading-tight"
              style={{ color: THEME.primary, fontFamily: FONT_BODY }}
            >
              {isPriceOnRequest ? "AED On Request" : priceDisplay}
            </p>
          </div>
          {property.ref_number && (
            <p
              className="shrink-0 text-[11px]"
              style={{ color: THEME.muted, fontFamily: FONT_BODY }}
            >
              Ref: {property.ref_number}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p
            className="text-[11px]"
            style={{ color: "#4A5462", fontFamily: FONT_BODY }}
          >
            {specs || "\u00A0"}
          </p>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCompare(property.id);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Add to compare"
            className={`relative flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
              isCompared
                ? "border-[#192334] bg-[#192334] text-white"
                : "border-[#192334]/20 bg-white text-[#192334] hover:border-[#192334] hover:bg-[#192334] hover:text-white"
            }`}
          >
            <HiPlus className="h-4 w-4" />
            
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 right-0 z-10 whitespace-nowrap rounded-[3px] bg-white px-2.5 py-1.5 text-[10px] font-medium shadow-md"
                  style={{ color: THEME.primary }}
                >
                  {isCompared ? "Remove" : "Compare"}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FloatingCompareBar({
  compareList,
  onRemove,
  onClear,
}: {
  compareList: Property[];
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  if (compareList.length === 0) return null;
  const ids = compareList.map((p) => p.id).join(",");
  const canCompare = compareList.length >= 2;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-white shadow-[0_-4px_20px_rgba(25,35,52,0.08)]"
      style={{ borderColor: THEME.border, fontFamily: FONT_BODY }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <HiOutlineScale
            className="h-4 w-4"
            style={{ color: THEME.primary }}
          />
          <span
            className="text-[11px] font-medium tracking-wide"
            style={{ color: THEME.primary }}
          >
            {compareList.length}/4 Selected
          </span>
          <div className="flex gap-2">
            {compareList.map((p) => (
              <div key={p.id} className="relative h-10 w-10">
                <SmartImage src={getActualImageUrl(p)} alt={p.name} />
                <button
                  onClick={() => onRemove(p.id)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#192334] text-white hover:bg-[#C8AA78] transition-colors"
                >
                  <HiOutlineXMark className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onClear}
            className="text-[10px] uppercase tracking-widest transition-colors hover:text-[#192334]"
            style={{ color: THEME.muted }}
          >
            Clear All
          </button>
          {canCompare ? (
            <Link
              href={`/properties/compare?ids=${ids}`}
              className="px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: THEME.primary }}
            >
              Compare Now
            </Link>
          ) : (
            <span
              className="px-5 py-2.5 text-[10px] uppercase tracking-[0.16em]"
              style={{ color: THEME.muted, backgroundColor: "#F0EEE9" }}
            >
              Add {2 - compareList.length} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/properties?featured=true&limit=6&show_all=true");
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setProperties(data.data);
      } else {
        const fallbackRes = await fetch("/api/v1/properties?limit=6&show_all=true");
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.data) {
          setProperties(fallbackData.data);
        } else {
          setError("No properties found");
        }
      }
    } catch (err) {
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  const handleCompare = useCallback((id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const compareList = properties.filter((p) => compareIds.includes(p.id));

  const handleViewAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      setTimeout(() => {
        window.location.href = "/featured-explore-properties";
      }, 900);
    },
    [isNavigating]
  );

  const visibleProperties = properties.slice(0, 3);
  const effectiveSlide = activeSlide >= visibleProperties.length ? 0 : activeSlide;

  if (error) {
    return (
      <section className="bg-white py-10 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 text-center">
          <p className="text-gray-500 font-inter">{error}</p>
          <button
            onClick={fetchProperties}
            className="mt-4 text-xs tracking-widest text-gray-600 hover:text-gray-900 border border-gray-300 px-6 py-2 hover:border-gray-900 transition-colors font-inter"
          >
            RETRY
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-8 text-center md:mb-12">
          <p
            className="mb-2 text-[10px] font-medium uppercase tracking-[0.26em]"
            style={{ color: THEME.muted, fontFamily: FONT_BODY }}
          >
            Featured Properties
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[22px] font-normal md:text-[32px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Explore the finest properties in Dubai
          </motion.h2>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && visibleProperties.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProperties.map((property, index) => (
                <PropertyCard
                  key={`${property.id}-${property.slug}`}
                  property={property}
                  index={index}
                  onCompare={handleCompare}
                  isCompared={compareIds.includes(property.id)}
                />
              ))}
            </div>

            <div className="md:hidden">
              <div className="mx-auto max-w-xs sm:max-w-sm overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${effectiveSlide * 100}%)`,
                  }}
                >
                  {visibleProperties.map((property, index) => (
                    <div
                      key={`${property.id}-${property.slug}-mobile`}
                      className="w-full flex-shrink-0 px-2"
                    >
                      <PropertyCard
                        property={property}
                        index={index}
                        onCompare={handleCompare}
                        isCompared={compareIds.includes(property.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                {visibleProperties.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === effectiveSlide
                        ? "w-6 bg-[#192334]"
                        : "w-1.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && visibleProperties.length > 0 && (
          <div className="mt-12 flex justify-center md:mt-14">
            <motion.button
              onClick={handleViewAllClick}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
              disabled={isNavigating}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all disabled:cursor-wait"
              style={{
                backgroundColor: THEME.primary,
                fontFamily: FONT_BODY,
                boxShadow: buttonHover && !isNavigating
                  ? "0 12px 32px rgba(25,35,52,0.25)"
                  : "0 4px 12px rgba(25,35,52,0.1)",
                transform: buttonHover && !isNavigating
                  ? "translateY(-2px)"
                  : "translateY(0)",
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                minWidth: "240px",
                justifyContent: "center",
              }}
            >
              <span
                className="absolute inset-0 origin-left"
                style={{
                  background: `linear-gradient(90deg, ${THEME.accent} 0%, #D4B888 100%)`,
                  transform: buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
              />

              {isNavigating && (
                <motion.span
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(200,170,120,0.4), transparent)",
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              <span
                className="relative z-10 transition-colors"
                style={{
                  color: buttonHover && !isNavigating ? THEME.primary : "#fff",
                }}
              >
                {isNavigating ? "Loading Properties" : "View All Properties"}
              </span>

              <span
                className="relative z-10 flex items-center"
                style={{
                  color: buttonHover && !isNavigating ? THEME.primary : "#fff",
                }}
              >
                {isNavigating ? (
                  <motion.svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
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
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    animate={buttonHover ? { x: 6 } : { x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </span>
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {compareList.length > 0 && (
          <FloatingCompareBar
            compareList={compareList}
            onRemove={(id) => setCompareIds((p) => p.filter((x) => x !== id))}
            onClear={() => setCompareIds([])}
          />
        )}
      </AnimatePresence>
    </section>
  );
}