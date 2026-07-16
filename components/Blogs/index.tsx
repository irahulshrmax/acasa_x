"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Blog {
  id: number;
  title: string;
  slug: string;
  category: string;
  imageurl: string | null;
  image_urls?: {
    main: string;
    thumbnail: string;
    medium: string;
    variations: string[];
  };
  descriptions?: string;
  excerpt?: string;
  writer?: string | null;
  publish_date?: string | null;
}

export default function BlogsSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    console.log("🔍 [BlogsSection] fetchBlogs STARTED");
    setLoading(true);

    try {
      const url = "/api/v1/blogs?page=1&limit=4&status=1&sort_by=newest";
      console.log("📡 [BlogsSection] API URL:", url);

      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 [BlogsSection] API Response:", data);

      if (data.success && data.data) {
        console.log("✅ [BlogsSection] Blogs received:", data.data.length);
        data.data.forEach((blog: Blog, i: number) => {
          console.log(`📸 Blog ${i+1}:`, {
            id: blog.id,
            title: blog.title,
            imageurl: blog.imageurl,
            image_urls_main: blog.image_urls?.main,
          });
        });
        setBlogs(data.data);
      } else {
        setError("Failed to load blogs");
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getImageUrl(blog: Blog): string {
    console.log(`🖼️ Blog ${blog.id} image check:`);
    
    // ✅ Try image_urls.main first
    if (blog.image_urls?.main) {
      console.log(`  ✅ Using image_urls.main: ${blog.image_urls.main}`);
      return blog.image_urls.main;
    }
    
    // ✅ Try imageurl
    if (blog.imageurl) {
      const url = blog.imageurl.startsWith('http') 
        ? blog.imageurl 
        : `https://acasa.ae/upload/blogs/${blog.imageurl}.webp`;
      console.log(`  ✅ Using imageurl: ${url}`);
      return url;
    }
    
    // ✅ Fallback to Unsplash placeholder
    console.log(`  ❌ No image, using placeholder`);
    return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop";
  }

  if (loading) return <div>Loading blogs...</div>;
  if (error) return <div>Error: {error} <button onClick={fetchBlogs}>Retry</button></div>;

  console.log("📋 [BlogsSection] Rendering", blogs.length, "blogs");

  return (
    <div style={{ padding: "20px" }}>
      <h2>Our Trending Blogs</h2>
      <p>{blogs.length} blogs loaded</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
        {blogs.slice(0, 4).map((blog) => {
          const imageUrl = getImageUrl(blog);
          console.log(`📷 Blog ${blog.id} final image: ${imageUrl}`);
          
          return (
            <Link 
              key={blog.id} 
              href={`/blog/${blog.slug}`}
              style={{ textDecoration: "none", color: "black", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", display: "block" }}
            >
              <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#f0f0f0" }}>
                <img
                  src={imageUrl}
                  alt={blog.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onLoad={() => console.log(`✅ Image ${blog.id} loaded`)}
                  onError={(e) => {
                    console.log(`❌ Image ${blog.id} FAILED:`, imageUrl);
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop";
                  }}
                />
              </div>
              <div style={{ padding: "12px" }}>
                <h3 style={{ fontSize: "16px" }}>{blog.title}</h3>
                {blog.category && <span style={{ background: "#eee", padding: "2px 8px", fontSize: "12px" }}>{blog.category}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}