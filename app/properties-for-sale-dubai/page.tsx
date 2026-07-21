"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  ArrowRight,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageOff,
  Map,
} from "lucide-react";

const API_URL = "/api/v1/properties";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
};

interface Property {
  id: number;
  name: string;
  slug: string;
  ref_number: string | null;
  listing_type: string;
  occupancy: string | null;
  status: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  price: {
    amount: number | null;
    display: string | null;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  bedrooms: string;
  bathrooms: string;
  display_title: string;
  area: { value: number | null; display: string; size: string | null };
  location: {
    community: string | null;
    city: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    community_id: number | null;
    city_id: number | null;
  };
  developer: { id: number | null; name: string | null; logo_url: string };
  agent: { id: number | null; name: string | null; phone: string | null; photo_url: string };
  featured_image: string;
  images: Array<{ id: number; url: string; title: string; featured: number }>;
  gallery_urls: string[];
  gallery_preview: string[];
  amenities: string[];
  payment_plans: Array<{ id: number; name: string; percentage: string }>;
  project_id: number | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cached?: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

const BEDROOM_OPTIONS: FilterOption[] = [
  { value: "Studio", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
  { value: "6", label: "6 Bedrooms" },
];

const PRICE_OPTIONS: FilterOption[] = [
  { value: "0-500000", label: "Under AED 500K" },
  { value: "500000-1000000", label: "AED 500K - 1M" },
  { value: "1000000-2000000", label: "AED 1M - 2M" },
  { value: "2000000-5000000", label: "AED 2M - 5M" },
  { value: "5000000-10000000", label: "AED 5M - 10M" },
  { value: "10000000-20000000", label: "AED 10M - 20M" },
  { value: "20000000-999999999", label: "AED 20M+" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "quality", label: "Best Match" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const LISTING_TYPE_OPTIONS: FilterOption[] = [
  { value: "Off plan", label: "Off Plan" },
  { value: "Resale", label: "Resale" },
  { value: "Rental", label: "Rental" },
];

const SIZE_OPTIONS: FilterOption[] = [
  { value: "0-500", label: "Under 500 sq.ft" },
  { value: "500-1000", label: "500 - 1000 sq.ft" },
  { value: "1000-2000", label: "1000 - 2000 sq.ft" },
  { value: "2000-999999", label: "2000+ sq.ft" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────

function formatPrice(amount: number | null, currency = "AED"): string {
  if (!amount) return "AED On Request";
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getBedroomLabel(bedroom: string): string {
  if (!bedroom || bedroom.toLowerCase() === "studio") return "Studio Apartment";
  const match = bedroom.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `${num} Bed`;
  }
  return bedroom;
}

function getImageUrl(property: Property): string | null {
  if (property.featured_image) return property.featured_image;
  if (property.gallery_urls?.length) return property.gallery_urls[0];
  if (property.images?.length) return property.images[0].url;
  if (property.gallery_preview?.length) return property.gallery_preview[0];
  return null;
}

function getDisplayName(property: Property): string {
  if (property.name && property.name !== "Null" && property.name !== "null") {
    return property.name.toUpperCase();
  }
  if (property.slug) {
    return (
      property.slug
        .replace(/-/g, " ")
        .replace(/\bLn\d+\b/gi, "")
        .trim()
        .toUpperCase() || `PROPERTY ${property.id}`
    );
  }
  return `PROPERTY ${property.id}`;
}

// ─── PROPERTY CARD (Figma Match) ─────────────────────────────────────────

function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const [imageError, setImageError] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const location = property.location?.community || property.location?.city || "Dubai";
  const isPriceOnRequest = property.price?.is_price_on_request || !property.price?.amount;
  const priceDisplay = property.price?.display || formatPrice(property.price?.amount);
  const displayName = getDisplayName(property);
  const bedroomLabel = getBedroomLabel(property.bedrooms);

  const imageUrl = useMemo(() => {
    if (imageError) return null;
    return getImageUrl(property);
  }, [property, imageError]);

  const specs = [
    bedroomLabel,
    property.bathrooms && property.bathrooms !== "0 Bath" ? property.bathrooms : null,
    property.area?.display && property.area.display !== "Area on Request" ? property.area.display : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group"
      style={{ fontFamily: FONT_BODY }}
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <Link href={`/properties-for-sale-dubai/${property.slug}`} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </Link>

        {/* FEATURED BADGE (only) */}
        {property.featured && (
          <span
            className="absolute left-3 top-3 bg-[#192334] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white"
            style={{ fontFamily: FONT_BODY }}
          >
            FEATURED
          </span>
        )}

        {/* ADD TO COMPARE (+) BUTTON */}
        <div
          className="absolute right-3 top-3"
          onMouseEnter={() => setShowCompare(true)}
          onMouseLeave={() => setShowCompare(false)}
        >
          <button
            aria-label="Add to compare"
            className="flex h-8 w-8 items-center justify-center bg-white text-[#192334] shadow-sm transition-all hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <AnimatePresence>
            {showCompare && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-10 whitespace-nowrap bg-white px-3 py-1.5 text-[11px] text-[#192334] shadow-md"
              >
                Add to compare
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DETAILS */}
      <div className="pt-4">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/properties-for-sale-dubai/${property.slug}`}>
              <h3
                className="truncate text-[15px] font-normal leading-snug tracking-[0.04em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {displayName}
              </h3>
            </Link>
            <p
              className="mt-1 text-[12px] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              {location}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p
              className="text-[10px] font-normal uppercase tracking-[0.14em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              PRICE
            </p>
            <p
              className="mt-0.5 text-[14px] font-semibold leading-tight text-[#192334]"
              style={{ fontFamily: FONT_BODY }}
            >
              {isPriceOnRequest ? "AED On Request" : priceDisplay}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 h-px w-full bg-[#E8E6E1]" />

        {/* Specs + Ref */}
        <div className="flex items-center justify-between gap-2">
          <p
            className="truncate text-[12px] text-[#4A5462]"
            style={{ fontFamily: FONT_BODY }}
          >
            {specs || "\u00A0"}
          </p>
          {property.ref_number && (
            <p
              className="text-[11px] text-[#8A94A3] whitespace-nowrap"
              style={{ fontFamily: FONT_BODY }}
            >
              Ref: {property.ref_number}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SKELETON ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div>
      <div className="animate-pulse bg-gray-200 aspect-[4/3]" />
      <div className="pt-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-40 animate-pulse bg-gray-200" />
          <div className="h-4 w-24 animate-pulse bg-gray-200" />
        </div>
        <div className="h-3 w-20 animate-pulse bg-gray-200" />
        <div className="h-px w-full bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-3 w-48 animate-pulse bg-gray-200" />
          <div className="h-3 w-20 animate-pulse bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── TOP FILTER DROPDOWN (Figma-style: text only) ────────────────────────

function TopFilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#192334] transition-opacity hover:opacity-60"
        style={{ fontFamily: FONT_BODY }}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-3 min-w-[200px] border border-gray-100 bg-white py-1 shadow-lg"
          >
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-[11px] text-gray-400 hover:bg-gray-50"
              style={{ fontFamily: FONT_BODY }}
            >
              All {label}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-[11px] transition-colors ${
                  value === opt.value
                    ? "bg-[#192334]/5 font-medium text-[#192334]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                style={{ fontFamily: FONT_BODY }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGINATION ─────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div
      className="mt-14 flex flex-wrap items-center justify-center gap-2"
      style={{ fontFamily: FONT_BODY }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-[12px] text-gray-400 transition-colors hover:text-[#192334] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>

      {getPageNumbers().map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`dots-${idx}`} className="px-2 text-[12px] text-gray-400">
              ...
            </span>
          );
        }
        const pageNum = page as number;
        const isActive = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`flex h-8 w-8 items-center justify-center text-[12px] transition-all ${
              isActive ? "bg-[#192334] text-white" : "text-gray-600 hover:text-[#192334]"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-[12px] text-[#192334] transition-colors hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────

export default function PropertiesForSaleDubaiPage() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    bedrooms: "",
    min_price: "",
    max_price: "",
    min_size: "",
    max_size: "",
    sort_by: "quality",
    listing_type: "Off plan",
  });

  const currentPriceValue =
    filters.min_price && filters.max_price ? `${filters.min_price}-${filters.max_price}` : "";
  const currentSizeValue =
    filters.min_size && filters.max_size ? `${filters.min_size}-${filters.max_size}` : "";
  const hasActiveFilters =
    filters.bedrooms !== "" ||
    filters.min_price !== "" ||
    filters.max_price !== "" ||
    filters.min_size !== "" ||
    filters.max_size !== "";
  const hasMore = pagination ? filters.page < pagination.totalPages : false;

  const fetchProperties = useCallback(
    async (page: number, isReset: boolean) => {
      if (isReset) {
        setLoading(true);
        setProperties([]);
        setPagination(null);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(filters.limit));
        params.append("sort_by", filters.sort_by);
        params.append("status", "5");

        if (filters.listing_type) params.append("listing_type", filters.listing_type);

        if (filters.bedrooms) {
          if (filters.bedrooms.toLowerCase() === "studio") {
            params.append("min_bedrooms", "0");
            params.append("max_bedrooms", "0");
          } else {
            const num = parseInt(filters.bedrooms, 10);
            if (!isNaN(num)) {
              params.append("min_bedrooms", String(num));
              params.append("max_bedrooms", String(num));
            }
          }
        }

        if (filters.min_price) params.append("min_price", filters.min_price);
        if (filters.max_price) params.append("max_price", filters.max_price);
        if (filters.min_size) params.append("min_size", filters.min_size);
        if (filters.max_size) params.append("max_size", filters.max_size);

        const response = await fetch(`${API_URL}?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch properties");

        let newProperties: Property[] = data.data || [];
        const seen = new Set<number>();
        newProperties = newProperties.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        if (isReset) {
          setProperties(newProperties);
          setIsInitialLoad(false);
        } else {
          setProperties((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            return [...prev, ...newProperties.filter((p) => !existingIds.has(p.id))];
          });
        }

        setPagination(data.meta || null);
      } catch (err: any) {
        setError(err.message || "Failed to load properties");
        if (isReset) {
          setProperties([]);
          setIsInitialLoad(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchProperties(filters.page, filters.page === 1);
  }, [fetchProperties, filters.page]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isInitialLoad) {
          setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observerRef.current.observe(currentLoader);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadingMore, isInitialLoad]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateFilter = useCallback((key: string, value: string) => {
    setProperties([]);
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    setProperties([]);
    if (!value) {
      setFilters((prev) => ({ ...prev, min_price: "", max_price: "", page: 1 }));
      return;
    }
    const [min, max] = value.split("-");
    setFilters((prev) => ({ ...prev, min_price: min || "", max_price: max || "", page: 1 }));
  }, []);

  const handleSizeChange = useCallback((value: string) => {
    setProperties([]);
    if (!value) {
      setFilters((prev) => ({ ...prev, min_size: "", max_size: "", page: 1 }));
      return;
    }
    const [min, max] = value.split("-");
    setFilters((prev) => ({ ...prev, min_size: min || "", max_size: max || "", page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setProperties([]);
    setFilters({
      page: 1,
      limit: 12,
      bedrooms: "",
      min_price: "",
      max_price: "",
      min_size: "",
      max_size: "",
      sort_by: "quality",
      listing_type: "Off plan",
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setProperties([]);
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <section className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* TOP NAV BAR (Figma style) */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* SEARCH */}
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PROPERTIES"
                className="w-full bg-transparent text-[11px] uppercase tracking-[0.14em] text-gray-500 placeholder-gray-400 outline-none"
                style={{ fontFamily: FONT_BODY }}
              />
            </div>

            {/* FILTERS - DESKTOP */}
            <div className="hidden lg:flex items-center gap-8">
              <TopFilterDropdown
                label="PRICE"
                value={currentPriceValue}
                onChange={handlePriceChange}
                options={PRICE_OPTIONS}
              />
              <TopFilterDropdown
                label="TYPE"
                value={filters.listing_type}
                onChange={(v) => updateFilter("listing_type", v)}
                options={LISTING_TYPE_OPTIONS}
              />
              <TopFilterDropdown
                label="SIZE"
                value={currentSizeValue}
                onChange={handleSizeChange}
                options={SIZE_OPTIONS}
              />
              <TopFilterDropdown
                label="BEDROOMS"
                value={filters.bedrooms}
                onChange={(v) => updateFilter("bedrooms", v)}
                options={BEDROOM_OPTIONS}
              />
              <TopFilterDropdown
                label="SORT"
                value={filters.sort_by}
                onChange={(v) => updateFilter("sort_by", v)}
                options={SORT_OPTIONS}
              />

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500 hover:text-[#192334]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  <X className="h-3 w-3" />
                  CLEAR
                </button>
              )}

              <button
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#192334] hover:opacity-60"
                style={{ fontFamily: FONT_BODY }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                FILTER
              </button>
            </div>

            {/* MOBILE FILTER BTN */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#192334]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              FILTER
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FILTERS */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-100 lg:hidden"
          >
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.listing_type}
                  onChange={(e) => updateFilter("listing_type", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  {LISTING_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={currentPriceValue}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Prices</option>
                  {PRICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => updateFilter("bedrooms", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Beds</option>
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sort_by}
                  onChange={(e) => updateFilter("sort_by", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleClearFilters}
                  className="col-span-2 h-9 border border-gray-300 text-[10px] uppercase tracking-[0.12em] text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 pt-10 pb-16">
        {/* TITLE + SHOW MAP */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[38px] font-normal leading-tight md:text-[44px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {filters.listing_type === "Resale"
                ? "Resale Properties for Sale"
                : filters.listing_type === "Rental"
                ? "Properties for Rent"
                : "Off Plan Properties for Sale"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              {loading
                ? "Loading..."
                : pagination
                ? `${pagination.total.toLocaleString()}+ LISTINGS`
                : `${properties.length} LISTINGS`}
            </motion.p>
          </div>

          <button
            className="flex items-center gap-2 border border-gray-200 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#192334] transition-colors hover:bg-gray-50"
            style={{ fontFamily: FONT_BODY }}
          >
            <Map className="h-3.5 w-3.5" />
            SHOW MAP
          </button>
        </div>

        {/* ERROR */}
        {error && !loading && (
          <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => fetchProperties(filters.page, filters.page === 1)}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {loading && properties.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            : properties.map((property, index) => (
                <PropertyCard
                  key={`${property.id}-${property.slug}`}
                  property={property}
                  index={index}
                />
              ))}
        </div>

        {/* INFINITE LOAD SENTINEL */}
        <div ref={loaderRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#192334]" />
              <p className="ml-3 text-[10px] uppercase tracking-widest text-[#8A94A3]">
                Loading more...
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {!loading && !hasMore && properties.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.15em] text-[#8A94A3]">
            You've reached the end
          </p>
        )}

        {/* EMPTY STATE */}
        {!loading && properties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Building2 className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
              No properties found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-[#8A94A3]">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-6 px-8 py-3 text-[10px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* SCROLL TO TOP */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowRight className="h-4 w-4 -rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}