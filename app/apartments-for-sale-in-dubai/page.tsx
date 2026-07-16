"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  MapPin,
  ArrowRight,
  X,
  DollarSign,
  Layers,
  Sparkles,
  Plus,
  Grid3x3,
  List,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Heart,
  Eye,
  ImageOff,
} from "lucide-react";

const API_URL = "/api/v1/properties/apartments";

const FONT_DISPLAY = "'Display Pro', 'Playfair Display', Georgia, serif";
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
  area: {
    value: number | null;
    display: string;
  };
  location: {
    community: string | null;
    city: string | null;
  };
  developer: {
    id: number;
    name: string;
    logo_url: string;
  };
  agent: {
    id: number;
    name: string;
    phone: string;
    photo_url: string;
  };
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
];

const PRICE_OPTIONS: FilterOption[] = [
  { value: "0-500000", label: "Under AED 500K" },
  { value: "500000-1000000", label: "AED 500K - 1M" },
  { value: "1000000-2000000", label: "AED 1M - 2M" },
  { value: "2000000-5000000", label: "AED 2M - 5M" },
  { value: "5000000-10000000", label: "AED 5M - 10M" },
  { value: "10000000-999999999", label: "AED 10M+" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// ✅ Listing type options
const LISTING_TYPE_OPTIONS: FilterOption[] = [
  { value: "All", label: "All Types" },
  { value: "Off plan", label: "Off Plan" },
  { value: "Ready", label: "Ready" },
  { value: "Resale", label: "Resale" },
];

// ─── GET IMAGE FROM API ──────────────────────────────────────────────────

function getPropertyImage(property: Property): string | null {
  if (property.featured_image) {
    return property.featured_image;
  }
  if (property.gallery_urls && property.gallery_urls.length > 0) {
    return property.gallery_urls[0];
  }
  if (property.images && property.images.length > 0) {
    return property.images[0].url;
  }
  if (property.gallery_preview && property.gallery_preview.length > 0) {
    return property.gallery_preview[0];
  }
  return null;
}

function getDisplayName(property: Property): string {
  if (property.name && property.name !== 'Null' && property.name !== 'null') {
    return property.name;
  }
  if (property.slug) {
    return property.slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase())
      .replace(/\bLn\d+\b/g, '')
      .trim() || `Property ${property.id}`;
  }
  return `Property ${property.id}`;
}

// ─── PROPERTY CARD ───────────────────────────────────────────────────────

function PropertyCard({ property, viewMode = "grid" }: { property: Property; viewMode?: string }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const location = property.location?.community || property.location?.city || "Dubai";
  const isPriceOnRequest = property.price?.is_price_on_request || !property.price?.amount;
  const priceDisplay = property.price?.display || "Price on Request";
  const displayName = getDisplayName(property);

  const imageUrl = useMemo(() => {
    if (imageError) return null;
    return getPropertyImage(property);
  }, [property, imageError]);

  const specs = [
    property.bedrooms,
    property.bathrooms && property.bathrooms !== "0 Bath" ? property.bathrooms : null,
    property.area?.display && property.area.display !== "Area on Request" ? property.area.display : null,
  ].filter(Boolean).join("  |  ");

  const isListMode = viewMode === "list";
  const hasImage = !!imageUrl;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {
      // silent
    }
  }, [property.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      const updated = isWishlisted 
        ? saved.filter((id: number) => id !== property.id)
        : [...saved, property.id];
      localStorage.setItem("property_wishlist", JSON.stringify(updated));
    } catch {
      // silent
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`group bg-white transition-all hover:shadow-lg ${
        isListMode ? "flex flex-col sm:flex-row gap-4" : ""
      }`}
      style={{ fontFamily: FONT_BODY }}
    >
      <div className={`relative overflow-hidden bg-gray-100 ${isListMode ? "sm:w-[320px] sm:flex-shrink-0" : "aspect-[4/3]"}`}>
        <Link href={`/apartments-for-sale-in-dubai/${property.slug}`} className="block h-full w-full">
          {hasImage ? (
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
              <p className="mt-2 text-xs text-gray-400">No Image</p>
            </div>
          )}
        </Link>

        {property.featured && (
          <span className="absolute left-3 top-3 rounded-[3px] bg-[#192334] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
            Featured
          </span>
        )}

        {property.listing_type && (
          <span className="absolute right-12 top-3 rounded-[3px] bg-white/90 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-[#192334]">
            {property.listing_type}
          </span>
        )}

        {property.status === 5 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-green-500/90 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Sparkles className="h-3 w-3" />
            Off Plan
          </div>
        )}

        <button
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
            isWishlisted
              ? "border-red-500 bg-red-500 text-white shadow-lg"
              : "border-white/50 bg-white/90 text-[#192334] hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className={`flex flex-1 flex-col ${isListMode ? "py-2 pr-2" : "pt-4"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/apartments-for-sale-in-dubai/${property.slug}`}>
              <h3
                className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {displayName}
              </h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8A94A3]">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A94A3]">Price</p>
            <p className="text-[14px] font-bold leading-tight text-[#192334]">
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-[#E8E6E1]" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-[11px] text-[#4A5462]">{specs || "\u00A0"}</p>
          <div className="flex items-center gap-2">
            {property.payment_plans && property.payment_plans.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-700">
                <Calendar className="h-3 w-3" />
                {property.payment_plans.length} Plans
              </span>
            )}
            {property.ref_number && (
              <p className="text-[10px] text-[#8A94A3]">Ref: {property.ref_number}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SKELETON ───────────────────────────────────────────────────────────

function SkeletonCard({ viewMode = "grid" }: { viewMode?: string }) {
  const isListMode = viewMode === "list";
  return (
    <div className={`bg-white ${isListMode ? "flex flex-col sm:flex-row gap-4" : ""}`}>
      <div className={`animate-pulse bg-gray-200 ${isListMode ? "sm:w-[320px] sm:aspect-[4/3]" : "aspect-[4/3]"}`} />
      <div className={`flex-1 space-y-3 ${isListMode ? "py-2" : "py-4"}`}>
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

// ─── FILTER DROPDOWN ────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  icon?: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasValue = value && value !== "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;
  const IconComponent = Icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[11px] font-medium transition-all duration-200 ${
          hasValue ? "bg-[#192334] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
        <span>{hasValue ? selectedLabel : label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[200px] border border-gray-200 bg-white py-1 shadow-xl"
          >
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-[11px] text-gray-400 hover:bg-gray-50"
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
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (Math.abs(i - currentPage) === 2) {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#192334] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {getPageNumbers().map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`dots-${idx}`} className="px-2 py-2 text-[12px] text-gray-400">
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
            className={`flex h-9 w-9 items-center justify-center rounded-[4px] text-[12px] font-medium transition-all ${
              isActive ? "bg-[#192334] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#192334] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────

export default function DubaiApartmentsPage() {
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    bedrooms: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
    listing_type: "All", // ✅ Changed from "Off plan" to "All"
    status: "", // ✅ Changed from "5" to ""
  });

  const currentPriceValue = filters.min_price && filters.max_price ? `${filters.min_price}-${filters.max_price}` : "";
  const hasActiveFilters = filters.bedrooms !== "" || filters.min_price !== "" || filters.max_price !== "" || filters.listing_type !== "All" || filters.status !== "";
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
        
        // ✅ Only add listing_type if not "All"
        if (filters.listing_type && filters.listing_type !== "All") {
          params.append("listing_type", filters.listing_type);
        }
        
        // ✅ Only add status if provided
        if (filters.status) {
          params.append("status", filters.status);
        }

        if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
        if (filters.min_price) params.append("min_price", filters.min_price);
        if (filters.max_price) params.append("max_price", filters.max_price);

        console.log("📡 Fetching:", `${API_URL}?${params.toString()}`);
        
        const response = await fetch(`${API_URL}?${params.toString()}`);
        const data = await response.json();

        console.log("📦 Response:", data);

        if (!data.success) throw new Error(data.error || "Failed to fetch");

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
        console.error("❌ Error:", err);
        setError(err.message);
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

  const handleClearFilters = useCallback(() => {
    setProperties([]);
    setFilters({
      page: 1,
      limit: 12,
      bedrooms: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
      listing_type: "All",
      status: "",
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setProperties([]);
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <section className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[32px] font-normal leading-tight md:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Apartments for Sale in Dubai
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-[#8A94A3]"
          >
            {loading
              ? "Loading..."
              : pagination
              ? `${pagination.total.toLocaleString()} APARTMENTS AVAILABLE`
              : `${properties.length} listings`}
          </motion.p>
        </div>
      </div>

      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2 md:gap-4">
            <div className="hidden flex-1 items-center justify-end gap-1 lg:flex">
              <FilterDropdown
                label="Status"
                value={filters.status}
                onChange={(v) => updateFilter("status", v)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "1", label: "Ready" },
                  { value: "5", label: "Off Plan" },
                ]}
                icon={Building2}
              />
              
              <FilterDropdown
                label="Listing Type"
                value={filters.listing_type}
                onChange={(v) => updateFilter("listing_type", v)}
                options={LISTING_TYPE_OPTIONS}
                icon={Building2}
              />
              
              <FilterDropdown
                label="Price"
                value={currentPriceValue}
                onChange={handlePriceChange}
                options={PRICE_OPTIONS}
                icon={DollarSign}
              />
              <FilterDropdown
                label="Bedrooms"
                value={filters.bedrooms}
                onChange={(v) => updateFilter("bedrooms", v)}
                options={BEDROOM_OPTIONS}
                icon={Layers}
              />
              <FilterDropdown
                label="Sort"
                value={filters.sort_by}
                onChange={(v) => updateFilter("sort_by", v)}
                options={SORT_OPTIONS}
                icon={ArrowUpDown}
              />

              <div className="ml-2 flex rounded-[4px] border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "grid" ? "bg-[#192334] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "list" ? "bg-[#192334] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="ml-2 flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#192334]"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="ml-auto flex items-center gap-1.5 rounded-[3px] border border-gray-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-gray-700 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-white lg:hidden"
            style={{ borderColor: THEME.border }}
          >
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Status</option>
                  <option value="1">Ready</option>
                  <option value="5">Off Plan</option>
                </select>
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

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6">
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

        <div
          className={`grid gap-x-6 gap-y-10 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {loading && properties.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} viewMode={viewMode} />)
            : properties.map((property) => (
                <PropertyCard key={`${property.id}-${property.slug}`} property={property} viewMode={viewMode} />
              ))}
        </div>

        <div ref={loaderRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#192334]" />
              <p className="ml-3 text-[10px] uppercase tracking-widest text-[#8A94A3]">Loading more...</p>
            </div>
          )}
        </div>

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

        {!loading && properties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Building2 className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
              No apartments found
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