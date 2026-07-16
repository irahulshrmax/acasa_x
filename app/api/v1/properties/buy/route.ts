// app/api/v1/properties/buy/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { 
  getBuyPropertiesStatistics,
  getBuyPropertiesByBedroom,
  getBuyPropertiesByPriceRange,
  getOffPlanProperties,
} from '@/lib/models/properties';
import { db } from '@/lib/database';
import { createZohoDeal } from '@/lib/zoho/deal';
import { searchZohoContactByEmail, createZohoContact } from '@/lib/zoho/contact';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_TTL = 300;
const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

// ─── TYPES ──────────────────────────────────────────────────────────────

interface BuyStatistics {
  total: number;
  with_price: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  by_bedroom: any[];
  by_listing_type: any[];
}

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
  return {
    page: Math.max(1, page),
    limit: Math.min(MAX_LIMIT, Math.max(1, limit)),
  };
}

// ─── GET: Fetch Buy Properties ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const stats = searchParams.get('stats') === 'true';
    const byBedroom = searchParams.get('by_bedroom');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const sortBy = searchParams.get('sort_by') || 'newest';
    const keyword = searchParams.get('keyword') || undefined;
    const developerId = searchParams.get('developer_id');
    const communityId = searchParams.get('community_id');
    const cityId = searchParams.get('city_id');

    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    // ─── Check Cache ──────────────────────────────────────────────
    const cacheKey = getCacheKey(request);
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        meta: { ...cachedData.meta, cached_at: new Date().toISOString() }
      });
    }

    // ─── ACTION: STATISTICS ──────────────────────────────────────
    if (stats) {
      const result = await getBuyPropertiesStatistics() as BuyStatistics;
      
      const response = {
        success: true,
        data: {
          total: result?.total || 0,
          with_price: result?.with_price || 0,
          min_price: result?.min_price || null,
          max_price: result?.max_price || null,
          avg_price: result?.avg_price || null,
          by_bedroom: result?.by_bedroom || [],
          by_listing_type: result?.by_listing_type || [],
        },
        meta: {
          type: 'buy_statistics',
          price_fixed: true,
          timestamp: new Date().toISOString(),
        },
        cached: false,
      };
      
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── FILTER: BY BEDROOM ──────────────────────────────────────
    if (byBedroom) {
      const result = await getBuyPropertiesByBedroom(byBedroom, validLimit);
      
      // Fix prices
      const fixedData = fixPropertiesPrices(result?.data || []);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result?.meta,
          filter: { bedroom: byBedroom },
          price_fixed: true,
          timestamp: new Date().toISOString(),
        },
        cached: false,
      };
      
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── FILTER: BY PRICE RANGE ──────────────────────────────────
    if (minPrice && maxPrice) {
      const result = await getBuyPropertiesByPriceRange(
        parseInt(minPrice),
        parseInt(maxPrice),
        validLimit
      );
      
      // Fix prices
      const fixedData = fixPropertiesPrices(result?.data || []);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result?.meta,
          filter: { min_price: parseInt(minPrice), max_price: parseInt(maxPrice) },
          price_fixed: true,
          timestamp: new Date().toISOString(),
        },
        cached: false,
      };
      
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    // ─── FILTER: ADVANCED SEARCH ──────────────────────────────────
    const filters: any = { 
      page: validPage, 
      limit: validLimit, 
      status: 5,
      listing_type: 'Off plan',
      sort_by: sortBy,
    };
    
    if (keyword) filters.keyword = keyword;
    if (developerId) filters.developer_id = parseInt(developerId);
    if (communityId) filters.community_id = parseInt(communityId);
    if (cityId) filters.city_id = parseInt(cityId);
    if (minPrice) filters.min_price = parseInt(minPrice);
    if (maxPrice) filters.max_price = parseInt(maxPrice);
    
    const bedroomFilter = searchParams.get('bedroom');
    if (bedroomFilter) {
      if (bedroomFilter.toLowerCase() === 'studio') {
        filters.min_bedrooms = 0;
        filters.max_bedrooms = 0;
      } else {
        const num = parseInt(bedroomFilter, 10);
        if (!isNaN(num)) {
          filters.min_bedrooms = num;
          filters.max_bedrooms = num;
        }
      }
    }

    // ─── Get Properties ──────────────────────────────────────────
    const result = await getOffPlanProperties(filters);
    
    // Fix prices
    const fixedData = fixPropertiesPrices(result?.data || []);
    
    const response = {
      success: true,
      data: fixedData,
      meta: {
        ...result?.meta,
        filters: {
          bedroom: bedroomFilter || null,
          min_price: minPrice || null,
          max_price: maxPrice || null,
          sort_by: sortBy,
          keyword: keyword || null,
          developer_id: developerId || null,
          community_id: communityId || null,
          city_id: cityId || null,
        },
        price_fixed: true,
        timestamp: new Date().toISOString(),
      },
      cached: false,
    };
    
    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching buy properties:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch buy properties', 
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ─── POST: Create Buy Property Enquiry ─────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Buy property enquiry:', body);

    // ─── Validation ──────────────────────────────────────────────
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const knex = await db();

    // ─── Check if user exists ────────────────────────────────────
    let userId = null;
    const [existingUser] = await knex('users')
      .where('email', body.email.toLowerCase())
      .select('id', 'full_name');
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('✅ Existing user found:', userId);
    }

    // ─── Check if user already in Zoho ──────────────────────────
    let zohoContactResult = null;
    let zohoDealResult = null;

    try {
      // ─── Check if contact exists ──────────────────────────────
      const existingContact = await searchZohoContactByEmail(body.email);

      if (existingContact.success && existingContact.data && existingContact.data.length > 0) {
        zohoContactResult = {
          success: true,
          id: existingContact.data[0].id,
          existing: true,
          message: 'Contact already exists in Zoho',
        };
        console.log('✅ Contact exists in Zoho:', existingContact.data[0].id);
      } else {
        // ─── Create new contact ──────────────────────────────────
        const firstName = body.name.split(' ')[0] || body.name;
        const lastName = body.name.split(' ').slice(1).join(' ') || '';
        
        zohoContactResult = await createZohoContact({
          First_Name: firstName,
          Last_Name: lastName,
          Email: body.email,
          Phone: body.phone,
          Mobile: body.phone,
          Company: 'ACASA Website',
          Description: `Buy property enquiry from ACASA website\nBudget: ${body.budget || 'N/A'}\nLocation: ${body.location || 'N/A'}\nProperty: ${body.property_name || 'N/A'}`,
          Source: 'Website - Buy',
          Lead_Status: 'New',
          Website: 'https://acasa.ae',
        });
        console.log('📡 Zoho contact result:', zohoContactResult);
      }

      // ─── Create Deal ───────────────────────────────────────────
      if (zohoContactResult?.success) {
        const dealName = `${body.name} - Buy Property${body.property_name ? ` (${body.property_name})` : ''}`;
        
        zohoDealResult = await createZohoDeal({
          Deal_Name: dealName,
          Stage: 'Qualification',
          Amount: body.budget || 0,
          Description: `Buy property enquiry\nBudget: ${body.budget || 'N/A'}\nLocation: ${body.location || 'N/A'}\nProperty: ${body.property_name || 'N/A'}\nMessage: ${body.message || 'N/A'}`,
          Property_ID: body.property_id ? String(body.property_id) : '',
          Property_Name: body.property_name || '',
          Enquiry_Type: 'Buy Property',
          Contact_Person: body.name,
          Contact_Email: body.email,
          Contact_Phone: body.phone,
          Lead_Source: 'Website - Buy',
        });
        console.log('📡 Zoho deal result:', zohoDealResult);
      }

    } catch (zohoError: any) {
      console.error('❌ Zoho sync error:', zohoError.message);
      // Don't fail the request
    }

    // ─── Save to DB ──────────────────────────────────────────────
    const [result] = await knex('property_enquiries').insert({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      message: body.message || null,
      enquiry_type: 'Buy Property',
      source: body.source || 'Website - Buy',
      property_id: body.property_id || null,
      property_name: body.property_name || null,
      budget: body.budget || null,
      location: body.location || null,
      user_id: userId,
      zoho_contact_id: zohoContactResult?.id || null,
      zoho_deal_id: zohoDealResult?.id || null,
      zoho_synced: zohoContactResult?.success ? 1 : 0,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Buy enquiry saved to DB, ID:', result);

    return NextResponse.json({
      success: true,
      message: 'Buy enquiry submitted successfully!',
      data: {
        enquiry_id: result,
        zoho: {
          contact: zohoContactResult,
          deal: zohoDealResult,
        },
      },
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating buy enquiry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit buy enquiry',
        message: error.message,
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';