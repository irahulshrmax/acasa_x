"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ExternalLink } from "lucide-react";

interface PressRelease {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  publish_date: string;
  author: string | null;
  image_url: string | null;
  featured_image: string | null;
}

export default function PressPage() {
  const [press, setPress] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/press")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPress(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="bg-white min-h-screen py-20">
        <div className="mx-auto max-w-[1460px] px-6 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#577C8E] border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading press releases...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white min-h-screen py-12 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center md:mb-16">
          <p className="mb-3 uppercase text-[#577C8E] text-[11px] tracking-[0.16em]">
            In the News
          </p>
          <h1 className="font-playfair text-[32px] uppercase tracking-[-0.5px] text-[#1a2233] md:text-[42px]">
            Press & Media
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[13px] text-[#1a2233]/60">
            Latest news, announcements, and market updates from Acasa
          </p>
          <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-[#577C8E] to-transparent" />
        </div>

        {press.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl opacity-20">📰</div>
            <h3 className="font-playfair text-[22px] text-[#1a2233]">No press releases yet</h3>
            <p className="mt-2 text-[13px] text-[#1a2233]/50">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {press.map((item) => (
              <Link
                key={item.id}
                href={`/press/${item.slug}`}
                className="group block overflow-hidden rounded-xl border border-[#1a2233]/10 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f5f1ec]">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ExternalLink className="h-10 w-10 text-[#1a2233]/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="p-5">
                  <span className="inline-block text-[9px] uppercase tracking-[0.14em] text-[#577C8E]">
                    Press Release
                  </span>
                  <h3 className="mt-2 font-playfair text-[15px] font-semibold uppercase tracking-[0.02em] text-[#1a2233] line-clamp-2 group-hover:text-[#577C8E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#1a2233]/60 line-clamp-3">
                    {item.excerpt?.replace(/<[^>]*>/g, "").substring(0, 120)}...
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-[10px] text-[#1a2233]/40">
                    {item.publish_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.publish_date)}
                      </span>
                    )}
                    {item.author && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.author}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border border-[#1a2233]/40 px-6 py-2.5 text-[10px] uppercase tracking-[0.14em] text-[#1a2233] transition-all hover:border-[#1a2233] hover:bg-[#1a2233] hover:text-white"
          >
            View All News →
          </Link>
        </div>
      </div>
    </section>
  );
}