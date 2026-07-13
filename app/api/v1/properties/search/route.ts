// app/api/v1/properties/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getProperties, getSearchFilters } from '@/lib/models/properties';
import { cache } from '@/lib/cache';

const CACHE_TTL = 600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      property_type    : searchParams.get('property_type')     || undefined,
      property_purpose : searchParams.get('property_purpose')  || undefined,
      listing_type     : searchParams.get('listing_type')      || undefined,
      keyword          : searchParams.get('keyword')           || undefined,
      sort_by          : (searchParams.get('sort_by') as any)  || 'newest',
      status           : 5,
      page             : searchParams.get('page')             ? parseInt(searchParams.get('page')!)             : 1,
      limit            : searchParams.get('limit')            ? parseInt(searchParams.get('limit')!)            : 20,
      city_id          : searchParams.get('city_id')          ? parseInt(searchParams.get('city_id')!)          : undefined,
      community_id     : searchParams.get('community_id')     ? parseInt(searchParams.get('community_id')!)     : undefined,
      sub_community_id : searchParams.get('sub_community_id') ? parseInt(searchParams.get('sub_community_id')!): undefined,
      min_price        : searchParams.get('min_price')        ? parseInt(searchParams.get('min_price')!)        : undefined,
      max_price        : searchParams.get('max_price')        ? parseInt(searchParams.get('max_price')!)        : undefined,
      min_bedrooms     : searchParams.get('min_bedrooms')     ? parseInt(searchParams.get('min_bedrooms')!)     : undefined,
      max_bedrooms     : searchParams.get('max_bedrooms')     ? parseInt(searchParams.get('max_bedrooms')!)     : undefined,
      min_area         : searchParams.get('min_area')         ? parseInt(searchParams.get('min_area')!)         : undefined,
      max_area         : searchParams.get('max_area')         ? parseInt(searchParams.get('max_area')!)         : undefined,
    };

    const cacheKey = `search:${JSON.stringify(filters)}`;

    // ── Check cache ───────────────────────────────────────────
    const cachedData = await cache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success : true,
        data    : cachedData.data,
        meta    : cachedData.meta,
        cached  : true,
      });
    }

    // ── Fetch data ────────────────────────────────────────────
    const [result, filterOptions] = await Promise.all([
      getProperties(filters),
      getSearchFilters(),
    ]);

    const response = {
      success : true,
      data    : {
        filters : filterOptions,
        results : result.data,
      },
      meta: result.meta,
    };

    // ✅ FIX: number → { ttl: number, tags: string[] }
    await cache.set(cacheKey, response, {
      ttl  : CACHE_TTL,
      tags : ['search', 'properties'],
    });

    return NextResponse.json({
      ...response,
      cached: false,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'Search failed' },
      { status: 500 }
    );
  }
}