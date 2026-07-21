"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Loader2,
  MapPin,
  Plus,
  Phone,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Play,
  Grid3x3,
  Map as MapIcon,
  Bath,
  Maximize,
  BedDouble,
  Star,
  Eye,
  Copy,
  TrendingUp,
  Clock,
  Award,
  Globe,
  Home,
} from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";

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

interface Property {
  id: number;
  name: string;
  slug: string;
  location: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  images: string[];
  featured: boolean;
  listing_type: string;
  property_type: string;
  developer: string;
  completion_date: string;
  description: string;
  amenities: string[];
  isPriceOnRequest: boolean;
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────

const DUMMY_PROPERTIES: Property[] = [
  {
    id: 1,
    name: "Palm Jumeirah Beachfront Villa",
    slug: "palm-jumeirah-beachfront-villa",
    location: "Palm Jumeirah",
    city: "Dubai",
    country: "UAE",
    price: 15000000,
    currency: "AED",
    bedrooms: 6,
    bathrooms: 8,
    area: 12000,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    ],
    featured: true,
    listing_type: "Resale",
    property_type: "Villa",
    developer: "Nakheel",
    completion_date: "2024-12",
    description: "Luxurious beachfront villa with private beach access, infinity pool, and panoramic sea views.",
    amenities: ["Private Beach", "Infinity Pool", "Home Cinema", "Gym", "Spa", "Smart Home"],
    isPriceOnRequest: false,
  },
  {
    id: 2,
    name: "Central Park Penthouse",
    slug: "central-park-penthouse",
    location: "Manhattan",
    city: "New York",
    country: "USA",
    price: 8500000,
    currency: "USD",
    bedrooms: 4,
    bathrooms: 5,
    area: 4500,
    image: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    featured: true,
    listing_type: "Resale",
    property_type: "Penthouse",
    developer: "Extell Development",
    completion_date: "2023-06",
    description: "Stunning penthouse with Central Park views, private terrace, and world-class amenities in the heart of Manhattan.",
    amenities: ["Central Park Views", "Private Terrace", "Concierge", "Fitness Center", "Pool", "Wine Cellar"],
    isPriceOnRequest: false,
  },
  {
    id: 3,
    name: "Knightsbridge Luxury Apartment",
    slug: "knightsbridge-luxury-apartment",
    location: "Knightsbridge",
    city: "London",
    country: "UK",
    price: 3200000,
    currency: "GBP",
    bedrooms: 3,
    bathrooms: 3,
    area: 1800,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
    ],
    featured: false,
    listing_type: "Resale",
    property_type: "Apartment",
    developer: "Candy & Candy",
    completion_date: "2023-09",
    description: "Elegant apartment in the heart of Knightsbridge, near Harrods, with premium finishes and concierge service.",
    amenities: ["Concierge", "Security", "Gym", "Parking", "Elevator", "24/7 Security"],
    isPriceOnRequest: false,
  },
  {
    id: 4,
    name: "French Riviera Villa",
    slug: "french-riviera-villa",
    location: "Saint-Tropez",
    city: "Côte d'Azur",
    country: "France",
    price: 12000000,
    currency: "EUR",
    bedrooms: 5,
    bathrooms: 6,
    area: 8000,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    ],
    featured: true,
    listing_type: "Resale",
    property_type: "Villa",
    developer: "Groupe Bernard",
    completion_date: "2024-03",
    description: "Mediterranean villa with sea views, private pool, and lush gardens in the exclusive Saint-Tropez area.",
    amenities: ["Sea Views", "Private Pool", "Garden", "Tennis Court", "Staff Quarters", "Garage"],
    isPriceOnRequest: false,
  },
  {
    id: 5,
    name: "Lake Como Waterfront Estate",
    slug: "lake-como-waterfront-estate",
    location: "Lake Como",
    city: "Como",
    country: "Italy",
    price: 9500000,
    currency: "EUR",
    bedrooms: 6,
    bathrooms: 7,
    area: 10000,
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    ],
    featured: false,
    listing_type: "Resale",
    property_type: "Villa",
    developer: "Private",
    completion_date: "2023-12",
    description: "Historic estate on the shores of Lake Como with private dock, gardens, and breathtaking mountain views.",
    amenities: ["Private Dock", "Lake Views", "Gardens", "Pool", "Wine Cellar", "Chapel"],
    isPriceOnRequest: true,
  },
  {
    id: 6,
    name: "Barcelona Beachfront Apartment",
    slug: "barcelona-beachfront-apartment",
    location: "Barceloneta",
    city: "Barcelona",
    country: "Spain",
    price: 2800000,
    currency: "EUR",
    bedrooms: 3,
    bathrooms: 3,
    area: 1600,
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    featured: false,
    listing_type: "Off plan",
    property_type: "Apartment",
    developer: "Barcelona Developments",
    completion_date: "2025-06",
    description: "Modern beachfront apartment with panoramic sea views, direct beach access, and premium amenities.",
    amenities: ["Beach Access", "Sea Views", "Pool", "Gym", "Concierge", "Parking"],
    isPriceOnRequest: false,
  },
  {
    id: 7,
    name: "Sydney Opera House View Penthouse",
    slug: "sydney-opera-house-view-penthouse",
    location: "Circular Quay",
    city: "Sydney",
    country: "Australia",
    price: 7200000,
    currency: "AUD",
    bedrooms: 4,
    bathrooms: 4,
    area: 3800,
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    featured: true,
    listing_type: "Resale",
    property_type: "Penthouse",
    developer: "Lendlease",
    completion_date: "2024-09",
    description: "Iconic penthouse with unobstructed Opera House and Harbour Bridge views, private lift and rooftop terrace.",
    amenities: ["Opera House Views", "Rooftop Terrace", "Private Lift", "Concierge", "Pool", "Gym"],
    isPriceOnRequest: false,
  },
  {
    id: 8,
    name: "Marina Bay Sands Residence",
    slug: "marina-bay-sands-residence",
    location: "Marina Bay",
    city: "Singapore",
    country: "Singapore",
    price: 15000000,
    currency: "SGD",
    bedrooms: 5,
    bathrooms: 6,
    area: 5500,
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    featured: false,
    listing_type: "Resale",
    property_type: "Penthouse",
    developer: "Marina Bay Sands",
    completion_date: "2023-03",
    description: "Ultra-luxury residence in Singapore's iconic Marina Bay Sands with skyline views and world-class amenities.",
    amenities: ["Skyline Views", "Infinity Pool", "Concierge", "Spa", "Fitness Center", "Private Cinema"],
    isPriceOnRequest: false,
  },
  {
    id: 9,
    name: "Beverly Hills Mansion",
    slug: "beverly-hills-mansion",
    location: "Beverly Hills",
    city: "Los Angeles",
    country: "USA",
    price: 25000000,
    currency: "USD",
    bedrooms: 7,
    bathrooms: 9,
    area: 15000,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    ],
    featured: true,
    listing_type: "Resale",
    property_type: "Villa",
    developer: "Private",
    completion_date: "2022-06",
    description: "Spectacular Beverly Hills mansion with panoramic city views, home theater, wine cellar, and resort-style pool.",
    amenities: ["City Views", "Home Theater", "Wine Cellar", "Pool", "Tennis Court", "Guest House"],
    isPriceOnRequest: false,
  },
  {
    id: 10,
    name: "Dubai Marina Sky Villa",
    slug: "dubai-marina-sky-villa",
    location: "Dubai Marina",
    city: "Dubai",
    country: "UAE",
    price: 8500000,
    currency: "AED",
    bedrooms: 4,
    bathrooms: 5,
    area: 4200,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
    ],
    featured: false,
    listing_type: "Off plan",
    property_type: "Villa",
    developer: "Emaar",
    completion_date: "2026-01",
    description: "Exclusive sky villa in Dubai Marina with stunning water views, private pool, and premium finishes.",
    amenities: ["Marina Views", "Private Pool", "Smart Home", "Concierge", "Gym", "Parking"],
    isPriceOnRequest: false,
  },
];

const DUMMY_PROPERTIES_EXTENDED: Property[] = [
  ...DUMMY_PROPERTIES,
  ...DUMMY_PROPERTIES.slice(0, 6).map((p, i) => ({
    ...p,
    id: i + 100,
    slug: p.slug + "-" + (i + 1),
  })),
];

function getPropertyBySlug(slug: string): Property | null {
  let found = DUMMY_PROPERTIES_EXTENDED.find(p => p.slug === slug);
  if (found) return found;
  found = DUMMY_PROPERTIES.find(p => p.slug === slug);
  if (found) return found;
  const baseSlug = slug.replace(/-\d+$/, '');
  found = DUMMY_PROPERTIES.find(p => p.slug === baseSlug);
  if (found) return found;
  return null;
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    UAE: "🇦🇪",
    USA: "🇺🇸",
    UK: "🇬🇧",
    France: "🇫🇷",
    Italy: "🇮🇹",
    Spain: "🇪🇸",
    Australia: "🇦🇺",
    Singapore: "🇸🇬",
  };
  return flags[country] || "🌍";
}

function formatPrice(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── LOADER ───────────────────────────────────────────────────────────────

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
          Loading Global Property
        </motion.p>
      </div>
    </div>
  );
}

// ─── GALLERY MODAL ──────────────────────────────────────────────────────

function GalleryModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const thumbsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentIndex] as HTMLElement;
    activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/97"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-[11px] tracking-[0.2em] text-white/50">
          {currentIndex + 1} <span className="text-white/25">/</span> {images.length}
        </span>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-16">
        <button
          onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-105"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <AnimatePresence mode="sync">
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            src={images[currentIndex]}
            alt={`Photo ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain"
          />
        </AnimatePresence>

        <button
          onClick={() => onNavigate((currentIndex + 1) % images.length)}
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-105"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="pb-6 pt-4">
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                i === currentIndex
                  ? "ring-2 ring-white opacity-100 scale-105"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── PROPERTY MAP ──────────────────────────────────────────────────────

function PropertyMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50">
        <MapIcon className="h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm text-gray-400">Map unavailable</p>
      </div>
    );
  }
  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`}
      allowFullScreen
      onError={() => setErr(true)}
    />
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function GlobalPropertyDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setTimeout(() => {
      const found = getPropertyBySlug(slug);
      if (found) {
        setProperty(found);
      } else {
        setError("Property not found");
      }
      setLoading(false);
    }, 600);
  }, [slug]);

  useEffect(() => {
    if (!property) return;
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist_global") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem("property_wishlist_global") || "[]");
        const updated = next
          ? [...saved, property.id]
          : saved.filter((id: number) => id !== property.id);
        localStorage.setItem("property_wishlist_global", JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [property]);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    return property.images || [property.image];
  }, [property]);

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <Globe className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-red-500 mb-6">{error || "Global property not found"}</p>
          <Link
            href="/global-properties-for-sale"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Global Properties
          </Link>
        </div>
      </div>
    );
  }

  const isPriceOnRequest = property.isPriceOnRequest || !property.price;
  const priceDisplay = property.isPriceOnRequest ? "Price on Request" : formatPrice(property.price, property.currency);

  const specs = [
    { icon: BedDouble, label: `${property.bedrooms} Bed${property.bedrooms > 1 ? 's' : ''}` },
    { icon: Bath, label: `${property.bathrooms} Bath${property.bathrooms > 1 ? 's' : ''}` },
    { icon: Maximize, label: `${property.area.toLocaleString()} sq.ft.` },
  ];

  const similarProperties = DUMMY_PROPERTIES
    .filter(p => p.id !== property.id && p.country === property.country)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/global-properties-for-sale" className="hover:text-gray-600 transition-colors">
                Global Properties
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {property.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleWishlist}
                className={`flex h-9 w-9 items-center justify-center border transition-all ${
                  isWishlisted
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })}
                className="hidden sm:flex items-center gap-2 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Property Header */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.featured && (
                <span
                  className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                  style={{ backgroundColor: THEME.accent }}
                >
                  Featured
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-gray-100 text-gray-700 border border-gray-200">
                <Globe className="h-2.5 w-2.5" />
                {property.country} {getCountryFlag(property.country)}
              </span>
              {property.listing_type && (
                <span className={`px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] border ${
                  property.listing_type === "Off plan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {property.listing_type}
                </span>
              )}
              {property.property_type && (
                <span className="px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-purple-50 text-purple-700 border border-purple-200">
                  {property.property_type}
                </span>
              )}
              {property.completion_date && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-orange-50 text-orange-700 border border-orange-200">
                  <Calendar className="h-2.5 w-2.5" />
                  Completion: {property.completion_date}
                </span>
              )}
            </div>

            <h1
              className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {property.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{property.location}, {property.city}, {property.country}</span>
                <span className="ml-1">{getCountryFlag(property.country)}</span>
              </div>
            </div>

            {property.developer && (
              <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: THEME.muted }}>
                <Building2 className="h-3.5 w-3.5" />
                <span>by {property.developer}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              Price
            </p>
            <p
              className="text-[26px] sm:text-[32px] font-light leading-none"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
            {!isPriceOnRequest && property.currency && (
              <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: THEME.muted }}>
                {property.currency}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {specs.map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2"
              style={{ borderColor: THEME.border }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div
          className="relative overflow-hidden bg-gray-100 aspect-[16/9] group cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <AnimatePresence mode="sync">
            {galleryImages.length > 0 ? (
              <motion.img
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={galleryImages[activeIndex]}
                alt={property.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex gap-2">
            {galleryImages.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 bg-white/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-800 backdrop-blur-sm transition-colors hover:bg-white"
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                All Photos ({galleryImages.length})
              </button>
            )}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-[3px] bg-black/50 px-3 py-1.5 text-[9px] uppercase tracking-widest text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
            View Gallery
          </div>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % galleryImages.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(showAllPhotos ? galleryImages : galleryImages.slice(0, 10)).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                    i === activeIndex ? "opacity-100" : "opacity-50 hover:opacity-80"
                  }`}
                  style={
                    i === activeIndex
                      ? { outline: `2px solid ${THEME.primary}`, outlineOffset: "-1px" }
                      : {}
                  }
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
              {!showAllPhotos && galleryImages.length > 10 && (
                <button
                  onClick={() => setShowAllPhotos(true)}
                  className="flex h-16 w-24 flex-shrink-0 items-center justify-center border text-[9px] uppercase tracking-widest transition-colors hover:bg-gray-50"
                  style={{ borderColor: THEME.border, color: THEME.muted }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {galleryImages.length - 10}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left Column */}
          <div>
            <div className="flex border-b mb-8" style={{ borderColor: THEME.border }}>
              {["overview", "amenities"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
                    "border-current"
                  }`}
                  style={{ color: THEME.primary, borderColor: THEME.primary }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div>
              <h2
                className="text-[20px] sm:text-[24px] leading-snug mb-4"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {property.name}
              </h2>

              <p className="text-[13px] leading-relaxed" style={{ color: "#4A5462" }}>
                {property.description}
              </p>

              <div
                className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3"
                style={{ borderColor: THEME.border }}
              >
                {[
                  { label: "Property Type", value: property.property_type },
                  { label: "Listing Type", value: property.listing_type },
                  { label: "Bedrooms", value: `${property.bedrooms}` },
                  { label: "Bathrooms", value: `${property.bathrooms}` },
                  { label: "Area", value: `${property.area.toLocaleString()} sq.ft.` },
                  { label: "Country", value: `${property.country} ${getCountryFlag(property.country)}` },
                  { label: "City", value: property.city },
                  { label: "Location", value: property.location },
                  { label: "Developer", value: property.developer },
                  { label: "Completion", value: property.completion_date },
                ]
                  .filter((item) => item.value)
                  .map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: THEME.muted }}>
                        {label}
                      </p>
                      <p className="text-[12px] font-medium" style={{ color: THEME.primary }}>
                        {value}
                      </p>
                    </div>
                  ))}
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-4" style={{ color: THEME.muted }}>
                    Amenities
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities.map((amenity, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 border rounded-[3px] px-4 py-3"
                        style={{ borderColor: THEME.border }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: THEME.accent }}
                        />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column - Enquiry Form ── */}
          <aside id="enquiry">
            <div className="sticky top-6">
              {/* ✅ Updated EnquiryForm with proper props */}
              <EnquiryForm
                propertyName={property.name}
                refNumber={`GLOBAL-${property.id}`}
                propertyId={property.id}
                agentId={null}
                agentName="Global Property Agent"
                agentPhone="+971 50 259 0071"
                agentPhoto={null}
                agentEmail="global@acasa.ae"
                listingType={property.listing_type || "For Sale"}
                whatsappNumber="971502590071"
              />

              <a
                href="https://wa.me/971502590071"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.primary }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>

              <Link
                href="/global-properties-for-sale"
                className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-gray-50"
                style={{ borderColor: THEME.border, color: THEME.muted }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Global Properties
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <div className="mx-auto max-w-[1180px] px-4 pb-16 md:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: THEME.accent }}>
                Explore More
              </p>
              <h2 className="text-[28px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                Similar Properties in {property.country}
              </h2>
            </div>
            <Link
              href="/global-properties-for-sale"
              className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-70 sm:flex"
              style={{ color: THEME.primary }}
            >
              View All
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {similarProperties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onClick={() => router.push(`/global-properties-for-sale/${p.slug}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {p.featured && (
                    <span
                      className="absolute left-0 top-3 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white"
                      style={{ backgroundColor: THEME.accent }}
                    >
                      Featured
                    </span>
                  )}
                  <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[9px] text-white backdrop-blur-sm">
                    {getCountryFlag(p.country)}
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <h3
                    className="truncate text-[13px] uppercase tracking-wide transition-colors group-hover:text-[#C9A96E]"
                    style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
                  >
                    {p.name}
                  </h3>
                  <p className="flex items-center gap-1 text-[11px]" style={{ color: THEME.muted }}>
                    <MapPin className="h-3 w-3" />
                    {p.location}, {p.city}
                  </p>
                  <p className="text-[13px] font-semibold" style={{ color: THEME.primary }}>
                    {p.isPriceOnRequest ? "On Request" : formatPrice(p.price, p.currency)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: THEME.muted }}>
                    <span>{p.bedrooms} Bed{p.bedrooms > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{p.bathrooms} Bath{p.bathrooms > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{p.area.toLocaleString()} sq.ft.</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <AnimatePresence>
        {showModal && (
          <GalleryModal
            images={galleryImages}
            currentIndex={activeIndex}
            onClose={() => setShowModal(false)}
            onNavigate={setActiveIndex}
          />
        )}
      </AnimatePresence>

      {/* Mobile CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden"
        style={{ borderColor: THEME.border }}
      >
        <div className="flex gap-2">
          <a
            href="https://wa.me/971502590071"
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-colors hover:bg-emerald-50"
            style={{ borderColor: "#10b981" }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-1 items-center justify-center py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white"
            style={{ backgroundColor: THEME.primary }}
          >
            Enquire Now
          </button>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}