"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiImage, FiArrowRight, FiPlus, FiCheck, FiMapPin, FiHome, FiMaximize2 } from "react-icons/fi";

type PriceObject = {
  amount?: number;
  amount_end?: number;
  display?: string;
  display_end?: string;
  currency?: string;
  symbol?: string;
  is_price_on_request?: boolean;
  sale_price?: number;
  listing_price?: number;
  rental_price?: number;
  [key: string]: any;
};

type Property = {
  id: number;
  name: string;
  slug: string;
  featured_image: string;
  images: { url: string }[];
  gallery_urls: string[];
  price?: PriceObject | string | number;
  location?: string | object;
  bedrooms?: number;
  bathrooms?: number;
  area?: string | number;
  reference?: string;
  property_type?: string;
  description?: string;
  is_featured?: boolean;
  community?: {
    name?: string;
    slug?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

type ApiResponse = {
  success: boolean;
  data: Property[];
};

const EXCLUDED_PROPERTIES = [
  "Studio Apartment in Peninsula One",
  "SO/ Uptown Dubai",
  "Mr.C Residences Dubai",
];

const DISPLAY_LIMIT = 6;
const FETCH_LIMIT = 20;

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return false;
  }
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function getFirstImage(property: Property): string {
  if (isValidImageUrl(property.featured_image)) return property.featured_image;
  if (property.gallery_urls?.length) {
    const valid = property.gallery_urls.find((u: string) => isValidImageUrl(u));
    if (valid) return valid;
  }
  if (property.images?.length) {
    const valid = property.images.find((i: any) => isValidImageUrl(i.url));
    if (valid) return valid.url;
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
  className = "",
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
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
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
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
        <div className="h-5 bg-neutral-200 rounded w-3/4 animate-pulse" />
        <div className="h-3.5 bg-neutral-100 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-neutral-200 rounded w-1/3 animate-pulse" />
        <div className="border-t border-neutral-100 pt-3">
          <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreFinestProperties() {
  const router = useRouter();
  const [propertyPool, setPropertyPool] = useState<Property[]>([]);
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<number[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/properties?limit=${FETCH_LIMIT}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result: ApiResponse = await res.json();

        if (!result.success || !result.data.length) {
          setPropertyPool([]);
          setLoading(false);
          return;
        }

        const valid = result.data.filter((p) => {
          const hasValidName = p.name && p.name.trim() !== "";
          if (!hasValidName) return false;
          if (EXCLUDED_PROPERTIES.includes(p.name)) return false;
          return getFirstImage(p) !== "";
        });

        setPropertyPool(dedupeProperties(valid));
      } catch (err) {
        setPropertyPool([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
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

  const getLocation = (property: Property): string => {
    if (typeof property.location === "string") return property.location;
    if (property.community && typeof property.community === "object") {
      return property.community.name || "";
    }
    return "";
  };

  const formatPrice = (price?: PriceObject | string | number): string | null => {
    if (!price) return null;

    if (typeof price === "object" && price !== null) {
      if (price.display && typeof price.display === "string") return price.display;
      if (price.amount !== undefined && price.currency) {
        const symbol = price.symbol || price.currency || "AED";
        return `${symbol} ${price.amount.toLocaleString()}`;
      }
      if (price.amount !== undefined) return `AED ${price.amount.toLocaleString()}`;
      if (price.sale_price) return `AED ${price.sale_price.toLocaleString()}`;
      if (price.listing_price) return `AED ${price.listing_price.toLocaleString()}`;
      if (price.rental_price) return `AED ${price.rental_price.toLocaleString()}`;
      if (price.is_price_on_request) return "Price on Request";
      return null;
    }

    if (typeof price === "number") return `AED ${price.toLocaleString()}`;

    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) return `AED ${numPrice.toLocaleString()}`;

    return price;
  };

  const navigateToProperty = (slug: string) => {
    router.push(`/featured-explore-properties/${slug}`);
  };

  const toggleCompare = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCompareList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="text-center mb-12 md:mb-14">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
              Featured Properties
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Explore the finest properties in Dubai
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
    return (
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
            Featured Properties
          </p>
          <h2
            className="text-3xl md:text-4xl text-neutral-900 font-normal mb-8 tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore the finest properties in Dubai
          </h2>
          <p className="text-neutral-500">No properties available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-neutral-50 py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
            Featured Properties
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal leading-tight tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore the finest properties in Dubai
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {properties.map((property, index) => {
            const imageUrl = getFirstImage(property);
            const location = getLocation(property);
            const formattedPrice = formatPrice(property.price);
            const isCompared = compareList.includes(property.id);

            const bedroomDisplay = property.bedrooms
              ? `${property.bedrooms} ${property.bedrooms === 1 ? "Bed" : "Beds"}`
              : null;
            const bathroomDisplay = property.bathrooms
              ? `${property.bathrooms} ${property.bathrooms === 1 ? "Bath" : "Baths"}`
              : null;
            const areaDisplay = property.area
              ? typeof property.area === "string"
                ? property.area
                : `${property.area} sqft`
              : null;

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onClick={() => navigateToProperty(property.slug)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-900/20 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-[260px] md:h-[280px] overflow-hidden bg-neutral-100">
                  {imageUrl ? (
                    <>
                      <ImageWithFallback
                        src={imageUrl}
                        alt={property.name}
                        className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        onError={() => handleImageError(property.id)}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                      {property.is_featured && (
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-neutral-900">
                            Featured
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => toggleCompare(e, property.id)}
                        aria-label={isCompared ? "Remove from compare" : "Add to compare"}
                        className="absolute top-4 right-4 z-10"
                      >
                        <div
                          className={`h-8 w-8 flex items-center justify-center rounded-full border transition-all duration-300 ${
                            isCompared
                              ? "bg-neutral-900 border-neutral-900"
                              : "bg-white/95 border-white/40 backdrop-blur-sm hover:bg-neutral-900 hover:border-neutral-900"
                          }`}
                        >
                          {isCompared ? (
                            <FiCheck size={14} className="text-white" />
                          ) : (
                            <FiPlus size={14} className="text-neutral-700 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      </button>

                      {property.property_type && (
                        <div className="absolute bottom-4 left-4">
                          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/90">
                            {property.property_type}
                          </span>
                        </div>
                      )}
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
                      {location && typeof location === "string" && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
                          <FiMapPin size={12} className="shrink-0" />
                          <span className="line-clamp-1">{location}</span>
                        </div>
                      )}
                    </div>

                    {formattedPrice && (
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                          Price
                        </p>
                        <p className="text-sm md:text-base font-semibold text-neutral-900 mt-0.5 leading-tight">
                          {formattedPrice}
                        </p>
                      </div>
                    )}
                  </div>

                  {(bedroomDisplay || bathroomDisplay || areaDisplay || property.reference) && (
                    <div className="border-t border-neutral-100 mt-4 pt-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[11px] text-neutral-600 flex-wrap">
                          {bedroomDisplay && (
                            <span className="flex items-center gap-1">
                              <FiHome size={12} className="text-neutral-400" />
                              {bedroomDisplay}
                            </span>
                          )}
                          {bathroomDisplay && (
                            <>
                              <span className="text-neutral-300">|</span>
                              <span>{bathroomDisplay}</span>
                            </>
                          )}
                          {areaDisplay && (
                            <>
                              <span className="text-neutral-300">|</span>
                              <span className="flex items-center gap-1">
                                <FiMaximize2 size={11} className="text-neutral-400" />
                                {areaDisplay}
                              </span>
                            </>
                          )}
                        </div>

                        {property.reference && (
                          <span className="text-[9px] text-neutral-400 shrink-0">
                            Ref: {property.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12 md:mt-16">
          <button
            onClick={() => router.push("/featured-explore-properties")}
            className="group inline-flex items-center gap-3 px-8 py-3.5 border border-neutral-900 hover:bg-neutral-900 transition-all duration-300 rounded-full"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-900 group-hover:text-white transition-colors">
              View All Properties
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