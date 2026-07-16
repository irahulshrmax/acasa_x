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
  Star,
  Home,
  TrendingUp,
  Clock,
  Users,
  Award,
  Globe,
  Shield,
} from "lucide-react";

const FONT_DISPLAY = "'Display Pro', 'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0A2540",
  primaryDark: "#061A2F",
  primaryLight: "#1B3A5F",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#0A2540",
};

interface Community {
  id: number;
  community_id: number;
  name: string;
  country_id: number;
  state_id: number;
  city_id: number;
  slug: string;
  latitude: string;
  longitude: string;
  img: string | null;
  description: string | null;
  featured: number;
  status: number;
  city_name: string;
  city_slug: string;
  state_name: string;
  country_name: string;
  property_count: number;
  image_url: string | null;
  image_variations: string[];
  seo_title: string | null;
  seo_slug: string | null;
  seo_description: string | null;
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

const SORT_OPTIONS: FilterOption[] = [
  { value: "featured_desc", label: "Featured" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "property_count_desc", label: "Most Properties" },
  { value: "newest", label: "Newest" },
];

// ─── COMMUNITY CARD ───────────────────────────────────────────────────────

function CommunityCard({
  community,
  viewMode = "grid",
  badge = null,
}: {
  community: Community;
  viewMode?: string;
  badge?: "featured" | "popular" | "new" | null;
}) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => {
    if (imageError) return null;
    if (community.image_url) return community.image_url;
    return null;
  }, [community, imageError]);

  const location = community.city_name || "Dubai";
  const isFeatured = community.featured === 1;
  const isListMode = viewMode === "list";
  const hasImage = !!imageUrl;

  const getBadgeConfig = () => {
    if (badge === "featured" || isFeatured) {
      return { label: "Featured", bg: "bg-[#0A2540]", icon: <Star className="h-3 w-3" /> };
    }
    if (badge === "popular") {
      return { label: "Popular", bg: "bg-[#1B3A5F]", icon: <Users className="h-3 w-3" /> };
    }
    if (badge === "new") {
      return { label: "New", bg: "bg-emerald-600", icon: <Sparkles className="h-3 w-3" /> };
    }
    if (community.property_count > 50) {
      return { label: "Popular", bg: "bg-[#1B3A5F]", icon: <Users className="h-3 w-3" /> };
    }
    return null;
  };

  const badgeConfig = getBadgeConfig();

  // Extract short description
  const getShortDescription = () => {
    if (!community.description) return null;
    const text = community.description.replace(/<[^>]*>/g, '');
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  const shortDesc = getShortDescription();

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
      <div
        className={`relative overflow-hidden bg-gray-100 ${
          isListMode ? "sm:w-[320px] sm:flex-shrink-0" : "aspect-[4/3]"
        }`}
      >
        <Link href={`/communities/${community.slug}`} className="block h-full w-full">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={community.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50">
              <Building2 className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">No Image</p>
            </div>
          )}
        </Link>

        {badgeConfig && (
          <span
            className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-[3px] ${badgeConfig.bg} px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white`}
          >
            {badgeConfig.icon}
            {badgeConfig.label}
          </span>
        )}

        {community.property_count > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Building2 className="h-3 w-3" />
            {community.property_count} Properties
          </div>
        )}

        {community.status === 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-emerald-600/90 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white">
            <Shield className="h-3 w-3" />
            Active
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isListMode ? "py-2 pr-2" : "pt-4"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/communities/${community.slug}`}>
              <h3
                className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {community.name}
              </h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8A94A3]">
              <MapPin className="h-3 w-3" />
              <span>{location}, {community.country_name || "UAE"}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A94A3]">Properties</p>
            <p className="text-[14px] font-bold leading-tight text-[#0A2540]">
              {community.property_count || 0}
            </p>
          </div>
        </div>

        {shortDesc && (
          <>
            <div className="my-3 h-px w-full bg-[#E8E6E1]" />
            <p className="line-clamp-2 text-[12px] leading-relaxed text-[#4A5462]">
              {shortDesc}
            </p>
          </>
        )}

        {!shortDesc && (
          <div className="my-3 h-px w-full bg-[#E8E6E1]" />
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            {community.seo_slug && (
              <span className="flex items-center gap-1 rounded-full bg-[#0A2540]/5 px-2 py-0.5 text-[9px] font-medium text-[#0A2540]">
                <Globe className="h-3 w-3" />
                {community.seo_slug}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#8A94A3]">
            ID: {community.community_id || community.id}
          </span>
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
      <div
        className={`animate-pulse bg-gray-200 ${
          isListMode ? "sm:w-[320px] sm:aspect-[4/3]" : "aspect-[4/3]"
        }`}
      />
      <div className={`flex-1 space-y-3 ${isListMode ? "py-2" : "py-4"}`}>
        <div className="flex justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-px w-full bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="flex justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
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
          hasValue ? "bg-[#0A2540] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
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
                    ? "bg-[#0A2540]/5 font-medium text-[#0A2540]"
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

// ─── MAIN PAGE ──────────────────────────────────────────────────────────

export default function CommunitiesPage() {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>([]);
  const [popularCommunities, setPopularCommunities] = useState<Community[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "popular" | "new">("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    sort_by: "featured_desc",
    status: "1",
    keyword: "",
  });

  const hasActiveFilters = filters.keyword !== "" || filters.sort_by !== "featured_desc";

  // ─── FETCH COMMUNITIES ──────────────────────────────────────────────────
  const fetchCommunities = useCallback(
    async (page: number, isReset: boolean = true) => {
      if (isReset) {
        setLoading(true);
        setAllCommunities([]);
        setFeaturedCommunities([]);
        setPopularCommunities([]);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(filters.limit));
        params.append("sort_by", filters.sort_by);
        if (filters.status) params.append("status", filters.status);
        if (filters.keyword) params.append("keyword", filters.keyword);

        const response = await fetch(`/api/v1/communities?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch");

        const communities = data.data || [];

        const featured = communities.filter((c: Community) => c.featured === 1);
        const popular = [...communities]
          .sort((a, b) => (b.property_count || 0) - (a.property_count || 0))
          .slice(0, 6);

        setAllCommunities(communities);
        setFeaturedCommunities(featured);
        setPopularCommunities(popular);
        setPagination(data.meta || null);
      } catch (err: any) {
        setError(err.message);
        if (isReset) {
          setAllCommunities([]);
          setFeaturedCommunities([]);
          setPopularCommunities([]);
        }
      } finally {
        if (isReset) setLoading(false);
      }
    },
    [filters]
  );

  // ─── FETCH FEATURED ONLY ──────────────────────────────────────────────
  const fetchFeaturedOnly = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(filters.limit));
        params.append("featured", "true");
        if (filters.status) params.append("status", filters.status);

        const response = await fetch(`/api/v1/communities?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch");

        const communities = data.data || [];
        setFeaturedCommunities(communities);
        setPagination(data.meta || null);
      } catch (err: any) {
        setError(err.message);
        setFeaturedCommunities([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // ─── FETCH POPULAR ONLY ───────────────────────────────────────────────
  const fetchPopularOnly = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(filters.limit));
        params.append("sort_by", "property_count_desc");
        if (filters.status) params.append("status", filters.status);

        const response = await fetch(`/api/v1/communities?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error(data.error || "Failed to fetch");

        const communities = data.data || [];
        setPopularCommunities(communities);
        setPagination(data.meta || null);
      } catch (err: any) {
        setError(err.message);
        setPopularCommunities([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // ─── MAIN FETCH LOGIC ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      switch (activeTab) {
        case "featured":
          await fetchFeaturedOnly(filters.page);
          break;
        case "popular":
          await fetchPopularOnly(filters.page);
          break;
        case "new":
          await fetchCommunities(filters.page, true);
          break;
        default:
          await fetchCommunities(filters.page, true);
          break;
      }
    };

    fetchData();
  }, [activeTab, filters.page, filters.sort_by, filters.status, filters.keyword]);

  // ─── SEARCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, keyword: searchKeyword, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // ─── SCROLL TO TOP ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── FILTER HANDLERS ───────────────────────────────────────────────────
  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 12,
      sort_by: "featured_desc",
      status: "1",
      keyword: "",
    });
    setSearchKeyword("");
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getCurrentCommunities = () => {
    switch (activeTab) {
      case "featured":
        return featuredCommunities;
      case "popular":
        return popularCommunities;
      case "new":
        return allCommunities;
      default:
        return allCommunities;
    }
  };

  const getTabBadge = () => {
    switch (activeTab) {
      case "featured":
        return "featured";
      case "popular":
        return "popular";
      case "new":
        return "new";
      default:
        return null;
    }
  };

  const currentCommunities = getCurrentCommunities();
  const currentBadge = getTabBadge();

  return (
    <section className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Header */}
      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[32px] font-normal leading-tight md:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Communities
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
              ? `${pagination.total.toLocaleString()} COMMUNITIES AVAILABLE`
              : `${currentCommunities.length} communities`}
          </motion.p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2 md:gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { key: "all", label: "All Communities", icon: Building2 },
                { key: "featured", label: "Featured", icon: Star },
                { key: "popular", label: "Popular", icon: Users },
                { key: "new", label: "New", icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] transition-all ${
                      isActive
                        ? "bg-[#0A2540] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.key === "featured" && featuredCommunities.length > 0 && (
                      <span className="ml-1 rounded-full bg-[#1B3A5F] px-1.5 text-[8px] text-white">
                        {featuredCommunities.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <div className="hidden items-center gap-1 lg:flex">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search communities..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="h-9 w-48 border border-gray-200 bg-white px-3 pl-8 text-[11px] placeholder:text-gray-400 focus:border-[#0A2540] focus:outline-none"
                  />
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>

                <FilterDropdown
                  label="Sort"
                  value={filters.sort_by}
                  onChange={(v) => updateFilter("sort_by", v)}
                  options={SORT_OPTIONS}
                  icon={ArrowUpDown}
                />

                <div className="ml-2 flex overflow-hidden rounded-[4px] border border-gray-200">
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

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="ml-2 flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#0A2540]"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-1.5 rounded-[3px] border border-gray-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-gray-700 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>
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
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="col-span-2 h-9 border border-gray-200 bg-white px-3 text-[11px] placeholder:text-gray-400 focus:border-[#0A2540] focus:outline-none"
                />
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

      {/* Main Content */}
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6">
        {error && !loading && (
          <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => {
                switch (activeTab) {
                  case "featured":
                    fetchFeaturedOnly(filters.page);
                    break;
                  case "popular":
                    fetchPopularOnly(filters.page);
                    break;
                  default:
                    fetchCommunities(filters.page, true);
                    break;
                }
              }}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Communities Grid */}
        <div
          className={`grid gap-x-6 gap-y-10 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {loading && currentCommunities.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} viewMode={viewMode} />
              ))
            : currentCommunities.map((community) => (
                <CommunityCard
                  key={`${community.id}-${community.slug}`}
                  community={community}
                  viewMode={viewMode}
                  badge={currentBadge}
                />
              ))}
        </div>

        {/* Pagination */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* End Message */}
        {!loading && !hasActiveFilters && currentCommunities.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Building2 className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
              No communities found
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

        {/* No results for tab */}
        {!loading && activeTab !== "all" && currentCommunities.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              {activeTab === "featured" ? (
                <Star className="h-8 w-8 text-gray-300" />
              ) : activeTab === "popular" ? (
                <Users className="h-8 w-8 text-gray-300" />
              ) : (
                <Sparkles className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <h3 className="mt-4 text-[22px] text-[#0A2540]" style={{ fontFamily: FONT_DISPLAY }}>
              No {activeTab} communities found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-[#8A94A3]">
              {activeTab === "featured"
                ? "No featured communities available. Check back later!"
                : activeTab === "popular"
                ? "No popular communities available. Check back later!"
                : "No new communities available. Check back later!"}
            </p>
            <button
              onClick={() => setActiveTab("all")}
              className="mt-6 px-8 py-3 text-[10px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              View All Communities
            </button>
          </motion.div>
        )}
      </div>

      {/* Scroll to Top */}
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