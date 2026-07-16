// app/api/v1/properties/rent/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import {
  getRentProperties,
  getRentPropertyBySlug,
  getRentPropertyById,
  getRentStatistics,
  getFeaturedRentProperties,
  getRecentRentProperties,
  getRentByBedroom,
  getRentByPriceRange,
  type RentFilters,
} from '@/lib/models/rent-properties';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_TTL = 300;
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

// ─── FIX BATCH PROPERTIES ─────────────────────────────────────────────

function fixPropertiesPrices(properties: any[]): any[] {
  if (!properties || !Array.isArray(properties)) return [];
  return properties.map(property => fixPropertyPrice(property));
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

// ─── CACHE ─────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();

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

function getCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  return url.pathname + url.search;
}

// ─── VALIDATION ─────────────────────────────────────────────────────────

function validatePagination(page: number, limit: number) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
  return { page: validPage, limit: validLimit };
}

function validatePriceRange(minPrice: number, maxPrice: number) {
  const validMin = Math.max(0, minPrice);
  const validMax = Math.max(validMin, maxPrice);
  return { minPrice: validMin, maxPrice: validMax };
}

// ─── MAIN GET HANDLER ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const stats = searchParams.get('stats') === 'true';
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const sort = searchParams.get('sort') || 'newest';

    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    // ─── Check Cache ──────────────────────────────────────────────────
    const cacheKey = getCacheKey(request);
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        meta: { ...cachedData.meta, cached_at: new Date().toISOString() }
      });
    }

    // ─── ACTION: STATISTICS ──────────────────────────────────────────
    if (stats) {
      const result = await getRentStatistics();
      const response = {
        success: true,
        data: result,
        meta: {
          type: 'statistics',
          price_fixed: true,
          timestamp: new Date().toISOString()
        }
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── ACTION: FEATURED ────────────────────────────────────────────
    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getFeaturedRentProperties(featuredLimit);
      
      // Fix prices
      const fixedData = fixPropertiesPrices(result.data || []);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'featured',
          price_fixed: true,
          timestamp: new Date().toISOString()
        }
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── ACTION: RECENT ──────────────────────────────────────────────
    if (action === 'recent') {
      const recentLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getRecentRentProperties(recentLimit);
      
      // Fix prices
      const fixedData = fixPropertiesPrices(result.data || []);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'recent',
          price_fixed: true,
          timestamp: new Date().toISOString()
        }
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── GET BY SLUG ──────────────────────────────────────────────────
    if (slug) {
      const property = await getRentPropertyBySlug(slug);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Rent property not found' },
          { status: 404 }
        );
      }
      
      // Fix price for single property
      const fixedProperty = fixPropertyPrice(property);
      
      const response = {
        success: true,
        data: fixedProperty,
        meta: {
          slug,
          listing_type: 'Rent',
          price_fixed: true,
          timestamp: new Date().toISOString()
        }
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── GET BY ID ────────────────────────────────────────────────────
    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getRentPropertyById(propertyId);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Rent property not found' },
          { status: 404 }
        );
      }
      
      // Fix price for single property
      const fixedProperty = fixPropertyPrice(property);
      
      const response = {
        success: true,
        data: fixedProperty,
        meta: {
          id: propertyId,
          listing_type: 'Rent',
          price_fixed: true,
          timestamp: new Date().toISOString()
        }
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── BUILD FILTERS ─────────────────────────────────────────────────
    const bedroom = searchParams.get('bedroom');
    const minPrice = parseFloat(searchParams.get('min_price') || '0');
    const maxPrice = parseFloat(searchParams.get('max_price') || '0');
    const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);
    const keyword = searchParams.get('keyword');
    const developerId = searchParams.get('developer_id') ? parseInt(searchParams.get('developer_id')!, 10) : undefined;
    const communityId = searchParams.get('community_id') ? parseInt(searchParams.get('community_id')!, 10) : undefined;
    const cityId = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!, 10) : undefined;
    const featured = searchParams.get('featured') === 'true';

    const filters: RentFilters = {
      page: validPage,
      limit: validLimit,
      status: 5,
    };

    if (bedroom) {
      if (bedroom.toLowerCase() === 'studio') {
        filters.min_bedrooms = 0;
        filters.max_bedrooms = 0;
      } else {
        const num = parseInt(bedroom, 10);
        if (!isNaN(num)) {
          filters.min_bedrooms = num;
          filters.max_bedrooms = num;
        }
      }
    }

    if (validMin > 0) filters.min_price = validMin;
    if (validMax > 0) filters.max_price = validMax;
    if (keyword) filters.keyword = keyword;
    if (developerId) filters.developer_id = developerId;
    if (communityId) filters.community_id = communityId;
    if (cityId) filters.city_id = cityId;
    if (featured) filters.featured = true;
    if (sort) filters.sort_by = sort as any;

    // ─── FETCH PROPERTIES ─────────────────────────────────────────────
    let result: any;

    if (validMin > 0 || validMax > 0) {
      result = await getRentByPriceRange(validMin, validMax, validLimit);
    } else if (bedroom) {
      result = await getRentByBedroom(bedroom, validLimit);
    } else {
      result = await getRentProperties(filters);
    }

    // ─── FIX PRICES ──────────────────────────────────────────────────
    const fixedData = fixPropertiesPrices(result.data || []);

    const response = {
      success: true,
      data: fixedData,
      meta: {
        ...result.meta,
        action: 'rent',
        sort_by: sort || 'newest',
        filters: {
          bedroom: bedroom || null,
          min_price: validMin || null,
          max_price: validMax || null,
          keyword: keyword || null,
          developer_id: developerId || null,
          community_id: communityId || null,
          city_id: cityId || null,
          featured: featured || false,
        },
        price_fixed: true,
        total_price_fixed: fixedData.length,
        timestamp: new Date().toISOString(),
      },
    };

    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Rent API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch rent properties',
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