"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  BookOpen,
  Check,
  ArrowRight,
} from "lucide-react";

const API_URL = "/api/v1/blogs";
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

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  descriptions: string;
  content: string;
  image: string;
  banner_image: string;
  image_urls: {
    main: string;
    thumbnail: string;
    medium: string;
    variations: string[];
  };
  author: string;
  author_image: string | null;
  author_designation: string | null;
  featured: number;
  status: number;
  views: number;
  likes: number;
  comments_count: number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
  formatted_date: string;
  excerpt: string;
  reading_time: number;
  tags_list: string[];
  related: Blog[];
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-16">
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
          <motion.div
            className="absolute inset-[6px] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: THEME.primary, borderLeftColor: THEME.primary }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-5 text-[10px] uppercase tracking-[0.3em]"
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
  const imageSrc = imageError
    ? "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop"
    : blog.image_urls?.thumbnail || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => router.push(`/blog/${blog.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={blog.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute left-3 top-3 rounded-[3px] bg-[#0F1C2E]/80 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {blog.category}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <h4
          className="truncate text-[13px] font-medium uppercase tracking-wide transition-colors group-hover:text-[#C9A96E]"
          style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
        >
          {blog.title}
        </h4>
        <p className="line-clamp-2 text-[11px] text-[#6B7A8D]">
          {blog.excerpt || blog.descriptions?.replace(/<[^>]*>/g, '').slice(0, 100) + '...' || ""}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-[#6B7A8D]">
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
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}?slug=${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Blog not found");
        setBlog(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!blog) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: blog.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [blog]);

  if (loading) return <PageLoader />;

  if (error || !blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Article not found"}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Articles
          </Link>
        </div>
      </div>
    );
  }

  const imageSrc = blog.image_urls?.main || blog.image || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/blog" className="hover:text-gray-600 transition-colors">
                Blog
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {blog.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <article>
        <div className="mx-auto max-w-[880px] px-4 pt-8 pb-6 md:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              {blog.category}
            </span>
            {blog.featured === 1 && (
              <span className="rounded-[3px] bg-[#C9A96E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                Featured
              </span>
            )}
            <span className="flex items-center gap-1 rounded-[3px] bg-gray-100 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6B7A8D]">
              <Clock className="h-3 w-3" />
              {blog.reading_time || 1} min read
            </span>
          </div>

          <h1
            className="text-[28px] leading-tight sm:text-[36px] md:text-[44px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            {blog.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-[#6B7A8D]">
            {blog.author && (
              <span className="flex items-center gap-2">
                {blog.author_image ? (
                  <img
                    src={blog.author_image}
                    alt={blog.author}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[11px] font-medium text-[#6B7A8D]">
                    {blog.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-[#0F1C2E]">{blog.author}</span>
                {blog.author_designation && (
                  <span className="text-[11px]">• {blog.author_designation}</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {blog.formatted_date || "Recent"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {blog.views || 0} views
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-4 md:px-6">
          <div className="relative aspect-[16/7] overflow-hidden bg-gray-100 rounded-[4px]">
            <img
              src={imageSrc}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>

        <div className="mx-auto max-w-[880px] px-4 py-10 md:px-6">
          <div className="prose prose-lg max-w-none text-[15px] leading-relaxed" style={{ color: "#333" }}>
            {blog.content ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: blog.descriptions || "" }} />
            )}
          </div>

          {blog.tags_list && blog.tags_list.length > 0 && (
            <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-[#6B7A8D]" />
                {blog.tags_list.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-3 py-1 text-[11px] text-[#6B7A8D]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-8" style={{ borderColor: THEME.border }}>
            <div className="flex items-center gap-4 text-[13px] text-[#6B7A8D]">
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
              className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-70"
              style={{ color: THEME.primary }}
            >
              All Articles
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </article>

      {blog.related && blog.related.length > 0 && (
        <section className="border-t" style={{ borderColor: THEME.border }}>
          <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: THEME.accent }}>
                  Explore More
                </p>
                <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Related Articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
                style={{ color: THEME.primary }}
              >
                View All
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {blog.related.map((relatedBlog, i) => (
                <RelatedBlogCard key={relatedBlog.id} blog={relatedBlog} index={i} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/blog"
                className="inline-block border px-8 py-3 text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.primary }}
              >
                View All Articles
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="h-20 sm:hidden" />
    </div>
  );
}