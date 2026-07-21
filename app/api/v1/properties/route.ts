// app/api/v1/properties/route.ts - OPTIMIZED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { 
  getProperties,
  getPropertyById,
  getPropertyBySlug,
  getFeaturedProperties,
  getRecentProperties,
  getRelatedProperties,
  getSearchFilters,
  type PropertyFilters,
} from '@/lib/models/properties';
import { db } from '@/lib/database';
import { fixPropertiesPrices, fixPropertyPrice } from '@/lib/utils/formatPrice';

const DEFAULT_LIMIT = 20; // ✅ Default 20 per page
const MAX_LIMIT = 100; // ✅ Max 100 per page

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    
    // ✅ PAGINATION PARAMS
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));
    const showAll = searchParams.get('show_all') === 'true';

    // ─── SINGLE PROPERTY BY SLUG ────────────────────────────────────
    if (slug) {
      const property = await getPropertyBySlug(slug);
      if (!property) {
        return NextResponse.json({ 
          success: false, 
          message: 'Property not found' 
        }, { status: 404 });
      }
      const fixedProperty = fixPropertyPrice(property);
      return NextResponse.json({
        success: true,
        data: fixedProperty,
        meta: { slug, timestamp: new Date().toISOString() }
      });
    }

    // ─── SINGLE PROPERTY BY ID ──────────────────────────────────────
    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getPropertyById(propertyId);
      if (!property) {
        return NextResponse.json({ 
          success: false, 
          message: 'Property not found' 
        }, { status: 404 });
      }
      const fixedProperty = fixPropertyPrice(property);
      return NextResponse.json({
        success: true,
        data: fixedProperty,
        meta: { id: propertyId, timestamp: new Date().toISOString() }
      });
    }

    // ─── FEATURED PROPERTIES ────────────────────────────────────────
    if (action === 'featured') {
      const featuredLimit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10')), 50);
      const result = await getFeaturedProperties(featuredLimit);
      const fixedData = fixPropertiesPrices(result.data);
      
      return NextResponse.json({
        success: true,
        data: fixedData,
        meta: {
          total: fixedData.length,
          limit: featuredLimit,
          action: 'featured',
          timestamp: new Date().toISOString()
        }
      });
    }

    // ─── RECENT PROPERTIES ──────────────────────────────────────────
    if (action === 'recent') {
      const recentLimit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10')), 50);
      const result = await getRecentProperties(recentLimit);
      const fixedData = fixPropertiesPrices(result.data);
      
      return NextResponse.json({
        success: true,
        data: fixedData,
        meta: {
          total: fixedData.length,
          limit: recentLimit,
          action: 'recent',
          timestamp: new Date().toISOString()
        }
      });
    }

    // ─── RELATED PROPERTIES ─────────────────────────────────────────
    if (action === 'related') {
      const propertyId = parseInt(searchParams.get('property_id') || '0', 10);
      const relatedLimit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '6')), 20);
      
      if (!propertyId) {
        return NextResponse.json({ 
          success: false, 
          error: 'property_id is required' 
        }, { status: 400 });
      }
      
      const result = await getRelatedProperties(propertyId, relatedLimit);
      const fixedData = fixPropertiesPrices(result.data);
      
      return NextResponse.json({
        success: true,
        data: fixedData,
        meta: {
          property_id: propertyId,
          limit: relatedLimit,
          action: 'related',
          timestamp: new Date().toISOString()
        }
      });
    }

    // ─── FILTERS ─────────────────────────────────────────────────────
    if (action === 'filters') {
      const filters = await getSearchFilters();
      return NextResponse.json({ 
        success: true, 
        data: filters,
        meta: { timestamp: new Date().toISOString() }
      });
    }

    // ─── LIST PROPERTIES WITH PAGINATION ────────────────────────────
    // ✅ Build filters from query params
    const filters: PropertyFilters = { 
      page, 
      limit,
    };
    
    if (searchParams.get('status')) {
      filters.status = parseInt(searchParams.get('status')!, 10);
    }
    if (searchParams.get('listing_type')) {
      filters.listing_type = searchParams.get('listing_type')!;
    }
    if (searchParams.get('property_type')) {
      filters.property_type = searchParams.get('property_type')!;
    }
    if (searchParams.get('property_purpose')) {
      filters.property_purpose = searchParams.get('property_purpose')!;
    }
    if (searchParams.get('city_id')) {
      filters.city_id = parseInt(searchParams.get('city_id')!, 10);
    }
    if (searchParams.get('community_id')) {
      filters.community_id = parseInt(searchParams.get('community_id')!, 10);
    }
    if (searchParams.get('min_price')) {
      filters.min_price = parseFloat(searchParams.get('min_price')!);
    }
    if (searchParams.get('max_price')) {
      filters.max_price = parseFloat(searchParams.get('max_price')!);
    }
    if (searchParams.get('min_bedrooms')) {
      filters.min_bedrooms = parseInt(searchParams.get('min_bedrooms')!, 10);
    }
    if (searchParams.get('max_bedrooms')) {
      filters.max_bedrooms = parseInt(searchParams.get('max_bedrooms')!, 10);
    }
    if (searchParams.get('bedrooms')) {
      const bedroom = searchParams.get('bedrooms')!;
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
    if (searchParams.get('keyword')) {
      filters.keyword = searchParams.get('keyword')!;
    }
    if (searchParams.get('featured') === 'true') {
      filters.featured = true;
    }
    if (searchParams.get('sort_by')) {
      filters.sort_by = searchParams.get('sort_by') as any;
    }

    // ✅ If show_all is true, fetch all with high limit
    if (showAll) {
      filters.limit = 9999;
    }

    // ✅ Execute query with pagination
    const result = await getProperties(filters);
    
    // ✅ Fix prices
    const fixedData = fixPropertiesPrices(result.data);
    
    // ✅ Calculate pagination
    const total = result.meta?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: fixedData,
      meta: {
        total,
        page,
        limit: showAll ? total : limit,
        totalPages: showAll ? 1 : totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
        action: 'list',
        filters: {
          status: filters.status || null,
          listing_type: filters.listing_type || null,
          property_type: filters.property_type || null,
          min_price: filters.min_price || null,
          max_price: filters.max_price || null,
          bedrooms: searchParams.get('bedrooms') || null,
          keyword: filters.keyword || null,
        },
        show_all: showAll,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Unknown error',
    }, { status: 500 });
  }
}

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
export const revalidate = 300;