"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  Eye,
  TrendingUp,
  Clock,
  Calendar,
  User,
  BookOpen,
  Heart,
  MessageCircle,
} from "lucide-react";

const API_URL = "/api/v1/blogs";
const DEFAULT_LIMIT = 9;

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#0F1C2E",
  secondary: "#1A2F4A",
  accent: "#C9A96E",
  muted: "#6B7A8D",
  border: "#E2E8F0",
};

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  descriptions: string;
  imageurl: string;
  image_urls: {
    main: string;
    thumbnail: string;
    medium: string;
    variations: string[];
  };
  writer: string;
  status: number;
  publish_date: string;
  formatted_date: string;
  excerpt: string;
  reading_time: number;
  tags_list: string[];
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cached?: boolean;
}

interface Category {
  category: string;
  count: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Popular" },
];

function BlogCard({ blog, index = 0 }: { blog: Blog; index?: number }) {
  const [imageError, setImageError] = useState(false);

  console.log("Blog Card Render:", {
    id: blog.id,
    title: blog.title,
    imageurl: blog.imageurl,
    image_urls: blog.image_urls,
    main_image: blog.image_urls?.main,
  });

  const defaultImage = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop";
  
  // Try to get image from multiple sources
  const imageSrc = (() => {
    if (imageError) return defaultImage;
    if (blog.image_urls?.main && blog.image_urls.main !== "https://acasa.ae/upload/no-image.png") {
      return blog.image_urls.main;
    }
    if (blog.imageurl && blog.imageurl !== "https://acasa.ae/upload/no-image.png") {
      return blog.imageurl;
    }
    return defaultImage;
  })();

  console.log("Image Source:", imageSrc);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group bg-white border transition-all duration-300 hover:shadow-xl"
      style={{ borderColor: THEME.border }}
    >
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={blog.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => {
              console.log("Image load error for:", blog.id, blog.imageurl);
              setImageError(true);
            }}
          />
          <span className="absolute right-3 top-3 rounded-[3px] bg-black/60 px-2.5 py-1 text-[9px] text-white backdrop-blur-sm">
            {blog.category}
          </span>
          <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[9px] text-white/80">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {blog.reading_time || 2} min
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3
            className="text-[16px] font-normal uppercase leading-snug tracking-[0.04em] transition-opacity group-hover:opacity-70 line-clamp-2"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            {blog.title}
          </h3>

          <div className="mt-2 flex items-center gap-3 text-[11px] text-[#6B7A8D]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {blog.formatted_date || "Recent"}
            </span>
            {blog.writer && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {blog.writer}
              </span>
            )}
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#4A5462] line-clamp-3">
            {blog.excerpt || blog.descriptions?.replace(/<[^>]*>/g, '').slice(0, 120) || ""}
          </p>

          <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: THEME.border }}>
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] transition-colors group-hover:text-[#C9A96E]" style={{ color: THEME.primary }}>
              Read More →
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
      <div className="aspect-[16/9] animate-pulse bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex justify-between pt-4 border-t">
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[11px] font-medium transition-all duration-200 ${
          hasValue ? "bg-[#0F1C2E] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
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
            className="absolute left-0 top-full z-50 mt-1 min-w-[180px] border border-gray-200 bg-white py-1 shadow-xl"
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
      </button>
    </div>
  );
}

export default function BlogPage() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    category: "",
    sort_by: "newest",
    keyword: "",
  });

  const hasActiveFilters = filters.category !== "" || searchTerm !== "";
  const hasMore = pagination ? filters.page < pagination.totalPages : false;

  const fetchBlogs = useCallback(
    async (page: number, isReset: boolean) => {
      console.log("Fetching blogs:", { page, isReset, filters, searchTerm });

      if (isReset) {
        setLoading(true);
        setBlogs([]);
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
        if (filters.category) params.append("category", filters.category);

        const url = `${API_URL}?${params.toString()}`;
        console.log("API URL:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("API Response:", data);

        if (!data.success) throw new Error(data.error || "Failed to fetch blogs");

        let newBlogs: Blog[] = data.data || [];
        console.log("Raw blogs from API:", newBlogs);
        console.log("First blog image data:", newBlogs[0]?.imageurl, newBlogs[0]?.image_urls);

        const seen = new Set<number>();
        newBlogs = newBlogs.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });

        if (data.cached) setIsCached(true);

        if (isReset) {
          setBlogs(newBlogs);
          setIsInitialLoad(false);
        } else {
          setBlogs((prev) => {
            const existingIds = new Set(prev.map((b) => b.id));
            return [...prev, ...newBlogs.filter((b) => !existingIds.has(b.id))];
          });
        }

        setPagination(data.meta || null);
      } catch (err: any) {
        console.error("Error fetching blogs:", err);
        setError(err.message || "Failed to load blogs");
        if (isReset) {
          setBlogs([]);
          setIsInitialLoad(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, searchTerm]
  );

  const fetchCategories = useCallback(async () => {
    console.log("Fetching categories...");
    try {
      const res = await fetch(`${API_URL}?categories=true`);
      const data = await res.json();
      console.log("Categories response:", data);
      if (data.success) setCategories(data.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBlogs(filters.page, filters.page === 1);
  }, [fetchBlogs, filters.page]);

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
    console.log("Updating filter:", key, value);
    setBlogs([]);
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleSearch = useCallback((value: string) => {
    console.log("Search:", value);
    setSearchTerm(value);
    setBlogs([]);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    console.log("Clearing filters");
    setBlogs([]);
    setFilters({
      page: 1,
      limit: DEFAULT_LIMIT,
      category: "",
      sort_by: "newest",
      keyword: "",
    });
    setSearchTerm("");
  }, []);

  const handlePageChange = useCallback((page: number) => {
    console.log("Page change:", page);
    setBlogs([]);
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
            Blog & Insights
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
                <span>{pagination.total.toLocaleString()} articles</span>
                {isCached && (
                  <span className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    cached
                  </span>
                )}
              </>
            ) : (
              `${blogs.length} articles`
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
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                />
              </div>

              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="h-9 border border-gray-200 bg-white px-3 text-[11px] focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>

              <FilterDropdown
                label="Sort"
                value={filters.sort_by}
                onChange={(v) => updateFilter("sort_by", v)}
                options={SORT_OPTIONS}
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
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
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
              onClick={() => fetchBlogs(filters.page, filters.page === 1)}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && blogs.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            : blogs.map((blog, index) => (
                <BlogCard key={`${blog.id}-${blog.slug}`} blog={blog} index={index} />
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

        {!loading && !hasMore && blogs.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.15em] text-[#6B7A8D]">
            You've reached the end
          </p>
        )}

        {!loading && blogs.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <BookOpen className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0F1C2E]" style={{ fontFamily: FONT_DISPLAY }}>
              No articles found
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
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}