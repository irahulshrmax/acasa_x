"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const BLOGS_API_URL = "/api/v1/blogs";
const PLACEHOLDER = "/placeholder-blog.png";
const IMAGE_BASE_URL = "https://acasa.ae/upload/blogs";

const FONT_BODY = "'Inter', sans-serif";

const THEME = {
  primary: "#0F1C2E",
  accent: "#C9A96E",
  accentLight: "#D4B888",
  muted: "#6B7A8D",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

interface Blog {
  id: number;
  title: string;
  slug: string;
  sub_title: string | null;
  writer: string | null;
  publish_date: string | null;
  category: string;
  imageurl: string | null;
  image_url: string | null;
  excerpt: string;
  status: number;
  created_at: string;
  updated_at: string;
  image_urls?: {
    main: string;
    thumbnail: string;
    medium: string;
    variations: string[];
  };
}

function getBlogImage(blog: Blog): string {
  if (blog.image_urls?.main && !blog.image_urls.main.includes("no-image")) {
    return blog.image_urls.main;
  }
  if (blog.image_url && !blog.image_url.includes("no-image")) {
    return blog.image_url;
  }
  if (blog.imageurl) {
    return `${IMAGE_BASE_URL}/${blog.imageurl}.webp`;
  }
  return PLACEHOLDER;
}

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function trimTitleForOverlay(title: string): string {
  const words = title.split(" ");
  if (words.length <= 5) return capitalizeFirst(title);
  const maxWords = words.length > 10 ? 6 : 5;
  return capitalizeFirst(words.slice(0, maxWords).join(" "));
}

// ─── Skeletons ─────────────────────────────────────────────────────────

const BlogSkeleton = () => (
  <div>
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-gray-200 animate-pulse"
      style={{ aspectRatio: "3/4" }}
    />
    <div className="mt-5 px-1">
      <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
    </div>
  </div>
);

// ─── Card Loader ──────────────────────────────────────────────────────

function CardLoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[3px]"
      style={{ background: "rgba(15, 28, 46, 0.85)" }}
    >
      <div className="relative h-14 w-14">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: THEME.accent,
            borderRightColor: THEME.accent,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "rgba(255,255,255,0.7)",
            borderLeftColor: "rgba(255,255,255,0.7)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.p
        className="mt-4 text-[9px] uppercase text-white"
        style={{
          fontFamily: FONT_BODY,
          letterSpacing: "0.3em",
          fontWeight: 500,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        Opening
      </motion.p>
    </motion.div>
  );
}

// ─── View All Button ──────────────────────────────────────────────────

function ViewAllButton() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isNavigating) return;
      setIsNavigating(true);
      setTimeout(() => {
        window.location.href = "/blog";
      }, 900);
    },
    [isNavigating]
  );

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setButtonHover(true)}
      onMouseLeave={() => setButtonHover(false)}
      disabled={isNavigating}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all disabled:cursor-wait"
      style={{
        backgroundColor: THEME.primary,
        fontFamily: FONT_BODY,
        boxShadow:
          buttonHover && !isNavigating
            ? "0 12px 32px rgba(15,28,46,0.25)"
            : "0 4px 12px rgba(15,28,46,0.1)",
        transform:
          buttonHover && !isNavigating ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        minWidth: "220px",
        justifyContent: "center",
      }}
    >
      <span
        className="absolute inset-0 origin-left"
        style={{
          background: `linear-gradient(90deg, ${THEME.accent} 0%, ${THEME.accentLight} 100%)`,
          transform: buttonHover && !isNavigating ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {isNavigating && (
        <motion.span
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      <span
        className="relative z-10 transition-colors"
        style={{
          color: buttonHover && !isNavigating ? THEME.primary : "#fff",
        }}
      >
        {isNavigating ? "Loading Blogs" : "View All Blog"}
      </span>

      <span
        className="relative z-10 flex items-center"
        style={{
          color: buttonHover && !isNavigating ? THEME.primary : "#fff",
        }}
      >
        {isNavigating ? (
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="30 60"
              strokeLinecap="round"
            />
          </motion.svg>
        ) : (
          <motion.span
            animate={buttonHover ? { x: 6 } : { x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-xs"
          >
            →
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}

// ─── Blog Image ────────────────────────────────────────────────────────

const BlogImage = ({
  blog,
  className,
}: {
  blog: Blog;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = getBlogImage(blog);
    setImgSrc(url);
    setLoaded(false);
    setFailed(false);
  }, [blog]);

  if (failed || !imgSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
      >
        <span className="text-sm text-gray-400">No Image</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-[0] animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}

      <img
        src={imgSrc}
        alt={blog.title}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
        }}
      />
    </>
  );
};

// ─── Desktop Card ──────────────────────────────────────────────────────

const DesktopBlogCard = ({ blog }: { blog: Blog }) => {
  const [isOpening, setIsOpening] = useState(false);

  const overlayTitle = trimTitleForOverlay(blog.title);
  const href = `/blog/${blog.slug}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => {
      window.location.href = href;
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="flex flex-col"
    >
      <a href={href} onClick={handleClick} className="flex h-full flex-col">
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-[#f0f0f0]"
          style={{
            aspectRatio: "3/4",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <BlogImage
            blog={blog}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <AnimatePresence>
            {isOpening && <CardLoadingOverlay />}
          </AnimatePresence>

          <div
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(to top, rgba(15,28,46,0.85) 0%, rgba(15,28,46,0.40) 40%, rgba(15,28,46,0.08) 75%, transparent 100%)",
            }}
          />

          <div className="absolute inset-x-0 bottom-0 z-[4] px-6 pb-8">
            <h3
              className="text-white/90"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(26px, 2.6vw, 42px)",
                fontWeight: 400,
                lineHeight: "1.2",
                maxWidth: "85%",
                textShadow: "0 2px 16px rgba(0,0,0,0.5)",
              }}
            >
              {overlayTitle}
            </h3>
          </div>
        </div>

        <div className="mt-5 px-1">
          <h4
            className="text-[#0F1C2E]"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: "1.55",
              letterSpacing: "-0.01em",
            }}
          >
            {capitalizeFirst(blog.title)}
          </h4>
        </div>
      </a>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────

export default function BlogsSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BLOGS_API_URL}?page=1&limit=4&status=1&sort_by=newest`
      );

      const data = await response.json();

      if (data.success) {
        setBlogs(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch blogs");
      }
    } catch (err: any) {
      setError(err.message);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const isLoading = loading;
  const hasError = error;
  const blogList = blogs.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] py-14 md:py-22 lg:py-28">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#C9A96E]/[0.06] to-transparent blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#0F1C2E]/[0.04] to-transparent blur-[100px]" />

      <div className="relative mx-auto max-w-[1320px] px-6">
        {/* Header */}
        <div className="mb-8 text-left lg:mb-16 lg:text-center">
          <p
            className="mb-2.5 uppercase text-[#C9A96E] lg:mb-3"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.18em",
            }}
          >
            Here to Help You Thrive
          </p>

          <h2
            className="text-[#0F1C2E]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 400,
              lineHeight: "1.2",
              letterSpacing: "-0.5px",
            }}
          >
            Our Trending Blogs
          </h2>

          <div
            className="mx-auto mt-5 hidden lg:block"
            style={{
              width: "48px",
              height: "1.5px",
              background:
                "linear-gradient(90deg, transparent, #C9A96E, transparent)",
            }}
          />
        </div>

        {/* Error */}
        {hasError && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500/80">Failed to load blogs</p>
            <button
              onClick={fetchBlogs}
              className="mt-3 text-xs text-[#C9A96E] underline underline-offset-2 transition-colors hover:text-[#0F1C2E]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Mobile */}
        <div className="lg:hidden">
          {isLoading ? (
            <BlogSkeleton />
          ) : (
            !hasError &&
            blogList.length > 0 && (
              <>
                {blogList.slice(0, 1).map((blog) => (
                  <div key={blog.id}>
                    <div
                      className="relative w-full overflow-hidden rounded-2xl bg-[#f0f0f0]"
                      style={{
                        aspectRatio: "3/4",
                        boxShadow:
                          "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      <BlogImage
                        blog={blog}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0 z-[1]"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(15,28,46,0.85) 0%, rgba(15,28,46,0.40) 40%, rgba(15,28,46,0.08) 75%, transparent 100%)",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 z-[4] px-6 pb-8">
                        <h3
                          className="text-white/90"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "clamp(26px, 7vw, 38px)",
                            fontWeight: 400,
                            lineHeight: "1.2",
                            maxWidth: "80%",
                            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
                          }}
                        >
                          {trimTitleForOverlay(blog.title)}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-5 px-1">
                      <h4
                        className="text-[#0F1C2E]"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          lineHeight: "1.55",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {capitalizeFirst(blog.title)}
                      </h4>
                    </div>
                  </div>
                ))}

                <div className="mt-12 flex justify-center">
                  <ViewAllButton />
                </div>
              </>
            )
          )}

          {!isLoading && !hasError && blogList.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6B7A8D]">No blogs available</p>
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6 xl:gap-7">
          {isLoading ? (
            <>
              <BlogSkeleton />
              <BlogSkeleton />
              <BlogSkeleton />
              <BlogSkeleton />
            </>
          ) : (
            !hasError &&
            blogList.map((blog) => (
              <DesktopBlogCard key={blog.id} blog={blog} />
            ))
          )}
        </div>

        {/* Desktop View All */}
        {!isLoading && !hasError && blogList.length > 0 && (
          <div className="hidden justify-center lg:mt-16 lg:flex">
            <ViewAllButton />
          </div>
        )}

        {!isLoading && !hasError && blogList.length === 0 && (
          <div className="hidden py-12 text-center lg:block">
            <p className="text-sm text-[#6B7A8D]">No blogs available</p>
          </div>
        )}
      </div>
    </section>
  );
}