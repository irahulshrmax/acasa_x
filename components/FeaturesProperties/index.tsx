"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiImage, FiArrowRight, FiPlus, FiMapPin, FiHome, FiMaximize2 } from "react-icons/fi";

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

// Properties to exclude (already shown in featured section)
const EXCLUDED_PROPERTIES = [
  'Studio Apartment in Peninsula One',
  'SO/ Uptown Dubai',
  'Mr.C Residences Dubai'
];

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return false;
  }
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function ImageWithFallback({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
      {!loaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-200 to-neutral-100" />
      )}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-sm overflow-hidden border border-neutral-200">
      <div className="relative h-[240px] bg-neutral-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-neutral-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-neutral-100 rounded w-1/2 animate-pulse" />
        <div className="h-5 bg-neutral-200 rounded w-1/3 animate-pulse" />
        <div className="border-t border-neutral-200 pt-3">
          <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ExploreFinestProperties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<number[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/properties?limit=20");
        if (!res.ok) throw new Error("Failed to fetch");
        const result: ApiResponse = await res.json();

        if (!result.success || !result.data.length) {
          setProperties([]);
          setLoading(false);
          return;
        }

        const valid = result.data.filter((p) => {
          const hasValidName = p.name && p.name.trim() !== "";
          if (!hasValidName) return false;

          // Exclude properties already shown
          if (EXCLUDED_PROPERTIES.includes(p.name)) {
            return false;
          }

          const hasValidImage =
            isValidImageUrl(p.featured_image) ||
            p.images?.some((i: any) => isValidImageUrl(i.url)) ||
            p.gallery_urls?.some((u: string) => isValidImageUrl(u));

          return hasValidImage;
        });

        setProperties(valid.slice(0, 6));
      } catch (err) {
        console.error("Error:", err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const getFirstImage = (property: Property): string => {
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
  };

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
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
              Featured Properties
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal"
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
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
            Featured Properties
          </p>
          <h2
            className="text-3xl md:text-4xl text-neutral-900 font-normal mb-8"
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
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1320px] px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-3">
            Featured Properties
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-[42px] text-neutral-900 font-normal leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore the finest properties in Dubai
          </h2>
        </div>

        {/* Grid */}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onClick={() => navigateToProperty(property.slug)}
                className="group relative bg-white rounded-sm overflow-hidden border border-neutral-200 hover:border-neutral-900 hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-[240px] md:h-[280px] overflow-hidden bg-neutral-100">
                  {imageUrl ? (
                    <>
                      <ImageWithFallback
                        src={imageUrl}
                        alt={property.name}
                        className="transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />

                      {/* Featured Badge */}
                      {property.is_featured && (
                        <div className="absolute top-3 left-3 bg-neutral-900 px-3 py-1.5">
                          <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white">
                            Featured
                          </span>
                        </div>
                      )}

                      {/* Property Type Badge */}
                      {property.property_type && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-neutral-200">
                          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-neutral-900">
                            {property.property_type}
                          </span>
                        </div>
                      )}

                      {/* Add to Compare Button */}
                      <button
                        onClick={(e) => toggleCompare(e, property.id)}
                        className="absolute top-3 right-3 group/btn"
                      >
                        <div
                          className={`flex items-center gap-2 ${
                            isCompared ? "bg-neutral-900" : "bg-white"
                          } border border-neutral-200 shadow-sm px-3 py-1.5 hover:bg-neutral-900 transition-all duration-300`}
                        >
                          <FiPlus
                            size={14}
                            className={`${
                              isCompared ? "text-white" : "text-neutral-700"
                            } group-hover/btn:text-white transition-colors`}
                          />
                          <span
                            className={`text-[9px] font-medium whitespace-nowrap ${
                              isCompared ? "text-white" : "text-neutral-700"
                            } group-hover/btn:text-white transition-colors opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[100px] overflow-hidden`}
                          >
                            {isCompared ? "Added" : "Compare"}
                          </span>
                        </div>
                      </button>

                      {/* View Details on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="bg-white/90 backdrop-blur-sm px-6 py-2.5 border border-neutral-900 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900">
                            View Details
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                      <FiImage size={48} className="text-neutral-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  {/* Title & Price Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base md:text-lg text-neutral-900 font-normal tracking-wide line-clamp-1"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {property.name}
                      </h3>
                      {location && typeof location === "string" && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500">
                          <FiMapPin size={12} />
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

                  {/* Divider */}
                  <div className="border-t border-neutral-200 mt-4 pt-3.5">
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
                            <span className="flex items-center gap-1">
                              {bathroomDisplay}
                            </span>
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
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12 md:mt-16">
          <button
            onClick={() => router.push("/featured-explore-properties")}
            className="group inline-flex items-center gap-3 px-8 py-3.5 border border-neutral-900 hover:bg-neutral-900 transition-all duration-300"
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