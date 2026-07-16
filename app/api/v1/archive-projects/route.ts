// app/api/v1/archive-projects/route.ts

import { NextResponse } from "next/server";
import {
  getArchiveProjects,
  getArchiveProjectStatistics,
  getArchiveProjectFilters,
  type ArchiveProjectFilters,
} from "@/lib/models/archive-projects";
import { cache } from "@/lib/cache";

const CACHE_TTL = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "12");
  const sort = url.searchParams.get("sort") || "newest";
  const search = url.searchParams.get("search") || "";
  const listingType = url.searchParams.get("listing_type") || "";
  const developerId = url.searchParams.get("developer_id") || "";
  const cityId = url.searchParams.get("city_id") || "";
  const minPrice = url.searchParams.get("min_price") || "";
  const maxPrice = url.searchParams.get("max_price") || "";
  const bedroom = url.searchParams.get("bedroom") || "";
  const featured = url.searchParams.get("featured") === "true";
  const propertyType = url.searchParams.get("property_type") || "";
  const getStats = url.searchParams.get("stats") === "true";
  const getFilters = url.searchParams.get("filters") === "true";

  if (getStats) {
    const stats = await getArchiveProjectStatistics();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  }

  if (getFilters) {
    const filters = await getArchiveProjectFilters();
    return NextResponse.json({
      success: true,
      data: filters,
    });
  }

  const cacheKey = `archive:list:${page}:${limit}:${sort}:${search}:${listingType}:${developerId}:${cityId}:${minPrice}:${maxPrice}:${bedroom}:${featured}:${propertyType}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ...cached,
      meta: { ...(cached as any).meta, cached: true }
    });
  }

  try {
    const filters: ArchiveProjectFilters = {
      page,
      limit,
      status: 1,
    };

    if (sort) {
      const sortMap: Record<string, any> = {
        newest: 'newest',
        oldest: 'oldest',
        'price-low': 'price_asc',
        'price-high': 'price_desc',
        'completion-early': 'completion_early',
        'completion-late': 'completion_late',
        popular: 'popular',
      };
      filters.sort_by = sortMap[sort] || 'newest';
    }

    if (search) filters.keyword = search;
    if (listingType) filters.listing_type = listingType;
    if (developerId) filters.developer_id = parseInt(developerId);
    if (cityId) filters.city_id = parseInt(cityId);
    if (minPrice) filters.min_price = parseFloat(minPrice);
    if (maxPrice) filters.max_price = parseFloat(maxPrice);
    if (bedroom) filters.bedroom = bedroom;
    if (featured) filters.featured = true;
    if (propertyType) filters.property_type = propertyType;

    const result = await getArchiveProjects(filters);

    const statsResult = await getArchiveProjectStatistics();

    const response = {
      success: true,
      data: result.data.map((project) => ({
        id: project.id,
        title: project.ProjectName,
        slug: project.project_slug,
        location: project.LocationName || project.CityName || "Dubai",
        price: project.price_display,
        image: project.image_url,
        featured: project.featured_project === "1",
        beds: project.bedrooms_label,
        sqft: project.area_display,
        handover: project.handover_display,
        listingType: project.listing_type,
        description: project.description,
        developer: project.developer_name,
        views: project.views || 0,
      })),
      stats: {
        total: statsResult.total || 0,
        offPlan: statsResult.by_listing_type?.find((t: any) => t.listing_type === 'Off plan')?.count || 0,
        resale: statsResult.by_listing_type?.find((t: any) => t.listing_type === 'Resale')?.count || 0,
        ready: statsResult.by_listing_type?.find((t: any) => t.listing_type === 'Ready')?.count || 0,
      },
      pagination: {
        page,
        limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
        hasNext: page * limit < result.meta.total,
        hasPrev: page > 1,
      },
    };

    await cache.set(cacheKey, response, { ttl: CACHE_TTL, tags: ['archive', 'list'] });
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching archive projects:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}