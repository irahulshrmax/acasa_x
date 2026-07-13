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
  TrendingUp,
  Clock,
  Shield,
  Home,
  Filter,
  Award,
  Archive,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";

const API_URL = "/api/v1/properties/archive";
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
    amount_end: number | null;
    display: string | null;
    display_end: string | null;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
    sale_price: number | null;
    listing_price: number | null;
    rental_price: number | null;
  };
  bedrooms: string;
  bathrooms: string;
  display_title: string;
  area: {
    value: number | null;
    size: string | null;
    display: string;
    min_area: string | null;
    max_area: string | null;
    area_end: string | null;
  };
  location: {
    community: string | null;
    community_slug: string | null;
    sub_community: string | null;
    city: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    community_id: number | null;
    city_id: number | null;
  };
  developer: {
    id: number | null;
    name: string | null;
    country: string | null;
    is_international: boolean;
    logo_url: string;
    logo_variations: string[];
  };
  agent: {
    id: number | null;
    name: string | null;
    phone: string | null;
    photo_url: string;
  };
  featured_image: string;
  images: Array<{ id: number; url: string; title: string; featured: number }>;
  gallery_urls: string[];
  gallery_preview: string[];
  media_base_url: string;
  amenities: string[];
  furnishing: string | null;
  video_url: string | null;
  payment_plans: Array<{ id: number; name: string; percentage: string; item_id: number; item_type: string | null }>;
  project_id: number | null;
}

interface StatusLabel {
  value: number;
  label: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cached?: boolean;
  action?: string;
  sort_by?: string;
  timestamp?: string;
  breakdown?: Record<string, number>;
  status_labels?: StatusLabel[];
}

interface FilterOption {
  value: string;
  label: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: "0", label: "Archived" },
  { value: "1", label: "Draft" },
  { value: "2", label: "Pending Review" },
  { value: "4", label: "Rejected" },
  { value: "6", label: "Suspended" },
];

const STATUS_COLORS: Record<number, string> = {
  0: "bg-gray-500",
  1: "bg-yellow-500",
  2: "bg-blue-500",
  3: "bg-green-500",
  4: "bg-red-500",
  5: "bg-emerald-500",
  6: "bg-orange-500",
  7: "bg-purple-500",
  8: "bg-indigo-500",
};

const STATUS_LABELS: Record<number, string> = {
  0: "Archived",
  1: "Draft",
  2: "Pending Review",
  3: "Sold",
  4: "Rejected",
  5: "Active",
  6: "Suspended",
  7: "Under Offer",
  8: "Reserved",
};

function getStatusColor(status: number): string {
  return STATUS_COLORS[status] || "bg-gray-500";
}

function getStatusLabel(status: number): string {
  return STATUS_LABELS[status] || `Status ${status}`;
}

function getPropertyImage(property: Property): string | null {
  if (property.featured_image) return property.featured_image;
  if (property.gallery_urls?.length) return property.gallery_urls[0];
  if (property.images?.length) return property.images[0].url;
  if (property.gallery_preview?.length) return property.gallery_preview[0];
  return null;
}

function getAllImages(property: Property): string[] {
  const imgs: string[] = [];
  if (property.featured_image) imgs.push(property.featured_image);
  if (property.gallery_urls) property.gallery_urls.forEach(img => { if (!imgs.includes(img)) imgs.push(img); });
  if (property.images) property.images.forEach(img => { if (img.url && !imgs.includes(img.url)) imgs.push(img.url); });
  if (property.gallery_preview) property.gallery_preview.forEach(img => { if (!imgs.includes(img)) imgs.push(img); });
  return imgs;
}

function formatPrice(amount: number | null, currency = "AED"): string {
  if (!amount) return "Price on Request";
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getBedroomLabel(bedroom: string): string {
  if (!bedroom || bedroom.toLowerCase() === "studio") return "Studio";
  const match = bedroom.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `${num} BHK`;
  }
  return bedroom;
}

function getDaysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function PropertyCard({ property, viewMode = "grid", index = 0 }: { property: Property; viewMode?: string; index?: number }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const location = property.location?.community || property.location?.city || "Dubai";
  const isPriceOnRequest = property.price?.is_price_on_request || !property.price?.amount;
  const priceDisplay = property.price?.display || "Price on Request";
  const bedroomLabel = getBedroomLabel(property.bedrooms);
  const daysAgo = getDaysAgo(property.created_at);
  const statusColor = getStatusColor(property.status);
  const statusLabel = getStatusLabel(property.status);

  const allImages = useMemo(() => getAllImages(property), [property]);
  const hasImages = allImages.length > 0;
  
  const currentImage = useMemo(() => {
    if (imageError || !hasImages) return null;
    return allImages[currentImageIndex % allImages.length];
  }, [allImages, currentImageIndex, imageError, hasImages]);

  const specs = [
    bedroomLabel,
    property.bathrooms && property.bathrooms !== "0 Bath" ? property.bathrooms : null,
    property.area?.display && property.area.display !== "Area on Request" ? property.area.display : null,
  ].filter(Boolean).join("  |  ");

  const isListMode = viewMode === "list";

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
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
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className={`group bg-white transition-all duration-300 hover:shadow-xl ${
        isListMode ? "flex flex-col sm:flex-row gap-4" : ""
      }`}
      style={{ fontFamily: FONT_BODY }}
    >
      <div className={`relative overflow-hidden bg-gray-100 ${isListMode ? "sm:w-[320px] sm:flex-shrink-0" : "aspect-[4/3]"}`}>
        <Link href={`/archive-properties/${property.slug}`} className="block h-full w-full">
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt={property.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.slice(0, 5).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIndex % allImages.length
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                  {allImages.length > 5 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">No Image</p>
            </div>
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {property.featured && (
            <span className="rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              Featured
            </span>
          )}
          <span className={`rounded-[3px] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white ${statusColor}`}>
            {statusLabel}
          </span>
          {property.listing_type && (
            <span className="rounded-[3px] bg-blue-500 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              {property.listing_type}
            </span>
          )}
        </div>

        {property.exclusive_status && (
          <span className="absolute right-12 top-3 rounded-[3px] bg-white/90 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-[#0F1C2E]">
            {property.exclusive_status}
          </span>
        )}

        {property.occupancy && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {property.occupancy}
          </div>
        )}

        <button
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
            isWishlisted
              ? "border-red-500 bg-red-500 text-white shadow-lg"
              : "border-white/50 bg-white/90 text-[#0F1C2E] hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {hasImages && allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[9px] text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {allImages.length}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isListMode ? "py-2 pr-2" : "pt-4"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/archive-properties/${property.slug}`}>
              <h3
                className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {property.name}
              </h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#6B7A8D]">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
            {property.developer?.name && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6B7A8D]">
                <Building2 className="h-3 w-3" />
                <span>{property.developer.name}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#6B7A8D]">Price</p>
            <p className="text-[14px] font-bold leading-tight text-[#0F1C2E]">
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-[#E2E8F0]" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-[11px] text-[#4A5462]">{specs || "\u00A0"}</p>
          <div className="flex items-center gap-2">
            {property.payment_plans && property.payment_plans.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-700">
                <Calendar className="h-3 w-3" />
                {property.payment_plans.length} Plans
              </span>
            )}
            <span className="text-[10px] text-[#6B7A8D]">{daysAgo}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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

export default function ArchivePropertiesPage() {
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
  const [isCached, setIsCached] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    status: "",
    sort: "newest",
    keyword: "",
  });

  const hasActiveFilters = filters.status !== "" || searchTerm !== "";
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
        params.append("sort", filters.sort);
        
        const keyword = searchTerm || filters.keyword;
        if (keyword) params.append("keyword", keyword);
        if (filters.status) params.append("status", filters.status);

        const response = await fetch(`${API_URL}?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch archive properties");

        let newProperties: Property[] = data.data || [];

        const seen = new Set<number>();
        newProperties = newProperties.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        if (data.cached) setIsCached(true);

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
        setError(err.message || "Failed to load archive properties");
        if (isReset) {
          setProperties([]);
          setIsInitialLoad(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, searchTerm]
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

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setProperties([]);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setProperties([]);
    setFilters({
      page: 1,
      limit: DEFAULT_LIMIT,
      status: "",
      sort: "newest",
      keyword: "",
    });
    setSearchTerm("");
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
            Archive Properties
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
                <span>{pagination.total.toLocaleString()} archived properties</span>
                {isCached && (
                  <span className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    cached
                  </span>
                )}
                {pagination.breakdown && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Archive className="h-3 w-3" />
                    {Object.entries(pagination.breakdown).map(([key, count]) => (
                      <span key={key} className="ml-1">
                        {key}: {count}
                      </span>
                    ))}
                  </span>
                )}
              </>
            ) : (
              `${properties.length} properties`
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
                  placeholder="Search archive..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                />
              </div>

              <FilterDropdown
                label="Status"
                value={filters.status}
                onChange={(v) => updateFilter("status", v)}
                options={STATUS_OPTIONS}
                icon={Layers}
              />
              <FilterDropdown
                label="Sort"
                value={filters.sort}
                onChange={(v) => updateFilter("sort", v)}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "price_desc", label: "Price High-Low" },
                  { value: "price_asc", label: "Price Low-High" },
                ]}
                icon={ArrowUpDown}
              />

              <div className="ml-2 flex rounded-[4px] border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "grid" ? "bg-[#0F1C2E] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "list" ? "bg-[#0F1C2E] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

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
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_desc">Price High-Low</option>
                  <option value="price_asc">Price Low-High</option>
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
            : properties.map((property, index) => (
                <PropertyCard key={`${property.id}-${property.slug}`} property={property} viewMode={viewMode} index={index} />
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

        {!loading && !hasMore && properties.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.15em] text-[#6B7A8D]">
            You've reached the end
          </p>
        )}

        {!loading && properties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Archive className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0F1C2E]" style={{ fontFamily: FONT_DISPLAY }}>
              No archived properties found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-[#6B7A8D]">
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