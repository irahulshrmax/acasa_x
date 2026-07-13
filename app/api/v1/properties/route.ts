import { NextRequest, NextResponse } from 'next/server';
import { 
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyBySlug,
  getOffPlanProperties,
  getOffPlanPropertiesByPrice,
  getOffPlanPropertiesWithCompletion,
  getOffPlanStatistics,
  getOffPlanByBedroom,
  getOffPlanByPriceRange,
  getBuyProperties,
  getBuyPropertiesByPriceRange,
  getBuyPropertiesStatistics,
  getBuyPropertiesByBedroom,
  getSellProperties,
  getSellPropertiesByPriceRange,
  getSellPropertiesStatistics,
  getSellPropertiesByBedroom,
  getArchiveProperties,
  getArchivePropertiesByPrice,
  getArchiveStatistics,
  getFeaturedProperties,
  getRecentProperties,
  getRelatedProperties,
  getSearchFilters,
  permanentDeleteProperty,
  restoreArchiveProperty,
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const showAll = searchParams.get('show_all') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    
    const effectiveLimit = showAll ? 9999 : Math.min(limit, MAX_LIMIT);
    const { page: validPage, limit: validLimit } = validatePagination(page, effectiveLimit);

    const cacheKey = getCacheKey(req);
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        meta: cachedData.meta,
        cached: true,
      });
    }

    if (action === 'filters') {
      const filters = await getSearchFilters();
      const response = { success: true, data: filters, meta: { timestamp: new Date().toISOString() } };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'statistics') {
      const type = searchParams.get('type') || 'all';
      let statistics: any;

      switch (type) {
        case 'offplan':
          statistics = await getOffPlanStatistics();
          break;
        case 'buy':
          statistics = await getBuyPropertiesStatistics();
          break;
        case 'sell':
          statistics = await getSellPropertiesStatistics();
          break;
        case 'archive':
          statistics = await getArchiveStatistics();
          break;
        default: {
          const [offplan, buy, sell, archive] = await Promise.all([
            getOffPlanStatistics(),
            getBuyPropertiesStatistics(),
            getSellPropertiesStatistics(),
            getArchiveStatistics(),
          ]);
          statistics = { 
            offplan, 
            buy, 
            sell, 
            archive, 
            total: ((offplan as any)?.total || 0) + ((buy as any)?.total || 0) + ((sell as any)?.total || 0) + ((archive as any)?.total || 0) 
          };
          break;
        }
      }

      const response = { success: true, data: statistics, meta: { type, timestamp: new Date().toISOString() } };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'featured') {
      const featuredLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getFeaturedProperties(featuredLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: { 
          ...result.meta, 
          sorted_by: 'quality_layer', 
          action: 'featured',
          timestamp: new Date().toISOString() 
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'recent') {
      const recentLimit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getRecentProperties(recentLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: { 
          ...result.meta, 
          sorted_by: 'quality_layer', 
          action: 'recent',
          timestamp: new Date().toISOString() 
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'related') {
      const propertyId = parseInt(searchParams.get('property_id') || '0', 10);
      const relatedLimit = parseInt(searchParams.get('limit') || '6', 10);
      if (!propertyId) {
        return NextResponse.json({ success: false, error: 'property_id is required' }, { status: 400 });
      }
      const result = await getRelatedProperties(propertyId, relatedLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const response = {
        success: true,
        data: sortedData,
        meta: { 
          ...result.meta, 
          property_id: propertyId, 
          sorted_by: 'quality_layer', 
          action: 'related',
          timestamp: new Date().toISOString() 
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'offplan') {
      const sort = searchParams.get('sort') || 'quality';
      const bedroom = searchParams.get('bedroom');
      const minPrice = parseFloat(searchParams.get('min_price') || '0');
      const maxPrice = parseFloat(searchParams.get('max_price') || '0');
      const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);

      let result;
      if (bedroom) {
        const validBedroom = validateBedroom(bedroom);
        result = await getOffPlanByBedroom(validBedroom, validLimit);
      } else if (validMin > 0 || validMax > 0) {
        result = await getOffPlanByPriceRange(validMin, validMax, validLimit);
      } else if (sort === 'price') {
        result = await getOffPlanPropertiesByPrice(validLimit);
      } else if (sort === 'completion') {
        result = await getOffPlanPropertiesWithCompletion(validLimit);
      } else {
        result = await getOffPlanProperties({ page: validPage, limit: validLimit });
      }

      const sortedData = sort === 'quality' ? sortPropertiesByQuality(result.data) : result.data;
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'offplan',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          filters: { bedroom: bedroom || null, min_price: validMin || null, max_price: validMax || null },
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'buy') {
      const sort = searchParams.get('sort') || 'quality';
      const bedroom = searchParams.get('bedroom');
      const minPrice = parseFloat(searchParams.get('min_price') || '0');
      const maxPrice = parseFloat(searchParams.get('max_price') || '0');
      const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);

      let result;
      if (bedroom) {
        const validBedroom = validateBedroom(bedroom);
        result = await getBuyPropertiesByBedroom(validBedroom, validLimit);
      } else if (validMin > 0 || validMax > 0) {
        result = await getBuyPropertiesByPriceRange(validMin, validMax, validLimit);
      } else if (sort === 'price') {
        result = await getBuyPropertiesByPriceRange(validMin || 0, validMax || 100000000, validLimit);
      } else {
        result = await getBuyProperties({ page: validPage, limit: validLimit });
      }

      const sortedData = sort === 'quality' ? sortPropertiesByQuality(result.data) : result.data;
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'buy',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          filters: { bedroom: bedroom || null, min_price: validMin || null, max_price: validMax || null },
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'sell') {
      const sort = searchParams.get('sort') || 'quality';
      const bedroom = searchParams.get('bedroom');
      const minPrice = parseFloat(searchParams.get('min_price') || '0');
      const maxPrice = parseFloat(searchParams.get('max_price') || '0');
      const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);

      let result;
      if (bedroom) {
        const validBedroom = validateBedroom(bedroom);
        result = await getSellPropertiesByBedroom(validBedroom, validLimit);
      } else if (validMin > 0 || validMax > 0) {
        result = await getSellPropertiesByPriceRange(validMin, validMax, validLimit);
      } else if (sort === 'price') {
        result = await getSellPropertiesByPriceRange(validMin || 0, validMax || 100000000, validLimit);
      } else {
        result = await getSellProperties({ page: validPage, limit: validLimit });
      }

      const sortedData = sort === 'quality' ? sortPropertiesByQuality(result.data) : result.data;
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'sell',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          filters: { bedroom: bedroom || null, min_price: validMin || null, max_price: validMax || null },
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'archive') {
      const sort = searchParams.get('sort') || 'quality';
      const bedroom = searchParams.get('bedroom');
      const minPrice = parseFloat(searchParams.get('min_price') || '0');
      const maxPrice = parseFloat(searchParams.get('max_price') || '0');
      const { minPrice: validMin, maxPrice: validMax } = validatePriceRange(minPrice, maxPrice);

      let result;
      const archiveFilters: PropertyFilters = {
        page: validPage,
        limit: validLimit,
        status: [0, 1, 2],
      };

      if (bedroom) {
        const validBedroom = validateBedroom(bedroom);
        if (validBedroom.toLowerCase() === 'studio') {
          archiveFilters.min_bedrooms = 0;
          archiveFilters.max_bedrooms = 0;
        } else {
          const num = parseInt(validBedroom, 10);
          if (!isNaN(num)) {
            archiveFilters.min_bedrooms = num;
            archiveFilters.max_bedrooms = num;
          }
        }
        result = await getArchiveProperties(archiveFilters);
      } else if (validMin > 0 || validMax > 0) {
        archiveFilters.min_price = validMin;
        archiveFilters.max_price = validMax;
        result = await getArchiveProperties(archiveFilters);
      } else if (sort === 'price') {
        result = await getArchivePropertiesByPrice(validLimit);
      } else {
        result = await getArchiveProperties(archiveFilters);
      }

      const sortedData = sort === 'quality' ? sortPropertiesByQuality(result.data) : result.data;
      const response = {
        success: true,
        data: sortedData,
        meta: {
          ...result.meta,
          action: 'archive',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          filters: { bedroom: bedroom || null, min_price: validMin || null, max_price: validMax || null },
          timestamp: new Date().toISOString(),
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (slug) {
      const property = await getPropertyBySlug(slug);
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      const response = { success: true, data: property, meta: { slug, timestamp: new Date().toISOString() } };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getPropertyById(propertyId);
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      const response = { success: true, data: property, meta: { id: propertyId, timestamp: new Date().toISOString() } };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    const propertyType = searchParams.get('property_type') || undefined;
    const propertyPurpose = searchParams.get('property_purpose') || undefined;
    const cityId = parseInt(searchParams.get('city_id') || '0', 10) || undefined;
    const communityId = parseInt(searchParams.get('community_id') || '0', 10) || undefined;
    const subCommunityId = parseInt(searchParams.get('sub_community_id') || '0', 10) || undefined;
    const minPrice = parseFloat(searchParams.get('min_price') || '0') || undefined;
    const maxPrice = parseFloat(searchParams.get('max_price') || '0') || undefined;
    const minBedrooms = parseInt(searchParams.get('min_bedrooms') || '0', 10) || undefined;
    const maxBedrooms = parseInt(searchParams.get('max_bedrooms') || '0', 10) || undefined;
    const minArea = parseInt(searchParams.get('min_area') || '0', 10) || undefined;
    const maxArea = parseInt(searchParams.get('max_area') || '0', 10) || undefined;
    const listingType = searchParams.get('listing_type') || undefined;
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!, 10) : 5;
    const featured = searchParams.get('featured') === 'true';
    const keyword = searchParams.get('keyword') || undefined;
    const sortBy = searchParams.get('sort_by') || 'quality';
    const sort = searchParams.get('sort') || 'quality';

    const filters: PropertyFilters = { page: validPage, limit: validLimit, status };
    if (propertyType) filters.property_type = propertyType;
    if (propertyPurpose) filters.property_purpose = propertyPurpose;
    if (cityId) filters.city_id = cityId;
    if (communityId) filters.community_id = communityId;
    if (subCommunityId) filters.sub_community_id = subCommunityId;
    if (minPrice) filters.min_price = minPrice;
    if (maxPrice) filters.max_price = maxPrice;
    if (minBedrooms) filters.min_bedrooms = minBedrooms;
    if (maxBedrooms) filters.max_bedrooms = maxBedrooms;
    if (minArea) filters.min_area = minArea;
    if (maxArea) filters.max_area = maxArea;
    if (listingType) filters.listing_type = listingType;
    if (featured) filters.featured = true;
    if (keyword) filters.keyword = keyword;
    if (sortBy !== 'quality') filters.sort_by = sortBy as any;

    const result = await getProperties(filters);
    const sortedData = sort === 'quality' ? sortPropertiesByQuality(result.data) : result.data;

    const response = {
      success: true,
      data: sortedData,
      meta: {
        ...result.meta,
        action: 'search',
        filters: {
          property_type: propertyType || null,
          property_purpose: propertyPurpose || null,
          city_id: cityId || null,
          community_id: communityId || null,
          sub_community_id: subCommunityId || null,
          min_price: minPrice || null,
          max_price: maxPrice || null,
          min_bedrooms: minBedrooms || null,
          max_bedrooms: maxBedrooms || null,
          min_area: minArea || null,
          max_area: maxArea || null,
          listing_type: listingType || null,
          status,
          featured: featured || false,
          keyword: keyword || null,
        },
        sort_by: sort === 'quality' ? 'quality_layer' : (sortBy || 'newest'),
        show_all: showAll,
        timestamp: new Date().toISOString(),
      },
    };

    setCached(cacheKey, response);
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.property_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'property_name is required' 
      }, { status: 400 });
    }

    if (!body.property_slug && body.property_name) {
      body.property_slug = body.property_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const property = await createProperty(body);
    
    clearCache('properties');
    clearCache('featured');
    clearCache('recent');
    
    return NextResponse.json({ 
      success: true, 
      data: property, 
      meta: { 
        created: true, 
        timestamp: new Date().toISOString() 
      } 
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create property', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || req.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id is required for update' 
      }, { status: 400 });
    }

    const property = await updateProperty(parseInt(id, 10), body);
    
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: 'Property not found' 
      }, { status: 404 });
    }

    clearCache('properties');
    clearCache(`property:${id}`);
    if (body.property_slug) clearCache(`property:${body.property_slug}`);
    
    return NextResponse.json({ 
      success: true, 
      data: property, 
      meta: { 
        updated: true, 
        timestamp: new Date().toISOString() 
      } 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update property', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const permanent = req.nextUrl.searchParams.get('permanent') === 'true';
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id is required for deletion' 
      }, { status: 400 });
    }

    let result;
    if (permanent) {
      result = await permanentDeleteProperty(parseInt(id, 10));
    } else {
      result = await deleteProperty(parseInt(id, 10));
    }

    clearCache('properties');
    clearCache(`property:${id}`);
    
    return NextResponse.json({ 
      success: true, 
      data: result, 
      meta: { 
        deleted: true, 
        permanent,
        timestamp: new Date().toISOString() 
      } 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete property', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const action = req.nextUrl.searchParams.get('action');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id is required' 
      }, { status: 400 });
    }

    let result;
    if (action === 'restore') {
      result = await restoreArchiveProperty(parseInt(id, 10));
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use action=restore' 
      }, { status: 400 });
    }

    clearCache('properties');
    clearCache(`property:${id}`);
    clearCache('archive');
    
    return NextResponse.json({ 
      success: true, 
      data: result, 
      meta: { 
        action: 'restore',
        timestamp: new Date().toISOString() 
      } 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to restore property', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300;