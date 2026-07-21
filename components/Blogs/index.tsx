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

const BLOG_LIMIT = 4;
const RETRY_ATTEMPTS = 2;
const FETCH_LIMIT = 4;

// EB Garamond font style object (reusable)
const ebGaramondStyle = {
  fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif",
  fontOpticalSizing: "auto" as const,
  fontWeight: 500,
  fontStyle: "normal" as const,
};

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

const stripHtml = (html?: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};

const SkeletonCard = () => (
  <div className="flex flex-col">
    <div className="relative aspect-[4/5] bg-neutral-200 overflow-hidden animate-pulse" />
    <div className="mt-3 space-y-2">
      <div className="h-2 bg-neutral-200 rounded w-1/3 animate-pulse" />
      <div className="h-3 bg-neutral-200 rounded w-2/3 animate-pulse" />
    </div>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <FiAlertCircle className="w-7 h-7 text-red-500" />
    </div>
    <h3 className="text-base font-medium text-neutral-900 mb-2">
      Failed to load blogs
    </h3>
    <p className="text-xs text-neutral-500 mb-5 text-center max-w-md">
      We couldn't fetch the latest blogs. This might be a temporary issue.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-5 py-2 bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
    >
      <FiRefreshCw size={14} />
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

      const apiUrl = `/api/v1/blogs?limit=${FETCH_LIMIT}&sort_by=newest&status=1`;

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

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

      setBlogPool(validBlogs);

      if (validBlogs.length === 0) {
        setError("No blogs available at the moment");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timeout - please try again");
        setLoading(false);
        return;
      }

      if (attempt < RETRY_ATTEMPTS) {
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
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="h-10 bg-neutral-100 rounded animate-pulse mb-10 max-w-sm mx-auto" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500 mb-3">
            Here to help you thrive
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-[42px] text-neutral-900 tracking-tight"
            style={ebGaramondStyle}
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
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {[1, 2, 3, 4].map((i) => (
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
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">
                Coming Soon
              </p>
              <p className="text-neutral-600 text-sm">
                New articles are being prepared for you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            >
              {displayedBlogs.map((blog, index) => {
                const imageUrl = getBlogImage(blog);
                const authorName =
                  blog.writer || blog.author || "Editorial Team";
                const excerpt = stripHtml(
                  blog.excerpt || blog.descriptions
                ).slice(0, 80);

                return (
                  <motion.article
                    key={blog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => navigateToBlog(blog)}
                    className="group cursor-pointer flex flex-col"
                  >
                    {/* Image with overlay title */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                      <img
                        src={imageUrl}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading={index < 2 ? "eager" : "lazy"}
                        onError={() => handleImageError(blog.id)}
                      />

                      {/* Bottom gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Title overlay with EB Garamond */}
                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                        <h3
                          className="text-white text-xl md:text-2xl lg:text-[26px] leading-[1.1] line-clamp-3 drop-shadow-md"
                          style={ebGaramondStyle}
                        >
                          {blog.title}
                        </h3>
                      </div>
                    </div>

                    {/* Below image content */}
                    <div className="mt-3 md:mt-4 flex flex-col">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                        {blog.category || authorName}
                      </p>
                      {excerpt && (
                        <p className="text-xs md:text-[13px] text-neutral-700 line-clamp-2 leading-snug">
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Button */}
        {!loading && !error && displayedBlogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mt-10 md:mt-12"
          >
            <button
              onClick={navigateToAllBlogs}
              className="group px-8 py-3 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 text-[11px] font-medium uppercase tracking-[0.25em]"
            >
              <span className="flex items-center gap-2">
                View All Blogs
              </span>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}