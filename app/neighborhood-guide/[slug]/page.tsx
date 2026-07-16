// app/neighborhood-guide/[slug]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  Loader2,
  MapPin,
  Calendar,
  Building2,
  Shield,
  ExternalLink,
  Check,
  MessageCircle,
  Globe,
  Home,
  Eye,
  Copy,
  TrendingUp,
  Clock,
  Map as MapIcon,
  Heart,
  Star,
  Phone,
  Mail,
} from 'lucide-react';

const API_URL = '/api/v1/neighborhoods';
const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: '#0F1C2E',
  secondary: '#1A2F4A',
  accent: '#C9A96E',
  accentLight: '#F5ECD7',
  muted: '#6B7A8D',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  image: string;
  latitude: string;
  longitude: string;
  description: string;
  city_id: number;
  city_name: string;
  status: number;
  featured: number;
  property_count: number;
}

function getImageUrl(image: string | null | undefined): string {
  if (!image) return '/images/placeholder-neighborhood.jpg';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return image;
  return image;
}

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

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
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-[6px] rounded-full border-2 border-transparent"
            style={{ borderBottomColor: THEME.primary, borderLeftColor: THEME.primary }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <motion.p
          className="mt-5 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: THEME.muted }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Neighborhood
        </motion.p>
      </div>
    </div>
  );
}

export default function NeighborhoodDetailPage() {
  console.log('🔍 NeighborhoodDetailPage rendered with slug:', useParams().slug);
  
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  console.log('📌 Current slug from params:', slug);
  console.log('📌 Type of slug:', typeof slug);
  
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect triggered with slug:', slug);
    
    if (!slug) {
      console.log('❌ No slug provided, returning early');
      return;
    }

    (async () => {
      console.log('🚀 Starting fetch for slug:', slug);
      setLoading(true);
      setError(null);
      
      try {
        // Try 1: Direct slug lookup
        const url = `${API_URL}/${slug}`;
        console.log('📡 Fetching from URL:', url);
        
        const res = await fetch(url);
        console.log('📡 Response status:', res.status);
        
        const data = await res.json();
        console.log('📡 Response data:', data);
        
        if (!res.ok || !data.success) {
          console.log('⚠️ First attempt failed, trying fallback');
          console.log('⚠️ Error:', data.message || 'Neighborhood not found');
          
          // Try 2: If slug is numeric, try ID lookup
          const numericId = parseInt(slug, 10);
          console.log('🔢 Numeric ID from slug:', numericId);
          console.log('🔢 Is NaN:', isNaN(numericId));
          
          if (!isNaN(numericId)) {
            console.log('🔄 Trying fallback with ID:', numericId);
            const fallbackRes = await fetch(`${API_URL}?id=${numericId}`);
            console.log('🔄 Fallback response status:', fallbackRes.status);
            
            const fallbackData = await fallbackRes.json();
            console.log('🔄 Fallback data:', fallbackData);
            
            if (fallbackData.success && fallbackData.data) {
              console.log('✅ Fallback successful!');
              setNeighborhood(fallbackData.data);
              setLoading(false);
              return;
            } else {
              console.log('❌ Fallback failed:', fallbackData.message);
            }
          }
          
          // Try 3: Try search with keyword
          console.log('🔄 Trying keyword search with:', slug);
          const searchRes = await fetch(`${API_URL}?keyword=${encodeURIComponent(slug)}&limit=1`);
          console.log('🔄 Search response status:', searchRes.status);
          
          const searchData = await searchRes.json();
          console.log('🔄 Search data:', searchData);
          
          if (searchData.success && searchData.data && searchData.data.length > 0) {
            console.log('✅ Search successful! Found:', searchData.data[0].name);
            setNeighborhood(searchData.data[0]);
            setLoading(false);
            return;
          }
          
          throw new Error(data.message || 'Neighborhood not found');
        }
        
        console.log('✅ Successfully fetched neighborhood:', data.data?.name);
        setNeighborhood(data.data);
        
      } catch (err: any) {
        console.log('❌ Error caught:', err.message);
        console.log('❌ Error stack:', err.stack);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('🏁 Fetch completed, loading set to false');
      }
    })();
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!neighborhood) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: neighborhood.name,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  }, [neighborhood]);

  console.log('🎯 Current state - loading:', loading, 'neighborhood:', neighborhood?.name, 'error:', error);

  if (loading) return <PageLoader />;

  if (error || !neighborhood) {
    console.log('❌ Showing error state - error:', error, 'hasNeighborhood:', !!neighborhood);
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center px-4">
          <MapIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1 className="text-2xl font-light mb-2" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
            Neighborhood Not Found
          </h1>
          <p className="text-sm text-red-500 mb-6">{error || 'The neighborhood you are looking for does not exist.'}</p>
          <div className="mb-4 p-4 bg-gray-100 rounded text-xs text-left">
            <p><strong>Debug Info:</strong></p>
            <p>Slug: {slug}</p>
            <p>Error: {error || 'No error'}</p>
            <p>Has data: {neighborhood ? 'Yes' : 'No'}</p>
          </div>
          <Link
            href="/neighborhoods"
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <ArrowLeft className="h-4 w-4" />
            All Neighborhoods
          </Link>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering neighborhood detail for:', neighborhood.name);
  
  const description = stripHtml(neighborhood.description);
  const imageSrc = imageError
    ? '/images/placeholder-neighborhood.jpg'
    : getImageUrl(neighborhood.image);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_BODY }}>
      <div className="border-b" style={{ borderColor: THEME.border, backgroundColor: THEME.surface }}>
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/neighborhoods" className="hover:text-gray-600 transition-colors">
                Neighborhoods
              </Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="truncate max-w-[120px] sm:max-w-none text-gray-500">
                {neighborhood.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {neighborhood.featured === 1 && (
                <span className="rounded-[3px] bg-[#C9A96E] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.12em] text-white shadow-sm">
                  Featured
                </span>
              )}
              <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-gray-100 text-gray-700 border border-gray-200">
                <Globe className="h-2.5 w-2.5" />
                {neighborhood.city_name || 'Dubai'}
              </span>
              {neighborhood.property_count > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Home className="h-2.5 w-2.5" />
                  {neighborhood.property_count} properties
                </span>
              )}
            </div>

            <h1
              className="text-[28px] leading-tight sm:text-[36px] md:text-[44px]"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              {neighborhood.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]" style={{ color: THEME.muted }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{neighborhood.city_name || 'Dubai'}, UAE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="relative overflow-hidden bg-gray-100 rounded-[8px] aspect-[16/7]">
          <img
            src={imageSrc}
            alt={neighborhood.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {neighborhood.featured === 1 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#C9A96E] fill-[#C9A96E]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                Featured Neighborhood
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[880px] px-4 py-10 md:px-6">
        {description && (
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-[15px] leading-relaxed text-[#333]"
              dangerouslySetInnerHTML={{ __html: neighborhood.description }} 
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8" style={{ borderColor: THEME.border }}>
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-[4px]">
            <Home className="h-5 w-5 text-[#C9A96E]" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">Properties</p>
              <p className="text-[16px] font-semibold" style={{ color: THEME.primary }}>
                {neighborhood.property_count || 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-[4px]">
            <Globe className="h-5 w-5 text-[#C9A96E]" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">City</p>
              <p className="text-[16px] font-semibold" style={{ color: THEME.primary }}>
                {neighborhood.city_name || 'Dubai'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-[4px]">
            <MapPin className="h-5 w-5 text-[#C9A96E]" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#6B7A8D]">Location</p>
              <p className="text-[16px] font-semibold" style={{ color: THEME.primary }}>
                {neighborhood.latitude && neighborhood.longitude ? 'Available' : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {neighborhood.latitude && neighborhood.longitude && (
          <div className="mt-8 border-t pt-8" style={{ borderColor: THEME.border }}>
            <h3
              className="text-[20px] mb-4"
              style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}
            >
              Location Map
            </h3>
            <div className="overflow-hidden rounded-[8px] border shadow-sm" style={{ borderColor: THEME.border }}>
              <div className="h-[350px] w-full">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${neighborhood.latitude},${neighborhood.longitude}&zoom=14`}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-8" style={{ borderColor: THEME.border }}>
          <Link
            href={`/properties?neighborhood=${neighborhood.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition-all hover:opacity-90"
            style={{ backgroundColor: THEME.primary }}
          >
            <Home className="h-3.5 w-3.5" />
            View Properties in {neighborhood.name}
          </Link>
          <Link
            href="/neighborhoods"
            className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-70"
            style={{ color: THEME.primary }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Neighborhoods
          </Link>
        </div>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  );
}