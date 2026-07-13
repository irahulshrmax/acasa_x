"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineHomeModern,
  HiOutlinePencilSquare,     // ✅ Replaced HiOutlineRulerSquare
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
} from "react-icons/hi2";

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

interface SearchDetail {
  id: number;
  property_name?: string;
  name?: string;
  property_slug?: string;
  slug?: string;
  listing_type: string;
  price: string | null;
  bedroom: string | null;
  bathrooms: string | null;
  area: string | null;
  featured_image: string | null;
  image_url?: string | null;
  image_fallbacks?: string[];
  location: string | null;
  developer_name: string | null;
  description: string | null;
  completion_date: string | null;
  occupancy: string | null;
  property_type: string | null;
  furnishing: string | null;
  parking: string | null;
  rera_number: string | null;
  dld_permit: string | null;
  video_url: string | null;
  amenities: string | null;
  result_type: 'property' | 'project';
}

function formatPriceFull(price: string | null): string {
  if (!price) return "Price on Request";
  const num = parseInt(price);
  if (isNaN(num)) return "Price on Request";
  return `AED ${num.toLocaleString()}`;
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return "Studio Apartment";
  if (bedroom.toLowerCase().includes("studio")) return "Studio Apartment";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio Apartment";
    if (num === 1) return "1 Bedroom";
    return `${num} Bedrooms`;
  }
  return bedroom;
}

function getUnsplashFallback(name?: string | null): string {
  const query = encodeURIComponent(name || "property dubai");
  return `https://source.unsplash.com/1200x800/?${query},real-estate`;
}

function formatHandoverDate(date?: string | null): string {
  if (!date) return "Ready to move";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch { return date; }
}

function getOccupancyLabel(occupancy: string | null): string {
  if (!occupancy) return "Available";
  const map: Record<string, string> = {
    "under construction": "Under Construction",
    "ready to move": "Ready to Move",
    vacant: "Vacant",
  };
  return map[occupancy.toLowerCase()] || occupancy;
}

// ─── FULL PAGE LOADER ───────────────────────────────────────────────────

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(200,170,120,0.15)]" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C8AA78] border-r-[#C8AA78]"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[8px] rounded-full border-2 border-transparent border-b-[#192334] border-l-[#192334]"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gray-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Details
        </motion.p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function SearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [item, setItem] = useState<SearchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!slug) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/search?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Not found");
        setItem(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchDetail();
    }
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    try {
      const saved = JSON.parse(localStorage.getItem("search_wishlist") || "[]");
      setLiked(saved.includes(item.id));
    } catch { /* ignore */ }
  }, [item]);

  const toggleWishlist = () => {
    if (!item) return;
    setLiked((prev) => {
      const newVal = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("search_wishlist") || "[]");
        const updated = newVal ? [...saved, item.id] : saved.filter((id: number) => id !== item.id);
        localStorage.setItem("search_wishlist", JSON.stringify(updated));
      } catch { /* ignore */ }
      return newVal;
    });
  };

  const handleShare = async () => {
    if (!item) return;
    setShareLoading(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.property_name || item.name || "Property", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
    } catch { /* ignore */ }
    setShareLoading(false);
  };

  const amenitiesList = item?.amenities?.split(",").filter(Boolean).map((a) => a.trim()) || [];

  if (loading) return <FullPageLoader />;

  if (error || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <HiOutlineBuildingOffice2 className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-3xl text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">{error || "This item doesn't exist."}</p>
          <Link href="/search" className="mt-6 inline-flex items-center gap-2 bg-[#192334] px-6 py-2.5 text-[11px] tracking-widest text-white hover:bg-[#2a3a4a]">
            <HiOutlineArrowLeft className="h-4 w-4" /> BACK TO SEARCH
          </Link>
        </div>
      </div>
    );
  }

  const isProperty = item.result_type === 'property';
  const name = isProperty ? item.property_name : item.name;
  const location = item.location || "Dubai";
  const bedroomLabel = getBedroomDisplay(item.bedroom);
  const bathroomCount = item.bathrooms || "1";
  const area = item.area || "N/A";
  const occupancyLabel = getOccupancyLabel(item.occupancy);
  const handoverDate = item.completion_date;
  const imageUrl = item.image_url || getUnsplashFallback(name);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* ─── HEADER ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#577C8E]">
              {item.listing_type?.toUpperCase() || "PROPERTY"}
            </p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-[26px] leading-tight text-[#192334] sm:text-[32px]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {name}
            </motion.h1>
            {location && (
              <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                <HiOutlineMapPin className="h-3.5 w-3.5" /> {location}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
              {isProperty && (
                <>
                  <span>{bedroomLabel}</span>
                  <span className="text-gray-300">|</span>
                  <span>{bathroomCount} Bath</span>
                  <span className="text-gray-300">|</span>
                  <span>{area} sq.ft</span>
                </>
              )}
              {!isProperty && <span>Project</span>}
              {handoverDate && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Handover: {formatHandoverDate(handoverDate)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleWishlist}
              className={`flex h-9 w-9 items-center justify-center border transition-colors ${
                liked ? "border-red-500 bg-red-500 text-white" : "border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
              }`}
            >
              {liked ? <HiHeart className="h-4 w-4" /> : <HiOutlineHeart className="h-4 w-4" />}
            </button>
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="flex h-9 w-9 items-center justify-center border border-gray-300 text-gray-600 hover:border-[#192334] hover:text-[#192334] disabled:cursor-wait"
            >
              {shareLoading ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" /> : <HiOutlineShare className="h-4 w-4" />}
            </button>
            <Link href={`/search?q=${encodeURIComponent(location)}`} className="bg-[#192334] px-6 py-2.5 text-[10px] tracking-widest text-white hover:bg-[#2a3a4a]">
              SIMILAR
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1180px] px-4 pb-10 md:px-6">
        {/* Hero Image */}
        <section className="pt-6">
          <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={name || "Property"}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = getUnsplashFallback(name); }}
            />
            <span className="absolute left-0 top-4 bg-[#192334] px-4 py-1.5 text-[9px] font-medium tracking-[0.2em] text-white">
              {item.listing_type?.toUpperCase() || "PROPERTY"}
            </span>
          </div>
        </section>

        {/* Details + Form */}
        <section className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="text-[20px] leading-tight text-[#192334] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY }}>
              {isProperty ? `${bedroomLabel} in ${name}` : `About ${name}`}
              {isProperty && item.developer_name && ` by ${item.developer_name}`}
            </h2>

            {/* Highlights */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="border border-gray-100 p-4 text-center">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Status</p>
                <p className="mt-1 text-[13px] font-medium text-[#192334]">{occupancyLabel}</p>
              </div>
              {handoverDate && (
                <div className="border border-gray-100 p-4 text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Completion</p>
                  <p className="mt-1 text-[13px] font-medium text-[#192334]">{formatHandoverDate(handoverDate)}</p>
                </div>
              )}
              {isProperty && item.price && (
                <div className="border border-gray-100 p-4 text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">Price</p>
                  <p className="mt-1 text-[13px] font-medium text-[#192334]">{formatPriceFull(item.price)}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {item.description ? (
              <div className="mt-8 text-[13px] leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: item.description }} />
            ) : (
              <div className="mt-8 text-[13px] leading-relaxed text-gray-600">
                <p>Discover {name} in {location}. This {isProperty ? bedroomLabel.toLowerCase() : "project"} offers premium quality and exceptional living experience.</p>
              </div>
            )}

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div className="mt-10">
                <h3 className="text-[24px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>Amenities</h3>
                <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {amenitiesList.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#192334]" /> {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Features */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <HiOutlineBuildingOffice2 className="h-4 w-4 text-[#577C8E]" />
                <span>{isProperty ? item.listing_type || "Property" : "Project"}</span>
              </div>
              {isProperty && (
                <>
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <HiOutlineHomeModern className="h-4 w-4 text-[#577C8E]" />   {/* ✅ Replaced HiOutlineBed */}
                    <span>{bedroomLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <HiOutlinePencilSquare className="h-4 w-4 text-[#577C8E]" />   {/* ✅ Replaced HiOutlineRulerSquare */}
                    <span>{area} sq.ft</span>
                  </div>
                </>
              )}
              {item.developer_name && (
                <div className="flex items-center gap-2 text-[12px] text-gray-600">
                  <span className="text-[#577C8E]">🏗️</span>
                  <span className="truncate">{item.developer_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enquiry Form */}
          <aside className="sticky top-6 border border-gray-200 bg-white p-6">
            <h3 className="mb-5 text-[17px] text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>
              Request Information
            </h3>
            <p className="text-sm text-gray-500">Interested in this {isProperty ? "property" : "project"}?</p>
            <Link
              href={`/contact?subject=${encodeURIComponent(name || "Property")}`}
              className="mt-4 block w-full bg-[#192334] py-3 text-center text-[11px] tracking-widest text-white hover:bg-[#2a3a4a] transition-colors"
            >
              CONTACT US
            </Link>
            <div className="mt-3 text-center text-[10px] text-gray-400">
              Ref: {isProperty ? `PR-${item.id}` : `PJ-${item.id}`}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}