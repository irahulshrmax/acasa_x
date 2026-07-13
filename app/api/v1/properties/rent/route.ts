// app/api/v1/properties/rent/route.ts

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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

    if (stats) {
      const result = await getRentStatistics();
      return NextResponse.json({
        success: true,
        data: result,
        meta: {
          type: 'statistics',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getFeaturedRentProperties(featuredLimit);
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: {
          ...result.meta,
          action: 'featured',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'recent') {
      const recentLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getRecentRentProperties(recentLimit);
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: {
          ...result.meta,
          action: 'recent',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (slug) {
      const property = await getRentPropertyBySlug(slug);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Rent property not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: property,
        meta: {
          slug,
          listing_type: 'Rent',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getRentPropertyById(propertyId);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Rent property not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: property,
        meta: {
          id: propertyId,
          listing_type: 'Rent',
          timestamp: new Date().toISOString()
        }
      });
    }

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

    let result: any;

    if (validMin > 0 || validMax > 0) {
      result = await getRentByPriceRange(validMin, validMax, validLimit);
    } else if (bedroom) {
      result = await getRentByBedroom(bedroom, validLimit);
    } else {
      result = await getRentProperties(filters);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
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
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';