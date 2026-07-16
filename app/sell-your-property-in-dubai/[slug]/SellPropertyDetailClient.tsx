// src/app/sell-properties-in-dubai/[slug]/SellPropertyDetailClient.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, ChevronLeft, ChevronRight, X,
  Maximize2, CheckCircle, Loader2, MapPin, Plus, Phone,
  Calendar, Building2, Shield, ExternalLink, Check,
  MessageCircle, Play, Grid3x3, Bath, BedDouble,
  Maximize, Star, Copy, Home, Clock, Eye, Award, Sparkles,
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
};

// ============== DUMMY DATA ==============
const DUMMY_PROPERTIES = [
  {
    id: 1,
    property_name: "Luxury Villa with Private Pool",
    property_slug: "luxury-villa-private-pool",
    listing_type: "Sale",
    property_type: "villa",
    occupancy: "ready to move",
    status: 5,
    featured: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: "2024",
    exclusive_status: "Exclusive",
    dld_permit: "DLD-12345",
    ref_number: "S-1001",
    rera_number: "RERA-12345",
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
    bathrooms: "5",
    area: {
      value: 3500,
      display: "3,500 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Emirates Hills",
      city: "Dubai",
      address: "Emirates Hills, Dubai",
      latitude: 25.0657,
      longitude: 55.1713,
      community_id: 1,
    },
    developer: {
      id: 1,
      name: "Emaar Properties",
      logo: null,
      country: "UAE",
      website: "https://www.emaar.com",
    },
    agent: {
      id: 1,
      name: "Ahmed Khan",
      phone: "+971 50 123 4567",
      photo: null,
      rera_brn: "BRN-12345",
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>This stunning 4-bedroom villa in Emirates Hills offers luxury living with a private pool, landscaped garden, and panoramic views of the golf course. Perfect for families seeking privacy and elegance.</p>",
    amenities: ["Swimming Pool", "Gym", "Security", "Parking", "Garden", "BBQ Area"],
    furnishing: "Fully Furnished",
    flooring: "Marble",
    parking: "2 Covered",
    video_url: null,
    payment_plans: [],
    display_title: "Stunning 4BR Villa with Ocean View",
    listed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 2,
    views_count: 156,
    is_verified: true,
    is_off_plan: false,
  },
  {
    id: 2,
    property_name: "Modern Apartment in Downtown",
    property_slug: "modern-apartment-downtown",
    listing_type: "Sale",
    property_type: "apartment",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: "2023",
    exclusive_status: null,
    dld_permit: null,
    ref_number: "S-1002",
    rera_number: null,
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
    bathrooms: "2",
    area: {
      value: 1200,
      display: "1,200 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Downtown Dubai",
      city: "Dubai",
      address: "Downtown Dubai, Dubai",
      latitude: 25.1952,
      longitude: 55.2740,
      community_id: 2,
    },
    developer: {
      id: 2,
      name: "Dubai Properties",
      logo: null,
      country: "UAE",
      website: null,
    },
    agent: {
      id: 2,
      name: "Sarah Ali",
      phone: "+971 50 987 6543",
      photo: null,
      rera_brn: null,
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>Stylish 2-bedroom apartment in Downtown Dubai with breathtaking views of Burj Khalifa and Dubai Fountain. Modern finishes and premium amenities.</p>",
    amenities: ["Pool", "Gym", "Concierge", "Parking", "Children's Play Area"],
    furnishing: "Semi-Furnished",
    flooring: "Wood",
    parking: "1 Covered",
    video_url: null,
    payment_plans: [],
    display_title: "Stylish 2BR Apartment with Burj View",
    listed_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 5,
    views_count: 89,
    is_verified: true,
    is_off_plan: false,
  },
  {
    id: 3,
    property_name: "Spacious Townhouse in JVC",
    property_slug: "spacious-townhouse-jvc",
    listing_type: "Sale",
    property_type: "townhouse",
    occupancy: "under construction",
    status: 5,
    featured: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: "2025",
    exclusive_status: "Sole Agency",
    dld_permit: "DLD-67890",
    ref_number: "S-1003",
    rera_number: null,
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
    bathrooms: "3",
    area: {
      value: 2200,
      display: "2,200 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Jumeirah Village Circle",
      city: "Dubai",
      address: "JVC, Dubai",
      latitude: 25.0800,
      longitude: 55.1500,
      community_id: 3,
    },
    developer: {
      id: 3,
      name: "Nakheel",
      logo: null,
      country: "UAE",
      website: null,
    },
    agent: {
      id: 3,
      name: "Omar Hassan",
      phone: "+971 50 456 7890",
      photo: null,
      rera_brn: null,
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>Beautiful 3-bedroom townhouse in JVC with garden and community amenities. Perfect for families looking for space and comfort.</p>",
    amenities: ["Garden", "Parking", "Community Pool", "Kids Play Area", "Clubhouse"],
    furnishing: "Unfurnished",
    flooring: "Tile",
    parking: "2 Covered",
    video_url: null,
    payment_plans: [],
    display_title: "3BR Townhouse with Garden",
    listed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 10,
    views_count: 234,
    is_verified: false,
    is_off_plan: true,
  },
  {
    id: 4,
    property_name: "Penthouse with Skyline View",
    property_slug: "penthouse-skyline-view",
    listing_type: "Sale",
    property_type: "penthouse",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: "2022",
    exclusive_status: "Exclusive",
    dld_permit: null,
    ref_number: "S-1004",
    rera_number: null,
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
    bathrooms: "6",
    area: {
      value: 5500,
      display: "5,500 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Palm Jumeirah",
      city: "Dubai",
      address: "Palm Jumeirah, Dubai",
      latitude: 25.1100,
      longitude: 55.1400,
      community_id: 4,
    },
    developer: {
      id: 4,
      name: "Meraas",
      logo: null,
      country: "UAE",
      website: null,
    },
    agent: {
      id: 4,
      name: "Fatima Al Maktoum",
      phone: "+971 50 789 0123",
      photo: null,
      rera_brn: null,
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>Exclusive 5-bedroom penthouse on Palm Jumeirah with private terrace, infinity pool, and panoramic views of Dubai skyline.</p>",
    amenities: ["Private Pool", "Jacuzzi", "Cinema Room", "Concierge", "Valet", "Smart Home"],
    furnishing: "Luxury Furnished",
    flooring: "Marble",
    parking: "3 Covered",
    video_url: null,
    payment_plans: [],
    display_title: "Luxury 5BR Penthouse with Private Terrace",
    listed_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 15,
    views_count: 567,
    is_verified: true,
    is_off_plan: false,
  },
  {
    id: 5,
    property_name: "Studio Apartment in Marina",
    property_slug: "studio-apartment-marina",
    listing_type: "Sale",
    property_type: "apartment",
    occupancy: "ready to move",
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: "2023",
    exclusive_status: null,
    dld_permit: null,
    ref_number: "S-1005",
    rera_number: null,
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
    bathrooms: "1",
    area: {
      value: 450,
      display: "450 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Dubai Marina",
      city: "Dubai",
      address: "Dubai Marina, Dubai",
      latitude: 25.0800,
      longitude: 55.1400,
      community_id: 5,
    },
    developer: {
      id: 5,
      name: "Select Group",
      logo: null,
      country: "UAE",
      website: null,
    },
    agent: {
      id: 5,
      name: "Mohammed Rashid",
      phone: "+971 50 234 5678",
      photo: null,
      rera_brn: null,
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>Cozy studio apartment in Dubai Marina with stunning waterfront views. Perfect for first-time buyers or investors.</p>",
    amenities: ["Pool", "Gym", "Security", "Concierge"],
    furnishing: "Fully Furnished",
    flooring: "Tile",
    parking: "1 Covered",
    video_url: null,
    payment_plans: [],
    display_title: "Cozy Studio with Marina View",
    listed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 3,
    views_count: 78,
    is_verified: true,
    is_off_plan: false,
  },
  {
    id: 6,
    property_name: "Land Plot for Villa Construction",
    property_slug: "land-plot-villa-construction",
    listing_type: "Sale",
    property_type: "land",
    occupancy: null,
    status: 5,
    featured: false,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: null,
    exclusive_status: null,
    dld_permit: null,
    ref_number: "S-1006",
    rera_number: null,
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
    bathrooms: "0",
    area: {
      value: 12000,
      display: "12,000 sqft",
      size: "sqft",
      min_area: null,
      max_area: null,
    },
    location: {
      community: "Dubai Hills Estate",
      city: "Dubai",
      address: "Dubai Hills Estate, Dubai",
      latitude: 25.1300,
      longitude: 55.2300,
      community_id: 6,
    },
    developer: null,
    agent: {
      id: 6,
      name: "Khalid Al Ameri",
      phone: "+971 50 345 6789",
      photo: null,
      rera_brn: null,
    },
    featured_image: "",
    images: [],
    gallery_urls: [],
    gallery_preview: [],
    description: "<p>Prime land plot in Dubai Hills Estate, perfect for building your dream villa. Premium location with easy access to amenities.</p>",
    amenities: [],
    furnishing: null,
    flooring: null,
    parking: null,
    video_url: null,
    payment_plans: [],
    display_title: "Prime Land Plot in Dubai Hills",
    listed_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    days_on_market: 20,
    views_count: 45,
    is_verified: false,
    is_off_plan: false,
  },
];

// ============== HELPERS ==============
function getDisplayPrice(price: any): string {
  if (!price) return 'Price on Request';
  if (price.is_price_on_request) return 'Price on Request';
  if (price.display) return price.display;
  if (price.amount) return `AED ${price.amount.toLocaleString()}`;
  return 'Price on Request';
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return 'Studio';
  const t = bedroom.toLowerCase().trim();
  if (t.includes('studio')) return 'Studio';
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return 'Studio';
    if (num === 1) return '1 Bedroom';
    return `${num} Bedrooms`;
  }
  return bedroom;
}

function getBathroomDisplay(bathrooms: string | null): string {
  if (!bathrooms) return '1 Bath';
  const match = bathrooms.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return '1 Bath';
    return `${num} Bath${num > 1 ? 's' : ''}`;
  }
  return bathrooms || '1 Bath';
}

function getAreaDisplay(area: any): string {
  if (!area) return 'N/A';
  if (area.display) return area.display;
  if (area.value) return `${area.value} sq.ft`;
  return 'N/A';
}

function getPropertyTypeLabel(type: string | null): string {
  if (!type) return 'Property';
  const map: Record<string, string> = {
    'villa': 'Villa',
    'apartment': 'Apartment',
    'townhouse': 'Townhouse',
    'penthouse': 'Penthouse',
    'land': 'Land / Plot',
  };
  return map[type.toLowerCase()] || type;
}

function getPropertyTypeIcon(type: string | null) {
  if (!type) return Building2;
  const map: Record<string, any> = {
    'villa': Home,
    'apartment': Building2,
    'townhouse': Building2,
    'penthouse': Maximize,
    'land': MapPin,
  };
  return map[type.toLowerCase()] || Building2;
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

// ─── GALLERY IMAGES FALLBACK ──────────────────────────────────────────
function getGalleryImages(property: any): string[] {
  const type = property.property_type?.toLowerCase() || 'property';
  
  const fallbackImages: Record<string, string[]> = {
    'villa': [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
    ],
    'apartment': [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop&q=80',
    ],
    'townhouse': [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80',
    ],
    'penthouse': [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
    ],
    'land': [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&h=600&fit=crop&q=80',
    ],
  };

  return fallbackImages[type] || [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80',
  ];
}

// ─── LOADER ──────────────────────────────────────────────────────────────
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
          Loading Property
        </motion.p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────

export default function SellPropertyDetailClient() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'plans'>('overview');

  // ─── Fetch Property ──────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const found = DUMMY_PROPERTIES.find(p => p.property_slug === slug);
      
      if (found) {
        setProperty(found);
      } else {
        setError('Property not found');
      }
      setLoading(false);
    }, 500);
  }, [slug]);

  // ─── Wishlist ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!property) return;
    try {
      const saved = JSON.parse(localStorage.getItem('property_wishlist') || '[]');
      setIsWishlisted(saved.includes(property.id));
    } catch {}
  }, [property]);

  const toggleWishlist = useCallback(() => {
    if (!property) return;
    setIsWishlisted(prev => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem('property_wishlist') || '[]');
        const updated = next ? [...saved, property.id] : saved.filter((id: number) => id !== property.id);
        localStorage.setItem('property_wishlist', JSON.stringify(updated));
      } catch {}
      return next;
    });
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!property) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.property_name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [property]);

  // ─── Gallery Images ──────────────────────────────────────────────────
  const galleryImages = useMemo(() => {
    if (!property) return [];
    const seen = new Set<string>();
    const add = (url: string) => { if (url && !seen.has(url)) seen.add(url); };
    
    if (property.featured_image) add(property.featured_image);
    if (property.gallery_urls) property.gallery_urls.forEach(add);
    if (property.gallery_images) property.gallery_images.forEach(add);
    if (property.images) property.images.forEach((img: any) => { if (img.url) add(img.url); });
    if (property.gallery_preview) property.gallery_preview.forEach(add);
    
    // Fallback images
    if (seen.size === 0) {
      const fallback = getGalleryImages(property);
      fallback.forEach(add);
    }
    return [...seen];
  }, [property]);

  // ─── Render States ────────────────────────────────────────────────────

  if (loading) return <PageLoader />;

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1 className="text-2xl font-light text-[#192334]" style={{ fontFamily: FONT_DISPLAY }}>Property Not Found</h1>
          <p className="text-sm text-red-500 my-4">{error || 'The property you are looking for does not exist.'}</p>
          <Link
            href="/sell-properties-in-dubai"
            className="inline-block bg-[#192334] px-6 py-2.5 text-[11px] tracking-widest text-white hover:bg-[#2a3a4a]"
          >
            ← All Properties for Sale
          </Link>
        </div>
      </div>
    );
  }

  // ─── Derived Data ────────────────────────────────────────────────────

  const location = property.location?.community || property.location?.city || 'Dubai';
  const refNumber = property.ref_number || `LN${property.id}`;
  const lat = property.location?.latitude ?? 25.0657;
  const lng = property.location?.longitude ?? 55.1713;
  const priceDisplay = getDisplayPrice(property.price);
  const bedroomDisplay = getBedroomDisplay(property.bedrooms);
  const bathroomDisplay = getBathroomDisplay(property.bathrooms);
  const areaDisplay = getAreaDisplay(property.area);
  const propertyType = getPropertyTypeLabel(property.property_type);
  const PropertyTypeIcon = getPropertyTypeIcon(property.property_type);
  const daysAgo = property.created_at ? getDaysAgo(property.created_at) : '';
  const isVerified = property.is_verified || false;
  const isOffPlan = property.is_off_plan || false;

  const specs = [
    { icon: BedDouble, label: bedroomDisplay },
    { icon: Bath, label: bathroomDisplay },
    { icon: Maximize, label: areaDisplay },
    { icon: PropertyTypeIcon, label: propertyType },
  ].filter(s => s.label);

  const hasGallery = galleryImages.length > 0;
  const mainImage = hasGallery ? galleryImages[activeIndex % galleryImages.length] : null;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>

      {/* ─── Breadcrumb ── */}
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600">Home</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/sell-properties-in-dubai" className="hover:text-gray-600">Properties for Sale</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">{property.property_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleWishlist} className={`flex h-9 w-9 items-center justify-center border transition-all ${
                isWishlisted ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500'
              }`}>
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Header ── */}
      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.featured && (
                <span className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-white" style={{ backgroundColor: THEME.accent }}>Featured</span>
              )}
              {isVerified && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="h-2.5 w-2.5" /> Verified
                </span>
              )}
              {isOffPlan && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="h-2.5 w-2.5" /> Off Plan
                </span>
              )}
              {propertyType && (
                <span className="px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-purple-50 text-purple-700 border border-purple-200">
                  {propertyType}
                </span>
              )}
              {property.exclusive_status && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-amber-50 text-amber-700 border border-amber-200">
                  <Award className="h-2.5 w-2.5" /> {property.exclusive_status}
                </span>
              )}
            </div>

            <h1 className="text-[24px] leading-tight sm:text-[32px] md:text-[38px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {property.property_name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location}</span>
              </div>
              {property.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Listed {daysAgo}</span>
                </div>
              )}
              {property.views_count && property.views_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{property.views_count} views</span>
                </div>
              )}
            </div>

            {property.developer?.name && (
              <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: THEME.muted }}>
                <Building2 className="h-3.5 w-3.5" />
                <span>by {property.developer.name}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: THEME.muted }}>
              Sale Price
            </p>
            <p className="text-[26px] sm:text-[32px] font-light leading-none" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
              {priceDisplay}
            </p>
            {property.price?.rental_price && (
              <p className="mt-1 text-[11px]" style={{ color: THEME.muted }}>
                Rental: AED {property.price.rental_price.toLocaleString()}
              </p>
            )}
            <p className="mt-2 text-[9px]" style={{ color: THEME.muted }}>Ref: {refNumber}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {specs.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2" style={{ borderColor: THEME.border }}>
              <Icon className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>{label}</span>
            </div>
          ))}
          {property.days_on_market !== null && (
            <div className="flex items-center gap-2 rounded-[3px] border px-3.5 py-2" style={{ borderColor: THEME.border }}>
              <Clock className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
              <span className="text-[11px] font-medium" style={{ color: THEME.primary }}>{property.days_on_market} days on market</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Gallery ── */}
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/9] group cursor-pointer" onClick={() => setShowModal(true)}>
          {mainImage ? (
            <img src={mainImage} alt={property.property_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Building2 className="h-16 w-16 text-gray-300" /></div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 flex gap-2">
            {hasGallery && (
              <button onClick={e => { e.stopPropagation(); setShowModal(true); }} className="flex items-center gap-1.5 bg-white/95 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-800 backdrop-blur-sm hover:bg-white">
                <Grid3x3 className="h-3.5 w-3.5" /> All Photos ({galleryImages.length})
              </button>
            )}
          </div>

          {hasGallery && galleryImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setActiveIndex(i => (i - 1 + galleryImages.length) % galleryImages.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveIndex(i => (i + 1) % galleryImages.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {hasGallery && galleryImages.length > 1 && (
          <div className="mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {galleryImages.slice(0, 6).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                    i === activeIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={i === activeIndex ? { outline: `2px solid ${THEME.primary}`, outlineOffset: '-1px' } : {}}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Content ── */}
      <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex border-b mb-8" style={{ borderColor: THEME.border }}>
              {(['overview', 'amenities'] as const)
                .filter(tab => {
                  if (tab === 'amenities') return property.amenities?.length > 0;
                  return true;
                })
                .map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? 'border-current' : 'border-transparent hover:text-gray-700'
                    }`}
                    style={activeTab === tab ? { color: THEME.primary, borderColor: THEME.primary } : { color: THEME.muted }}
                  >
                    {tab === 'overview' ? 'Overview' : `Amenities (${property.amenities?.length || 0})`}
                  </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-[20px] sm:text-[24px] leading-snug mb-4" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                    {property.display_title || property.property_name}
                  </h2>

                  {property.description ? (
                    <div className="prose prose-sm max-w-none text-[13px] leading-relaxed" style={{ color: '#4A5462' }} dangerouslySetInnerHTML={{ __html: property.description }} />
                  ) : (
                    <p className="text-[13px] leading-relaxed" style={{ color: '#4A5462' }}>
                      Welcome to {property.property_name}, a distinguished property in {location}, Dubai.
                    </p>
                  )}

                  <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-8 sm:grid-cols-3" style={{ borderColor: THEME.border }}>
                    {[
                      { label: 'Property Type', value: propertyType },
                      { label: 'Bedrooms', value: bedroomDisplay },
                      { label: 'Bathrooms', value: bathroomDisplay },
                      { label: 'Area', value: areaDisplay },
                      { label: 'Furnishing', value: property.furnishing || 'N/A' },
                      { label: 'Parking', value: property.parking || 'N/A' },
                      { label: 'DLD Permit', value: property.dld_permit || 'N/A' },
                      { label: 'RERA No.', value: property.rera_number || 'N/A' },
                      { label: 'Days on Market', value: property.days_on_market ? `${property.days_on_market} days` : 'N/A' },
                      { label: 'Ref Number', value: refNumber },
                    ]
                      .filter(item => item.value && item.value !== 'N/A')
                      .map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: THEME.muted }}>{label}</p>
                          <p className="text-[12px] font-medium" style={{ color: THEME.primary }}>{value}</p>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'amenities' && property.amenities?.length > 0 && (
                <motion.div
                  key="amenities"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {property.amenities.map((amenity: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 border rounded-[3px] px-4 py-3" style={{ borderColor: THEME.border }}>
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: THEME.accent }} />
                        <span className="text-[12px]" style={{ color: THEME.primary }}>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enquiry */}
          <aside id="enquiry">
            <div className="sticky top-6">
              <div className="border bg-white" style={{ borderColor: THEME.border }}>
                <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
                  <h3 className="text-[16px] font-normal text-white" style={{ fontFamily: FONT_DISPLAY }}>
                    Request Information
                  </h3>
                  <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">Get in touch about {property.property_name}</p>
                </div>
                <div className="p-5">
                  <form className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input type="text" placeholder="Your full name" className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] focus:border-gray-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input type="tel" placeholder="+971 50 000 0000" className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] focus:border-gray-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input type="email" placeholder="you@email.com" className="mt-1.5 w-full border border-gray-200 px-3 py-2.5 text-[12px] focus:border-gray-400 focus:outline-none" />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white hover:opacity-90"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Submit
                    </button>
                  </form>
                </div>
              </div>
              {property.agent?.phone && (
                <a href={`tel:${property.agent.phone}`} className="mt-3 flex items-center justify-center gap-2 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-gray-50" style={{ borderColor: THEME.border, color: THEME.primary }}>
                  <Phone className="h-3.5 w-3.5" /> Call Agent
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Map ── */}
      <div className="mx-auto max-w-[1180px] px-4 pb-12 md:px-6">
        <div className="mb-6 flex items-baseline gap-3">
          <h2 className="text-[20px] sm:text-[24px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>Location</h2>
          <span className="h-px flex-1" style={{ backgroundColor: THEME.border }} />
        </div>
        <div className="overflow-hidden rounded-[3px] border" style={{ borderColor: THEME.border }}>
          <div className="h-[300px] sm:h-[400px]">
            <iframe width="100%" height="100%" style={{ border: 0 }} src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`} allowFullScreen />
          </div>
        </div>
      </div>

      {/* ─── Gallery Modal ── */}
      <AnimatePresence>
        {showModal && hasGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/97"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-[11px] tracking-[0.2em] text-white/50">
                {activeIndex + 1} <span className="text-white/25">/</span> {galleryImages.length}
              </span>
              <button onClick={() => setShowModal(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-16">
              <button
                onClick={() => setActiveIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-105"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <AnimatePresence mode="sync">
                <motion.img
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  src={galleryImages[activeIndex]}
                  alt={`Photo ${activeIndex + 1}`}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </AnimatePresence>

              <button
                onClick={() => setActiveIndex(i => (i + 1) % galleryImages.length)}
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-105"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="pb-6 pt-4">
              <div className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden transition-all duration-200 ${
                      i === activeIndex ? 'ring-2 ring-white opacity-100 scale-105' : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 sm:hidden" style={{ borderColor: THEME.border }}>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/971502590071?text=I'm%20interested%20in%20${encodeURIComponent(property.property_name)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 hover:bg-emerald-50"
            style={{ borderColor: '#10b981' }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <button
            onClick={() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })}
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