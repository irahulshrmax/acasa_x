// app/api/v1/properties/rent/[slug]/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { 
  getRentPropertyBySlug,
  getRentPropertyById,
  getRentProperties,
} from '@/lib/models/rent-properties';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

// ─── STRONG PRICE FIXER ───────────────────────────────────────────────

function fixPropertyPrice(property: any): any {
  if (!property) return property;

  // If price doesn't exist, create it
  if (!property.price) {
    property.price = {
      amount: null,
      amount_end: null,
      display: FALLBACK_DISPLAY,
      display_end: '',
      currency: DEFAULT_CURRENCY,
      symbol: DEFAULT_SYMBOL,
      is_price_on_request: true,
      sale_price: null,
      listing_price: null,
      rental_price: null,
    };
    return property;
  }

  const price = property.price;

  // ─── TRY TO GET AMOUNT FROM VARIOUS SOURCES ──────────────────────
  let amount = null;
  
  // Check all possible price fields
  if (price.amount && price.amount !== 'null' && !isNaN(parseFloat(price.amount))) {
    amount = parseFloat(price.amount);
  } else if (price.sale_price && price.sale_price !== 'null' && !isNaN(parseFloat(price.sale_price))) {
    amount = parseFloat(price.sale_price);
  } else if (price.listing_price && price.listing_price !== 'null' && !isNaN(parseFloat(price.listing_price))) {
    amount = parseFloat(price.listing_price);
  } else if (price.rental_price && price.rental_price !== 'null' && !isNaN(parseFloat(price.rental_price))) {
    amount = parseFloat(price.rental_price);
  } else if (price.amount_from && price.amount_from !== 'null' && !isNaN(parseFloat(price.amount_from))) {
    amount = parseFloat(price.amount_from);
  }

  // Store the amount
  price.amount = amount;

  // ─── GET CURRENCY AND SYMBOL ──────────────────────────────────────
  let currency = price.currency || DEFAULT_CURRENCY;
  let symbol = price.symbol || DEFAULT_SYMBOL;

  // Clean up null strings
  if (currency === 'null' || !currency) currency = DEFAULT_CURRENCY;
  if (symbol === 'null' || !symbol) symbol = DEFAULT_SYMBOL;

  price.currency = currency;
  price.symbol = symbol;

  // ─── GENERATE DISPLAY ─────────────────────────────────────────────
  if (amount && amount > 0) {
    // Format the amount with proper locale
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Use symbol if available, otherwise use currency code
    const prefix = (symbol && symbol !== 'null') ? symbol : currency;
    price.display = `${prefix} ${formattedAmount}`;

    // If there's an end amount, add range
    let amountEnd = null;
    if (price.amount_end && price.amount_end !== 'null' && !isNaN(parseFloat(price.amount_end))) {
      amountEnd = parseFloat(price.amount_end);
    } else if (price.amount_to && price.amount_to !== 'null' && !isNaN(parseFloat(price.amount_to))) {
      amountEnd = parseFloat(price.amount_to);
    }

    if (amountEnd && amountEnd > 0 && amountEnd !== amount) {
      const formattedEnd = Number(amountEnd).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      price.display = `${prefix} ${formattedAmount} - ${formattedEnd}`;
      price.display_end = `${prefix} ${formattedEnd}`;
      price.amount_end = amountEnd;
    }

    price.is_price_on_request = false;
  } else {
    // No valid amount found
    price.display = FALLBACK_DISPLAY;
    price.is_price_on_request = true;
  }

  // ─── FIX AMOUNT_END ───────────────────────────────────────────────
  if (!price.amount_end || price.amount_end === 'null') {
    price.amount_end = null;
  }

  return property;
}

// ─── FORMAT PRICE FOR DISPLAY ─────────────────────────────────────────

function formatPriceDisplay(price: any): string {
  if (!price) return FALLBACK_DISPLAY;
  
  if (price.display && !price.display.includes('null') && !price.display.startsWith('null ')) {
    return price.display;
  }
  
  const amount = price.amount || price.sale_price || price.listing_price || price.rental_price;
  if (!amount) return FALLBACK_DISPLAY;
  
  const currency = price.currency || DEFAULT_CURRENCY;
  const symbol = price.symbol || DEFAULT_SYMBOL;
  const prefix = (symbol && symbol !== 'null') ? symbol : currency;
  
  return `${prefix} ${Number(amount).toLocaleString()}`;
}

// ─── INTERFACES ─────────────────────────────────────────────────────────

interface PropertyPrice {
  amount: number | null;
  amount_end: number | null;
  display: string;
  display_end: string | null;
  currency: string;
  symbol: string;
  is_price_on_request: boolean;
  rental_price: number | null;
  sale_price: number | null;
  listing_price: number | null;
}

interface PropertyArea {
  value: number | null;
  size: string | null;
  display: string;
  min_area?: string | null;
  max_area?: string | null;
  area_end?: string | null;
}

interface PropertyLocation {
  community: string | null;
  community_slug: string | null;
  sub_community: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  community_id?: number | null;
  city_id?: number | null;
  address?: string | null;
}

interface PropertyDeveloper {
  id: number | null;
  name: string | null;
  country: string | null;
  website: string | null;
  informations: string | null;
  logo_url: string | null;
  logo_variations?: string[];
}

interface PropertyAgent {
  id: number | null;
  name: string | null;
  phone: string | null;
  photo_url: string | null;
  photo_variations?: string[];
  rera_brn?: string | null;
  email?: string | null;
  mobile?: string | null;
  about?: string | null;
}

interface PropertyImage {
  id?: number;
  url: string;
  title?: string | null;
  description?: string | null;
  featured?: number | null;
}

interface PaymentPlan {
  id: number;
  name: string | null;
  percentage: string | null;
  item_id: number | null;
  item_type?: string | null;
  status?: number | null;
}

interface PropertySEO {
  title: string;
  description: string | null;
  keywords: string | null;
  slug: string | null;
}

interface RentDetails {
  completion_date: string | null;
  occupancy: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  rera_number: string | null;
  furnishing: string | null;
  flooring: string | null;
  parking: string | null;
}

interface PropertyResponse {
  id: number;
  property_name: string;
  property_slug: string;
  listing_type: string | null;
  property_type: string | null;
  property_purpose: string | null;
  status: number;
  featured: boolean;
  created_at: string | null;
  updated_at: string | null;
  price: PropertyPrice;
  bedrooms: string;
  bathrooms: string;
  area: PropertyArea;
  location: PropertyLocation;
  developer: PropertyDeveloper;
  agent: PropertyAgent;
  images: PropertyImage[];
  featured_image_url: string;
  gallery_urls: string[];
  gallery_preview: string[];
  media_base_url: string;
  description: string | null;
  video_url: string | null;
  furnishing: string | null;
  amenities: string[];
  payment_plans: PaymentPlan[];
  facilities: any;
  location_data: any;
  is_rent: boolean;
  rent_details: RentDetails;
  ref_number: string | null;
  display_title: string;
  seo: PropertySEO;
  similar_properties: any[];
}

// ─── CACHE ─────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300;

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL * 1000) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCached(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

// ─── MAIN GET HANDLER ──────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const includeSimilar = searchParams.get('similar') !== 'false';
    const similarLimit = parseInt(searchParams.get('similar_limit') || '6', 10);

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    const cacheKey = `rent:property:${slug}`;
    let cachedProperty = getCached(cacheKey);
    
    if (cachedProperty) {
      return NextResponse.json({
        success: true,
        data: cachedProperty,
        cached: true,
        meta: { 
          timestamp: new Date().toISOString(),
          price_fixed: true 
        }
      });
    }

    let property: any;

    if (!isNaN(parseInt(slug))) {
      property = await getRentPropertyById(parseInt(slug));
    } else {
      property = await getRentPropertyBySlug(slug);
    }

    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rent property not found',
          error: `No rent property found for: ${slug}`
        },
        { status: 404 }
      );
    }

    // ─── FIX PRICE ──────────────────────────────────────────────────
    const fixedProperty = fixPropertyPrice(property);
    const formattedPrice = formatPriceDisplay(fixedProperty.price);

    // ─── BUILD RESPONSE WITH FIXED PRICE ──────────────────────────
    const responseData: PropertyResponse = {
      id: fixedProperty.id,
      property_name: fixedProperty.property_name || fixedProperty.name || 'Property',
      property_slug: fixedProperty.property_slug || fixedProperty.slug || '',
      listing_type: fixedProperty.listing_type || 'Rent',
      property_type: fixedProperty.property_type || null,
      property_purpose: fixedProperty.property_purpose || 'Rent',
      status: fixedProperty.status || 5,
      featured: fixedProperty.featured_property === '1' || fixedProperty.featured === true,
      created_at: fixedProperty.created_at || null,
      updated_at: fixedProperty.updated_at || null,
      
      price: {
        amount: fixedProperty.price?.amount || null,
        amount_end: fixedProperty.price?.amount_end || null,
        display: formattedPrice,
        display_end: fixedProperty.price?.display_end || null,
        currency: fixedProperty.price?.currency || DEFAULT_CURRENCY,
        symbol: fixedProperty.price?.symbol || DEFAULT_SYMBOL,
        is_price_on_request: fixedProperty.price?.is_price_on_request !== false,
        rental_price: fixedProperty.price?.rental_price || null,
        sale_price: fixedProperty.price?.sale_price || null,
        listing_price: fixedProperty.price?.listing_price || null,
      },
      
      bedrooms: fixedProperty.bedrooms || fixedProperty.bedroom || 'Studio',
      bathrooms: fixedProperty.bathrooms || '1 Bath',
      
      area: fixedProperty.area || {
        value: null,
        display: 'Area on Request',
        size: null,
      },
      
      location: {
        community: fixedProperty.location?.community || null,
        community_slug: fixedProperty.location?.community_slug || null,
        sub_community: fixedProperty.location?.sub_community || null,
        city: fixedProperty.location?.city || null,
        address: fixedProperty.location?.address || null,
        latitude: fixedProperty.location?.latitude || null,
        longitude: fixedProperty.location?.longitude || null,
        community_id: fixedProperty.location?.community_id || null,
        city_id: fixedProperty.location?.city_id || null,
      },
      
      developer: {
        id: fixedProperty.developer?.id || null,
        name: fixedProperty.developer?.name || null,
        country: fixedProperty.developer?.country || null,
        website: fixedProperty.developer?.website || null,
        informations: fixedProperty.developer?.informations || null,
        logo_url: fixedProperty.developer?.logo_url || null,
        logo_variations: fixedProperty.developer?.logo_variations || [],
      },
      
      agent: {
        id: fixedProperty.agent?.id || null,
        name: fixedProperty.agent?.name || null,
        phone: fixedProperty.agent?.phone || null,
        photo_url: fixedProperty.agent?.photo_url || null,
        rera_brn: fixedProperty.agent?.rera_brn || null,
        email: fixedProperty.agent?.email || null,
        mobile: fixedProperty.agent?.mobile || null,
        about: fixedProperty.agent?.about || null,
      },
      
      images: fixedProperty.images || [],
      featured_image_url: fixedProperty.featured_image || fixedProperty.featured_image_url || '',
      gallery_urls: fixedProperty.gallery_urls || [],
      gallery_preview: fixedProperty.gallery_preview || [],
      media_base_url: fixedProperty.media_base_url || 'https://acasa.ae/upload',
      
      description: fixedProperty.description || null,
      video_url: fixedProperty.video_url || null,
      furnishing: fixedProperty.furnishing || null,
      amenities: fixedProperty.amenities || [],
      
      payment_plans: fixedProperty.payment_plans || [],
      
      facilities: fixedProperty.facilities || null,
      location_data: fixedProperty.location_data || null,
      
      is_rent: true,
      rent_details: {
        completion_date: fixedProperty.completion_date || null,
        occupancy: fixedProperty.occupancy || null,
        exclusive_status: fixedProperty.exclusive_status || null,
        dld_permit: fixedProperty.dld_permit || null,
        rera_number: fixedProperty.rera_number || null,
        furnishing: fixedProperty.furnishing || null,
        flooring: fixedProperty.flooring || null,
        parking: fixedProperty.parking || null,
      },
      
      ref_number: fixedProperty.ref_number || fixedProperty.RefNumber || null,
      display_title: fixedProperty.display_title || fixedProperty.property_name || 'Property',
      
      seo: {
        title: fixedProperty.seo?.title || fixedProperty.property_name || 'Property for Rent',
        description: fixedProperty.seo?.description || fixedProperty.description?.slice(0, 160) || null,
        keywords: fixedProperty.seo?.keywords || null,
        slug: fixedProperty.property_slug || '',
      },
      
      similar_properties: [],
    };

    // ─── FETCH SIMILAR PROPERTIES ──────────────────────────────────
    if (includeSimilar) {
      try {
        let similarResult: { data: any[]; meta: any } = { data: [], meta: {} };
        const currentPropertyId = fixedProperty.id;

        if (fixedProperty.community_id) {
          const result = await getRentProperties({
            community_id: fixedProperty.community_id,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length && fixedProperty.property_type) {
          const result = await getRentProperties({
            property_type: fixedProperty.property_type,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length && fixedProperty.city_id) {
          const result = await getRentProperties({
            city_id: fixedProperty.city_id,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length) {
          const result = await getRentProperties({
            status: 5,
            limit: similarLimit + 1,
            page: 1,
            sort_by: 'newest',
          });
          similarResult = result;
        }

        // Fix prices for similar properties
        const fixedSimilar = similarResult.data
          .filter((p: any) => p.id !== currentPropertyId)
          .slice(0, similarLimit)
          .map((p: any) => fixPropertyPrice(p));

        responseData.similar_properties = fixedSimilar;

      } catch (error) {
        console.error('Error fetching similar properties:', error);
        responseData.similar_properties = [];
      }
    }

    setCached(cacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      meta: {
        id: fixedProperty.id,
        slug: fixedProperty.property_slug,
        listing_type: 'Rent',
        has_similar: responseData.similar_properties.length > 0,
        similar_count: responseData.similar_properties.length,
        price_fixed: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Rent Property API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch rent property', 
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ─── OPTIONS: CORS ─────────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';