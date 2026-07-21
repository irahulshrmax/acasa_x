"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiImage,
  FiArrowRight,
  FiMapPin,
  FiHome,
  FiMaximize2,
  FiAward,
  FiStar,
  FiHeart,
  FiShare2,
} from "react-icons/fi";

type Property = {
  id: number;
  name: string;
  slug: string;
  price: {
    amount: number | null;
    display: string;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  location: {
    community: string | null;
    city: string | null;
  };
  bedrooms: string;
  bathrooms: string;
  area: {
    display: string;
    value: number | null;
  };
  featured_image: string | null;
  gallery_urls: string[];
  featured: boolean;
  listing_type: string | null;
  developer: {
    name: string | null;
  };
  occupancy?: string | null;
  completion_date?: string | null;
  exclusive_status?: string | null;
};

const DISPLAY_LIMIT = 6;
const FETCH_LIMIT = 100;
const LUXURY_PRICE_THRESHOLD = 3000000;

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return false;
  }
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function getFirstImage(property: Property): string {
  if (isValidImageUrl(property.featured_image)) return property.featured_image as string;
  if (property.gallery_urls?.length) {
    const valid = property.gallery_urls.find((u: string) => isValidImageUrl(u));
    if (valid) return valid;
  }
  return "";
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeProperties(list: Property[]): Property[] {
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();
  const result: Property[] = [];

  for (const p of list) {
    const nameKey = normalizeName(p.name);
    if (seenIds.has(p.id) || seenNames.has(nameKey)) continue;
    seenIds.add(p.id);
    seenNames.add(nameKey);
    result.push(p);
  }

  return result;
}

function ImageWithFallback({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-200 to-neutral-100" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={onError}
      />
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200">
      <div className="relative h-[260px] bg-neutral-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3.5 bg-neutral-100 rounded w-1/4 animate-pulse" />
        <div className="h-5 bg-neutral-200 rounded w-3/4 animate-pulse" />
        <div className="h-3.5 bg-neutral-100 rounded w-1/2 animate-pulse" />
        <div className="flex items-center gap-4 pt-2">
          <div className="h-3 bg-neutral-200 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-neutral-200 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-neutral-200 rounded w-1/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function LuxuryProperties() {
  const router = useRouter();
  const [propertyPool, setPropertyPool] = useState<Property[]>([]);
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<number[]>([]);

  useEffect(() => {
    async function fetchLuxuryProperties() {
      try {
        setLoading(true);

        // Fetch from offplan API which we know works
        const res = await fetch(`/api/v1/properties/offplan?limit=${FETCH_LIMIT}&status=5`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();

        if (!result.success || !result.data.length) {
          setPropertyPool([]);
          setLoading(false);
          return;
        }

        // Filter for luxury properties (price >= 3M AED) and with images
        const luxury = result.data.filter((p: any) => {
          const price = p.price?.amount || p.price?.sale_price || 0;
          const hasImage = getFirstImage(p) !== "";
          return price >= LUXURY_PRICE_THRESHOLD && hasImage;
        });

        setPropertyPool(dedupeProperties(luxury));
      } catch (err) {
        console.error("Error fetching luxury properties:", err);
        setPropertyPool([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLuxuryProperties();
  }, []);

  const properties = useMemo(() => {
    return propertyPool.filter((p) => !failedIds.has(p.id)).slice(0, DISPLAY_LIMIT);
  }, [propertyPool, failedIds]);

  const handleImageError = useCallback((propertyId: number) => {
    setFailedIds((prev) => {
      if (prev.has(propertyId)) return prev;
      const next = new Set(prev);
      next.add(propertyId);
      return next;
    });
  }, []);

  const toggleLike = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLiked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleShare = useCallback((e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: property.name,
        text: `Check out ${property.name} in ${property.location?.city || "Dubai"}`,
        url: window.location.href,
      });
    }
  }, []);

  const handleCardClick = useCallback((property: Property) => {
    router.push(`/luxury-properties/${property.slug}`);
  }, [router]);

  if (loading) {
    return (
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FiAward className="text-neutral-400" size={16} />
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                Premium Collection
              </p>
            </div>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Luxury Properties
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  // If only 1 property, center it with max-width
  const isSingleProperty = properties.length === 1;

  return (
    <section className="bg-neutral-50 py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FiAward className="text-neutral-400" size={16} />
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
              Premium Collection
            </p>
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal leading-tight tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Luxury <span className="text-neutral-400">Properties</span>
          </h2>
          <div className="w-16 h-[2px] bg-neutral-900 mx-auto mt-4" />
        </div>

        <div 
          className={`grid gap-6 md:gap-8 ${
            isSingleProperty 
              ? "grid-cols-1 max-w-md mx-auto" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {properties.map((property, index) => {
            const imageUrl = getFirstImage(property);
            const location = property.location?.community || property.location?.city || "Dubai";
            const isLiked = liked.includes(property.id);
            
            // Format bedroom display
            const bedroomDisplay = property.bedrooms?.toLowerCase() === "studio" 
              ? "Studio" 
              : property.bedrooms || "Studio";
            
            // Format bathroom display
            const bathroomDisplay = property.bathrooms || "1 Bath";

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onClick={() => handleCardClick(property)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-900/20 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-[260px] md:h-[280px] overflow-hidden bg-neutral-100">
                  {imageUrl ? (
                    <>
                      <ImageWithFallback
                        src={imageUrl}
                        alt={property.name}
                        onError={() => handleImageError(property.id)}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute top-4 left-4 bg-neutral-900 px-3 py-1.5 rounded-full">
                        <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white flex items-center gap-1.5">
                          <FiStar size={10} />
                          Luxury
                        </span>
                      </div>

                      {property.listing_type && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-neutral-900">
                            {property.listing_type}
                          </span>
                        </div>
                      )}

                      {property.occupancy && (
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-white">
                            {property.occupancy}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                          onClick={(e) => toggleLike(e, property.id)}
                          aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm hover:bg-white transition-all"
                        >
                          <FiHeart
                            className={`h-3.5 w-3.5 transition-colors ${
                              isLiked ? "fill-red-500 text-red-500" : "text-neutral-700"
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleShare(e, property)}
                          aria-label="Share property"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm hover:bg-white transition-all"
                        >
                          <FiShare2 className="h-3.5 w-3.5 text-neutral-700" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                      <FiImage size={48} className="text-neutral-300" />
                    </div>
                  )}
                </div>

                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base md:text-lg text-neutral-900 font-normal tracking-wide line-clamp-1"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {property.name}
                      </h3>
                      {location && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
                          <FiMapPin size={12} className="shrink-0" />
                          <span className="line-clamp-1">{location}</span>
                        </div>
                      )}
                      {property.developer?.name && (
                        <div className="text-[10px] text-neutral-400 mt-1">
                          By {property.developer.name}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                        Price
                      </p>
                      <p className="text-sm md:text-base font-semibold text-neutral-900 mt-0.5 leading-tight">
                        {property.price?.display || "Price on Request"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 mt-4 pt-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FiHome size={12} className="text-neutral-400" />
                          {bedroomDisplay}
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span>{bathroomDisplay}</span>
                        {property.area?.display && property.area.display !== "Area on Request" && (
                          <>
                            <span className="text-neutral-300">|</span>
                            <span className="flex items-center gap-1">
                              <FiMaximize2 size={11} className="text-neutral-400" />
                              {property.area.display}
                            </span>
                          </>
                        )}
                      </div>

                      <FiArrowRight
                        size={14}
                        className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all duration-300 shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12 md:mt-16">
          <button
            onClick={() => router.push("/luxury-properties")}
            className="group inline-flex items-center gap-3 px-8 py-3.5 border border-neutral-900 hover:bg-neutral-900 transition-all duration-300 rounded-full"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-900 group-hover:text-white transition-colors">
              View All Luxury Properties
            </span>
            <FiArrowRight
              size={16}
              className="text-neutral-900 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
            />
          </button>
        </div>
      </div>
    </section>
  );
}