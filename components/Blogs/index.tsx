"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiRefreshCw, FiAlertCircle } from "react-icons/fi";

interface BlogImageUrls {
  main?: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
  [key: string]: string | undefined;
}

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  descriptions?: string;
  excerpt?: string;
  imageurl?: string;
  image_urls?: BlogImageUrls;
  author?: string;
  writer?: string;
  publish_date?: string;
  created_at: string;
  updated_at?: string;
  status?: number;
  views?: number;
  seo_slug?: string;
  featured?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Blog[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

// ✅ Changed to 3
const BLOG_LIMIT = 3;
const RETRY_ATTEMPTS = 2;
const FETCH_LIMIT = 3;

const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const getBlogImage = (blog: Blog): string => {
  const candidates = [
    blog.image_urls?.main,
    blog.image_urls?.large,
    blog.image_urls?.medium,
    blog.imageurl,
    blog.image_urls?.thumbnail,
  ];

  for (const url of candidates) {
    if (isValidImageUrl(url)) return url!;
  }
  return "";
};

const hasValidImage = (blog: Blog): boolean => getBlogImage(blog) !== "";

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const stripHtml = (html?: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};

const SkeletonCard = () => (
  <div className="relative aspect-[3/4] bg-neutral-200 overflow-hidden animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-neutral-300/50 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
      <div className="h-3 bg-neutral-300/80 rounded w-1/3" />
      <div className="h-3 bg-neutral-300/80 rounded w-1/4" />
      <div className="h-8 bg-neutral-300/80 rounded w-3/4 mt-4" />
    </div>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <FiAlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="text-lg font-medium text-neutral-900 mb-2">
      Failed to load blogs
    </h3>
    <p className="text-sm text-neutral-500 mb-6 text-center max-w-md">
      We couldn't fetch the latest blogs. This might be a temporary issue.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-sm hover:bg-neutral-800 transition-colors"
    >
      <FiRefreshCw size={16} />
      Try Again
    </button>
  </motion.div>
);

export default function TrendingBlogs() {
  const router = useRouter();
  const [blogPool, setBlogPool] = useState<Blog[]>([]);
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchBlogs = useCallback(async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      setFailedIds(new Set());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // ✅ Fetch only 3 blogs
      const apiUrl = `/api/v1/blogs?limit=${FETCH_LIMIT}&sort_by=newest&status=1`;

      console.log('🔵 [TrendingBlogs] Fetching:', apiUrl);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      console.log('🔵 [TrendingBlogs] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      console.log('🔵 [TrendingBlogs] Result success:', result.success);
      console.log('🔵 [TrendingBlogs] Blogs count:', result.data?.length || 0);

      if (!result.success) {
        throw new Error(result.message || "API returned unsuccessful response");
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid data format received");
      }

      const validBlogs = result.data.filter((blog): blog is Blog => {
        const hasId = typeof blog.id === "number";
        const hasTitle =
          typeof blog.title === "string" && blog.title.trim().length > 0;
        const hasSlug =
          (typeof blog.slug === "string" && blog.slug.trim().length > 0) ||
          (typeof blog.seo_slug === "string" &&
            blog.seo_slug.trim().length > 0);
        const hasImage = hasValidImage(blog);

        return hasId && hasTitle && hasSlug && hasImage;
      });

      console.log('🔵 [TrendingBlogs] Valid blogs:', validBlogs.length);

      setBlogPool(validBlogs);

      if (validBlogs.length === 0) {
        setError("No blogs available at the moment");
      }
    } catch (err) {
      console.error('🔴 [TrendingBlogs] Error:', err);
      
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timeout - please try again");
        setLoading(false);
        return;
      }

      if (attempt < RETRY_ATTEMPTS) {
        console.log(`🟡 [TrendingBlogs] Retry attempt ${attempt + 1}`);
        setTimeout(() => fetchBlogs(attempt + 1), 2000 * (attempt + 1));
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchBlogs();
    }
  }, [isClient, fetchBlogs]);

  const displayedBlogs = useMemo(() => {
    return blogPool
      .filter((blog) => !failedIds.has(blog.id))
      .slice(0, BLOG_LIMIT);
  }, [blogPool, failedIds]);

  const handleImageError = useCallback((blogId: number) => {
    setFailedIds((prev) => {
      if (prev.has(blogId)) return prev;
      const next = new Set(prev);
      next.add(blogId);
      return next;
    });
  }, []);

  const navigateToBlog = useCallback(
    (blog: Blog) => {
      const slug = blog.slug || blog.seo_slug || String(blog.id);
      router.push(`/blog/${slug}`);
    },
    [router]
  );

  const navigateToAllBlogs = useCallback(() => {
    router.push(`/blog`);
  }, [router]);

  if (!isClient) {
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="h-12 bg-neutral-100 rounded animate-pulse mb-12 max-w-md mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2
            className="text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-normal tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Trending Blogs
          </h2>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1"
            >
              <ErrorState onRetry={() => fetchBlogs()} />
            </motion.div>
          ) : displayedBlogs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <p className="text-neutral-400 text-sm uppercase tracking-widest mb-2">
                Coming Soon
              </p>
              <p className="text-neutral-600">
                New articles are being prepared for you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {displayedBlogs.map((blog, index) => {
                const imageUrl = getBlogImage(blog);
                const displayDate = formatDate(
                  blog.publish_date || blog.created_at
                );
                const authorName =
                  blog.writer || blog.author || "Editorial Team";
                const excerpt = stripHtml(
                  blog.excerpt || blog.descriptions
                ).slice(0, 100);

                return (
                  <motion.article
                    key={blog.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => navigateToBlog(blog)}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-5">
                      <img
                        src={imageUrl}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading={index < 2 ? "eager" : "lazy"}
                        onError={() => handleImageError(blog.id)}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <div className="flex items-center gap-3 mb-3 text-white/80">
                            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
                              {blog.category || "Lifestyle"}
                            </span>
                            {displayDate && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">
                                  {displayDate}
                                </span>
                              </>
                            )}
                          </div>

                          <h3
                            className="text-white text-xl md:text-2xl font-normal leading-[1.2] line-clamp-3"
                            style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {blog.title}
                          </h3>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                          <FiArrowRight className="text-white" size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-2">
                        {authorName}
                      </p>
                      {excerpt && (
                        <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                          {excerpt}...
                        </p>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && displayedBlogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-12 md:mt-16"
          >
            <button
              onClick={navigateToAllBlogs}
              className="group relative px-8 py-3 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 text-[11px] font-medium uppercase tracking-[0.25em] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                View All Blogs
                <FiArrowRight
                  size={16}
                  className="transform group-hover:translate-x-1 transition-transform duration-300"
                />
              </span>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}