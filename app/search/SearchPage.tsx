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
  HiOutlinePencilSquare,   // ✅ Replaced HiOutlineRulerSquare
  HiOutlineArrowPath,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
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
  price: string | null;
  bedroom: string | null;
  bathrooms: string | null;
  area: string | null;
  featured_image: string | null;
  image_url?: string | null;
  image_fallbacks?: string[];
  location: string | null;
  developer_name: string | null;
  result_type: 'property' | 'project';
}

// ─── HELPERS ────────────────────────────────────────────────────────────

function formatPrice(price: string | null): string {
  if (!price) return "Price on Request";
  const num = parseInt(price);
  if (isNaN(num)) return "Price on Request";
  if (num >= 1_000_000) return `AED ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `AED ${(num / 1_000).toFixed(0)}K`;
  return `AED ${num.toLocaleString()}`;
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return "Studio";
  if (bedroom.toLowerCase().includes("studio")) return "Studio";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio";
    if (num === 1) return "1 Bed";
    return `${num} Beds`;
  }
  return bedroom;
}

function getUnsplashFallback(name?: string | null): string {
  const query = encodeURIComponent(name || "property dubai");
  return `https://source.unsplash.com/800x600/?${query},real-estate`;
}

// ─── SKELETON ───────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
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

  const isProperty = item.result_type === 'property';
  const name = isProperty ? item.property_name : item.name;
  const slug = isProperty ? item.property_slug : item.slug;
  const imageUrl = imgError ? getUnsplashFallback(name) : item.image_url || getUnsplashFallback(name);
  const localUrl = `/search/${slug}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    setTimeout(() => router.push(localUrl), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.35) }}
      className="group relative"
    >
      <div onClick={handleClick} className="block cursor-pointer">
        <div className="relative overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={name || "Property"}
              loading={index < 6 ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Badges */}
            <div className="absolute left-0 top-4 z-10 flex flex-col gap-1.5">
              <span className={`px-4 py-1.5 text-[9px] font-medium tracking-[0.2em] text-white ${
                isProperty ? "bg-[#577C8E]" : "bg-[#192334]"
              }`}>
                {isProperty ? item.listing_type?.toUpperCase() || "PROPERTY" : "PROJECT"}
              </span>
            </div>

            {/* Location Badge */}
            {item.location && (
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 px-3 py-1.5 text-[10px] text-gray-600 backdrop-blur-sm">
                <HiOutlineMapPin className="inline h-3 w-3 mr-1" />
                {item.location}
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
              {isProperty && item.developer_name && (
                <p className="mt-0.5 text-xs text-gray-500">{item.developer_name}</p>
              )}
            </div>
            {isProperty && item.price && (
              <div className="text-right shrink-0">
                <p className="text-[9px] tracking-[0.2em] text-gray-400">PRICE</p>
                <p className="text-sm font-semibold text-[#192334]">{formatPrice(item.price)}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              {isProperty && item.bedroom && (
                <span className="flex items-center gap-1">
                  <HiOutlineHomeModern className="h-3.5 w-3.5" />   {/* ✅ Replaced HiOutlineBed */}
                  {getBedroomDisplay(item.bedroom)}
                </span>
              )}
              {isProperty && item.area && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <HiOutlinePencilSquare className="h-3.5 w-3.5" />   {/* ✅ Replaced HiOutlineRulerSquare */}
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
          className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center bg-[#192334] text-white shadow-xl hover:bg-[#2a3a4a] transition-colors"
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
  const locations = locationsParam ? locationsParam.split(",") : [];

  const [properties, setProperties] = useState<SearchItem[]>([]);
  const [projects, setProjects] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("type", type);
      if (locations.length) params.set("locations", locations.join(","));

      const res = await fetch(`/api/public/search?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to fetch");

      setProperties(data.data.properties || []);
      setProjects(data.data.projects || []);
    } catch (err: any) {
      setError(err.message);
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
          <div className="flex items-center justify-between py-3.5 gap-4">
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
                className="w-full pl-9 pr-3 py-2.5 text-[11px] tracking-widest border border-gray-200 focus:border-[#192334] focus:outline-none placeholder-gray-400"
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
                className={`px-4 py-2 text-[11px] tracking-widest border transition-colors ${
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
                className={`px-4 py-2 text-[11px] tracking-widest border transition-colors ${
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
        <div className="flex items-start justify-between mb-8 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[36px] leading-tight text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
              Search Results
            </h1>
            <p className="mt-2 text-xs tracking-wider text-gray-500">
              {loading ? "Searching..." : `${totalResults} result${totalResults !== 1 ? "s" : ""} found for "${query || locations.join(", ")}"`}
            </p>
          </div>
        </div>

        {error && (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={fetchResults} className="text-[#192334] border border-[#192334] px-6 py-2.5 hover:bg-[#192334] hover:text-white transition-colors">
              <HiOutlineArrowPath className="inline h-4 w-4 mr-2" /> TRY AGAIN
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SearchSkeleton key={i} />)}
          </div>
        )}

        {!error && !loading && totalResults === 0 && (
          <div className="py-24 text-center">
            <HiOutlineBuildingOffice2 className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-[20px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>No Results Found</h3>
            <p className="mt-2 text-sm text-gray-400">Try adjusting your search or browse our popular locations</p>
            <Link href="/" className="mt-6 inline-flex items-center gap-2 bg-[#192334] px-8 py-3 text-[11px] tracking-widest text-white hover:bg-[#2a3a4a] transition-colors">
              BACK TO HOME
            </Link>
          </div>
        )}

        {!error && !loading && totalResults > 0 && (
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