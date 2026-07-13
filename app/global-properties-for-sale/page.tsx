"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  MapPin,
  ArrowRight,
  X,
  DollarSign,
  Layers,
  Sparkles,
  Grid3x3,
  List,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Heart,
  Eye,
  ImageOff,
  TrendingUp,
  Clock,
  Shield,
  Home,
  Filter,
  Award,
  Globe,
} from "lucide-react";

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

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterOption {
  value: string;
  label: string;
}

const BEDROOM_OPTIONS: FilterOption[] = [
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
  { value: "6", label: "6 Bedrooms" },
];

const PRICE_OPTIONS: FilterOption[] = [
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-1000000", label: "$500K - $1M" },
  { value: "1000000-2000000", label: "$1M - $2M" },
  { value: "2000000-5000000", label: "$2M - $5M" },
  { value: "5000000-10000000", label: "$5M - $10M" },
  { value: "10000000-999999999", label: "$10M+" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PROPERTY_TYPE_OPTIONS: FilterOption[] = [
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Land", label: "Land" },
];

const COUNTRY_OPTIONS: FilterOption[] = [
  { value: "UAE", label: "UAE" },
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Australia", label: "Australia" },
  { value: "Singapore", label: "Singapore" },
];

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

const DUMMY_PROPERTIES_EXTENDED = [...DUMMY_PROPERTIES, ...DUMMY_PROPERTIES.slice(0, 6)].map((p, i) => ({
  ...p,
  id: i + 1,
  slug: p.slug + "-" + (i + 1),
}));

function getPropertyImage(property: Property): string {
  return property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop";
}

function getAllImages(property: Property): string[] {
  return property.images || [property.image];
}

function formatPrice(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

function getDaysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
}

function PropertyCard({ property, viewMode = "grid", index = 0 }: { property: Property; viewMode?: string; index?: number }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isPriceOnRequest = property.isPriceOnRequest || !property.price;
  const priceDisplay = property.isPriceOnRequest ? "Price on Request" : formatPrice(property.price, property.currency);
  const daysAgo = getDaysAgo("2024-01-01");

  const allImages = useMemo(() => getAllImages(property), [property]);
  const hasImages = allImages.length > 0;
  
  const currentImage = useMemo(() => {
    if (imageError || !hasImages) return null;
    return allImages[currentImageIndex % allImages.length];
  }, [allImages, currentImageIndex, imageError, hasImages]);

  const specs = [
    `${property.bedrooms} Bed${property.bedrooms > 1 ? 's' : ''}`,
    `${property.bathrooms} Bath${property.bathrooms > 1 ? 's' : ''}`,
    `${property.area.toLocaleString()} sq.ft.`,
  ].filter(Boolean).join("  |  ");

  const isListMode = viewMode === "list";

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist_global") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist_global") || "[]");
      const updated = isWishlisted 
        ? saved.filter((id: number) => id !== property.id)
        : [...saved, property.id];
      localStorage.setItem("property_wishlist_global", JSON.stringify(updated));
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className={`group bg-white transition-all duration-300 hover:shadow-xl ${
        isListMode ? "flex flex-col sm:flex-row gap-4" : ""
      }`}
      style={{ fontFamily: FONT_BODY }}
    >
      <div className={`relative overflow-hidden bg-gray-100 ${isListMode ? "sm:w-[320px] sm:flex-shrink-0" : "aspect-[4/3]"}`}>
        <Link href={`/global-properties-for-sale/${property.slug}`} className="block h-full w-full">
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt={property.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.slice(0, 5).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIndex % allImages.length
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                  {allImages.length > 5 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">No Image</p>
            </div>
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {property.featured && (
            <span className="rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              Featured
            </span>
          )}
          {property.listing_type && (
            <span className={`rounded-[3px] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white ${
              property.listing_type === "Off plan" ? "bg-emerald-500" : "bg-blue-500"
            }`}>
              {property.listing_type}
            </span>
          )}
          {property.completion_date && (
            <span className="rounded-[3px] bg-purple-500 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              {property.completion_date}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <span className="rounded-[3px] bg-black/60 px-2 py-1 text-[9px] text-white backdrop-blur-sm">
            {getCountryFlag(property.country)}
          </span>
        </div>

        <button
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className={`absolute right-12 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
            isWishlisted
              ? "border-red-500 bg-red-500 text-white shadow-lg"
              : "border-white/50 bg-white/90 text-[#0F1C2E] hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {hasImages && allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[9px] text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {allImages.length}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isListMode ? "py-2 pr-2" : "pt-4"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/global-properties-for-sale/${property.slug}`}>
              <h3
                className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {property.name}
              </h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#6B7A8D]">
              <MapPin className="h-3 w-3" />
              <span>{property.location}, {property.city}</span>
              <span className="ml-1">{getCountryFlag(property.country)}</span>
            </div>
            {property.developer && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6B7A8D]">
                <Building2 className="h-3 w-3" />
                <span>{property.developer}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#6B7A8D]">Price</p>
            <p className="text-[14px] font-bold leading-tight text-[#0F1C2E]">
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
            <p className="text-[10px] text-[#6B7A8D]">{property.currency}</p>
          </div>
        </div>

        <div className="my-3 h-px w-full bg-[#E2E8F0]" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-[11px] text-[#4A5462]">{specs || "\u00A0"}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#6B7A8D]">{daysAgo}</span>
          </div>
        </div>

        {isListMode && property.amenities && property.amenities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {property.amenities.slice(0, 4).map((amenity, i) => (
              <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[8px] text-gray-600">
                {amenity}
              </span>
            ))}
            {property.amenities.length > 4 && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[8px] text-gray-600">
                +{property.amenities.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard({ viewMode = "grid" }: { viewMode?: string }) {
  const isListMode = viewMode === "list";
  return (
    <div className={`bg-white ${isListMode ? "flex flex-col sm:flex-row gap-4" : ""}`}>
      <div className={`animate-pulse bg-gray-200 ${isListMode ? "sm:w-[320px] sm:aspect-[4/3]" : "aspect-[4/3]"}`} />
      <div className={`flex-1 space-y-3 ${isListMode ? "py-2" : "py-4"}`}>
        <div className="flex justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-px w-full bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  icon?: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasValue = value && value !== "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || label;
  const IconComponent = Icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[11px] font-medium transition-all duration-200 ${
          hasValue ? "bg-[#0F1C2E] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
        <span>{hasValue ? selectedLabel : label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[200px] border border-gray-200 bg-white py-1 shadow-xl"
          >
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2.5 text-left text-[11px] text-gray-400 hover:bg-gray-50"
            >
              All {label}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-[11px] transition-colors ${
                  value === opt.value
                    ? "bg-[#0F1C2E]/5 font-medium text-[#0F1C2E]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (Math.abs(i - currentPage) === 2) {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F1C2E] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      {getPageNumbers().map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`dots-${idx}`} className="px-2 py-2 text-[12px] text-gray-400">
              ...
            </span>
          );
        }
        const pageNum = page as number;
        const isActive = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`flex h-9 w-9 items-center justify-center rounded-[4px] text-[12px] font-medium transition-all ${
              isActive ? "bg-[#0F1C2E] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-[4px] px-3 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F1C2E] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function GlobalPropertiesPage() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    bedroom: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
    property_type: "",
    country: "",
  });

  const currentPriceValue = filters.min_price && filters.max_price ? `${filters.min_price}-${filters.max_price}` : "";
  const hasActiveFilters = filters.bedroom !== "" || filters.min_price !== "" || filters.max_price !== "" || filters.property_type !== "" || filters.country !== "" || searchTerm !== "";
  const hasMore = pagination ? filters.page < pagination.totalPages : false;

  const filterProperties = useCallback(() => {
    let filtered = [...properties];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.country.toLowerCase().includes(term)
      );
    }

    if (filters.bedroom) {
      filtered = filtered.filter(p => p.bedrooms === parseInt(filters.bedroom));
    }

    if (filters.min_price && filters.max_price) {
      filtered = filtered.filter(p =>
        p.price >= parseInt(filters.min_price) &&
        p.price <= parseInt(filters.max_price)
      );
    }

    if (filters.property_type) {
      filtered = filtered.filter(p => p.property_type === filters.property_type);
    }

    if (filters.country) {
      filtered = filtered.filter(p => p.country === filters.country);
    }

    if (filters.sort_by === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sort_by === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => b.id - a.id);
    }

    setFilteredProperties(filtered);

    const totalPages = Math.ceil(filtered.length / filters.limit);
    setPagination({
      total: filtered.length,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    });
  }, [properties, filters, searchTerm]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProperties(DUMMY_PROPERTIES_EXTENDED);
      setLoading(false);
      setIsInitialLoad(false);
    }, 800);
  }, []);

  useEffect(() => {
    filterProperties();
  }, [filterProperties]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isInitialLoad) {
          setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observerRef.current.observe(currentLoader);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadingMore, isInitialLoad]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    if (!value) {
      setFilters((prev) => ({ ...prev, min_price: "", max_price: "", page: 1 }));
      return;
    }
    const [min, max] = value.split("-");
    setFilters((prev) => ({ ...prev, min_price: min || "", max_price: max || "", page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 12,
      bedroom: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
      property_type: "",
      country: "",
    });
    setSearchTerm("");
  }, []);

  const currentPageProperties = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    return filteredProperties.slice(start, end);
  }, [filteredProperties, filters.page, filters.limit]);

  return (
    <section className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[32px] font-normal leading-tight md:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Global Properties for Sale
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#6B7A8D]"
          >
            {loading ? (
              "Loading..."
            ) : pagination ? (
              <>
                <span>{pagination.total.toLocaleString()} premium properties worldwide</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <Globe className="h-3 w-3" />
                  global
                </span>
              </>
            ) : (
              `${properties.length} listings`
            )}
          </motion.p>
        </div>
      </div>

      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2 md:gap-4">
            <div className="hidden flex-1 items-center gap-2 lg:flex">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search global properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                />
              </div>

              <FilterDropdown
                label="Country"
                value={filters.country}
                onChange={(v) => updateFilter("country", v)}
                options={COUNTRY_OPTIONS}
                icon={Globe}
              />
              <FilterDropdown
                label="Price"
                value={currentPriceValue}
                onChange={handlePriceChange}
                options={PRICE_OPTIONS}
                icon={DollarSign}
              />
              <FilterDropdown
                label="Bedrooms"
                value={filters.bedroom}
                onChange={(v) => updateFilter("bedroom", v)}
                options={BEDROOM_OPTIONS}
                icon={Layers}
              />
              <FilterDropdown
                label="Property Type"
                value={filters.property_type}
                onChange={(v) => updateFilter("property_type", v)}
                options={PROPERTY_TYPE_OPTIONS}
                icon={Building2}
              />
              <FilterDropdown
                label="Sort"
                value={filters.sort_by}
                onChange={(v) => updateFilter("sort_by", v)}
                options={SORT_OPTIONS}
                icon={ArrowUpDown}
              />

              <div className="ml-2 flex rounded-[4px] border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "grid" ? "bg-[#0F1C2E] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "list" ? "bg-[#0F1C2E] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="ml-2 flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#0F1C2E]"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="ml-auto flex items-center gap-1.5 rounded-[3px] border border-gray-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-gray-700 lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-white lg:hidden"
            style={{ borderColor: THEME.border }}
          >
            <div className="p-4">
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-[11px] focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.country}
                  onChange={(e) => updateFilter("country", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Countries</option>
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={currentPriceValue}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Prices</option>
                  {PRICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.bedroom}
                  onChange={(e) => updateFilter("bedroom", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Beds</option>
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.property_type}
                  onChange={(e) => updateFilter("property_type", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sort_by}
                  onChange={(e) => updateFilter("sort_by", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleClearFilters}
                  className="col-span-2 h-9 border border-gray-300 text-[10px] uppercase tracking-[0.12em] text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6">
        {error && !loading && (
          <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setProperties(DUMMY_PROPERTIES_EXTENDED);
                  setLoading(false);
                }, 500);
              }}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div
          className={`grid gap-x-6 gap-y-10 ${
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {loading && properties.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} viewMode={viewMode} />)
            : currentPageProperties.map((property, index) => (
                <PropertyCard key={`${property.id}-${property.slug}`} property={property} viewMode={viewMode} index={index} />
              ))}
        </div>

        <div ref={loaderRef} className="py-4">
          {loadingMore && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#0F1C2E]" />
              <p className="ml-3 text-[10px] uppercase tracking-widest text-[#6B7A8D]">Loading more...</p>
            </div>
          )}
        </div>

        {!loading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={filters.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => {
              setFilters((prev) => ({ ...prev, page }));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {!loading && filteredProperties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Globe className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0F1C2E]" style={{ fontFamily: FONT_DISPLAY }}>
              No global properties found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-[#6B7A8D]">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-6 px-8 py-3 text-[10px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowRight className="h-4 w-4 -rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}