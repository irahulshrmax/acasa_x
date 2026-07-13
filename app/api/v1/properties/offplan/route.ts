import { NextRequest, NextResponse } from 'next/server';
import { 
  getOffPlanProperties,
  getOffPlanPropertyBySlug,
  getOffPlanPropertyById,
  getOffPlanByDeveloper,
  getOffPlanByCommunity,
  getOffPlanByCity,
  getOffPlanFeatured,
  getOffPlanLatest,
  getOffPlanByPriceRange,
  getOffPlanByBedroom,
  getOffPlanWithCompletion,
  getOffPlanByExclusiveStatus,
  getOffPlanWithDLD,
  getOffPlanStatistics,
  getOffPlanPriceRangeStats,
  getOffPlanCompletionStats,
  getOffPlanBedroomStats,
  fixBedroomData,
  updateLocationFromPropertyLocations,
  fixCityDataFromLocation,
  type PropertyFilters,
} from '@/lib/models/properties';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_TTL = 300;

type PropertyQuality = {
  hasPrice: boolean;
  hasArea: boolean;
  hasImages: boolean;
  hasDescription: boolean;
  hasDeveloper: boolean;
  hasLocation: boolean;
  layer: number;
  score: number;
};

function getPropertyQuality(property: any): PropertyQuality {
  const hasPrice = !!(property.price?.amount || property.price?.sale_price);
  const hasArea = !!(property.area?.value || property.area?.display);
  const hasImages = !!(property.images?.length > 0 || property.gallery_urls?.length > 0);
  const hasDescription = !!(property.description && property.description.length > 50);
  const hasDeveloper = !!(property.developer?.name && property.developer?.name !== 'null');
  const hasLocation = !!(property.location?.city || property.location?.community);

  let layer = 7;
  if (hasPrice && hasArea && hasImages && hasDescription && hasDeveloper && hasLocation) layer = 1;
  else if (hasPrice && hasArea && hasImages && hasDescription && hasDeveloper) layer = 2;
  else if (hasPrice && hasArea && hasImages && hasDescription) layer = 3;
  else if (hasPrice && hasArea && hasImages) layer = 4;
  else if (hasPrice && hasArea) layer = 5;
  else if (hasPrice) layer = 6;
  else layer = 7;

  let score = 0;
  if (hasPrice) score += 10000;
  if (hasArea) score += 1000;
  if (hasImages) score += 100;
  if (hasDescription) score += 10;
  if (hasDeveloper) score += 5;
  if (hasLocation) score += 1;

  return { hasPrice, hasArea, hasImages, hasDescription, hasDeveloper, hasLocation, layer, score };
}

function sortPropertiesByQuality(properties: any[]): any[] {
  return properties.sort((a, b) => {
    const qualityA = getPropertyQuality(a);
    const qualityB = getPropertyQuality(b);

    if (qualityA.layer !== qualityB.layer) {
      return qualityA.layer - qualityB.layer;
    }

    if (qualityA.score !== qualityB.score) {
      return qualityB.score - qualityA.score;
    }

    const priceA = a.price?.amount || a.price?.sale_price || 0;
    const priceB = b.price?.amount || b.price?.sale_price || 0;
    if (priceA !== priceB) {
      return priceB - priceA;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

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

function validateBedroom(bedroom: string): string {
  const valid = bedroom.trim();
  if (/^[0-9]+$/.test(valid)) {
    const num = parseInt(valid, 10);
    if (num === 0) return 'Studio';
    return `${num} Bedroom${num > 1 ? 's' : ''}`;
  }
  return valid;
}

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

function getCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  return url.pathname + url.search;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const stats = searchParams.get('stats') === 'true';
    const detailedStats = searchParams.get('detailed_stats') === 'true';
    const fix = searchParams.get('fix');
    const showAll = searchParams.get('show_all') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const sort = searchParams.get('sort') || 'quality';
    const sortBy = searchParams.get('sort_by') || 'quality';

    const effectiveLimit = showAll ? 9999 : Math.min(limit, MAX_LIMIT);
    const { page: validPage, limit: validLimit } = validatePagination(page, effectiveLimit);

    if (fix === 'bedroom') {
      const result = await fixBedroomData();
      return NextResponse.json({ success: true, data: result, meta: { action: 'fix_bedroom' } });
    }

    if (fix === 'location') {
      const result = await updateLocationFromPropertyLocations();
      return NextResponse.json({ success: true, data: result, meta: { action: 'fix_location' } });
    }

    if (fix === 'city') {
      const result = await fixCityDataFromLocation();
      return NextResponse.json({ success: true, data: result, meta: { action: 'fix_city' } });
    }

    const cacheKey = getCacheKey(request);
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        meta: cachedData.meta,
        cached: true,
      });
    }

    if (stats) {
      const result = await getOffPlanStatistics();
      const response = { 
        success: true, 
        data: result, 
        meta: { 
          type: 'statistics',
          timestamp: new Date().toISOString() 
        } 
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (detailedStats) {
      const [priceStats, completionStats, bedroomStats] = await Promise.all([
        getOffPlanPriceRangeStats(),
        getOffPlanCompletionStats(),
        getOffPlanBedroomStats(),
      ]);
      
      const response = { 
        success: true, 
        data: { price_stats: priceStats, completion_stats: completionStats, bedroom_stats: bedroomStats },
        meta: { 
          type: 'detailed_statistics',
          timestamp: new Date().toISOString() 
        } 
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getOffPlanFeatured(featuredLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'featured',
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'latest') {
      const latestLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getOffPlanLatest(latestLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'latest',
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'by_developer') {
      const developerId = parseInt(searchParams.get('developer_id') || '0', 10);
      const developerLimit = parseInt(searchParams.get('limit') || '20', 10);
      if (!developerId) {
        return NextResponse.json(
          { success: false, error: 'developer_id is required' },
          { status: 400 }
        );
      }
      const result = await getOffPlanByDeveloper(developerId, developerLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'by_developer',
          developer_id: developerId,
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'by_community') {
      const communityId = parseInt(searchParams.get('community_id') || '0', 10);
      const communityLimit = parseInt(searchParams.get('limit') || '20', 10);
      if (!communityId) {
        return NextResponse.json(
          { success: false, error: 'community_id is required' },
          { status: 400 }
        );
      }
      const result = await getOffPlanByCommunity(communityId, communityLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'by_community',
          community_id: communityId,
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'by_city') {
      const cityId = parseInt(searchParams.get('city_id') || '0', 10);
      const cityLimit = parseInt(searchParams.get('limit') || '20', 10);
      if (!cityId) {
        return NextResponse.json(
          { success: false, error: 'city_id is required' },
          { status: 400 }
        );
      }
      const result = await getOffPlanByCity(cityId, cityLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'by_city',
          city_id: cityId,
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'exclusive') {
      const exclusiveStatus = searchParams.get('status') || 'Non-Exclusive';
      const exclusiveLimit = parseInt(searchParams.get('limit') || '20', 10);
      const result = await getOffPlanByExclusiveStatus(exclusiveStatus, exclusiveLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'exclusive',
          exclusive_status: exclusiveStatus,
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'with_dld') {
      const dldLimit = parseInt(searchParams.get('limit') || '20', 10);
      const result = await getOffPlanWithDLD(dldLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'with_dld',
          sort_by: 'quality_layer',
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (slug) {
      const property = await getOffPlanPropertyBySlug(slug);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Off-plan property not found' },
          { status: 404 }
        );
      }
      const response = { 
        success: true, 
        data: property, 
        meta: { 
          slug, 
          listing_type: 'Off plan',
          timestamp: new Date().toISOString() 
        } 
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getOffPlanPropertyById(propertyId);
      if (!property) {
        return NextResponse.json(
          { success: false, error: 'Off-plan property not found' },
          { status: 404 }
        );
      }
      const response = { 
        success: true, 
        data: property, 
        meta: { 
          id: propertyId, 
          listing_type: 'Off plan',
          timestamp: new Date().toISOString() 
        } 
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    const bedroom = searchParams.get('bedroom');
    const minPrice = parseFloat(searchParams.get('min_price') || '0');
    const maxPrice = parseFloat(searchParams.get('max_price') || '0');
    const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);
    const keyword = searchParams.get('keyword');
    const occupancy = searchParams.get('occupancy');
    const developerId = searchParams.get('developer_id') ? parseInt(searchParams.get('developer_id')!, 10) : undefined;
    const communityId = searchParams.get('community_id') ? parseInt(searchParams.get('community_id')!, 10) : undefined;
    const cityId = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!, 10) : undefined;
    const completionFrom = searchParams.get('completion_from');
    const completionTo = searchParams.get('completion_to');
    const exclusiveStatus = searchParams.get('exclusive_status');
    const hasDLD = searchParams.get('has_dld') === 'true';
    const featured = searchParams.get('featured') === 'true';

    const filters: PropertyFilters = {
      page: validPage,
      limit: validLimit,
      status: 5,
      listing_type: 'Off plan',
    };

    if (bedroom) {
      const validBedroom = validateBedroom(bedroom);
      if (validBedroom.toLowerCase() === 'studio') {
        filters.min_bedrooms = 0;
        filters.max_bedrooms = 0;
      } else {
        const num = parseInt(validBedroom, 10);
        if (!isNaN(num)) {
          filters.min_bedrooms = num;
          filters.max_bedrooms = num;
        }
      }
    }

    if (validMin > 0) filters.min_price = validMin;
    if (validMax > 0) filters.max_price = validMax;
    if (keyword) filters.keyword = keyword;
    if (occupancy) filters.occupancy = occupancy;
    if (developerId) filters.developer_id = developerId;
    if (communityId) filters.community_id = communityId;
    if (cityId) filters.city_id = cityId;
    if (completionFrom) filters.completion_from = completionFrom;
    if (completionTo) filters.completion_to = completionTo;
    if (exclusiveStatus) filters.exclusive_status = exclusiveStatus;
    if (hasDLD) filters.has_dld = true;
    if (featured) filters.featured = true;
    
    if (sort !== 'quality' && sortBy !== 'quality') {
      filters.sort_by = sortBy as any;
    }

    let result: any;

    if (validMin > 0 || validMax > 0) {
      result = await getOffPlanByPriceRange(validMin, validMax, validLimit);
    } else if (bedroom) {
      const validBedroom = validateBedroom(bedroom);
      result = await getOffPlanByBedroom(validBedroom, validLimit);
    } else {
      result = await getOffPlanProperties(filters);
    }

    const sortedData = (sort === 'quality' || sortBy === 'quality')
      ? sortPropertiesByQuality(result.data)
      : result.data;

    const response = {
      success: true,
      data: sortedData,
      meta: {
        ...result.meta,
        action: 'offplan',
        sort_by: (sort === 'quality' || sortBy === 'quality') ? 'quality_layer' : (sortBy || 'newest'),
        filters: {
          bedroom: bedroom || null,
          min_price: validMin || null,
          max_price: validMax || null,
          keyword: keyword || null,
          occupancy: occupancy || null,
          developer_id: developerId || null,
          community_id: communityId || null,
          city_id: cityId || null,
          completion_from: completionFrom || null,
          completion_to: completionTo || null,
          exclusive_status: exclusiveStatus || null,
          has_dld: hasDLD || false,
          featured: featured || false,
        },
        show_all: showAll,
        timestamp: new Date().toISOString(),
      },
    };

    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch off-plan properties',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';