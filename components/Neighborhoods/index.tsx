"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiArrowPath,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  property_count: number;
  featured: boolean;
  city_name: string | null;
  amenities?: string[];
  avg_price?: string;
  population?: string;
  year_established?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  secondary: "#5B7FBF",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
};

// ─── SmartImage ──────────────────────────────────────────────────────────────

function NeighborhoodImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackImage =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(alt) +
    "&size=400&background=192334&color=fff&font-size=0.5&bold=true";

  const getImageSrc = () => {
    if (!src || imgError) return fallbackImage;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("/")) return src;
    return `https://acasa.ae/upload/locations/${src}`;
  };

  const imageSrc = getImageSrc();

  useEffect(() => {
    setLoaded(false);
    setImgError(false);
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────

function NeighborhoodCardSkeleton() {
  return (
    <div>
      <div
        className="animate-pulse bg-gray-200"
        style={{ aspectRatio: "3/4" }}
      />
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Neighborhood Card with Flip ─────────────────────────────────────────────────

function NeighborhoodCard({
  item,
  index,
}: {
  item: Neighborhood;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Enhanced data for back side
  const neighborhoodDetails = {
    description: item.description || `Discover the luxury lifestyle in ${item.name}, one of Dubai's most prestigious communities.`,
    property_count: item.property_count || 0,
    avg_price: item.avg_price || "AED 2.5M - 8.5M",
    amenities: item.amenities || ["Parks", "Schools", "Shopping", "Healthcare", "Community Centers"],
    year_established: item.year_established || "2010",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.3) }}
      className="group block perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative transition-all duration-700 preserve-3d ${
          isHovered ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT SIDE */}
        <div
          className="relative w-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div
            className="relative overflow-hidden bg-gray-100"
            style={{ aspectRatio: "3/4" }}
          >
            <NeighborhoodImage src={item.image} alt={item.name} />

            {/* Featured badge */}
            {item.featured && (
              <span
                className="absolute left-3 top-3 z-10 bg-[#192334] px-3 py-1 text-[10px] font-medium tracking-widest text-white"
                style={{ fontFamily: FONT_BODY }}
              >
                FEATURED
              </span>
            )}

            {/* Hover gradient — subtle darkening */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          <div className="mt-4 text-center">
            <h3
              className="text-[17px] uppercase leading-snug text-[#192334] transition-colors group-hover:text-[#5B7FBF]"
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 500,
              }}
            >
              {item.name}
            </h3>
            {item.city_name && (
              <p
                className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500"
                style={{ fontFamily: FONT_BODY }}
              >
                <HiOutlineMapPin className="h-3 w-3" />
                {item.city_name}
              </p>
            )}
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 w-full backface-hidden rotate-y-180"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="h-full w-full rounded-none bg-[#192334] p-6 shadow-xl flex flex-col justify-between" style={{ aspectRatio: "3/4" }}>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-xs text-[#C8AA78] font-medium flex items-center gap-1">
                <HiOutlineMapPin className="h-3 w-3" />
                {item.city_name || "Dubai"}
              </p>
              
              <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                {neighborhoodDetails.description}
              </p>
              
              <div className="mt-4">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#C8AA78] font-semibold mb-2">
                  Community Highlights
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Properties</span>
                    <span className="text-white font-medium">{neighborhoodDetails.property_count}+</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Price Range</span>
                    <span className="text-white font-medium">{neighborhoodDetails.avg_price}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Established</span>
                    <span className="text-white font-medium">{neighborhoodDetails.year_established}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[8px] uppercase tracking-[0.15em] text-[#C8AA78] font-semibold mb-1.5">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {neighborhoodDetails.amenities.slice(0, 5).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="text-[8px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[8px] text-gray-400 text-center tracking-widest">
                HOVER TO EXPLORE • {neighborhoodDetails.property_count}+ PROPERTIES
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function NeighborhoodsSection() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const fetchNeighborhoods = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/communities?limit=4&sort_by=featured_desc"
      );
      const data = await response.json();

      if (data.success) {
        const formattedData = data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          image: item.img || item.image_url || item.image || null,
          description: item.description,
          property_count: item.property_count || 0,
          featured: item.featured === 1,
          city_name: item.city_name || "Dubai",
          avg_price: item.avg_price || "AED 2.5M - 8.5M",
          amenities: item.amenities || ["Parks", "Schools", "Shopping", "Healthcare", "Community Centers"],
          year_established: item.year_established || "2010",
        }));
        setNeighborhoods(formattedData);
      } else {
        throw new Error(data.message || "Failed to load neighborhoods");
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback data with working image URLs
      setNeighborhoods([
        {
          id: 1,
          name: "Dubai Hills Estate",
          slug: "dubai-hills-estate",
          image: "https://images.unsplash.com/photo-1573048466001-693cf9d9204c?auto=format&fit=crop&w=800&q=80",
          description: "Experience the pinnacle of luxury living in this master-planned community with world-class amenities and stunning golf course views.",
          property_count: 450,
          featured: true,
          city_name: "Dubai",
          avg_price: "AED 3.2M - 12.5M",
          amenities: ["Golf Course", "Parks", "Schools", "Shopping Mall", "Healthcare"],
          year_established: "2014",
        },
        {
          id: 2,
          name: "Downtown Dubai",
          slug: "downtown-dubai",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
          description: "Live at the heart of the city with iconic landmarks like Burj Khalifa and Dubai Mall right at your doorstep.",
          property_count: 820,
          featured: true,
          city_name: "Dubai",
          avg_price: "AED 1.8M - 15.2M",
          amenities: ["Burj Khalifa", "Dubai Mall", "Fountains", "Metro", "Fine Dining"],
          year_established: "2003",
        },
        {
          id: 3,
          name: "Dubai Creek Harbour",
          slug: "dubai-creek-harbour",
          image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
          description: "A stunning waterfront destination offering a harmonious blend of urban living and natural beauty.",
          property_count: 320,
          featured: true,
          city_name: "Dubai",
          avg_price: "AED 2.5M - 9.8M",
          amenities: ["Waterfront", "Parks", "Marina", "Retail", "Creek Tower"],
          year_established: "2018",
        },
        {
          id: 4,
          name: "Arabian Ranches",
          slug: "arabian-ranches",
          image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
          description: "A premier villa community offering a serene desert lifestyle with exceptional facilities and green spaces.",
          property_count: 580,
          featured: true,
          city_name: "Dubai",
          avg_price: "AED 2.2M - 7.5M",
          amenities: ["Equestrian Club", "Parks", "Schools", "Community Centers", "Retail"],
          year_established: "2004",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNeighborhoods();
  }, [fetchNeighborhoods]);

  // Button click — loader ON button only
  const handleViewAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      setTimeout(() => {
        window.location.href = "/communities";
      }, 900);
    },
    [isNavigating]
  );

  const displayItems = neighborhoods.slice(0, 4);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <p
            className="text-[11px] tracking-widest text-[#5B7FBF]"
            style={{ fontFamily: FONT_BODY }}
          >
            EXPLORE ICONIC NEIGHBORHOODS
          </p>
          <h2
            className="mt-2 text-[32px] leading-tight text-[#192334] md:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Prime locations
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-[#192334]" />
          <p
            className="mx-auto mt-4 max-w-xl text-sm text-gray-600"
            style={{ fontFamily: FONT_BODY }}
          >
            Discover Dubai's most prestigious communities, each offering a
            unique lifestyle.
          </p>
        </div>

        {/* Error */}
        {error && neighborhoods.length === 0 && (
          <div className="text-center">
            <p className="text-sm text-red-500">Failed to load neighborhoods</p>
            <button
              onClick={fetchNeighborhoods}
              className="mt-4 inline-flex items-center gap-2 border border-gray-300 px-4 py-2 text-[11px] tracking-widest text-gray-700 transition-colors hover:border-[#192334] hover:bg-[#192334] hover:text-white"
              style={{ fontFamily: FONT_BODY }}
            >
              <HiArrowPath className="h-3.5 w-3.5" />
              RETRY
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <NeighborhoodCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Grid with Flip Cards */}
        {!loading && displayItems.length > 0 && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {displayItems.map((item, index) => (
              <NeighborhoodCard
                key={`${item.id}-${item.slug}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        )}

        {/* ── CTA — SAME AS FEATURED PROPERTIES (Golden) ── */}
        {!loading && displayItems.length > 0 && (
          <div className="mt-12 flex justify-center md:mt-16">
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
                boxShadow:
                  buttonHover && !isNavigating
                    ? "0 12px 32px rgba(25,35,52,0.25)"
                    : "0 4px 12px rgba(25,35,52,0.1)",
                transform:
                  buttonHover && !isNavigating
                    ? "translateY(-2px)"
                    : "translateY(0)",
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                minWidth: "280px",
                justifyContent: "center",
              }}
            >
              {/* Animated gold sweep background on hover */}
              <span
                className="absolute inset-0 origin-left"
                style={{
                  background: `linear-gradient(90deg, ${THEME.accent} 0%, #D4B888 100%)`,
                  transform:
                    buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
              />

              {/* Shimmer effect when loading */}
              {isNavigating && (
                <motion.span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(200,170,120,0.4), transparent)`,
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Text */}
              <span
                className="relative z-10 transition-colors"
                style={{
                  color: buttonHover && !isNavigating ? THEME.primary : "#fff",
                }}
              >
                {isNavigating ? "Loading Neighborhoods" : "View All Neighborhoods"}
              </span>

              {/* Arrow / Spinner */}
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
                  <motion.div
                    animate={buttonHover ? { x: 6 } : { x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </span>
            </motion.button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  );
}