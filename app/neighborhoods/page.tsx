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
  Grid3x3,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  ImageOff,
  TrendingUp,
  Clock,
  Home,
  Filter,
  Globe,
  Map as MapIcon,
  Heart,
  Star,
} from "lucide-react";

const API_URL = "/api/v1/neighborhoods";
const DEFAULT_LIMIT = 12;

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  accentLight: "#F5ECD7",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  image: string;
  latitude: string;
  longitude: string;
  description: string;
  city_id: number;
  city_name: string;
  status: number;
  featured: number;
  property_count: number;
}

interface City {
  id: number;
  name: string;
  count: number;
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

const SORT_OPTIONS: FilterOption[] = [
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Popular" },
];

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function getNeighborhoodImage(neighborhood: Neighborhood): string {
  if (neighborhood.image) return neighborhood.image;
  return "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&h=400&fit=crop";
}

function getSlugWithName(slug: string, name: string): string {
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug}-${nameSlug}`;
}

function NeighborhoodCard({ neighborhood, index = 0 }: { neighborhood: Neighborhood; index?: number }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError
    ? "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&h=400&fit=crop"
    : getNeighborhoodImage(neighborhood);

  const description = stripHtml(neighborhood.description);
  const shortDescription = description.slice(0, 120);
  const linkSlug = getSlugWithName(neighborhood.slug, neighborhood.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group bg-white border transition-all duration-300 hover:shadow-xl"
      style={{ borderColor: THEME.border }}
    >
      <Link href={`/neighborhoods/${linkSlug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={neighborhood.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {neighborhood.featured === 1 && (
            <span className="absolute left-3 top-3 rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              Featured
            </span>
          )}

          {neighborhood.property_count > 0 && (
            <span className="absolute right-3 top-3 rounded-[3px] bg-black/60 px-2.5 py-1 text-[9px] text-white backdrop-blur-sm">
              <Home className="inline h-3 w-3 mr-1" />
              {neighborhood.property_count} properties
            </span>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[9px] text-white/80">
            <MapPin className="h-3 w-3" />
            <span>{neighborhood.city_name || "Dubai"}</span>
          </div>
        </div>

        <div className="p-4">
          <h3
            className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity group-hover:opacity-70"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            {neighborhood.name}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6B7A8D]">
            <Globe className="h-3 w-3" />
            <span>{neighborhood.city_name || "Dubai"}</span>
          </div>

          {description && (
            <p className="mt-2 text-[12px] leading-relaxed text-[#6B7A8D] line-clamp-2">
              {shortDescription}
              {description.length > 120 && "..."}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: THEME.border }}>
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6B7A8D]">
              {neighborhood.property_count || 0} properties
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] transition-colors group-hover:text-[#C9A96E]" style={{ color: THEME.primary }}>
              Explore →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border" style={{ borderColor: THEME.border }}>
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

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
          hasValue ? "bg-[#0F1C2E] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
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
                    ? "bg-[#0F1C2E]/5 font-medium text-[#0F1C2E]"
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
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F1C2E] disabled:cursor-not-allowed disabled:opacity-30"
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
              isActive ? "bg-[#0F1C2E] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F1C2E] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NeighborhoodsPage() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    city_id: "",
    sort_by: "name_asc",
    keyword: "",
  });

  const hasActiveFilters = filters.city_id !== "" || searchTerm !== "";
  const hasMore = pagination ? filters.page < pagination.totalPages : false;

  const fetchNeighborhoods = useCallback(
    async (page: number, isReset: boolean) => {
      if (isReset) {
        setLoading(true);
        setNeighborhoods([]);
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
        params.append("status", "1");
        
        const keyword = searchTerm || filters.keyword;
        if (keyword) params.append("keyword", keyword);
        if (filters.city_id) params.append("city_id", filters.city_id);

        const response = await fetch(`${API_URL}?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch neighborhoods");

        let newNeighborhoods: Neighborhood[] = data.data || [];

        const seen = new Set<number>();
        newNeighborhoods = newNeighborhoods.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });

        if (data.cached) setIsCached(true);

        if (isReset) {
          setNeighborhoods(newNeighborhoods);
          setIsInitialLoad(false);
        } else {
          setNeighborhoods((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            return [...prev, ...newNeighborhoods.filter((n) => !existingIds.has(n.id))];
          });
        }

        setPagination(data.meta || null);
      } catch (err: any) {
        setError(err.message || "Failed to load neighborhoods");
        if (isReset) {
          setNeighborhoods([]);
          setIsInitialLoad(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, searchTerm]
  );

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}?cities=true`);
      const data = await res.json();
      if (data.success) setCities(data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    fetchNeighborhoods(filters.page, filters.page === 1);
  }, [fetchNeighborhoods, filters.page]);

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
    setNeighborhoods([]);
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setNeighborhoods([]);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setNeighborhoods([]);
    setFilters({
      page: 1,
      limit: DEFAULT_LIMIT,
      city_id: "",
      sort_by: "name_asc",
      keyword: "",
    });
    setSearchTerm("");
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setNeighborhoods([]);
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
            Neighborhoods in Dubai
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#6B7A8D]"
          >
            {loading ? (
              "Loading..."
            ) : pagination ? (
              <>
                <span>{pagination.total.toLocaleString()} neighborhoods</span>
                {isCached && (
                  <span className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    cached
                  </span>
                )}
              </>
            ) : (
              `${neighborhoods.length} neighborhoods`
            )}
          </motion.p>
        </div>
      </div>

      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2 md:gap-4">
            <div className="hidden flex-1 items-center gap-2 lg:flex">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search neighborhoods..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                />
              </div>

              <select
                value={filters.city_id}
                onChange={(e) => updateFilter("city_id", e.target.value)}
                className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:outline-none"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={String(city.id)}>
                    {city.name} ({city.count})
                  </option>
                ))}
              </select>

              <FilterDropdown
                label="Sort"
                value={filters.sort_by}
                onChange={(v) => updateFilter("sort_by", v)}
                options={SORT_OPTIONS}
                icon={ArrowUpDown}
              />

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="ml-2 flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#0F1C2E]"
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
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.city_id}
                  onChange={(e) => updateFilter("city_id", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city.id} value={String(city.id)}>
                      {city.name}
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
              onClick={() => fetchNeighborhoods(filters.page, filters.page === 1)}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && neighborhoods.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            : neighborhoods.map((neighborhood, index) => (
                <NeighborhoodCard key={`${neighborhood.id}-${neighborhood.slug}`} neighborhood={neighborhood} index={index} />
              ))}
        </div>

        <div ref={loaderRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#0F1C2E]" />
              <p className="ml-3 text-[10px] uppercase tracking-widest text-[#6B7A8D]">Loading more...</p>
            </div>
          )}
        </div>

        {!loading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={filters.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {!loading && !hasMore && neighborhoods.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.15em] text-[#6B7A8D]">
            You've reached the end
          </p>
        )}

        {!loading && neighborhoods.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <MapIcon className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0F1C2E]" style={{ fontFamily: FONT_DISPLAY }}>
              No neighborhoods found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-[#6B7A8D]">
              Try adjusting your search or filters.
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