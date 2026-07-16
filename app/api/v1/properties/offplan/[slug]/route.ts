// app/api/v1/properties/offplan/[id]/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOffPlanPropertyBySlug,
  getOffPlanPropertyById,
  getOffPlanProperties,
} from '@/lib/models/properties';

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
  sale_price: number | null;
  listing_price: number | null;
  rental_price: number | null;
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
}

interface PropertyDeveloper {
  id: number | null;
  name: string | null;
  country: string | null;
  website: string | null;
  informations: string | null;
  logo_url: string | null;
  is_international: boolean;
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
  path?: string | null;
  full_url?: string;
  title?: string | null;
  description?: string | null;
  featured?: number | null;
  media_order?: number | null;
  url_variations?: string[];
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
  slug: string | null;
}

interface OffPlanDetails {
  completion_date: string | null;
  occupancy: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  rera_number: string | null;
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
  created_at: Date | null;
  updated_at: Date | null;
  price: PropertyPrice;
  bedrooms: string;
  bathrooms: string;
  area: PropertyArea;
  location: PropertyLocation;
  developer: PropertyDeveloper;
  agent: PropertyAgent;
  images: PropertyImage[];
  featured_image_url: string;
  gallery_images: string[];
  gallery_preview: string[];
  media_base_url: string;
  description: string | null;
  video_url: string | null;
  furnishing: string | null;
  amenities: string[];
  payment_plans: PaymentPlan[];
  facilities: any;
  location_data: any;
  is_off_plan: boolean;
  off_plan_details: OffPlanDetails;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    
    const includeSimilar = searchParams.get('similar') !== 'false';
    const similarLimit = parseInt(searchParams.get('similar_limit') || '6', 10);

    const cacheKey = `offplan:property:${idOrSlug}`;
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

    if (!isNaN(parseInt(idOrSlug))) {
      property = await getOffPlanPropertyById(parseInt(idOrSlug));
    } else {
      property = await getOffPlanPropertyBySlug(idOrSlug);
    }

    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Off-plan property not found',
          error: `No off-plan property found for: ${idOrSlug}`
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
      listing_type: fixedProperty.listing_type || null,
      property_type: fixedProperty.property_type || null,
      property_purpose: fixedProperty.property_purpose || null,
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
        sale_price: fixedProperty.price?.sale_price || null,
        listing_price: fixedProperty.price?.listing_price || null,
        rental_price: fixedProperty.price?.rental_price || null,
      },
      
      bedrooms: fixedProperty.bedrooms || fixedProperty.bedroom || 'Studio',
      bathrooms: fixedProperty.bathrooms || '1 Bath',
      
      area: fixedProperty.area || {
        value: null,
        display: 'Area on Request',
        size: null,
      },
      
      location: fixedProperty.location || {
        community: null,
        community_slug: null,
        sub_community: null,
        city: null,
        latitude: fixedProperty.map_latitude || null,
        longitude: fixedProperty.map_longitude || null,
        community_id: fixedProperty.community_id || null,
      },
      
      developer: fixedProperty.developer || {
        id: null,
        name: null,
        country: null,
        website: null,
        informations: null,
        logo_url: null,
        is_international: false,
      },
      
      agent: fixedProperty.agent || {
        id: null,
        name: null,
        phone: null,
        photo_url: null,
        rera_brn: null,
        email: null,
        mobile: null,
        about: null,
      },
      
      images: fixedProperty.images || [],
      featured_image_url: fixedProperty.featured_image_url || fixedProperty.image || '',
      gallery_images: fixedProperty.gallery_images || [],
      gallery_preview: fixedProperty.gallery_preview || [],
      media_base_url: fixedProperty.media_base_url || 'https://acasa.ae/upload',
      
      description: fixedProperty.description || null,
      video_url: fixedProperty.video_url || null,
      furnishing: fixedProperty.furnishing || null,
      amenities: fixedProperty.amenities || [],
      
      payment_plans: fixedProperty.payment_plans || [],
      
      facilities: fixedProperty.facilities || null,
      location_data: fixedProperty.location_data || null,
      
      is_off_plan: true,
      off_plan_details: {
        completion_date: fixedProperty.completion_date || null,
        occupancy: fixedProperty.occupancy || null,
        exclusive_status: fixedProperty.exclusive_status || null,
        dld_permit: fixedProperty.dld_permit || null,
        rera_number: fixedProperty.ReraNumber || null,
      },
      
      ref_number: fixedProperty.RefNumber || fixedProperty.ref_number || null,
      display_title: fixedProperty.display_title || fixedProperty.property_name || 'Property',
      
      seo: {
        title: fixedProperty.seo_title || fixedProperty.property_name || 'Property',
        description: fixedProperty.meta_description || fixedProperty.description?.slice(0, 160) || null,
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
          const result = await getOffPlanProperties({
            community_id: fixedProperty.community_id,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length && fixedProperty.property_type) {
          const result = await getOffPlanProperties({
            property_type: fixedProperty.property_type,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length) {
          const result = await getOffPlanProperties({
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
        listing_type: 'Off plan',
        has_similar: responseData.similar_properties.length > 0,
        similar_count: responseData.similar_properties.length,
        price_fixed: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Off-Plan Property API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch off-plan property', 
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