// app/search/SearchPage.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHome,
} from "react-icons/hi2";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SearchItem {
  id: number;
  property_name?: string;
  name?: string;
  property_slug?: string;
  slug?: string;
  listing_type: string;
  price: number | null;
  price_display: string | null;
  bedroom: string | null;
  bathrooms: string | null;
  area: number | null;
  area_display: string | null;
  featured_image: string | null;
  image_url?: string | null;
  image_variations?: string[];
  gallery_images?: string[];
  location: string | null;
  city_name: string | null;
  community_name: string | null;
  developer_name: string | null;
  description: string | null;
  completion_date: string | null;
  occupancy: string | null;
  property_type: string | null;
  result_type: 'property' | 'project';
  extra?: Record<string, any>;
}

// ─── HELPERS ────────────────────────────────────────────────────────────

function formatPriceDisplay(price: number | null): string {
  if (!price) return "Price on Request";
  if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `AED ${(price / 1_000).toFixed(0)}K`;
  return `AED ${price.toLocaleString()}`;
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return "Studio";
  const t = bedroom.toLowerCase().trim();
  if (t.includes("studio")) return "Studio";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio";
    if (num === 1) return "1 Bed";
    return `${num} Beds`;
  }
  return bedroom;
}

// ✅ IMPROVED: Better Unsplash fallback with multiple queries
function getUnsplashFallback(name?: string | null, listingType?: string | null): string {
  const searchTerms = [];
  
  // Add name
  if (name) {
    searchTerms.push(name);
  }
  
  // Add listing type
  if (listingType) {
    const type = listingType.toLowerCase();
    if (type.includes('villa')) searchTerms.push('villa');
    else if (type.includes('apartment')) searchTerms.push('apartment');
    else if (type.includes('penthouse')) searchTerms.push('penthouse');
    else if (type.includes('townhouse')) searchTerms.push('townhouse');
  }
  
  // Always add Dubai and real-estate
  searchTerms.push('dubai');
  searchTerms.push('real-estate');
  
  // Also add luxury
  searchTerms.push('luxury');
  
  const query = encodeURIComponent(searchTerms.join(' '));
  
  // Use multiple Unsplash sources for better results
  const sources = [
    `https://source.unsplash.com/800x600/?${query}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(name || 'dubai')},property`,
    `https://source.unsplash.com/800x600/?dubai,real-estate,luxury`,
    `https://source.unsplash.com/800x600/?dubai,property`,
  ];
  
  // Return first source, fallback chain will handle others
  return sources[0];
}

// ✅ NEW: Get image with proper fallback chain
function getImageWithFallback(
  imageUrl: string | null | undefined,
  name?: string | null,
  listingType?: string | null
): string {
  // If image_url exists and doesn't contain no-image
  if (imageUrl && !imageUrl.includes('no-image')) {
    return imageUrl;
  }
  
  // Try to construct from gallery if available
  // This will be handled in the component
  
  // Return Unsplash fallback
  return getUnsplashFallback(name, listingType);
}

function getCompletionStatus(date: string | null): string {
  if (!date) return "Date TBC";
  try {
    const now = new Date();
    const comp = new Date(date);
    if (isNaN(comp.getTime())) return "Date TBC";
    const diffMonths = (comp.getFullYear() - now.getFullYear()) * 12 + (comp.getMonth() - now.getMonth());
    if (diffMonths < 0) return "Ready to Move";
    if (diffMonths <= 3) return "Handover in 3 Months";
    if (diffMonths <= 6) return "Handover in 6 Months";
    return `Handover ${comp.getFullYear()}`;
  } catch {
    return "Date TBC";
  }
}

// ─── SKELETON ───────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 rounded" />
      <div className="mt-4 space-y-2">
        <div className="h-5 w-2/3 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// ─── RESULT CARD ────────────────────────────────────────────────────────

function ResultCard({ item, index }: { item: SearchItem; index: number }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isProperty = item.result_type === 'property';
  const name = isProperty ? item.property_name : item.name;
  const slug = isProperty ? item.property_slug : item.slug;
  const listingType = item.listing_type;
  
  // ✅ Get all available images
  const allImages: string[] = [];
  
  // Add image_url if exists and not no-image
  if (item.image_url && !item.image_url.includes('no-image')) {
    allImages.push(item.image_url);
  }
  
  // Add gallery images
  if (item.gallery_images && item.gallery_images.length > 0) {
    for (const img of item.gallery_images) {
      if (!img.includes('no-image') && !allImages.includes(img)) {
        allImages.push(img);
      }
    }
  }
  
  // Add image variations
  if (item.image_variations && item.image_variations.length > 0) {
    for (const img of item.image_variations) {
      if (!img.includes('no-image') && !allImages.includes(img)) {
        allImages.push(img);
      }
    }
  }
  
  // If still no images, use Unsplash
  if (allImages.length === 0) {
    allImages.push(getUnsplashFallback(name, listingType));
  }
  
  // Current image to display
  const currentImage = imgError 
    ? getUnsplashFallback(name, listingType) 
    : allImages[currentImageIndex] || getUnsplashFallback(name, listingType);
  
  const hasMultipleImages = allImages.length > 1;
  const price = item.price_display || formatPriceDisplay(item.price);
  const bedroom = getBedroomDisplay(item.bedroom);
  const location = item.location || item.city_name || item.community_name;
  
  const localUrl = `/search/${slug || `item-${item.id}`}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => router.push(localUrl), 800);
  };

  // Rotate through images
  useEffect(() => {
    if (hasMultipleImages && !imgError) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [hasMultipleImages, allImages.length, imgError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.35) }}
      className="group relative"
    >
      <div onClick={handleClick} className="block cursor-pointer">
        <div className="relative overflow-hidden rounded bg-gray-100">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={currentImage}
              alt={name || "Property"}
              loading={index < 6 ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                // Try next image if available
                if (currentImageIndex < allImages.length - 1) {
                  setCurrentImageIndex(prev => prev + 1);
                } else {
                  setImgError(true);
                  e.currentTarget.src = getUnsplashFallback(name, listingType);
                }
              }}
            />

            {/* Image counter */}
            {hasMultipleImages && !imgError && (
              <div className="absolute bottom-4 right-4 z-10 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                {currentImageIndex + 1}/{allImages.length}
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-0 top-4 z-10 flex flex-col gap-1.5">
              <span className={`px-4 py-1.5 text-[9px] font-medium tracking-[0.2em] text-white ${
                isProperty ? "bg-[#577C8E]" : "bg-[#192334]"
              }`}>
                {isProperty ? (item.listing_type?.toUpperCase() || "PROPERTY") : "PROJECT"}
              </span>
            </div>

            {/* Location Badge */}
            {location && (
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 px-3 py-1.5 text-[10px] text-gray-600 backdrop-blur-sm rounded">
                <HiOutlineMapPin className="inline h-3 w-3 mr-1" />
                {location}
              </div>
            )}

            {/* Unsplash badge (only for fallback images) */}
            {imgError && (
              <div className="absolute top-4 right-4 z-10 bg-orange-500/90 text-white text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                ⚡ Fallback
              </div>
            )}
          </div>
        </div>

        {/* Card Info */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] uppercase leading-snug text-[#192334] group-hover:text-[#577C8E] transition-colors duration-300" style={{ fontFamily: FONT_DISPLAY, fontWeight: 500 }}>
                {name}
              </h3>
              {item.developer_name && (
                <p className="mt-0.5 text-xs text-gray-500">{item.developer_name}</p>
              )}
            </div>
            {price && (
              <div className="text-right shrink-0">
                <p className="text-[9px] tracking-[0.2em] text-gray-400">PRICE</p>
                <p className="text-sm font-semibold text-[#192334]">{price}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              {isProperty && bedroom && (
                <span className="flex items-center gap-1">
                  <HiOutlineHomeModern className="h-3.5 w-3.5" />
                  {bedroom}
                </span>
              )}
              {isProperty && item.area && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                    {item.area} sq.ft
                  </span>
                </>
              )}
              {!isProperty && (
                <span className="flex items-center gap-1">
                  <HiOutlineHomeModern className="h-3.5 w-3.5" />
                  Project
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">
              {isProperty ? `PR-${item.id}` : `PJ-${item.id}`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SCROLL TO TOP ──────────────────────────────────────────────────────

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center bg-[#192334] text-white shadow-xl hover:bg-[#2a3a4a] transition-colors rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14V2M8 2L3 7M8 2L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "buy";
  const locationsParam = searchParams.get("locations") || "";
  const locations = locationsParam ? locationsParam.split(",").filter(Boolean) : [];

  const [properties, setProperties] = useState<SearchItem[]>([]);
  const [projects, setProjects] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const fetchedRef = useRef(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("type", type);
      if (locations.length) params.set("locations", locations.join(","));

      const apiUrl = `/api/v1/location?${params.toString()}`;
      console.log("🔍 [SearchPage] Fetching:", apiUrl);
      
      const res = await fetch(apiUrl);
      console.log("📡 [SearchPage] Response status:", res.status);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response. Check if route exists.");
      }

      const data = await res.json();
      console.log("✅ [SearchPage] Data received:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch results");
      }

      const propertiesData = data.data?.properties || [];
      const projectsData = data.data?.projects || [];
      
      setProperties(propertiesData);
      setProjects(projectsData);
      setTotal((data.data?.total_properties || 0) + (data.data?.total_projects || 0));
      
      console.log(`✅ [SearchPage] Found ${propertiesData.length} properties, ${projectsData.length} projects`);
      
    } catch (err: any) {
      console.error("❌ [SearchPage] Error:", err);
      setError(err.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }, [query, type, locations]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchResults();
    }
  }, [fetchResults]);

  useEffect(() => {
    fetchedRef.current = false;
  }, [query, type, locations.join(",")]);

  const totalResults = properties.length + projects.length;

  return (
    <section className="bg-white min-h-screen" style={{ fontFamily: FONT_BODY }}>
      {/* ─── FILTER BAR ────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="flex items-center justify-between py-3.5 gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm min-w-[180px]">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  const params = new URLSearchParams(searchParams.toString());
                  if (newQuery) params.set("q", newQuery);
                  else params.delete("q");
                  router.push(`/search?${params.toString()}`);
                }}
                placeholder="SEARCH PROPERTIES, PROJECTS..."
                className="w-full pl-9 pr-3 py-2.5 text-[11px] tracking-widest border border-gray-200 focus:border-[#192334] focus:outline-none placeholder-gray-400 rounded"
              />
              {query && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineXMark className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("type", "buy");
                  router.push(`/search?${params.toString()}`);
                }}
                className={`px-4 py-2 text-[11px] tracking-widest border transition-colors rounded ${
                  type === "buy"
                    ? "bg-[#192334] text-white border-[#192334]"
                    : "border-gray-200 text-gray-600 hover:border-[#192334]"
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("type", "rent");
                  router.push(`/search?${params.toString()}`);
                }}
                className={`px-4 py-2 text-[11px] tracking-widest border transition-colors rounded ${
                  type === "rent"
                    ? "bg-[#192334] text-white border-[#192334]"
                    : "border-gray-200 text-gray-600 hover:border-[#192334]"
                }`}
              >
                RENT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[36px] leading-tight text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
              Search Results
            </h1>
            <p className="mt-2 text-xs tracking-wider text-gray-500">
              {loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""} found for "${query || locations.join(", ")}"`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {!loading && total > 0 && (
              <>
                <span>{properties.length} Properties</span>
                <span className="text-gray-300">|</span>
                <span>{projects.length} Projects</span>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="py-16 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <div className="mt-4 p-4 bg-gray-50 rounded text-xs text-left font-mono overflow-auto max-h-40 border border-gray-200">
              <p><strong>Debug Info:</strong></p>
              <p>API: /api/v1/location</p>
              <p>Query: {query}</p>
              <p>Type: {type}</p>
              <p>Locations: {locations.join(", ")}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 text-[#192334] border border-[#192334] px-6 py-2.5 hover:bg-[#192334] hover:text-white transition-colors rounded"
            >
              <HiOutlineArrowPath className="inline h-4 w-4 mr-2" /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Loading */}
        {!error && loading && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SearchSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!error && !loading && total === 0 && (
          <div className="py-24 text-center">
            <HiOutlineHome className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-[20px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>No Results Found</h3>
            <p className="mt-2 text-sm text-gray-400">Try adjusting your search or browse our popular locations</p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 bg-[#192334] px-8 py-3 text-[11px] tracking-widest text-white hover:bg-[#2a3a4a] transition-colors rounded">
              BACK TO HOME
            </Link>
          </div>
        )}

        {/* Results */}
        {!error && !loading && total > 0 && (
          <>
            {projects.length > 0 && (
              <div className="mb-12">
                <h2 className="mb-6 text-[20px] uppercase text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
                  Projects ({projects.length})
                </h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project, index) => (
                    <ResultCard key={project.id} item={project} index={index} />
                  ))}
                </div>
              </div>
            )}

            {properties.length > 0 && (
              <div>
                <h2 className="mb-6 text-[20px] uppercase text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
                  Properties ({properties.length})
                </h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property, index) => (
                    <ResultCard key={property.id} item={property} index={index} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ScrollToTop />
    </section>
  );
}