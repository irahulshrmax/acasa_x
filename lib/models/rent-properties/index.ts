// lib/models/rent-properties/index.ts

import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

const UPLOAD_BASE_URL = 'https://acasa.ae/upload';

const CK = {
  list: (f: any) => `rent:list:${JSON.stringify(f)}`,
  byId: (id: number) => `rent:id:${id}`,
  bySlug: (slug: string) => `rent:slug:${slug}`,
  count: (f: any) => `rent:count:${JSON.stringify(f)}`,
  stats: (type: string) => `rent:stats:${type}`,
};

export interface RentFilters {
  page?: number;
  limit?: number;
  status?: number;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  city_id?: number;
  community_id?: number;
  developer_id?: number;
  property_type?: string | number;  
  featured?: boolean;
  keyword?: string;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

interface RentListResult {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    cached?: boolean;
  };
}

function cleanPath(val: string): string {
  return val.replace(/\\/g, '/').trim().replace(/^\/+/, '');
}

function isAbsoluteUrl(val: string): boolean {
  return /^https?:\/\//i.test(val);
}

function stripUploadPrefix(val: string): string {
  return cleanPath(val).replace(/^upload\//i, '').replace(/^\/+/, '');
}

export function getNoImageUrl(): string {
  return `${UPLOAD_BASE_URL}/no-image.png`;
}

export function getImageUrl(rawPath: string | null | undefined): string {
  if (!rawPath || /no-image/i.test(rawPath)) return getNoImageUrl();
  if (isAbsoluteUrl(rawPath)) return rawPath;
  const clean = stripUploadPrefix(rawPath);
  if (!clean) return getNoImageUrl();
  if (!clean.includes('/') || clean.split('/')[0] === 'property') {
    return `${UPLOAD_BASE_URL}/media/${clean}`;
  }
  return `${UPLOAD_BASE_URL}/${clean}`;
}

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'string') {
    if (/price on request|poa|contact|upon request|call|ask/i.test(val.trim())) return null;
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isFinite(num) ? num : null;
  }
  return null;
}

function formatPrice(
  amount: number | string | null | undefined,
  currency = 'AED',
  symbol = 'AED'
): string {
  const num = toNumber(amount);
  if (num === null) return 'Price on Request';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const cur = symbol || currency;
  if (['AED', 'د.إ'].includes(cur)) return `AED ${formatted}`;
  if (['USD', '$'].includes(cur)) return `$${formatted}`;
  if (['EUR', '€'].includes(cur)) return `€${formatted}`;
  if (['GBP', '£'].includes(cur)) return `£${formatted}`;
  return `${cur} ${formatted}`;
}

function parseBedroom(val: string | null | undefined): string {
  if (!val) return 'Studio';
  const t = val.trim();
  if (/studio/i.test(t)) return 'Studio';
  const match = t.match(/^(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    return `${n} Bedroom${n !== 1 ? 's' : ''}`;
  }
  return t;
}

function parseBathroom(val: string | null | undefined): string {
  if (!val) return '1 Bath';
  const t = val.trim();
  if (/studio/i.test(t)) return '1 Bath';
  const match = t.match(/^(\d+\.?\d*)/);
  if (match) {
    const n = parseFloat(match[1]);
    if (n === 0) return '1 Bath';
    return `${n} Bath${n !== 1 ? 's' : ''}`;
  }
  return '1 Bath';
}

function parseArea(area: number | null | undefined, areaSize: string | null | undefined): string {
  if (area && area > 0) return `${area.toLocaleString('en-US')} sq. ft.`;
  if (areaSize) {
    const n = parseFloat(areaSize);
    if (!isNaN(n) && n > 0) return `${n.toLocaleString('en-US')} sq. ft.`;
  }
  return 'Area on Request';
}

function parseCommaIds(ids: string | null | undefined): number[] {
  if (!ids) return [];
  return ids
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

function buildRentQuery(knex: any, filters: RentFilters) {
  const {
    status = 5,
    min_price,
    max_price,
    min_bedrooms,
    max_bedrooms,
    city_id,
    community_id,
    developer_id,
    featured,
    keyword,
    sort_by = 'newest',
  } = filters;

  const query = knex('properties as p')
    .leftJoin('properties_prices as pp', 'p.id', 'pp.property_id')
    .leftJoin('developers as d', 'p.developer_id', 'd.id')
    .leftJoin('users as u', 'p.agent_id', 'u.id')
    .leftJoin('community as c', 'p.community_id', 'c.id')
    .leftJoin('cities as ci', 'p.city_id', 'ci.id')
    .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
    .where('p.status', status)
    .where('p.listing_type', 'Off plan')
    .whereNotNull('pp.rental_price')
    .where('pp.rental_price', '!=', '')
    .whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) > 0');

  if (city_id) query.where('p.city_id', city_id);
  if (community_id) query.where('p.community_id', community_id);
  if (developer_id) query.where('p.developer_id', developer_id);

  if (min_price) {
    query.whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) >= ?', [min_price]);
  }
  if (max_price) {
    query.whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) <= ?', [max_price]);
  }

  if (min_bedrooms === 0) {
    query.where(function(this: any) {
      this.where('p.bedroom', 'like', '%Studio%')
        .orWhere('p.bedroom', '=', '0')
        .orWhere('p.bedroom', '=', '');
    });
  } else if (min_bedrooms) {
    query.whereRaw('CAST(REGEXP_SUBSTR(p.bedroom, \'^[0-9]+\') AS UNSIGNED) >= ?', [min_bedrooms]);
  }

  if (max_bedrooms === 0) {
    query.where(function(this: any) {
      this.where('p.bedroom', 'like', '%Studio%')
        .orWhere('p.bedroom', '=', '0')
        .orWhere('p.bedroom', '=', '');
    });
  } else if (max_bedrooms) {
    query.whereRaw('CAST(REGEXP_SUBSTR(p.bedroom, \'^[0-9]+\') AS UNSIGNED) <= ?', [max_bedrooms]);
  }

  if (featured) {
    query.where(function(this: any) {
      this.where('p.featured_property', '1')
        .orWhere('p.featured_property', 'yes')
        .orWhere('p.featured_property', 'true');
    });
  }

  if (keyword) {
    query.where(function(this: any) {
      this.where('p.property_name', 'like', `%${keyword}%`)
        .orWhere('p.keyword', 'like', `%${keyword}%`)
        .orWhere('p.description', 'like', `%${keyword}%`)
        .orWhere('c.name', 'like', `%${keyword}%`)
        .orWhere('ci.name', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'price_asc':
      query.orderByRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) ASC');
      break;
    case 'price_desc':
      query.orderByRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) DESC');
      break;
    case 'oldest':
      query.orderBy('p.created_at', 'asc');
      break;
    case 'newest':
    default:
      query.orderBy('p.created_at', 'desc');
  }

  return query;
}

const LIST_COLUMNS = [
  'p.id',
  'p.property_name',
  'p.property_slug',
  'p.listing_type',
  'p.occupancy',
  'p.status',
  'p.featured_property',
  'p.featured_image',
  'p.gallery_media_ids',
  'p.map_latitude',
  'p.map_longitude',
  'p.developer_id',
  'p.agent_id',
  'p.community_id',
  'p.city_id',
  'p.bedroom',
  'p.bathrooms',
  'p.area',
  'p.area_size',
  'p.furnishing',
  'p.amenities',
  'p.description',
  'p.video_url',
  'p.created_at',
  'p.updated_at',
  'p.completion_date',
  'p.exclusive_status',
  'p.dld_permit',
  'p.RefNumber',
  'p.ReraNumber',
  'd.name as developer_name',
  'd.image as developer_logo',
  'u.full_name as agent_name',
  'u.phone as agent_phone',
  'u.photo as agent_photo',
  'c.name as community_name',
  'c.slug as community_slug',
  'ci.name as city_name',
  'cur.code as currency_code',
  'cur.simbol as currency_symbol',
] as const;

async function batchFetchMedia(knex: any, galleryIds: number[]): Promise<Map<number, any>> {
  if (!galleryIds.length) return new Map();
  const cacheKey = `rent:media:${galleryIds.slice().sort().join(',')}`;
  const cached = await cache.get<Map<number, any>>(cacheKey);
  if (cached) return cached;
  const records = await knex('media')
    .whereIn('id', galleryIds)
    .where('status', 1)
    .orderBy('media_order', 'asc')
    .select('id', 'path', 'title', 'description', 'featured', 'media_order');
  const map = new Map<number, any>();
  for (const r of records) map.set(r.id, r);
  await cache.set(cacheKey, map, {
    ttl: 300,
    tags: ['rent', 'media'],
  });
  return map;
}

async function batchFetchPaymentPlans(knex: any, planIds: number[]): Promise<Map<number, any>> {
  if (!planIds.length) return new Map();
  const cacheKey = `rent:plans:${planIds.slice().sort().join(',')}`;
  const cached = await cache.get<Map<number, any>>(cacheKey);
  if (cached) return cached;
  const plans = await knex('payment_plan')
    .whereIn('id', planIds)
    .where('status', 1)
    .select('id', 'name', 'percentage', 'item_id', 'item_type');
  const map = new Map<number, any>();
  for (const p of plans) map.set(p.id, p);
  await cache.set(cacheKey, map, {
    ttl: 600,
    tags: ['rent', 'plans'],
  });
  return map;
}

function transformRentProperty(
  p: any,
  mediaMap: Map<number, any>,
  plansMap: Map<number, any>,
  isDetail = false
): any {
  const galleryIds = parseCommaIds(p.gallery_media_ids);
  const galleryImages = galleryIds
    .map(id => mediaMap.get(id))
    .filter(Boolean)
    .map((m: any) => ({
      id: m.id,
      url: getImageUrl(m.path),
      title: m.title || null,
      description: m.description || null,
      featured: m.featured || 0,
    }));

  const galleryUrls = galleryImages.map((g: any) => g.url);
  const featuredImage = p.featured_image
    ? getImageUrl(p.featured_image)
    : galleryUrls[0] || getNoImageUrl();

  const rentalPrice = toNumber(p.rental_price);
  const salePrice = toNumber(p.sale_price);

  const bedroom = parseBedroom(p.bedroom);
  const bathroom = parseBathroom(p.bathrooms);
  const area = parseArea(p.area, p.area_size);

  const planIds = parseCommaIds(p.payment_plan_ids);
  const plans = planIds.map(id => plansMap.get(id)).filter(Boolean);

  const base = {
    id: p.id,
    name: p.property_name || 'Property',
    slug: p.property_slug || '',
    listing_type: p.listing_type || null,
    occupancy: p.occupancy || null,
    status: p.status,
    featured: ['1', 1, 'yes', 'true'].includes(p.featured_property),
    created_at: p.created_at,
    updated_at: p.updated_at,
    completion_date: p.completion_date || null,
    exclusive_status: p.exclusive_status || null,
    dld_permit: p.dld_permit || null,
    ref_number: p.RefNumber || null,

    price: {
      amount: rentalPrice,
      display: formatPrice(rentalPrice, p.currency_code, p.currency_symbol),
      currency: p.currency_code || 'AED',
      symbol: p.currency_symbol || 'AED',
      is_price_on_request: rentalPrice === null,
      rental_price: rentalPrice,
      sale_price: salePrice,
    },

    bedrooms: bedroom,
    bathrooms: bathroom,
    display_title: `${bedroom} | ${bathroom} | ${area}`,

    area: {
      value: p.area,
      size: p.area_size,
      display: area,
    },

    location: {
      community: p.community_name || null,
      community_slug: p.community_slug || null,
      city: p.city_name || 'Dubai',
      address: p.address || p.location || null,
      latitude: p.map_latitude || null,
      longitude: p.map_longitude || null,
      community_id: p.community_id || null,
      city_id: p.city_id || null,
    },

    developer: {
      id: p.developer_id || null,
      name: p.developer_name || null,
      logo_url: getImageUrl(p.developer_logo),
    },

    agent: {
      id: p.agent_id || null,
      name: p.agent_name || null,
      phone: p.agent_phone || null,
      photo_url: getImageUrl(p.agent_photo),
    },

    featured_image: featuredImage,
    images: isDetail ? galleryImages : galleryImages.slice(0, 5),
    gallery_urls: isDetail ? galleryUrls : galleryUrls.slice(0, 5),
    gallery_preview: galleryUrls.slice(0, 3),
    media_base_url: UPLOAD_BASE_URL,

    amenities: p.amenities
      ? p.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      : [],
    furnishing: p.furnishing || null,
    video_url: p.video_url || null,
    payment_plans: plans,
  };

  if (isDetail) {
    return {
      ...base,
      description: p.description || null,
      flooring: p.flooring || null,
      parking: p.parking || null,
      rera_number: p.ReraNumber || null,
      seo: {
        title: p.seo_title || p.property_name || null,
        description: p.meta_description || p.description?.slice(0, 160) || null,
        keywords: p.keyword || null,
        slug: p.property_slug || '',
      },
    };
  }

  return base;
}

export async function getRentProperties(filters: RentFilters = {}): Promise<RentListResult> {
  const { page = 1, limit = 20 } = filters;
  const cacheKey = CK.list(filters);
  const cached = await cache.get<RentListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();
    const query = buildRentQuery(knex, filters);
    const countKey = CK.count(filters);

    const [countResult, properties] = await Promise.all([
      cache.get<number>(countKey).then(async cachedCount => {
        if (cachedCount !== null) return cachedCount;
        const countQ = buildRentQuery(knex, filters);
        const [{ total }] = await countQ.count('p.id as total');
        const count = Number(total);
        await cache.set(countKey, count, {
          ttl: 120,
          tags: ['rent', 'list', 'count'],
        });
        return count;
      }),
      query
        .clone()
        .select(LIST_COLUMNS)
        .limit(limit)
        .offset((page - 1) * limit),
    ]);

    if (!properties.length) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const allGalleryIds: number[] = [];
    const allPlanIds: number[] = [];

    for (const p of properties) {
      const gIds = parseCommaIds(p.gallery_media_ids);
      const pIds = parseCommaIds(p.payment_plan_ids);
      allGalleryIds.push(...gIds);
      allPlanIds.push(...pIds);
    }

    const uniqueGalleryIds = [...new Set(allGalleryIds)];
    const uniquePlanIds = [...new Set(allPlanIds)];

    const [mediaMap, plansMap] = await Promise.all([
      batchFetchMedia(knex, uniqueGalleryIds),
      batchFetchPaymentPlans(knex, uniquePlanIds),
    ]);

    const data = properties.map((p: any) => transformRentProperty(p, mediaMap, plansMap, false));

    const result: RentListResult = {
      data,
      meta: {
        total: countResult,
        page,
        limit,
        totalPages: Math.ceil(countResult / limit),
      },
    };

    const tags = ['rent', 'list'];
    if (filters.city_id) tags.push(`city:${filters.city_id}`);
    if (filters.community_id) tags.push(`community:${filters.community_id}`);
    if (filters.featured) tags.push('featured');

    await cache.set(cacheKey, result, {
      ttl: 120,
      tags,
    });
    return result;
  });
}

export async function getRentPropertyById(id: number): Promise<any | null> {
  const cacheKey = CK.byId(id);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();

    const property = await knex('properties as p')
      .leftJoin('properties_prices as pp', 'p.id', 'pp.property_id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('users as u', 'p.agent_id', 'u.id')
      .leftJoin('community as c', 'p.community_id', 'c.id')
      .leftJoin('cities as ci', 'p.city_id', 'ci.id')
      .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
      .where('p.id', id)
      .where('p.status', 5)
      .where('p.listing_type', 'Off plan')
      .whereNotNull('pp.rental_price')
      .where('pp.rental_price', '!=', '')
      .whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) > 0')
      .first()
      .select(
        'p.*',
        'pp.rental_price',
        'pp.sale_price',
        'pp.payment_plan_ids',
        'd.name as developer_name',
        'd.image as developer_logo',
        'd.country as developer_country',
        'd.website as developer_website',
        'u.full_name as agent_name',
        'u.phone as agent_phone',
        'u.photo as agent_photo',
        'u.rera_brn as agent_rera',
        'u.email as agent_email',
        'u.mobile_phone as agent_mobile',
        'u.about as agent_about',
        'c.name as community_name',
        'c.slug as community_slug',
        'ci.name as city_name',
        'cur.code as currency_code',
        'cur.simbol as currency_symbol'
      );

    if (!property) return null;

    const galleryIds = parseCommaIds(property.gallery_media_ids);
    const planIds = parseCommaIds(property.payment_plan_ids);

    const [mediaMap, plansMap, facilities, locationData] = await Promise.all([
      batchFetchMedia(knex, galleryIds),
      batchFetchPaymentPlans(knex, planIds),
      knex('facilities').where('property_id', id).where('status', 1).first(),
      knex('property_locations').where('property_id', id).first(),
    ]);

    const result = {
      ...transformRentProperty(property, mediaMap, plansMap, true),
      facilities: facilities || null,
      location_data: locationData || null,
      agent: {
        id: property.agent_id || null,
        name: property.agent_name || null,
        phone: property.agent_phone || null,
        photo_url: getImageUrl(property.agent_photo),
        rera_brn: property.agent_rera || null,
        email: property.agent_email || null,
        mobile: property.agent_mobile || null,
        about: property.agent_about || null,
      },
      developer: {
        id: property.developer_id || null,
        name: property.developer_name || null,
        country: property.developer_country || null,
        website: property.developer_website || null,
        logo_url: getImageUrl(property.developer_logo),
      },
    };

    await cache.set(cacheKey, result, {
      ttl: 600,
      tags: ['rent', 'detail', `rent:${id}`],
    });
    return result;
  });
}

export async function getRentPropertyBySlug(slug: string): Promise<any | null> {
  const cacheKey = CK.bySlug(slug);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const row = await knex('properties')
    .where('property_slug', slug)
    .first()
    .select('id');

  if (!row) return null;

  const result = await getRentPropertyById(row.id);
  if (result) {
    await cache.set(cacheKey, result, {
      ttl: 600,
      tags: ['rent', 'detail', `slug:${slug}`],
    });
  }
  return result;
}

export async function getRentStatistics() {
  const cacheKey = CK.stats('rent');
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [totalResult, priceStats, bedroomStats] = await Promise.all([
    knex('properties as p')
      .leftJoin('properties_prices as pp', 'p.id', 'pp.property_id')
      .where('p.status', 5)
      .where('p.listing_type', 'Off plan')
      .whereNotNull('pp.rental_price')
      .where('pp.rental_price', '!=', '')
      .whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) > 0')
      .count('* as total')
      .first(),

    knex('properties as p')
      .leftJoin('properties_prices as pp', 'p.id', 'pp.property_id')
      .where('p.status', 5)
      .where('p.listing_type', 'Off plan')
      .whereNotNull('pp.rental_price')
      .where('pp.rental_price', '!=', '')
      .whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) > 0')
      .select(
        knex.raw('COUNT(*) as total_with_price'),
        knex.raw('MIN(CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0))) as min_price'),
        knex.raw('MAX(CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0))) as max_price'),
        knex.raw('AVG(CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0))) as avg_price')
      )
      .first(),

    knex('properties as p')
      .leftJoin('properties_prices as pp', 'p.id', 'pp.property_id')
      .where('p.status', 5)
      .where('p.listing_type', 'Off plan')
      .whereNotNull('pp.rental_price')
      .where('pp.rental_price', '!=', '')
      .whereRaw('CAST(REPLACE(pp.rental_price, ",", "") AS DECIMAL(20,0)) > 0')
      .whereNotNull('p.bedroom')
      .select('p.bedroom')
      .count('* as count')
      .groupBy('p.bedroom')
      .orderBy('p.bedroom'),
  ]);

  const result = {
    total: Number(totalResult?.total || 0),
    with_price: Number(priceStats?.total_with_price || 0),
    min_price: priceStats?.min_price || null,
    max_price: priceStats?.max_price || null,
    avg_price: priceStats?.avg_price || null,
    by_bedroom: bedroomStats || [],
  };

  await cache.set(cacheKey, result, {
    ttl: 3600,
    tags: ['rent', 'stats'],
  });
  return result;
}

export const getFeaturedRentProperties = (limit = 10) =>
  getRentProperties({ featured: true, limit });

export const getRecentRentProperties = (limit = 10) =>
  getRentProperties({ sort_by: 'newest', limit });

export const getRentByBedroom = (bedroom: string, limit: number = 20) => {
  const filters: RentFilters = { limit, sort_by: 'price_desc' };

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

  return getRentProperties(filters);
};

export const getRentByPriceRange = (minPrice: number, maxPrice: number, limit: number = 20) => {
  return getRentProperties({
    min_price: minPrice,
    max_price: maxPrice,
    sort_by: 'price_desc',
    limit,
  });
};