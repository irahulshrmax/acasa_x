// app/api/v1/location/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { search, getSearchResult } from '@/lib/models/search';
import { cache } from '@/lib/cache';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CACHE_TTL = 300; // 5 minutes
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const DEFAULT_PAGE = 1;

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface LocationSearchParams {
  q?: string;
  type?: 'buy' | 'rent' | 'all';
  locations?: string[];
  page: number;
  limit: number;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  city_id?: number;
  community_id?: number;
  featured?: boolean;
  include_properties?: boolean;
  include_projects?: boolean;
}

interface SearchResultType {
  id: number;
  result_type: 'property' | 'project';
  name: string;
  slug: string;
  listing_type: string | null;
  price: number | null;
  price_display: string | null;
  bedroom: string | null;
  bathrooms: string | null;
  area: number | null;
  area_display: string | null;
  location: string | null;
  city_name: string | null;
  community_name: string | null;
  developer_name: string | null;
  description: string | null;
  featured_image: string | null;
  image_url: string;
  image_variations: string[];
  gallery_images: string[];
  completion_date: string | null;
  occupancy: string | null;
  property_type: string | null;
  furnishing: string | null;
  parking: string | null;
  rera_number: string | null;
  dld_permit: string | null;
  video_url: string | null;
  amenities: string[];
  status: number;
  created_at: string | null;
  updated_at: string | null;
  project_id?: number;
  ProjectName?: string;
  project_slug?: string;
  LogoUrl?: string | null;
  extra?: Record<string, any>;
}

interface CachedSearchResponse {
  data: {
    properties: SearchResultType[];
    projects: SearchResultType[];
    total_properties: number;
    total_projects: number;
    total: number;
  };
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    filters: {
      q: string;
      type: string;
      locations: string[];
      sort_by: string;
      min_price?: number;
      max_price?: number;
      min_bedrooms?: number;
      max_bedrooms?: number;
      city_id?: number;
      community_id?: number;
      featured: boolean;
    };
    timestamp: string;
    cached: boolean;
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function validatePagination(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(DEFAULT_PAGE, page),
    limit: Math.min(MAX_LIMIT, Math.max(1, limit)),
  };
}

function validatePrice(price: string | null): number | undefined {
  if (!price) return undefined;
  const parsed = parseInt(price, 10);
  return parsed > 0 ? parsed : undefined;
}

function validateBedroom(bedroom: string | null): number | undefined {
  if (!bedroom) return undefined;
  const parsed = parseInt(bedroom, 10);
  return parsed >= 0 ? parsed : undefined;
}

function getCacheKey(searchParams: URLSearchParams): string {
  const sortedParams = new URLSearchParams(
    [...searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
  return `location:search:${sortedParams.toString()}`;
}

// ✅ FIXED: buildLocationFilter with community_id support
function buildLocationFilter(searchParams: URLSearchParams): LocationSearchParams {
  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'buy') as 'buy' | 'rent' | 'all';
  const locationsParam = searchParams.get('locations') || '';
  const locations = locationsParam ? locationsParam.split(',').filter(Boolean) : [];
  const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const sort_by = (searchParams.get('sort_by') || 'newest') as 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  const featured = searchParams.get('featured') === 'true';
  const min_price = validatePrice(searchParams.get('min_price'));
  const max_price = validatePrice(searchParams.get('max_price'));
  const min_bedrooms = validateBedroom(searchParams.get('min_bedrooms'));
  const max_bedrooms = validateBedroom(searchParams.get('max_bedrooms'));
  const city_id = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!, 10) : undefined;
  // ✅ FIXED: community_id ko properly parse karo
  const community_id = searchParams.get('community_id') 
    ? parseInt(searchParams.get('community_id')!, 10) 
    : undefined;

  const { page: validPage, limit: validLimit } = validatePagination(page, limit);

  return {
    q,
    type,
    locations,
    page: validPage,
    limit: validLimit,
    sort_by,
    featured,
    min_price,
    max_price,
    min_bedrooms,
    max_bedrooms,
    city_id,
    community_id, // ✅ Now properly included
    include_properties: true,
    include_projects: true,
  };
}

// ─── MAIN GET HANDLER ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  console.log(`🔍 [Location Search] Request: ${searchParams.toString()}`);

  try {
    // ─── SINGLE RESULT BY SLUG OR ID ──────────────────────────────────────
    const slug = searchParams.get('slug') || '';
    const id = searchParams.get('id') || '';

    if (slug || id) {
      const identifier = slug || id;
      console.log(`📍 [Location Search] Fetching single: ${identifier}`);
      
      const cacheKey = `location:single:${identifier}`;
      const cachedResult = await cache.get<SearchResultType>(cacheKey);
      
      if (cachedResult) {
        console.log(`✅ [Location Search] Cache hit for: ${identifier}`);
        return NextResponse.json({
          success: true,
          data: cachedResult,
          type: cachedResult.result_type,
          cached: true,
          meta: {
            timestamp: new Date().toISOString(),
            responseTime: `${Date.now() - startTime}ms`,
          },
        });
      }

      const result = await getSearchResult(identifier);
      
      if (!result) {
        console.warn(`⚠️ [Location Search] Not found: ${identifier}`);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Result not found',
            meta: {
              timestamp: new Date().toISOString(),
            }
          },
          { status: 404 }
        );
      }

      await cache.set(cacheKey, result, { ttl: CACHE_TTL * 2 });

      console.log(`✅ [Location Search] Found: ${identifier} (${result.result_type})`);
      
      return NextResponse.json({
        success: true,
        data: result,
        type: result.result_type,
        cached: false,
        meta: {
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
        },
      });
    }

    // ─── LISTING SEARCH ────────────────────────────────────────────────────

    const filters = buildLocationFilter(searchParams);
    
    console.log(`🔍 [Location Search] Filters:`, JSON.stringify(filters, null, 2));

    // ─── Check Cache ──────────────────────────────────────────────────────
    const cacheKey = getCacheKey(searchParams);
    const cachedResults = await cache.get<CachedSearchResponse>(cacheKey);
    
    if (cachedResults) {
      console.log(`✅ [Location Search] Cache hit`);
      return NextResponse.json({
        success: true,
        data: cachedResults.data,
        meta: {
          ...cachedResults.meta,
          cached: true,
          cached_at: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
        },
      });
    }

    // ─── Execute Search ──────────────────────────────────────────────────
    console.log('🔍 [Location Search] Calling search()...');
    const results = await search(filters);
    
    console.log(`📊 [Location Search] Raw results:`, {
      total: results?.meta?.total || 0,
      properties_count: results?.meta?.total_properties || 0,
      projects_count: results?.meta?.total_projects || 0,
      data_length: results?.data?.length || 0,
    });

    const propertiesData = results?.data?.filter((r: any) => r.result_type === 'property') || [];
    const projectsData = results?.data?.filter((r: any) => r.result_type === 'project') || [];
    
    console.log(`📊 [Location Search] Properties: ${propertiesData.length}, Projects: ${projectsData.length}`);

    // ─── Format Response ──────────────────────────────────────────────────
    const responseData = {
      properties: propertiesData,
      projects: projectsData,
      total_properties: results?.meta?.total_properties || results?.meta?.properties_count || propertiesData.length,
      total_projects: results?.meta?.total_projects || results?.meta?.projects_count || projectsData.length,
      total: results?.meta?.total || (propertiesData.length + projectsData.length),
    };

    const responseMeta = {
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(responseData.total / filters.limit) || 0,
      filters: {
        q: filters.q || '',
        type: filters.type || 'buy',
        locations: filters.locations || [],
        sort_by: filters.sort_by || 'newest',
        min_price: filters.min_price,
        max_price: filters.max_price,
        min_bedrooms: filters.min_bedrooms,
        max_bedrooms: filters.max_bedrooms,
        city_id: filters.city_id,
        community_id: filters.community_id, // ✅ Now included in response
        featured: filters.featured || false,
      },
      timestamp: new Date().toISOString(),
      cached: false,
    };

    const response: CachedSearchResponse = {
      data: responseData,
      meta: responseMeta,
    };

    // ─── Cache Response ──────────────────────────────────────────────────
    await cache.set(cacheKey, response, { ttl: CACHE_TTL });

    console.log(`✅ [Location Search] Success: ${responseData.total} results (${responseData.properties.length} properties, ${responseData.projects.length} projects)`);

    return NextResponse.json({
      success: true,
      data: response.data,
      meta: response.meta,
    });

  } catch (error: any) {
    console.error('❌ [Location Search] Error:', error);
    
    return NextResponse.json({
      success: true,
      data: {
        properties: [],
        projects: [],
        total_properties: 0,
        total_projects: 0,
        total: 0,
      },
      meta: {
        page: 1,
        limit: DEFAULT_LIMIT,
        totalPages: 0,
        filters: {
          q: searchParams.get('q') || '',
          type: searchParams.get('type') || 'buy',
          locations: [],
          sort_by: 'newest',
          featured: false,
        },
        timestamp: new Date().toISOString(),
        cached: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
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

// ─── EXPORT CONFIG ─────────────────────────────────────────────────────

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300;