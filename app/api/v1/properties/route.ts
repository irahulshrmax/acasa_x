// app/api/properties/route.ts
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
import { db } from '@/lib/database';
import { fixPropertiesPrices, fixPropertyPrice } from '@/lib/utils/formatPrice';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 9999;
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
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(MAX_LIMIT, Math.max(1, limit || DEFAULT_LIMIT));
  return { page: validPage, limit: validLimit };
}

function validatePriceRange(minPrice: number, maxPrice: number) {
  const validMin = Math.max(0, minPrice || 0);
  const validMax = Math.max(validMin, maxPrice || 0);
  return { minPrice: validMin, maxPrice: validMax };
}

function validateBedroom(bedroom: string): string {
  const valid = bedroom?.trim() || '';
  if (/^[0-9]+$/.test(valid)) {
    const num = parseInt(valid, 10);
    if (num === 0) return 'Studio';
    return `${num} Bedroom${num > 1 ? 's' : ''}`;
  }
  return valid || 'Studio';
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

// ─── FETCH ALL PROPERTIES DIRECT ──────────────────────────────────────

async function fetchAllPropertiesDirect(filters: any) {
  const knex = await db();
  
  let query = knex('properties as p')
    .leftJoin('developers as d', 'p.developer_id', 'd.id')
    .leftJoin('users as u', 'p.agent_id', 'u.id')
    .leftJoin('community as c', 'p.community_id', 'c.id')
    .leftJoin('cities as ci', 'p.city_id', 'ci.id')
    .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
    .leftJoin(
      knex('properties_prices')
        .select(
          'property_id',
          knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'),
          knex.raw('MIN(NULLIF(listing_price, 0)) as listing_price'),
          knex.raw('MIN(NULLIF(rental_price, 0)) as rental_price'),
          knex.raw('GROUP_CONCAT(DISTINCT payment_plan_ids SEPARATOR ",") as payment_plan_ids')
        )
        .groupBy('property_id')
        .as('pp'),
      'p.id',
      'pp.property_id'
    );

  if (filters.status !== undefined && filters.status !== null) {
    query = query.where('p.status', filters.status);
  }

  if (filters.featured) {
    query = query.where(function() {
      this.where('p.featured_property', '1')
        .orWhere('p.featured_property', 'yes')
        .orWhere('p.featured_property', 'true');
    });
  }

  if (filters.listing_type) {
    query = query.where('p.listing_type', filters.listing_type);
  }
  if (filters.property_type) {
    query = query.where('p.property_type', filters.property_type);
  }
  if (filters.city_id) {
    query = query.where('p.city_id', filters.city_id);
  }
  if (filters.community_id) {
    query = query.where('p.community_id', filters.community_id);
  }
  if (filters.min_price) {
    query = query.where(function() {
      this.where('pp.sale_price', '>=', filters.min_price)
          .orWhere('p.price', '>=', filters.min_price);
    });
  }
  if (filters.max_price) {
    query = query.where(function() {
      this.where('pp.sale_price', '<=', filters.max_price)
          .orWhere('p.price', '<=', filters.max_price);
    });
  }
  if (filters.bedrooms) {
    const bedroom = filters.bedrooms;
    if (bedroom.toLowerCase() === 'studio') {
      query = query.where(function() {
        this.where('p.bedroom', 'like', '%Studio%')
            .orWhere('p.bedroom', '=', '0')
            .orWhere('p.bedroom', '=', '');
      });
    } else {
      const num = parseInt(bedroom, 10);
      if (!isNaN(num)) {
        query = query.whereRaw(
          'CAST(REGEXP_SUBSTR(p.bedroom, \'^[0-9]+\') AS UNSIGNED) = ?',
          [num]
        );
      }
    }
  }

  if (filters.sort_by === 'price_asc') {
    query = query.orderByRaw('COALESCE(NULLIF(pp.sale_price, 0), NULLIF(p.price, 0)) ASC NULLS LAST');
  } else if (filters.sort_by === 'price_desc') {
    query = query.orderByRaw('COALESCE(NULLIF(pp.sale_price, 0), NULLIF(p.price, 0)) DESC NULLS LAST');
  } else if (filters.sort_by === 'oldest') {
    query = query.orderBy('p.created_at', 'asc');
  } else {
    query = query.orderBy('p.created_at', 'desc');
  }

  const columns = [
    'p.id',
    'p.p_id',
    'p.project_id',
    'p.property_name as name',
    'p.property_slug as slug',
    'p.property_type',
    'p.property_purpose',
    'p.listing_type',
    'p.occupancy',
    'p.price',
    'p.price_end',
    'p.bedroom as bedrooms',
    'p.bathrooms',
    'p.area',
    'p.area_size',
    'p.min_area',
    'p.max_area',
    'p.area_end',
    'p.featured_property as featured',
    'p.status',
    'p.featured_image',
    'p.gallery_media_ids',
    'p.map_latitude',
    'p.map_longitude',
    'p.developer_id',
    'p.agent_id',
    'p.community_id',
    'p.dld_permit',
    'p.RefNumber as ref_number',
    'p.completion_date',
    'p.exclusive_status',
    'p.furnishing',
    'p.amenities',
    'p.description',
    'p.video_url',
    'p.created_at',
    'p.updated_at',
    'd.name as developer_name',
    'd.image as developer_logo',
    'd.country as developer_country',
    'u.full_name as agent_name',
    'u.phone as agent_phone',
    'u.photo as agent_photo',
    'c.name as community_name',
    'c.slug as community_slug',
    'c.img as community_image',
    'ci.name as city_name',
    'ci.id as city_id',
    'cur.code as currency_code',
    'cur.simbol as currency_symbol',
    'pp.sale_price',
    'pp.listing_price',
    'pp.rental_price',
    'pp.payment_plan_ids',
  ];

  const properties = await query.select(columns);

  const allMediaIds: number[] = [];
  for (const p of properties) {
    if (p.gallery_media_ids) {
      const ids = p.gallery_media_ids
        .split(',')
        .map((id: string) => parseInt(id.trim(), 10))
        .filter((id: number) => !isNaN(id) && id > 0);
      allMediaIds.push(...ids);
    }
  }

  const uniqueMediaIds = [...new Set(allMediaIds)].filter(id => id > 0);

  const mediaMap = new Map<number, any>();
  if (uniqueMediaIds.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < uniqueMediaIds.length; i += chunkSize) {
      const chunk = uniqueMediaIds.slice(i, i + chunkSize);
      const mediaRecords = await knex('media')
        .whereIn('id', chunk)
        .where('status', 1)
        .select('id', 'path', 'title', 'description', 'featured', 'media_order');
      
      for (const m of mediaRecords) {
        mediaMap.set(m.id, m);
      }
    }
  }

  const transformed = properties.map((p: any) => {
    const galleryIds = p.gallery_media_ids ? 
      p.gallery_media_ids.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id) && id > 0) : 
      [];
    
    const galleryImages = galleryIds
      .map((id: number) => mediaMap.get(id))
      .filter(Boolean)
      .map((m: any) => ({
        id: m.id,
        url: `https://acasa.ae/upload/media/${m.path}`,
        title: m.title || null,
        description: m.description || null,
        featured: m.featured || 0,
      }));

    const galleryUrls = galleryImages.map((g: any) => g.url);
    
    let featuredImage = null;
    if (p.featured_image) {
      if (p.featured_image.includes('.') || p.featured_image.includes('/')) {
        featuredImage = `https://acasa.ae/upload/media/${p.featured_image}`;
      } else {
        const mediaId = parseInt(p.featured_image, 10);
        if (!isNaN(mediaId) && mediaMap.has(mediaId)) {
          const media = mediaMap.get(mediaId);
          featuredImage = `https://acasa.ae/upload/media/${media.path}`;
        }
      }
    }
    if (!featuredImage && galleryUrls.length > 0) {
      featuredImage = galleryUrls[0];
    }

    const priceAmount = p.sale_price || p.price;
    const isPriceOnRequest = !priceAmount || priceAmount === 0;
    
    return {
      id: p.id,
      name: p.name || 'Property',
      slug: p.slug || '',
      listing_type: p.listing_type || null,
      occupancy: p.occupancy || null,
      status: p.status,
      featured: Boolean(p.featured),
      created_at: p.created_at,
      updated_at: p.updated_at,
      completion_date: p.completion_date || null,
      exclusive_status: p.exclusive_status || null,
      dld_permit: p.dld_permit || null,
      ref_number: p.ref_number || null,
      price: {
        amount: priceAmount ? Number(priceAmount) : null,
        display: isPriceOnRequest ? 'Price on Request' : `AED ${Number(priceAmount).toLocaleString()}`,
        currency: p.currency_code || 'AED',
        symbol: p.currency_symbol || 'AED',
        is_price_on_request: isPriceOnRequest,
        sale_price: p.sale_price ? Number(p.sale_price) : null,
        listing_price: p.listing_price ? Number(p.listing_price) : null,
        rental_price: p.rental_price ? Number(p.rental_price) : null,
      },
      bedrooms: p.bedrooms || 'Studio',
      bathrooms: p.bathrooms || '1 Bath',
      area: {
        value: p.area ? Number(p.area) : null,
        display: p.area ? `${Number(p.area).toLocaleString()} sq. ft.` : 'Area on Request',
        size: p.area_size || null,
        min_area: p.min_area ? Number(p.min_area) : null,
        max_area: p.max_area ? Number(p.max_area) : null,
        area_end: p.area_end || null,
      },
      location: {
        community: p.community_name || null,
        community_slug: p.community_slug || null,
        city: p.city_name || 'Dubai',
        community_id: p.community_id || null,
        city_id: p.city_id || null,
      },
      developer: {
        id: p.developer_id || null,
        name: p.developer_name || null,
        logo_url: p.developer_logo || null,
      },
      agent: {
        id: p.agent_id || null,
        name: p.agent_name || null,
        phone: p.agent_phone || null,
        photo_url: p.agent_photo || null,
      },
      featured_image: featuredImage,
      images: galleryImages,
      gallery_urls: galleryUrls,
      gallery_preview: galleryUrls.slice(0, 3),
      description: p.description || null,
      amenities: p.amenities ? p.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
      video_url: p.video_url || null,
      payment_plans: [],
    };
  });

  return {
    data: transformed,
    meta: {
      total: transformed.length,
      page: 1,
      limit: transformed.length,
      totalPages: 1,
      show_all: true,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const showAll = searchParams.get('show_all') === 'true';
    
    // ✅ GET LIMIT FROM QUERY PARAM (default 25, max 9999)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      // Allow user to set custom limit (1-9999)
      if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
      if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    }
    
    const effectiveLimit = showAll ? 9999 : Math.min(limit, MAX_LIMIT);
    const { page: validPage, limit: validLimit } = validatePagination(page, effectiveLimit);

    const cacheKey = getCacheKey(req);
    if (!showAll) {
      const cachedData = getCached(cacheKey);
      if (cachedData) {
        if (cachedData.data && Array.isArray(cachedData.data)) {
          cachedData.data = fixPropertiesPrices(cachedData.data);
        }
        if (cachedData.data && !Array.isArray(cachedData.data)) {
          cachedData.data = fixPropertyPrice(cachedData.data);
        }
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          meta: cachedData.meta,
          cached: true,
        });
      }
    }

    if (showAll) {
      const filters: any = {};
      
      if (searchParams.get('status') !== null) {
        filters.status = parseInt(searchParams.get('status')!, 10);
      }
      if (searchParams.get('listing_type')) filters.listing_type = searchParams.get('listing_type');
      if (searchParams.get('property_type')) filters.property_type = searchParams.get('property_type');
      if (searchParams.get('city_id')) filters.city_id = parseInt(searchParams.get('city_id')!, 10);
      if (searchParams.get('community_id')) filters.community_id = parseInt(searchParams.get('community_id')!, 10);
      if (searchParams.get('min_price')) filters.min_price = parseFloat(searchParams.get('min_price')!);
      if (searchParams.get('max_price')) filters.max_price = parseFloat(searchParams.get('max_price')!);
      if (searchParams.get('bedrooms')) filters.bedrooms = searchParams.get('bedrooms');
      if (searchParams.get('featured') === 'true') filters.featured = true;
      if (searchParams.get('sort_by')) filters.sort_by = searchParams.get('sort_by');

      const result = await fetchAllPropertiesDirect(filters);
      const fixedData = fixPropertiesPrices(result.data);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'search',
          show_all: true,
          timestamp: new Date().toISOString(),
        },
      };

      return NextResponse.json(response);
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
      // ✅ Get limit from query (default 10, user can customize)
      const featuredLimit = parseInt(searchParams.get('limit') || '10', 10);
      const finalLimit = Math.min(Math.max(1, featuredLimit), 100); // Max 100 for featured
      
      const result = await getFeaturedProperties(finalLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const fixedData = fixPropertiesPrices(sortedData);
      
      // ✅ Return requested limit info in meta
      const response = {
        success: true,
        data: fixedData,
        meta: { 
          ...result.meta, 
          sorted_by: 'quality_layer', 
          action: 'featured',
          requested_limit: finalLimit,
          returned_count: fixedData.length,
          per_page: DEFAULT_LIMIT,
          timestamp: new Date().toISOString() 
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'recent') {
      const recentLimit = parseInt(searchParams.get('limit') || '10', 10);
      const finalLimit = Math.min(Math.max(1, recentLimit), 100);
      
      const result = await getRecentProperties(finalLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const fixedData = fixPropertiesPrices(sortedData);
      
      const response = {
        success: true,
        data: fixedData,
        meta: { 
          ...result.meta, 
          sorted_by: 'quality_layer', 
          action: 'recent',
          requested_limit: finalLimit,
          returned_count: fixedData.length,
          per_page: DEFAULT_LIMIT,
          timestamp: new Date().toISOString() 
        },
      };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (action === 'related') {
      const propertyId = parseInt(searchParams.get('property_id') || '0', 10);
      const relatedLimit = parseInt(searchParams.get('limit') || '6', 10);
      const finalLimit = Math.min(Math.max(1, relatedLimit), 50);
      
      if (!propertyId) {
        return NextResponse.json({ success: false, error: 'property_id is required' }, { status: 400 });
      }
      const result = await getRelatedProperties(propertyId, finalLimit);
      const sortedData = sortPropertiesByQuality(result.data);
      const fixedData = fixPropertiesPrices(sortedData);
      
      const response = {
        success: true,
        data: fixedData,
        meta: { 
          ...result.meta, 
          property_id: propertyId, 
          sorted_by: 'quality_layer', 
          action: 'related',
          requested_limit: finalLimit,
          returned_count: fixedData.length,
          per_page: DEFAULT_LIMIT,
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
      const fixedData = fixPropertiesPrices(sortedData);
      const totalPages = Math.ceil((result.meta?.total || 0) / validLimit);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'offplan',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          per_page: validLimit,
          current_page: validPage,
          total_pages: totalPages,
          has_next_page: validPage < totalPages,
          has_prev_page: validPage > 1,
          next_page: validPage < totalPages ? validPage + 1 : null,
          prev_page: validPage > 1 ? validPage - 1 : null,
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
      const fixedData = fixPropertiesPrices(sortedData);
      const totalPages = Math.ceil((result.meta?.total || 0) / validLimit);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'buy',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          per_page: validLimit,
          current_page: validPage,
          total_pages: totalPages,
          has_next_page: validPage < totalPages,
          has_prev_page: validPage > 1,
          next_page: validPage < totalPages ? validPage + 1 : null,
          prev_page: validPage > 1 ? validPage - 1 : null,
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
      const fixedData = fixPropertiesPrices(sortedData);
      const totalPages = Math.ceil((result.meta?.total || 0) / validLimit);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'sell',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          per_page: validLimit,
          current_page: validPage,
          total_pages: totalPages,
          has_next_page: validPage < totalPages,
          has_prev_page: validPage > 1,
          next_page: validPage < totalPages ? validPage + 1 : null,
          prev_page: validPage > 1 ? validPage - 1 : null,
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
      const fixedData = fixPropertiesPrices(sortedData);
      const totalPages = Math.ceil((result.meta?.total || 0) / validLimit);
      
      const response = {
        success: true,
        data: fixedData,
        meta: {
          ...result.meta,
          action: 'archive',
          sort_by: sort === 'quality' ? 'quality_layer' : sort,
          per_page: validLimit,
          current_page: validPage,
          total_pages: totalPages,
          has_next_page: validPage < totalPages,
          has_prev_page: validPage > 1,
          next_page: validPage < totalPages ? validPage + 1 : null,
          prev_page: validPage > 1 ? validPage - 1 : null,
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
      const fixedProperty = fixPropertyPrice(property);
      const response = { success: true, data: fixedProperty, meta: { slug, timestamp: new Date().toISOString() } };
      setCached(cacheKey, response);
      return NextResponse.json(response);
    }

    if (id) {
      const propertyId = parseInt(id, 10);
      const property = await getPropertyById(propertyId);
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }
      const fixedProperty = fixPropertyPrice(property);
      const response = { success: true, data: fixedProperty, meta: { id: propertyId, timestamp: new Date().toISOString() } };
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
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!, 10) : undefined;
    const featured = searchParams.get('featured') === 'true';
    const keyword = searchParams.get('keyword') || undefined;
    const sortBy = searchParams.get('sort_by') || 'quality';
    const sort = searchParams.get('sort') || 'quality';

    const filters: PropertyFilters = { 
      page: validPage, 
      limit: validLimit,
    };
    
    if (status !== undefined) filters.status = status;
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
    const fixedData = fixPropertiesPrices(sortedData);

    const totalPages = Math.ceil((result.meta?.total || 0) / validLimit);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    const response = {
      success: true,
      data: fixedData,
      meta: {
        ...result.meta,
        action: 'search',
        per_page: validLimit,
        current_page: validPage,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        next_page: hasNextPage ? validPage + 1 : null,
        prev_page: hasPrevPage ? validPage - 1 : null,
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
          status: status || null,
          featured: featured || false,
          keyword: keyword || null,
        },
        sort_by: sort === 'quality' ? 'quality_layer' : (sortBy || 'newest'),
        show_all: showAll,
        timestamp: new Date().toISOString(),
      },
    };

    if (!showAll) {
      setCached(cacheKey, response);
    }
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
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
    console.error('POST Error:', error);
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
    console.error('PUT Error:', error);
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
    console.error('DELETE Error:', error);
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
    console.error('PATCH Error:', error);
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