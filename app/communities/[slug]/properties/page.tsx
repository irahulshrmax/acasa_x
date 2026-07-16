"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Home,
  Loader2,
  AlertCircle,
  Grid3x3,
  List,
  ArrowUpDown,
  Filter,
  X,
  BedDouble,
  Bath,
  Maximize,
  DollarSign,
  Eye,
  Star,
  Clock,
  Shield,
} from "lucide-react";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0A2540",
  secondary: "#1B3A5F",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

interface Property {
  id: number;
  property_name: string;
  property_slug: string;
  price: {
    amount: number | null;
    display: string | null;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
  };
  bedroom: string | null;
  bathrooms: string | null;
  area: string | null;
  area_size: string | null;
  featured_image: string | null;
  listing_type: string | null;
  status: number;
  featured: boolean;
  created_at: string;
  completion_date: string | null;
  occupancy: string | null;
}

interface CommunityInfo {
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  community_slug?: string;
  community_name?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "Off plan", label: "Off Plan" },
  { value: "Ready", label: "Ready" },
  { value: "Under construction", label: "Under Construction" },
];

const BEDROOM_OPTIONS = [
  { value: "Studio", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
];

const PRICE_OPTIONS = [
  { value: "0-500000", label: "Under AED 500K" },
  { value: "500000-1000000", label: "AED 500K - 1M" },
  { value: "1000000-2000000", label: "AED 1M - 2M" },
  { value: "2000000-5000000", label: "AED 2M - 5M" },
  { value: "5000000-10000000", label: "AED 5M - 10M" },
  { value: "10000000-999999999", label: "AED 10M+" },
];

function fixImageUrl(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/upload/") && !url.includes("/media/")) {
    return url.replace("/upload/", "https://acasa.ae/upload/media/");
  }
  if (url.startsWith("upload/")) {
    return `https://acasa.ae/upload/media/${url.replace("upload/", "")}`;
  }
  if (url.startsWith("media/")) {
    return `https://acasa.ae/upload/${url}`;
  }
  return `https://acasa.ae/upload/media/${url}`;
}

function getDisplayPrice(price: any): string {
  if (!price) return "Price on Request";
  if (price.is_price_on_request) return "Price on Request";
  if (price.display) return price.display;
  if (price.amount) return `AED ${price.amount.toLocaleString()}`;
  return "Price on Request";
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return "Studio";
  const t = bedroom.toLowerCase().trim();
  if (t.includes("studio")) return "Studio";
  if (t.includes("1 bed") || t === "1") return "1 Bedroom";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio";
    if (num === 1) return "1 Bedroom";
    return `${num} Bedrooms`;
  }
  return bedroom;
}

function getBathroomDisplay(bathrooms: string | null): string {
  if (!bathrooms) return "1 Bath";
  const match = bathrooms.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "1 Bath";
    return `${num} Bath${num > 1 ? "s" : ""}`;
  }
  return bathrooms || "1 Bath";
}

function getAreaDisplay(area: any): string {
  if (!area) return "N/A";
  if (typeof area === 'string') return area;
  if (area.display) return area.display;
  if (area.value) return `${area.value} sq.ft`;
  return "N/A";
}

function PropertyCard({ property }: { property: Property }) {
  const [imgErr, setImgErr] = useState(false);
  const router = useRouter();

  const img = !imgErr
    ? property.featured_image || null
    : null;

  const priceDisplay = getDisplayPrice(property.price);
  const bedroomDisplay = getBedroomDisplay(property.bedroom);
  const bathroomDisplay = getBathroomDisplay(property.bathrooms);
  const areaDisplay = getAreaDisplay(property.area || property.area_size);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => router.push(`/featured-explore-properties/${property.property_slug}`)}
      className="group cursor-pointer rounded-[3px] border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: THEME.border }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={fixImageUrl(img)}
            alt={property.property_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Home className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {property.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-[#0A2540] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Star className="h-3 w-3" />
            Featured
          </span>
        )}
        {property.listing_type && !property.featured && (
          <span className="absolute right-3 top-3 rounded-[3px] bg-black/70 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            {property.listing_type}
          </span>
        )}
        {property.status === 5 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-emerald-600/90 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Clock className="h-3 w-3" />
            Off Plan
          </div>
        )}
        {property.status === 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Shield className="h-3 w-3" />
            Ready
          </div>
        )}
      </div>
      <div className="p-4">
        <h4
          className="truncate text-[13px] font-medium uppercase tracking-wide"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {property.property_name}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#8A94A3]">
          {bedroomDisplay && <span>{bedroomDisplay}</span>}
          {bedroomDisplay && bathroomDisplay && <span>•</span>}
          {bathroomDisplay && <span>{bathroomDisplay}</span>}
          {(bedroomDisplay || bathroomDisplay) && areaDisplay && <span>•</span>}
          {areaDisplay && <span>{areaDisplay}</span>}
        </div>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: THEME.primary }}>
          {priceDisplay}
        </p>
        {property.completion_date && (
          <p className="mt-1 text-[10px]" style={{ color: THEME.muted }}>
            <Clock className="mr-1 inline h-3 w-3" />
            {new Date(property.completion_date).getFullYear()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[3px] border bg-white" style={{ borderColor: THEME.border }}>
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

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
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0A2540] disabled:cursor-not-allowed disabled:opacity-30"
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
              isActive ? "bg-[#0A2540] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0A2540] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CommunityPropertiesPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);

  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sort_by: "newest",
    property_type: "",
    min_price: "",
    max_price: "",
    min_bedrooms: "",
    max_bedrooms: "",
  });

  const currentPriceValue =
    filters.min_price && filters.max_price ? `${filters.min_price}-${filters.max_price}` : "";
  const hasActiveFilters =
    filters.property_type !== "" ||
    filters.min_price !== "" ||
    filters.max_price !== "" ||
    filters.min_bedrooms !== "" ||
    filters.max_bedrooms !== "";

  // ─── RESOLVE PARAMS ────────────────────────────────────────────────────
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setSlug(resolved.slug);
    };
    resolveParams();
  }, [params]);

  // ─── FETCH ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (page: number) => {
      if (!slug) return;
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(page));
        queryParams.append("limit", String(filters.limit));
        queryParams.append("sort_by", filters.sort_by);
        if (filters.property_type) queryParams.append("property_type", filters.property_type);
        if (filters.min_price) queryParams.append("min_price", filters.min_price);
        if (filters.max_price) queryParams.append("max_price", filters.max_price);
        if (filters.min_bedrooms) queryParams.append("min_bedrooms", filters.min_bedrooms);
        if (filters.max_bedrooms) queryParams.append("max_bedrooms", filters.max_bedrooms);

        const response = await fetch(
          `/api/v1/communities/${slug}/properties?${queryParams.toString()}`
        );
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch");

        setCommunity(data.data?.community || null);
        setProperties(data.data?.properties || []);
        setPagination(data.data?.meta || null);
      } catch (err: any) {
        setError(err.message);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [slug, filters]
  );

  useEffect(() => {
    if (slug) {
      fetchData(filters.page);
    }
  }, [slug, filters.page]);

  // ─── FILTER HANDLERS ───────────────────────────────────────────────────
  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    if (!value) {
      setFilters((prev) => ({ ...prev, min_price: "", max_price: "", page: 1 }));
      return;
    }
    const [min, max] = value.split("-");
    setFilters((prev) => ({ ...prev, min_price: min || "", max_price: max || "", page: 1 }));
  }, []);

  const handleBedroomChange = useCallback((value: string) => {
    if (!value) {
      setFilters((prev) => ({ ...prev, min_bedrooms: "", max_bedrooms: "", page: 1 }));
      return;
    }
    if (value === "Studio") {
      setFilters((prev) => ({ ...prev, min_bedrooms: "0", max_bedrooms: "0", page: 1 }));
      return;
    }
    const num = parseInt(value);
    setFilters((prev) => ({ ...prev, min_bedrooms: String(num), max_bedrooms: String(num), page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 12,
      sort_by: "newest",
      property_type: "",
      min_price: "",
      max_price: "",
      min_bedrooms: "",
      max_bedrooms: "",
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center border transition-colors hover:bg-gray-50"
              style={{ borderColor: THEME.border }}
            >
              <ArrowLeft className="h-4 w-4" style={{ color: THEME.primary }} />
            </button>
            <div>
              <Link
                href={`/communities/${slug}`}
                className="text-[10px] uppercase tracking-[0.15em] transition-colors hover:opacity-70"
                style={{ color: THEME.muted }}
              >
                {community?.name || slug}
              </Link>
              <h1
                className="text-[18px] leading-tight sm:text-[24px]"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                Properties in {community?.name || slug}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              <div className="hidden items-center gap-2 lg:flex">
                {/* Sort */}
                <select
                  value={filters.sort_by}
                  onChange={(e) => updateFilter("sort_by", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:border-[#0A2540] focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Property Type */}
                <select
                  value={filters.property_type}
                  onChange={(e) => updateFilter("property_type", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:border-[#0A2540] focus:outline-none"
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Price */}
                <select
                  value={currentPriceValue}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:border-[#0A2540] focus:outline-none"
                >
                  <option value="">All Prices</option>
                  {PRICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Bedrooms */}
                <select
                  value={
                    filters.min_bedrooms === filters.max_bedrooms && filters.min_bedrooms !== ""
                      ? filters.min_bedrooms === "0"
                        ? "Studio"
                        : filters.min_bedrooms
                      : ""
                  }
                  onChange={(e) => handleBedroomChange(e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:border-[#0A2540] focus:outline-none"
                >
                  <option value="">All Beds</option>
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#0A2540]"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <div className="ml-auto flex items-center gap-1">
                <div className="flex overflow-hidden rounded-[4px] border border-gray-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 transition-colors ${
                      viewMode === "grid" ? "bg-[#0A2540] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 transition-colors ${
                      viewMode === "list" ? "bg-[#0A2540] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-1.5 rounded-[3px] border border-gray-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-gray-700 lg:hidden"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
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
                <select
                  value={filters.property_type}
                  onChange={(e) => updateFilter("property_type", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
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
                  value={
                    filters.min_bedrooms === filters.max_bedrooms && filters.min_bedrooms !== ""
                      ? filters.min_bedrooms === "0"
                        ? "Studio"
                        : filters.min_bedrooms
                      : ""
                  }
                  onChange={(e) => handleBedroomChange(e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Beds</option>
                  {BEDROOM_OPTIONS.map((opt) => (
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

      {/* Main Content */}
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6">
        {error && !loading && (
          <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => fetchData(filters.page)}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Properties Grid */}
        <div
          className={`grid gap-x-6 gap-y-8 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {loading && properties.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            : properties.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>

        {/* Pagination */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* No Results */}
        {!loading && properties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Home className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
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
    </div>
  );
}