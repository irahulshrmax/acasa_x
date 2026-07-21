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
const FONT_DISPLAY = "'Display Pro', 'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
  gold: "#C9A96E",
  surface: "#F8FAFC",
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
  views: number;
  likes: number;
  comments_count: number;
  related: Blog[];
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

  const imageSrc = imageError
    ? "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop"
    : blog.image_urls?.main || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => router.push(`/blog/${blog.slug}`)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-lg">
        <img
          src={imageSrc}
          alt={blog.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <span className="absolute left-3 top-3 rounded bg-neutral-900/80 px-2.5 py-1 text-[9px] font-medium text-white backdrop-blur-sm">
          {blog.category}
        </span>
      </div>
      <div className="mt-3">
        <h4 className="text-[14px] font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
          {blog.title}
        </h4>
        <p className="text-[12px] text-neutral-500 line-clamp-2 mt-1">
          {blog.excerpt || blog.descriptions?.replace(/<[^>]*>/g, '').slice(0, 100) || ""}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400">
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
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Article not found"}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Articles
          </Link>
        </div>
      </div>
    );
  }

  const imageSrc = blog.image_urls?.main || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Minimal Nav */}
      <div className="border-b border-neutral-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/blog" className="hover:text-neutral-600 transition-colors">Blog</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="text-neutral-500 truncate max-w-[100px] sm:max-w-xs">{blog.title}</span>
            </div>
            <button
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4 text-neutral-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-5xl mx-auto px-4 py-6">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="rounded bg-neutral-900 px-2.5 py-1 text-[9px] font-medium uppercase text-white">
            {blog.category}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-neutral-500">
            <Clock className="h-3 w-3" />
            {blog.reading_time || 1} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
          {blog.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px] text-neutral-500">
          {blog.writer && (
            <span className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-700">
                {blog.writer.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-neutral-800">{blog.writer}</span>
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

        {/* Featured Image */}
        <div className="mt-6 aspect-[16/7] overflow-hidden bg-neutral-100 rounded-xl">
          <img
            src={imageSrc}
            alt={blog.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="mt-8 prose prose-neutral max-w-none text-[15px] leading-relaxed text-neutral-800">
          <div dangerouslySetInnerHTML={{ __html: blog.descriptions || "" }} />
        </div>

        {/* Tags */}
        {blog.tags_list && blog.tags_list.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-neutral-400" />
              {blog.tags_list.map((tag) => (
                <span key={tag} className="rounded bg-neutral-100 px-3 py-1 text-[11px] text-neutral-600">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[12px] text-neutral-500">
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
            className="flex items-center gap-2 text-[10px] font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            All Articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>

      {/* Related Articles */}
      {blog.related && blog.related.length > 0 && (
        <section className="border-t border-neutral-100 mt-4">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Explore More</p>
                <h2 className="text-2xl font-medium text-neutral-900">Related Articles</h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:flex items-center gap-2 text-[10px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blog.related.map((relatedBlog, i) => (
                <RelatedBlogCard key={relatedBlog.id} blog={relatedBlog} index={i} />
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/blog"
                className="inline-block px-6 py-2.5 text-[11px] font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
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