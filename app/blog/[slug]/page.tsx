"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import parse from "html-react-parser";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  BookOpen,
  Check,
  ArrowRight,
  Clock,
} from "lucide-react";

const API_URL = "/api/v1/blogs";
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  navy: "#111827",
  slateBlue: "#577C8E",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
  accentDark: "#A88752",
  surface: "#F8FAFC",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop";

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
  views: number;
  likes: number;
  comments_count: number;
  related: Blog[];
}

function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-50"
      style={{ scaleX, background: THEME.accent }}
    />
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-12 w-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${THEME.accent}30` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: THEME.accent, borderRightColor: THEME.accent }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-4 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: THEME.muted }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Article
        </motion.p>
      </div>
    </div>
  );
}

function RelatedBlogCard({ blog, index }: { blog: Blog; index: number }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const imageSrc = imageError ? FALLBACK_IMAGE : blog.image_urls?.main || FALLBACK_IMAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => router.push(`/blog/${blog.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 rounded-xl">
        <img
          src={imageSrc}
          alt={blog.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-[9px] font-medium uppercase tracking-wide text-white backdrop-blur-sm"
          style={{ background: `${THEME.navy}CC` }}
        >
          {blog.category}
        </span>
      </div>
      <div className="mt-3">
        <h4
          className="text-[15px] font-medium text-neutral-900 truncate transition-colors"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {blog.title}
        </h4>
        <p className="text-[12px] text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
          {blog.excerpt || blog.descriptions?.replace(/<[^>]*>/g, "").slice(0, 100) || ""}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {blog.reading_time || 1} min
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {blog.views || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams() as { slug: string };
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadBlog() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?slug=${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Blog not found");
        if (!cancelled) setBlog(data.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBlog();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!blog) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: blog.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      setCopied(false);
    }
  }, [blog]);

  if (loading) return <PageLoader />;

  if (error || !blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Article not found"}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-medium text-white rounded-lg transition-colors"
            style={{ background: THEME.navy }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Articles
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = heroImageError ? FALLBACK_IMAGE : blog.image_urls?.main || FALLBACK_IMAGE;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <ReadingProgressBar />

      <div className="border-b border-neutral-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <Link href="/" className="hover:text-neutral-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/blog" className="hover:text-neutral-600 transition-colors">
                Blog
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="text-neutral-500 truncate max-w-[100px] sm:max-w-xs">{blog.title}</span>
            </div>
            <button
              onClick={handleShare}
              className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors text-[11px] font-medium text-neutral-600"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <article className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span
            className="rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white"
            style={{ background: THEME.navy }}
          >
            {blog.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            {blog.reading_time || 1} min read
          </span>
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-900 leading-[1.15] tracking-tight"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="mt-4 text-[15px] sm:text-base text-neutral-500 leading-relaxed max-w-3xl">
            {blog.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-neutral-100">
          {blog.writer && (
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-white ring-2 ring-offset-2"
                style={{ background: THEME.slateBlue, boxShadow: `0 0 0 2px ${THEME.accent}40` }}
              >
                {blog.writer.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-medium text-neutral-900">{blog.writer}</p>
                <p className="text-[11px] text-neutral-400">Author</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-[12px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {blog.formatted_date || "Recent"}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {blog.views || 0} views
            </span>
          </div>
        </div>

        <div className="mt-8 relative aspect-[16/8] overflow-hidden bg-neutral-100 rounded-2xl">
          <img
            src={heroImage}
            alt={blog.title}
            className="h-full w-full object-cover"
            onError={() => setHeroImageError(true)}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
        </div>

        <div className="mt-10">
          <div className="blog-content">{isMounted && blog.descriptions && parse(blog.descriptions)}</div>
        </div>

        {blog.tags_list && blog.tags_list.length > 0 && (
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-neutral-400" />
              {blog.tags_list.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium text-neutral-600 border transition-colors hover:text-white cursor-default"
                  style={{ borderColor: THEME.border }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = THEME.accent;
                    e.currentTarget.style.borderColor = THEME.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = THEME.border;
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-[13px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              {blog.likes || 0}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              {blog.comments_count || 0}
            </span>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-2 text-[11px] font-medium transition-colors"
            style={{ color: THEME.navy }}
          >
            All Articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>

      {blog.related && blog.related.length > 0 && (
        <section className="border-t border-neutral-100" style={{ background: THEME.surface }}>
          <div className="max-w-5xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.25em] mb-2 font-medium"
                  style={{ color: THEME.accentDark }}
                >
                  Explore More
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900" style={{ fontFamily: FONT_DISPLAY }}>
                  Related Articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blog.related.map((relatedBlog, i) => (
                <RelatedBlogCard key={relatedBlog.id} blog={relatedBlog} index={i} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/blog"
                className="inline-block px-6 py-2.5 text-[11px] font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-white transition-colors"
              >
                View All Articles
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}