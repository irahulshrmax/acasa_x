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
  Building,
  CheckCircle,
} from "lucide-react";

const DEFAULT_LIMIT = 12;

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

// ============== TYPES ==============
interface SellProperty {
  id: number;
  name: string;
  slug: string;
  ref_number: string | null;
  listing_type: string;
  property_type: string;
  occupancy: string | null;
  status: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  price: {
    amount: number | null;
    amount_end: number | null;
    display: string | null;
    display_end: string | null;
    currency: string;
    symbol: string;
    is_price_on_request: boolean;
    sale_price: number | null;
    listing_price: number | null;
    rental_price: number | null;
  };
  bedrooms: string;
  bathrooms: string;
  display_title: string;
  area: {
    value: number | null;
    size: string | null;
    display: string;
    min_area: string | null;
    max_area: string | null;
    area_end: string | null;
  };
  location: {
    community: string | null;
    community_slug: string | null;
    sub_community: string | null;
    city: string | null;
    address: string | null;
    latitude: string | null;
    longitude: string | null;
    community_id: number | null;
    city_id: number | null;
  };
  developer: {
    id: number | null;
    name: string | null;
    country: string | null;
    is_international: boolean;
    logo_url: string;
    logo_variations: string[];
  } | null; // ✅ FIXED: Allow null
  agent: {
    id: number | null;
    name: string | null;
    phone: string | null;
    photo_url: string;
  };
  featured_image: string;
  images: Array<{ id: number; url: string; title: string; featured: number }>;
  gallery_urls: string[];
  gallery_preview: string[];
  media_base_url: string;
  amenities: string[];
  furnishing: string | null;
  video_url: string | null;
  project_id: number | null;
  listed_date: string | null;
  days_on_market: number | null;
  views_count: number | null;
  is_verified: boolean;
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

// ============== FALLBACK IMAGES (NO API CALL - NO ERROR) ==============
const FALLBACK_IMAGES: Record<string, string[]> = {
  villa: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
  ],
  apartment: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80',
  ],
  townhouse: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
  ],
  penthouse: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
  ],
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&h=600&fit=crop&q=80',
  ],
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
];

// ============== DUMMY DATA ==============
const DUMMY_PROPERTIES: SellProperty[] = [
  {
    id: 1,
    name: "Luxury Villa with Private Pool",
    slug: "luxury-villa-private-pool",
    ref_number: "S-1001",
    listing_type: "sale",
    property_type: "villa",
    occupancy: "ready to move",
    status: 5,
    featured: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2024",
    exclusive_status: "Exclusive",
    dld_permit: "DLD-12345",
    price: {
      amount: 4500000,
      amount_end: null,
      display: "AED 4,500,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 4500000,
      listing_price: 4500000,
      rental_price: 180000,
    },
    bedrooms: "4",
    bathrooms: "5 Bath",
    display_title: "Stunning 4BR Villa with Ocean View",
    area: {
      value: 3500,
      size: "sqft",
      display: "3,500 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Emirates Hills",
      community_slug: "emirates-hills",
      sub_community: "Villa 12",
      city: "Dubai",
      address: "Emirates Hills, Dubai",
      latitude: "25.0657",
      longitude: "55.1713",
      community_id: 1,
      city_id: 1,
    },
    developer: {
      id: 1,
      name: "Emaar Properties",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 1,
      name: "Ahmed Khan",
      phone: "+971 50 123 4567",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Swimming Pool", "Gym", "Security", "Parking", "Garden", "BBQ Area"],
    furnishing: "Fully Furnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 2,
    views_count: 156,
    is_verified: true,
  },
  {
    id: 2,
    name: "Modern Apartment in Downtown",
    slug: "modern-apartment-downtown",
    ref_number: "S-1002",
    listing_type: "sale",
    property_type: "apartment",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2023",
    exclusive_status: null,
    dld_permit: null,
    price: {
      amount: 1850000,
      amount_end: null,
      display: "AED 1,850,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 1850000,
      listing_price: 1850000,
      rental_price: 85000,
    },
    bedrooms: "2",
    bathrooms: "2 Bath",
    display_title: "Stylish 2BR Apartment with Burj View",
    area: {
      value: 1200,
      size: "sqft",
      display: "1,200 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Downtown Dubai",
      community_slug: "downtown-dubai",
      sub_community: "Burj Residences",
      city: "Dubai",
      address: "Downtown Dubai, Dubai",
      latitude: "25.1952",
      longitude: "55.2740",
      community_id: 2,
      city_id: 1,
    },
    developer: {
      id: 2,
      name: "Dubai Properties",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 2,
      name: "Sarah Ali",
      phone: "+971 50 987 6543",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Pool", "Gym", "Concierge", "Parking", "Children's Play Area"],
    furnishing: "Semi-Furnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 5,
    views_count: 89,
    is_verified: true,
  },
  {
    id: 3,
    name: "Spacious Townhouse in JVC",
    slug: "spacious-townhouse-jvc",
    ref_number: "S-1003",
    listing_type: "sale",
    property_type: "townhouse",
    occupancy: "under construction",
    status: 5,
    featured: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2025",
    exclusive_status: "Sole Agency",
    dld_permit: "DLD-67890",
    price: {
      amount: 2800000,
      amount_end: 2950000,
      display: "AED 2,800,000",
      display_end: "AED 2,950,000",
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 2800000,
      listing_price: 2800000,
      rental_price: null,
    },
    bedrooms: "3",
    bathrooms: "3 Bath",
    display_title: "3BR Townhouse with Garden",
    area: {
      value: 2200,
      size: "sqft",
      display: "2,200 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Jumeirah Village Circle",
      community_slug: "jumeirah-village-circle",
      sub_community: null,
      city: "Dubai",
      address: "JVC, Dubai",
      latitude: "25.0800",
      longitude: "55.1500",
      community_id: 3,
      city_id: 1,
    },
    developer: {
      id: 3,
      name: "Nakheel",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 3,
      name: "Omar Hassan",
      phone: "+971 50 456 7890",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Garden", "Parking", "Community Pool", "Kids Play Area", "Clubhouse"],
    furnishing: "Unfurnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 10,
    views_count: 234,
    is_verified: false,
  },
  {
    id: 4,
    name: "Penthouse with Skyline View",
    slug: "penthouse-skyline-view",
    ref_number: "S-1004",
    listing_type: "sale",
    property_type: "penthouse",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2022",
    exclusive_status: "Exclusive",
    dld_permit: null,
    price: {
      amount: 12000000,
      amount_end: null,
      display: "AED 12,000,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 12000000,
      listing_price: 12000000,
      rental_price: null,
    },
    bedrooms: "5",
    bathrooms: "6 Bath",
    display_title: "Luxury 5BR Penthouse with Private Terrace",
    area: {
      value: 5500,
      size: "sqft",
      display: "5,500 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Palm Jumeirah",
      community_slug: "palm-jumeirah",
      sub_community: "Frond N",
      city: "Dubai",
      address: "Palm Jumeirah, Dubai",
      latitude: "25.1100",
      longitude: "55.1400",
      community_id: 4,
      city_id: 1,
    },
    developer: {
      id: 4,
      name: "Meraas",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 4,
      name: "Fatima Al Maktoum",
      phone: "+971 50 789 0123",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Private Pool", "Jacuzzi", "Cinema Room", "Concierge", "Valet", "Smart Home"],
    furnishing: "Luxury Furnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 15,
    views_count: 567,
    is_verified: true,
  },
  {
    id: 5,
    name: "Studio Apartment in Marina",
    slug: "studio-apartment-marina",
    ref_number: "S-1005",
    listing_type: "sale",
    property_type: "apartment",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2023",
    exclusive_status: null,
    dld_permit: null,
    price: {
      amount: 950000,
      amount_end: null,
      display: "AED 950,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 950000,
      listing_price: 950000,
      rental_price: 45000,
    },
    bedrooms: "Studio",
    bathrooms: "1 Bath",
    display_title: "Cozy Studio with Marina View",
    area: {
      value: 450,
      size: "sqft",
      display: "450 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Dubai Marina",
      community_slug: "dubai-marina",
      sub_community: "Marina Bay",
      city: "Dubai",
      address: "Dubai Marina, Dubai",
      latitude: "25.0800",
      longitude: "55.1400",
      community_id: 5,
      city_id: 1,
    },
    developer: {
      id: 5,
      name: "Select Group",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 5,
      name: "Mohammed Rashid",
      phone: "+971 50 234 5678",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Pool", "Gym", "Security", "Concierge"],
    furnishing: "Fully Furnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 3,
    views_count: 78,
    is_verified: true,
  },
  {
    id: 6,
    name: "Land Plot for Villa Construction",
    slug: "land-plot-villa-construction",
    ref_number: "S-1006",
    listing_type: "sale",
    property_type: "land",
    occupancy: null,
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: null,
    exclusive_status: null,
    dld_permit: null,
    price: {
      amount: 3500000,
      amount_end: null,
      display: "AED 3,500,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 3500000,
      listing_price: 3500000,
      rental_price: null,
    },
    bedrooms: "0",
    bathrooms: "0 Bath",
    display_title: "Prime Land Plot in Dubai Hills",
    area: {
      value: 12000,
      size: "sqft",
      display: "12,000 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Dubai Hills Estate",
      community_slug: "dubai-hills-estate",
      sub_community: null,
      city: "Dubai",
      address: "Dubai Hills Estate, Dubai",
      latitude: "25.1300",
      longitude: "55.2300",
      community_id: 6,
      city_id: 1,
    },
    developer: null, // ✅ This is now allowed
    agent: {
      id: 6,
      name: "Khalid Al Ameri",
      phone: "+971 50 345 6789",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: [],
    furnishing: null,
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 20,
    views_count: 45,
    is_verified: false,
  },
  {
    id: 7,
    name: "Waterfront Villa with Private Beach",
    slug: "waterfront-villa-private-beach",
    ref_number: "S-1007",
    listing_type: "sale",
    property_type: "villa",
    occupancy: "ready to move",
    status: 5,
    featured: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2024",
    exclusive_status: "Exclusive",
    dld_permit: "DLD-78901",
    price: {
      amount: 8500000,
      amount_end: null,
      display: "AED 8,500,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 8500000,
      listing_price: 8500000,
      rental_price: 350000,
    },
    bedrooms: "6",
    bathrooms: "7 Bath",
    display_title: "6BR Beachfront Villa with Private Access",
    area: {
      value: 6500,
      size: "sqft",
      display: "6,500 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "Jumeirah Beach Residence",
      community_slug: "jumeirah-beach-residence",
      sub_community: "JBR",
      city: "Dubai",
      address: "JBR, Dubai",
      latitude: "25.0750",
      longitude: "55.1300",
      community_id: 7,
      city_id: 1,
    },
    developer: {
      id: 6,
      name: "Dubai Holding",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 7,
      name: "Noor Al Suwaidi",
      phone: "+971 50 456 0123",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Private Beach", "Infinity Pool", "Home Theater", "Gym", "Spa", "Wine Cellar"],
    furnishing: "Luxury Furnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 7,
    views_count: 432,
    is_verified: true,
  },
  {
    id: 8,
    name: "Affordable Studio in International City",
    slug: "affordable-studio-international-city",
    ref_number: "S-1008",
    listing_type: "sale",
    property_type: "apartment",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completion_date: "2023",
    exclusive_status: null,
    dld_permit: null,
    price: {
      amount: 550000,
      amount_end: null,
      display: "AED 550,000",
      display_end: null,
      currency: "AED",
      symbol: "AED",
      is_price_on_request: false,
      sale_price: 550000,
      listing_price: 550000,
      rental_price: 28000,
    },
    bedrooms: "Studio",
    bathrooms: "1 Bath",
    display_title: "Budget-Friendly Studio with Community View",
    area: {
      value: 380,
      size: "sqft",
      display: "380 sqft",
      min_area: null,
      max_area: null,
      area_end: null,
    },
    location: {
      community: "International City",
      community_slug: "international-city",
      sub_community: "England Cluster",
      city: "Dubai",
      address: "International City, Dubai",
      latitude: "25.1900",
      longitude: "55.4100",
      community_id: 8,
      city_id: 1,
    },
    developer: {
      id: 7,
      name: "Nakheel",
      country: "UAE",
      is_international: false,
      logo_url: "",
      logo_variations: [],
    },
    agent: {
      id: 8,
      name: "Rashid Al Maktoum",
      phone: "+971 50 567 8901",
      photo_url: "",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    media_base_url: "",
    amenities: ["Security", "Parking", "Community Center"],
    furnishing: "Unfurnished",
    video_url: null,
    project_id: null,
    listed_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 12,
    views_count: 34,
    is_verified: false,
  },
];

// ============== FILTER OPTIONS ==============
const PROPERTY_TYPE_OPTIONS: FilterOption[] = [
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Land / Plot" },
];

const BEDROOM_OPTIONS: FilterOption[] = [
  { value: "Studio", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
  { value: "6+", label: "6+ Bedrooms" },
];

const PRICE_OPTIONS: FilterOption[] = [
  { value: "0-500000", label: "Under AED 500K" },
  { value: "500000-1000000", label: "AED 500K - 1M" },
  { value: "1000000-2000000", label: "AED 1M - 2M" },
  { value: "2000000-5000000", label: "AED 2M - 5M" },
  { value: "5000000-10000000", label: "AED 5M - 10M" },
  { value: "10000000-20000000", label: "AED 10M - 20M" },
  { value: "20000000-999999999", label: "AED 20M+" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: "Newest Listed" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Viewed" },
  { value: "featured", label: "Featured First" },
];

const EXCLUSIVE_OPTIONS: FilterOption[] = [
  { value: "Non-Exclusive", label: "Non-Exclusive" },
  { value: "Exclusive", label: "Exclusive" },
  { value: "Sole Agency", label: "Sole Agency" },
];

// ============== ENRICH WITH IMAGES (NO API CALL) ==============
function enrichPropertyWithImages(property: SellProperty): SellProperty {
  if (property.featured_image || (property.gallery_urls && property.gallery_urls.length > 0)) {
    return property;
  }

  const type = property.property_type?.toLowerCase() || '';
  const images = FALLBACK_IMAGES[type] || DEFAULT_IMAGES;

  return {
    ...property,
    featured_image: images[0] || '',
    gallery_urls: images,
  };
}

// ============== HELPERS ==============
function getPropertyImage(property: SellProperty): string | null {
  if (property.featured_image) return property.featured_image;
  if (property.gallery_urls?.length) return property.gallery_urls[0];
  if (property.images?.length) return property.images[0].url;
  if (property.gallery_preview?.length) return property.gallery_preview[0];
  return null;
}

function getAllImages(property: SellProperty): string[] {
  const imgs: string[] = [];
  if (property.featured_image) imgs.push(property.featured_image);
  if (property.gallery_urls) property.gallery_urls.forEach(img => { if (!imgs.includes(img)) imgs.push(img); });
  if (property.images) property.images.forEach(img => { if (img.url && !imgs.includes(img.url)) imgs.push(img.url); });
  if (property.gallery_preview) property.gallery_preview.forEach(img => { if (!imgs.includes(img)) imgs.push(img); });
  return imgs;
}

function formatPrice(amount: number | null, currency = "AED"): string {
  if (!amount) return "Price on Request";
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getBedroomLabel(bedroom: string): string {
  if (!bedroom || bedroom.toLowerCase() === "studio") return "Studio";
  const match = bedroom.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `${num} BHK`;
  }
  return bedroom;
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

function getPropertyTypeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "villa":
      return Home;
    case "apartment":
      return Building2;
    case "townhouse":
      return Building;
    case "penthouse":
      return Layers;
    default:
      return Building2;
  }
}

// ============== COMPONENTS ==============
function PropertyCard({ property, viewMode = "grid", index = 0 }: { property: SellProperty; viewMode?: string; index?: number }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const location = property.location?.community || property.location?.city || "Dubai";
  const isPriceOnRequest = property.price?.is_price_on_request || !property.price?.amount;
  const priceDisplay = property.price?.display || "Price on Request";
  const bedroomLabel = getBedroomLabel(property.bedrooms);
  const daysAgo = getDaysAgo(property.created_at);
  const isVerified = property.is_verified || false;
  const PropertyTypeIcon = getPropertyTypeIcon(property.property_type);

  const allImages = useMemo(() => getAllImages(property), [property]);
  const hasImages = allImages.length > 0;
  
  const currentImage = useMemo(() => {
    if (imageError || !hasImages) return null;
    return allImages[currentImageIndex % allImages.length];
  }, [allImages, currentImageIndex, imageError, hasImages]);

  const specs = [
    bedroomLabel,
    property.bathrooms && property.bathrooms !== "0 Bath" ? property.bathrooms : null,
    property.area?.display && property.area.display !== "Area on Request" ? property.area.display : null,
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
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    try {
      const saved = JSON.parse(localStorage.getItem("property_wishlist") || "[]");
      const updated = isWishlisted 
        ? saved.filter((id: number) => id !== property.id)
        : [...saved, property.id];
      localStorage.setItem("property_wishlist", JSON.stringify(updated));
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
        <Link href={`/sell-your-property-in-dubai/${property.slug}`} className="block h-full w-full">
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
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <Building2 className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-xs text-gray-400">Loading Image...</p>
            </div>
          )}
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {property.featured && (
            <span className="rounded-[3px] bg-[#0F1C2E] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              Featured
            </span>
          )}
          {isVerified && (
            <span className="flex items-center gap-1 rounded-[3px] bg-emerald-500 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              <CheckCircle className="h-3 w-3" />
              Verified
            </span>
          )}
          {property.property_type && (
            <span className="rounded-[3px] bg-blue-500 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
              {property.property_type}
            </span>
          )}
        </div>

        {property.exclusive_status && (
          <span className="absolute right-12 top-3 rounded-[3px] bg-white/90 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-[#0F1C2E]">
            {property.exclusive_status}
          </span>
        )}

        {property.days_on_market !== null && property.days_on_market !== undefined && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {property.days_on_market} days on market
          </div>
        )}

        {property.views_count && property.views_count > 0 && (
          <div className="absolute bottom-3 right-12 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {property.views_count}
          </div>
        )}

        <button
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
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
            <Link href={`/sell-your-property-in-dubai/${property.slug}`}>
              <h3
                className="truncate text-[15px] font-normal uppercase leading-snug tracking-[0.06em] transition-opacity hover:opacity-70"
                style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
              >
                {property.name}
              </h3>
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#6B7A8D]">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
            {property.developer?.name && (
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#6B7A8D]">
                <Building2 className="h-3 w-3" />
                <span>{property.developer.name}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#6B7A8D]">Price</p>
            <p className="text-[14px] font-bold leading-tight text-[#0F1C2E]">
              {isPriceOnRequest ? "On Request" : priceDisplay}
            </p>
            {property.price?.rental_price && (
              <p className="text-[10px] text-[#6B7A8D]">
                Rental: {formatPrice(property.price.rental_price)}
              </p>
            )}
          </div>
        </div>

        <div className="my-3 h-px w-full bg-[#E2E8F0]" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-[11px] text-[#4A5462]">{specs || "\u00A0"}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#6B7A8D]">{daysAgo}</span>
          </div>
        </div>

        {isListMode && property.developer?.logo_url && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={property.developer.logo_url}
              alt={property.developer.name || "Developer"}
              className="h-6 w-auto max-w-[80px] object-contain opacity-60 grayscale transition-opacity group-hover:opacity-100"
            />
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

// ============== MAIN PAGE ==============
export default function SellYourPropertyPage() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [properties, setProperties] = useState<SellProperty[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    bedroom: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
    property_type: "",
    keyword: "",
    exclusive_status: "",
  });

  const currentPriceValue = filters.min_price && filters.max_price ? `${filters.min_price}-${filters.max_price}` : "";
  const hasActiveFilters = filters.bedroom !== "" || filters.min_price !== "" || filters.max_price !== "" || filters.property_type !== "" || filters.keyword !== "" || filters.exclusive_status !== "";
  const hasMore = pagination ? filters.page < pagination.totalPages : false;

  // ============== FETCH PROPERTIES FROM DUMMY DATA ==============
  const fetchProperties = useCallback(
    async (page: number, isReset: boolean) => {
      if (isReset) {
        setLoading(true);
        setProperties([]);
        setPagination(null);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filtered = [...DUMMY_PROPERTIES];
        
        if (filters.bedroom) {
          if (filters.bedroom === "Studio") {
            filtered = filtered.filter(p => p.bedrooms.toLowerCase() === "studio");
          } else if (filters.bedroom === "6+") {
            filtered = filtered.filter(p => {
              const num = parseInt(p.bedrooms);
              return !isNaN(num) && num >= 6;
            });
          } else {
            filtered = filtered.filter(p => p.bedrooms === filters.bedroom);
          }
        }
        
        if (filters.property_type) {
          filtered = filtered.filter(p => p.property_type === filters.property_type);
        }
        
        if (filters.min_price) {
          filtered = filtered.filter(p => (p.price.amount || 0) >= parseInt(filters.min_price));
        }
        
        if (filters.max_price) {
          filtered = filtered.filter(p => (p.price.amount || 0) <= parseInt(filters.max_price));
        }
        
        if (filters.exclusive_status) {
          filtered = filtered.filter(p => p.exclusive_status === filters.exclusive_status);
        }
        
        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(keyword) ||
            p.location?.community?.toLowerCase().includes(keyword) ||
            p.location?.city?.toLowerCase().includes(keyword)
          );
        }
        
        switch (filters.sort_by) {
          case "price_asc":
            filtered.sort((a, b) => (a.price.amount || 0) - (b.price.amount || 0));
            break;
          case "price_desc":
            filtered.sort((a, b) => (b.price.amount || 0) - (a.price.amount || 0));
            break;
          case "popular":
            filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
            break;
          case "featured":
            filtered.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return 0;
            });
            break;
          default:
            filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        
        const total = filtered.length;
        const start = (page - 1) * filters.limit;
        const end = start + filters.limit;
        const paginated = filtered.slice(start, end);
        const totalPages = Math.ceil(total / filters.limit);
        
        // ✅ FIX: Use enrichPropertyWithImages (NO Unsplash API call)
        const enriched = paginated.map(p => enrichPropertyWithImages(p));
        
        if (isReset) {
          setProperties(enriched);
          setIsInitialLoad(false);
        } else {
          setProperties(prev => [...prev, ...enriched]);
        }
        
        setPagination({
          total,
          page,
          limit: filters.limit,
          totalPages,
        });
        
      } catch (err: any) {
        setError(err.message || "Failed to load properties");
        if (isReset) {
          setProperties([]);
          setIsInitialLoad(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchProperties(filters.page, filters.page === 1);
  }, [fetchProperties, filters.page]);

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
    setProperties([]);
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    setProperties([]);
    if (!value) {
      setFilters((prev) => ({ ...prev, min_price: "", max_price: "", page: 1 }));
      return;
    }
    const [min, max] = value.split("-");
    setFilters((prev) => ({ ...prev, min_price: min || "", max_price: max || "", page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setProperties([]);
    setFilters({
      page: 1,
      limit: DEFAULT_LIMIT,
      bedroom: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
      property_type: "",
      keyword: "",
      exclusive_status: "",
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setProperties([]);
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <section className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      {/* HEADER */}
      <div className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[32px] font-normal leading-tight md:text-[40px]"
            style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
          >
            Sell Your Property in Dubai
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
                <span>{pagination.total.toLocaleString()} properties for sale in Dubai</span>
              </>
            ) : (
              `${properties.length} listings`
            )}
          </motion.p>
        </div>
      </div>

      {/* STICKY FILTERS */}
      <div className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm" style={{ borderColor: THEME.border }}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-14 items-center gap-2 md:gap-4">
            <div className="hidden flex-1 items-center justify-end gap-1 lg:flex">
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
                icon={Building}
              />
              <FilterDropdown
                label="Exclusive"
                value={filters.exclusive_status}
                onChange={(v) => updateFilter("exclusive_status", v)}
                options={EXCLUSIVE_OPTIONS}
                icon={Award}
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

      {/* MOBILE FILTERS */}
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
              <div className="grid grid-cols-2 gap-2">
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
                  value={filters.exclusive_status}
                  onChange={(e) => updateFilter("exclusive_status", e.target.value)}
                  className="h-9 border border-gray-200 bg-white px-3 text-[11px]"
                >
                  <option value="">All Exclusive</option>
                  {EXCLUSIVE_OPTIONS.map((opt) => (
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

      {/* PROPERTY GRID */}
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6">
        {error && !loading && (
          <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => fetchProperties(filters.page, filters.page === 1)}
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
            : properties.map((property, index) => (
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
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {!loading && !hasMore && properties.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.15em] text-[#6B7A8D]">
            You've reached the end
          </p>
        )}

        {!loading && properties.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <Home className="mx-auto h-14 w-14 text-gray-300" />
            <h3 className="mt-4 text-[22px] text-[#0F1C2E]" style={{ fontFamily: FONT_DISPLAY }}>
              No properties for sale found
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

      {/* SCROLL TO TOP */}
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