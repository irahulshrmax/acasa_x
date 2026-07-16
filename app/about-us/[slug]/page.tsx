"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineUserGroup,
} from "react-icons/hi2";

interface AboutData {
  id: number;
  title: string;
  slug: string;
  heading: string | null;
  imageurl: string | null;
  descriptions: string | null;
  descriptions_other: string | null;
  enable_modules: string | null;
  seo_title: string | null;
  seo_keywork: string | null;
  seo_description: string | null;
  status: number;
  image_url?: string;
  image_variations?: string[];
}

function getImageUrl(image: string | null | undefined): string {
  if (!image || image.includes('no-image')) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffc?w=1200&h=800&fit=crop&q=80";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `https://acasa.ae${image}`;
  }

  if (image.startsWith("upload/")) {
    return `https://acasa.ae/${image}`;
  }

  return `https://acasa.ae/upload/about/${image}`;
}

export default function AboutSlugPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchAbout = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/about/${slug}`);
        const data = await response.json();

        if (data?.success) {
          setAbout(data.data);
        } else {
          throw new Error(data?.message || "Page not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchAbout();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-[300px] bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !about) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl text-[#192334]">Page Not Found</h1>
          <p className="mt-3 text-gray-500">{error || "This page doesn't exist."}</p>
          <Link
            href="/"
            className="mt-6 inline-block bg-[#192334] px-8 py-3 text-white"
          >
            GO BACK HOME
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = getImageUrl(about.imageurl || about.image_url);
  const stats = [
    { label: "Properties", value: "2,500+", icon: HiOutlineBuildingOffice2 },
    { label: "Clients", value: "3,200+", icon: HiOutlineUserGroup },
    { label: "Years", value: "15+", icon: HiOutlineCalendar },
    { label: "Locations", value: "25+", icon: HiOutlineMapPin },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/about-us"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#192334] transition mb-6"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to About
        </Link>

        <h1
          className="text-4xl text-[#192334] sm:text-5xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {about.title}
        </h1>

        {about.seo_description && (
          <p className="mt-4 max-w-2xl text-gray-600">{about.seo_description}</p>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl">
          <img
            src={heroImage}
            alt={about.title}
            className="h-[300px] w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffc?w=1200&h=800&fit=crop&q=80";
            }}
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <stat.icon className="mx-auto h-6 w-6 text-[#5B7FBF]" />
              <p className="mt-2 text-2xl font-bold text-[#192334]">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {about.descriptions && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500">Main</p>
              <div
                className="mt-4 text-sm leading-relaxed text-gray-700 [&>p]:mb-4"
                dangerouslySetInnerHTML={{ __html: about.descriptions }}
              />
            </div>
          )}

          {about.descriptions_other && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500">Additional</p>
              <div
                className="mt-4 text-sm leading-relaxed text-gray-700 [&>p]:mb-4"
                dangerouslySetInnerHTML={{ __html: about.descriptions_other }}
              />
            </div>
          )}
        </div>

        {(about.seo_title || about.seo_keywork || about.seo_description) && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-xs uppercase tracking-widest text-gray-500">SEO Info</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              {about.seo_title && (
                <p><span className="font-semibold">Title:</span> {about.seo_title}</p>
              )}
              {about.seo_keywork && (
                <p><span className="font-semibold">Keywords:</span> {about.seo_keywork}</p>
              )}
              {about.seo_description && (
                <p><span className="font-semibold">Description:</span> {about.seo_description}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-[#192334] px-8 py-3 text-white transition hover:opacity-90"
          >
            GO BACK HOME
          </Link>
        </div>
      </div>
    </div>
  );
}