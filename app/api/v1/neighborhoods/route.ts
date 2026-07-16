// app/api/v1/neighborhoods/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getNeighborhoods,
  getFeaturedNeighborhoods,
  getNeighborhoodCities,
  getNeighborhoodBySlug,
  getNeighborhoodById,
  getNeighborhoodsByCity,
  type NeighborhoodFilters,
} from '@/lib/models/neighborhood';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const featured = searchParams.get('featured') === 'true';
    const cities = searchParams.get('cities') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const keyword = searchParams.get('keyword') || undefined;
    const city_id = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!, 10) : undefined;
    const city_slug = searchParams.get('city_slug') || undefined;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

    if (cities) {
      const result = await getNeighborhoodCities();
      return NextResponse.json({
        success: true,
        data: result,
        meta: {
          type: 'cities',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (featured) {
      const featuredLimit = parseInt(searchParams.get('limit') || '6', 10);
      const result = await getFeaturedNeighborhoods(featuredLimit);
      return NextResponse.json({
        success: true,
        data: result,
        meta: {
          count: result.length,
          type: 'featured',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (slug) {
      const neighborhood = await getNeighborhoodBySlug(slug);
      if (!neighborhood) {
        return NextResponse.json(
          { success: false, error: 'Neighborhood not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: neighborhood,
        meta: {
          slug,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (id) {
      const neighborhoodId = parseInt(id, 10);
      const neighborhood = await getNeighborhoodById(neighborhoodId);
      if (!neighborhood) {
        return NextResponse.json(
          { success: false, error: 'Neighborhood not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: neighborhood,
        meta: {
          id: neighborhoodId,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (city_slug) {
      const result = await getNeighborhoodsByCity(city_slug, {
        page: validPage,
        limit: validLimit,
        status: 1,
        keyword,
      });
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: {
          ...result.meta,
          type: 'city',
          city_slug,
          timestamp: new Date().toISOString()
        }
      });
    }

    const filters: NeighborhoodFilters = {
      page: validPage,
      limit: validLimit,
      status: 1,
    };

    if (city_id) filters.city_id = city_id;
    if (keyword) filters.keyword = keyword;
    if (featured) filters.featured = true;

    const result = await getNeighborhoods(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        type: 'list',
        filters: {
          city_id: city_id || null,
          keyword: keyword || null,
          featured: featured || false,
        },
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch neighborhoods',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';