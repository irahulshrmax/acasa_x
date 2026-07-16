"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

type Blog = {
  id: number;
  title: string;
  slug: string;
  category: string;
  descriptions: string;
  imageurl?: string;
  image_urls?: {
    main?: string;
    thumbnail?: string;
    medium?: string;
    [key: string]: any;
  };
  author?: string;
  writer?: string;
  publish_date: string;
  created_at: string;
  status: number;
  views?: number;
  seo_slug?: string;
};

type ApiResponse = {
  success: boolean;
  data: Blog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return false;
  }
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

export default function TrendingBlogs() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        // Fetch more blogs so we can filter
        const res = await fetch("/api/v1/blogs?limit=20&sort_by=newest");
        if (!res.ok) throw new Error("Failed to fetch");
        const result: ApiResponse = await res.json();

        if (result.success && result.data.length) {
          // Filter blogs with valid images
          const valid = result.data.filter((b) => {
            const hasValidTitle = b.title && b.title.trim() !== "";
            const hasValidImage = isValidImageUrl(b.image_urls?.main) || 
                                 isValidImageUrl(b.image_urls?.thumbnail) || 
                                 isValidImageUrl(b.imageurl);
            return hasValidTitle && hasValidImage;
          });
          // Take first 4 blogs (reference shows 4)
          setBlogs(valid.slice(0, 4));
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const getBlogImage = (blog: Blog): string => {
    if (blog.image_urls?.main && isValidImageUrl(blog.image_urls.main)) {
      return blog.image_urls.main;
    }
    if (blog.image_urls?.thumbnail && isValidImageUrl(blog.image_urls.thumbnail)) {
      return blog.image_urls.thumbnail;
    }
    if (blog.imageurl && isValidImageUrl(blog.imageurl)) {
      return blog.imageurl;
    }
    return "";
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const navigateToBlog = (slug: string) => {
    // Using /blog instead of /blogs
    router.push(`/blog/${slug}`);
  };

  if (loading) {
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <h2 
            className="text-center text-3xl md:text-4xl text-neutral-900 font-normal mb-12"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Trending Blogs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        {/* Header - Reference style */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-3xl md:text-4xl lg:text-[42px] text-neutral-900 font-normal mb-12 md:mb-16 tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Our Trending Blogs
        </motion.h2>

        {/* Grid - 4 Columns like reference image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {blogs.map((blog, index) => {
            const imageUrl = getBlogImage(blog);
            const displaySlug = blog.slug || blog.seo_slug || String(blog.id);
            
            return (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => navigateToBlog(displaySlug)}
                className="group relative cursor-pointer"
              >
                {/* Image Container - Tall aspect ratio like reference (3:4) */}
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  <img
                    src={imageUrl}
                    alt={blog.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Dark Gradient Overlay - Bottom to Top for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Content Overlay - Positioned at bottom like reference */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    {/* Small uppercase category/date text */}
                    <div className="mb-2 space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/90">
                        {blog.category || "Design Trends"}
                      </p>
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/70">
                        {formatDate(blog.publish_date || blog.created_at)}
                      </p>
                    </div>
                    
                    {/* Title - Large white text like reference image */}
                    <h3 
                      className="text-white text-xl md:text-2xl lg:text-[26px] font-normal leading-tight"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {blog.title}
                    </h3>
                  </div>

                  {/* Hover arrow indicator */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <FiArrowRight className="text-white" size={18} />
                    </div>
                  </div>
                </div>

                {/* Optional subtitle below image - minimal like reference */}
                <div className="mt-4 space-y-1">
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    {blog.writer || blog.author || "By Admin"}
                  </p>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {blog.descriptions ? blog.descriptions.replace(/<[^>]*>/g, '').substring(0, 80) + "..." : "Read more about this article..."}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* View All Button - Minimal outlined style, URL changed to /blog */}
        {blogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-12 md:mt-16"
          >
            <button
              onClick={() => router.push("/blog")} // Changed from /blogs to /blog
              className="group px-8 py-3 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-300 text-[11px] font-medium uppercase tracking-[0.2em]"
            >
              View All Blogs
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500">No blogs available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}