"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiArrowPath,
  HiOutlineHome,
} from "react-icons/hi2";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  seo_slug: string | null;
  image: string | null;
  description: string | null;
  property_count: number;
  featured: boolean;
  city_name: string | null;
  image_url?: string | null;
  img?: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  secondary: "#5B7FBF",
  accent: "#C8AA78",
};

// ─── SmartImage ──────────────────────────────────────────────────────────

function NeighborhoodImage({ src, alt }: { src: string | null; alt: string }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackImage =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(alt) +
    "&size=400&background=192334&color=fff&font-size=0.5&bold=true";

  const getImageSrc = () => {
    if (!src || imgError) return fallbackImage;
    
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("/upload/") || src.startsWith("/uploads/")) {
      return `https://acasa.ae${src}`;
    }
    if (src.startsWith("/")) return `https://acasa.ae${src}`;
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
    <div className="overflow-hidden bg-white border border-gray-100">
      <div className="animate-pulse bg-gray-200" style={{ aspectRatio: "4/3" }} />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Neighborhood Card ─────────────────────────────────────────────────

function NeighborhoodCard({ item, index }: { item: Neighborhood; index: number }) {
  const router = useRouter();

  const handleClick = () => {
    // Use seo_slug if available, otherwise use slug
    const slugToUse = item.seo_slug || item.slug;
    console.log("🔗 Navigating to community slug:", slugToUse);
    // 🔥 FIX: Change /communities to /dubai
    router.push(`/dubai/${slugToUse}`);
  };

  const imageUrl = item.image || item.image_url || item.img || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.3) }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-transparent">
        <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "4/3" }}>
          <NeighborhoodImage src={imageUrl} alt={item.name} />

          {item.featured && (
            <span className="absolute left-3 top-3 z-10 bg-[#192334] px-3 py-1 text-[9px] font-medium tracking-[0.15em] text-white">
              FEATURED
            </span>
          )}

          {item.property_count > 0 && (
            <span className="absolute bottom-3 right-3 z-10 bg-black/70 px-3 py-1 text-[9px] font-medium tracking-[0.1em] text-white backdrop-blur-sm flex items-center gap-1.5">
              <HiOutlineHome className="h-3 w-3" />
              {item.property_count} Properties
            </span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="bg-white/90 px-6 py-2.5 text-[10px] font-medium tracking-[0.15em] text-[#192334] backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              View Community
            </span>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <h3
            className="text-[15px] font-medium uppercase leading-snug text-[#192334] transition-colors group-hover:text-[#5B7FBF]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {item.name}
          </h3>
          
          <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
            <HiOutlineMapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{item.city_name || "Dubai"}</span>
          </div>

          {item.description && (
            <p className="mt-2.5 line-clamp-2 text-xs text-gray-600 leading-relaxed">
              {item.description.replace(/<[^>]*>/g, '').slice(0, 120)}
              {item.description.length > 120 ? '...' : ''}
            </p>
          )}

          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">
              {item.property_count || 0} Properties
            </span>
            <span className="text-[10px] font-medium text-[#192334] transition-all group-hover:text-[#5B7FBF] group-hover:translate-x-1 flex items-center gap-1">
              Explore
              <HiOutlineArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function NeighborhoodsSection() {
  const router = useRouter();
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
        "/api/v1/communities?limit=6&sort_by=featured_desc&status=1"
      );
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        console.log("✅ API Data:", data.data.map((d: any) => ({ 
          name: d.name, 
          slug: d.slug, 
          seo_slug: d.seo_slug 
        })));
        
        const formattedData = data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          seo_slug: item.seo_slug,
          image: item.img || item.image_url || null,
          description: item.description,
          property_count: item.property_count || 0,
          featured: item.featured === 1,
          city_name: item.city_name || "Dubai",
          image_url: item.image_url,
          img: item.img,
        }));
        setNeighborhoods(formattedData);
      } else {
        // Fallback with seo_slug
        setNeighborhoods([
          {
            id: 107,
            name: "Arabian Ranches",
            slug: "13",
            seo_slug: "apartments-for-sale-in-arabian-ranches",
            image: "arabian-ranches-a3c9b53144320cc9aafcca5b849dde59.jpg",
            description: "A premier villa community offering a serene desert lifestyle.",
            property_count: 580,
            featured: true,
            city_name: "Dubai",
          },
          {
            id: 116,
            name: "City Walk",
            slug: "22",
            seo_slug: "apartments-for-sale-in-city-walk",
            image: "city-walk-677847cffb93e4ae384654372d3bda9f.jpg",
            description: "The very essence of the urban millennial culture comes to life at City Walk.",
            property_count: 320,
            featured: true,
            city_name: "Dubai",
          },
          {
            id: 117,
            name: "Damac Hills",
            slug: "24",
            seo_slug: "apartments-for-sale-in-damac-hills",
            image: "damac-hills-8d9b36c8a8cbe30ef765a5f023d2d69b.jpg",
            description: "A prestigious master development spanning 42 million square feet.",
            property_count: 450,
            featured: true,
            city_name: "Dubai",
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message);
      setNeighborhoods([
        {
          id: 107,
          name: "Arabian Ranches",
          slug: "13",
          seo_slug: "apartments-for-sale-in-arabian-ranches",
          image: "arabian-ranches-a3c9b53144320cc9aafcca5b849dde59.jpg",
          description: "A premier villa community offering a serene desert lifestyle.",
          property_count: 580,
          featured: true,
          city_name: "Dubai",
        },
        {
          id: 118,
          name: "Downtown Dubai",
          slug: "26",
          seo_slug: "apartments-for-sale-in-downtown-dubai",
          image: "downtown-dubai-b4152fb8ccab0ef9752d5523f4035303.jpg",
          description: "Live at the heart of the city with iconic landmarks at your doorstep.",
          property_count: 820,
          featured: true,
          city_name: "Dubai",
        },
        {
          id: 129,
          name: "Dubai Hills Estate",
          slug: "35",
          seo_slug: "apartments-for-sale-in-dubai-hills-estate",
          image: "dubai-hills-emaar-7a70c9054240467af0d253fc0c6fc799.jpg",
          description: "Experience luxury living in this master-planned community.",
          property_count: 450,
          featured: true,
          city_name: "Dubai",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNeighborhoods();
  }, [fetchNeighborhoods]);

  const handleViewAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      // 🔥 FIX: Change /communities to /dubai
      router.push("/dubai");
    },
    [isNavigating, router]
  );

  const displayItems = neighborhoods.slice(0, 3);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="mb-10 md:mb-12 text-center">
          <p
            className="text-[10px] tracking-[0.2em] text-[#5B7FBF] uppercase"
            style={{ fontFamily: FONT_BODY }}
          >
            Explore Iconic Neighborhoods
          </p>
          <h2
            className="mt-2 text-[28px] leading-tight text-[#192334] md:text-[36px] lg:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Prime Locations
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-[#192334]" />
          <p
            className="mx-auto mt-4 max-w-xl text-sm text-gray-500 px-4"
            style={{ fontFamily: FONT_BODY }}
          >
            Discover Dubai's most prestigious communities, each offering a
            unique lifestyle experience.
          </p>
        </div>

        {error && neighborhoods.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchNeighborhoods}
              className="mt-4 inline-flex items-center gap-2 border border-gray-300 px-6 py-2.5 text-[11px] tracking-widest text-gray-700 transition-colors hover:border-[#192334] hover:bg-[#192334] hover:text-white"
            >
              <HiArrowPath className="h-3.5 w-3.5" />
              RETRY
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <NeighborhoodCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && displayItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayItems.map((item, index) => (
              <NeighborhoodCard
                key={`${item.id}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        )}

        {!loading && displayItems.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">No neighborhoods available at the moment.</p>
          </div>
        )}

        {!loading && displayItems.length > 0 && (
          <div className="mt-10 md:mt-14 flex justify-center">
            <motion.button
              onClick={handleViewAllClick}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
              disabled={isNavigating}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5 md:px-10 md:py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 disabled:cursor-wait"
              style={{
                backgroundColor: THEME.primary,
                fontFamily: FONT_BODY,
                minWidth: "200px",
                justifyContent: "center",
              }}
            >
              <span
                className="absolute inset-0 origin-left transition-transform duration-500"
                style={{
                  background: THEME.accent,
                  transform: buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
                }}
              />

              {isNavigating && (
                <motion.span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
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
                className="relative z-10 transition-colors duration-300"
                style={{
                  color: buttonHover && !isNavigating ? THEME.primary : "#fff",
                }}
              >
                {isNavigating ? "Loading..." : "View All Communities"}
              </span>

              <span
                className="relative z-10 flex items-center transition-colors duration-300"
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
                    transition={{ duration: 0.3 }}
                  >
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </span>
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}