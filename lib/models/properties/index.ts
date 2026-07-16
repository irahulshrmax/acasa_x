import { db } from '@/lib/database';
import { cache } from '@/lib/cache';
import {
  UPLOAD_BASE_URL,
  getImageUrl,
  getImageUrlVariations,
  getFeaturedImage,
  getNoImageUrl,
  getDeveloperImageUrl,
  getDeveloperImageVariations,
  getAgentImageUrl,
  getAgentImageVariations,
  getCommunityImageUrl,
  getCommunityImageVariations,
  getMediaImageUrl,
  getGalleryImages,
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  PROPERTY_IMAGE_DIRS,
  USER_IMAGE_DIRS,
  AGENT_IMAGE_DIRS,
  COMMUNITY_IMAGE_DIRS,
  BLOG_IMAGE_DIRS,
  TESTIMONIAL_IMAGE_DIRS,
  extractImageUrls,
  processImageBatch,
  getProjectImageCandidates,
  getProjectImageUrl,
  getProjectImageVariations,
  getProjectGalleryImageUrl,
  getProjectGalleryImages,
  getProjectLogoUrl,
  getProjectFeaturedImage,
  buildProjectImageSet,
} from '@/lib/image-resolver';

const CACHE_TTL = {
  LIST: 120,
  DETAIL: 600,
  RELATED: 300,
  FILTERS: 900,
  STATS: 3600,
  MEDIA: 300,
  PLANS: 600,
};

const CK = {
  list: (f: any) => `prop:list:${JSON.stringify(f)}`,
  byId: (id: number) => `prop:id:${id}`,
  bySlug: (slug: string) => `prop:slug:${slug}`,
  related: (id: number, limit: number) => `prop:related:${id}:${limit}`,
  filters: () => `prop:filters`,
  count: (f: any) => `prop:count:${JSON.stringify(f)}`,
  media: (ids: number[]) => `prop:media:${ids.slice().sort().join(',')}`,
  plans: (ids: number[]) => `prop:plans:${ids.slice().sort().join(',')}`,
  stats: (type: string) => `prop:stats:${type}`,
};

export interface PropertyFilters {
  page?: number;
  limit?: number;
  status?: number | number[];
  listing_type?: string | string[];
  property_type?: string | number;
  property_purpose?: string;
  city_id?: number | number[];
  community_id?: number | number[];
  sub_community_id?: number | number[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_area?: number;
  max_area?: number;
  featured?: boolean;
  keyword?: string;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'quality';
  occupancy?: string | string[];
  completion_from?: string;
  completion_to?: string;
  has_price?: boolean;
  has_location?: boolean;
  developer_id?: number | number[];
  completion_date?: string;
  exclusive_status?: string | string[];
  has_dld?: boolean;
}

interface PropertyListResult {
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

function buildPropertyQuery(knex: any, filters: PropertyFilters) {
  const {
    status = 5,
    listing_type,
    property_type,
    property_purpose,
    city_id,
    community_id,
    sub_community_id,
    min_price,
    max_price,
    min_bedrooms,
    max_bedrooms,
    min_area,
    max_area,
    featured,
    keyword,
    sort_by = 'newest',
    occupancy,
    completion_from,
    completion_to,
    has_price,
    developer_id,
    completion_date,
    exclusive_status,
    has_dld,
  } = filters;

  const query = knex('properties as p')
    .leftJoin('developers as d', 'p.developer_id', 'd.id')
    .leftJoin('internationaldevelopers as intd', 'p.developer_id', 'intd.id')
    .leftJoin('users as u', 'p.agent_id', 'u.id')
    .leftJoin('community as c', 'p.community_id', 'c.id')
    .leftJoin('sub_community as sc', 'p.sub_community_id', 'sc.id')
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

  if (Array.isArray(status)) {
    query.whereIn('p.status', status);
  } else {
    query.where('p.status', status);
  }

  if (listing_type) {
    Array.isArray(listing_type)
      ? query.whereIn('p.listing_type', listing_type)
      : query.where('p.listing_type', listing_type);
  }

  if (property_type) {
    Array.isArray(property_type)
      ? query.whereIn('p.property_type', property_type)
      : query.where('p.property_type', property_type);
  }

  if (property_purpose) query.where('p.property_purpose', property_purpose);

  if (city_id) {
    Array.isArray(city_id)
      ? query.whereIn('p.city_id', city_id)
      : query.where('p.city_id', city_id);
  }
  if (community_id) {
    Array.isArray(community_id)
      ? query.whereIn('p.community_id', community_id)
      : query.where('p.community_id', community_id);
  }
  if (sub_community_id) {
    Array.isArray(sub_community_id)
      ? query.whereIn('p.sub_community_id', sub_community_id)
      : query.where('p.sub_community_id', sub_community_id);
  }

  if (developer_id) {
    Array.isArray(developer_id)
      ? query.whereIn('p.developer_id', developer_id)
      : query.where('p.developer_id', developer_id);
  }

  if (exclusive_status) {
    Array.isArray(exclusive_status)
      ? query.whereIn('p.exclusive_status', exclusive_status)
      : query.where('p.exclusive_status', exclusive_status);
  }

  if (has_dld) {
    query.whereNotNull('p.dld_permit');
  }

  if (occupancy) {
    Array.isArray(occupancy)
      ? query.whereIn('p.occupancy', occupancy)
      : query.where('p.occupancy', occupancy);
  }

  if (completion_from) query.where('p.completion_date', '>=', completion_from);
  if (completion_to) query.where('p.completion_date', '<=', completion_to);
  if (completion_date) query.where('p.completion_date', completion_date);

  if (min_price) {
    query.where(function(this: any) {
      this.where('pp.sale_price', '>=', min_price).orWhere('p.price', '>=', min_price);
    });
  }
  if (max_price) {
    query.where(function(this: any) {
      this.where('pp.sale_price', '<=', max_price).orWhere('p.price', '<=', max_price);
    });
  }
  if (has_price) {
    query.where(function(this: any) {
      this.whereNotNull('pp.sale_price').orWhereNotNull('p.price');
    });
  }

  if (min_bedrooms === 0 || min_bedrooms) {
    if (min_bedrooms === 0) {
      query.where(function(this: any) {
        this.where('p.bedroom', 'like', '%Studio%')
          .orWhere('p.bedroom', '=', '0')
          .orWhere('p.bedroom', '=', '');
      });
    } else {
      query.whereRaw(
        'CAST(REGEXP_SUBSTR(p.bedroom, \'^[0-9]+\') AS UNSIGNED) >= ?',
        [min_bedrooms]
      );
    }
  }
  if (max_bedrooms === 0 || max_bedrooms) {
    if (max_bedrooms === 0) {
      query.where(function(this: any) {
        this.where('p.bedroom', 'like', '%Studio%')
          .orWhere('p.bedroom', '=', '0')
          .orWhere('p.bedroom', '=', '');
      });
    } else {
      query.whereRaw(
        'CAST(REGEXP_SUBSTR(p.bedroom, \'^[0-9]+\') AS UNSIGNED) <= ?',
        [max_bedrooms]
      );
    }
  }

  if (min_area) query.where('p.area', '>=', min_area);
  if (max_area) query.where('p.area', '<=', max_area);

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
        .orWhere('p.address', 'like', `%${keyword}%`)
        .orWhere('c.name', 'like', `%${keyword}%`)
        .orWhere('ci.name', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'price_asc':
      query.orderByRaw('COALESCE(NULLIF(pp.sale_price, 0), NULLIF(p.price, 0)) ASC NULLS LAST');
      break;
    case 'price_desc':
      query.orderByRaw('COALESCE(NULLIF(pp.sale_price, 0), NULLIF(p.price, 0)) DESC NULLS LAST');
      break;
    case 'oldest':
      query.orderBy('p.created_at', 'asc');
      break;
    case 'quality':
      query.orderByRaw('CASE WHEN p.featured_property = 1 THEN 0 ELSE 1 END, p.created_at DESC');
      break;
    case 'newest':
    default:
      query.orderBy('p.created_at', 'desc');
  }

  return query;
}

const LIST_COLUMNS = [
  'p.id',
  'p.p_id',
  'p.project_id',
  'p.property_name',
  'p.property_slug',
  'p.property_type',
  'p.property_purpose',
  'p.listing_type',
  'p.occupancy',
  'p.price',
  'p.price_end',
  'p.bedroom',
  'p.bathrooms',
  'p.area',
  'p.area_size',
  'p.min_area',
  'p.max_area',
  'p.area_end',
  'p.featured_property',
  'p.status',
  'p.featured_image',
  'p.gallery_media_ids',
  'p.map_latitude',
  'p.map_longitude',
  'p.developer_id',
  'p.agent_id',
  'p.community_id',
  'p.dld_permit',
  'p.RefNumber',
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
  'intd.name as intd_name',
  'intd.image as intd_logo',
  'intd.country as intd_country',
  'u.full_name as agent_name',
  'u.phone as agent_phone',
  'u.photo as agent_photo',
  'c.name as community_name',
  'c.slug as community_slug',
  'c.img as community_image',
  'sc.name as sub_community_name',
  'ci.name as city_name',
  'cur.code as currency_code',
  'cur.simbol as currency_symbol',
  'pp.sale_price',
  'pp.listing_price',
  'pp.rental_price',
  'pp.payment_plan_ids',
] as const;

// ─── BATCH FETCH ──────────────────────────────────────────────────────────

async function batchFetchMedia(knex: any, galleryIds: number[]): Promise<Map<number, any>> {
  if (!galleryIds.length) return new Map();
  const cacheKey = CK.media(galleryIds);
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
    ttl: CACHE_TTL.MEDIA,
    tags: ['media', 'properties'],
  });
  return map;
}

async function batchFetchPaymentPlans(knex: any, planIds: number[]): Promise<Map<number, any>> {
  if (!planIds.length) return new Map();
  const cacheKey = CK.plans(planIds);
  const cached = await cache.get<Map<number, any>>(cacheKey);
  if (cached) return cached;
  const plans = await knex('payment_plan')
    .whereIn('id', planIds)
    .where('status', 1)
    .select('id', 'name', 'percentage', 'item_id', 'item_type');
  const map = new Map<number, any>();
  for (const p of plans) map.set(p.id, p);
  await cache.set(cacheKey, map, {
    ttl: CACHE_TTL.PLANS,
    tags: ['plans', 'properties'],
  });
  return map;
}

// ─── TRANSFORM PROPERTY ──────────────────────────────────────────────────

function transformProperty(
  p: any,
  mediaMap: Map<number, any>,
  plansMap: Map<number, any>,
  isDetail = false
): any {
  const galleryIds = parseCommaIds(p.gallery_media_ids);
  
  // ✅ Build gallery images from mediaMap with proper paths
  const galleryImages = galleryIds
    .map(id => mediaMap.get(id))
    .filter(Boolean)
    .map((m: any) => ({
      id: m.id,
      url: getMediaImageUrl(m.path),
      title: m.title || null,
      description: m.description || null,
      featured: m.featured || 0,
    }));

  // ✅ Gallery URLs from media path
  const galleryUrls = galleryImages.map((g: any) => g.url);
  
  // ✅ Featured image - try featured_image first
  let featuredImage = null;
  
  if (p.featured_image) {
    // If it contains extension or slash, it's a path
    if (p.featured_image.includes('.') || p.featured_image.includes('/')) {
      featuredImage = getMediaImageUrl(p.featured_image);
    } else {
      // It might be a media ID
      const mediaId = parseInt(p.featured_image, 10);
      if (!isNaN(mediaId) && mediaMap.has(mediaId)) {
        const media = mediaMap.get(mediaId);
        featuredImage = getMediaImageUrl(media.path);
      }
    }
  }
  
  // If no featured image, use first gallery image
  if (!featuredImage && galleryUrls.length > 0) {
    featuredImage = galleryUrls[0];
  }
  
  // If still no image, use no-image placeholder
  if (!featuredImage) {
    featuredImage = getNoImageUrl();
  }

  const priceAmount = toNumber(p.sale_price) || toNumber(p.price);
  const priceEndAmount = toNumber(p.price_end);

  const devName = p.intd_name || p.developer_name || null;
  const devLogo = p.intd_logo || p.developer_logo || null;
  const devCountry = p.intd_country || p.developer_country || null;
  const isInternational = !!p.intd_name;

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
      amount: priceAmount,
      amount_end: priceEndAmount,
      display: formatPrice(priceAmount, p.currency_code, p.currency_symbol),
      display_end: formatPrice(priceEndAmount, p.currency_code, p.currency_symbol),
      currency: p.currency_code || 'AED',
      symbol: p.currency_symbol || 'AED',
      is_price_on_request: priceAmount === null,
      sale_price: toNumber(p.sale_price),
      listing_price: toNumber(p.listing_price),
      rental_price: toNumber(p.rental_price),
    },

    bedrooms: bedroom,
    bathrooms: bathroom,
    display_title: `${bedroom} | ${bathroom} | ${area}`,

    area: {
      value: p.area,
      size: p.area_size,
      display: area,
      min_area: p.min_area || null,
      max_area: p.max_area || null,
      area_end: p.area_end || null,
    },

    location: {
      community: p.community_name || null,
      community_slug: p.community_slug || null,
      sub_community: p.sub_community_name || null,
      city: p.city_name || 'Dubai',
      address: p.address || p.location || null,
      latitude: p.map_latitude || null,
      longitude: p.map_longitude || null,
      community_id: p.community_id || null,
      city_id: p.city_id || null,
      community_image: p.community_image ? getCommunityImageUrl(p.community_image) : null,
    },

    developer: {
      id: p.developer_id || null,
      name: devName,
      country: devCountry,
      is_international: isInternational,
      logo_url: getDeveloperImageUrl(devLogo),
      logo_variations: getDeveloperImageVariations(devLogo),
    },

    agent: {
      id: p.agent_id || null,
      name: p.agent_name || null,
      phone: p.agent_phone || null,
      photo_url: getAgentImageUrl(p.agent_photo),
      photo_variations: getAgentImageVariations(p.agent_photo),
    },

    featured_image: featuredImage,
    featured_image_variations: [featuredImage],
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
    project_id: p.project_id || null,
  };

  if (isDetail) {
    return {
      ...base,
      description: p.description || null,
      flooring: p.flooring || null,
      parking: p.parking || null,
      whatsapp_url: p.whatsapp_url || null,
      rera_number: p.ReraNumber || null,
      seo: {
        title: p.seo_title || p.property_name || null,
        description: p.meta_description || p.description?.slice(0, 160) || null,
        keywords: p.keyword || null,
        slug: p.property_slug || '',
      },
      image_candidates: {
        featured: [featuredImage],
        gallery: galleryUrls,
        community: p.community_image ? getCommunityImageVariations(p.community_image) : [],
      },
    };
  }

  return base;
}

// ─── MAIN CRUD FUNCTIONS ─────────────────────────────────────────────────

export async function getProperties(filters: PropertyFilters = {}): Promise<PropertyListResult> {
  const { page = 1, limit = 20 } = filters;
  const cacheKey = CK.list(filters);
  const cached = await cache.get<PropertyListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();
    const query = buildPropertyQuery(knex, filters);
    const countKey = CK.count(filters);

    const [countResult, properties] = await Promise.all([
      cache.get<number>(countKey).then(async cachedCount => {
        if (cachedCount !== null) return cachedCount;
        const countQ = buildPropertyQuery(knex, filters);
        const [{ total }] = await countQ.count('p.id as total');
        const count = Number(total);
        await cache.set(countKey, count, {
          ttl: CACHE_TTL.LIST,
          tags: ['properties', 'list', 'count'],
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

    const data = properties.map((p: any) => transformProperty(p, mediaMap, plansMap, false));

    const result: PropertyListResult = {
      data,
      meta: {
        total: countResult,
        page,
        limit,
        totalPages: Math.ceil(countResult / limit),
      },
    };

    const tags = ['properties', 'list'];
    if (filters.listing_type) tags.push(filters.listing_type as string);
    if (filters.city_id) tags.push(`city:${filters.city_id}`);
    if (filters.community_id) tags.push(`community:${filters.community_id}`);
    if (filters.featured) tags.push('featured');

    await cache.set(cacheKey, result, {
      ttl: CACHE_TTL.LIST,
      tags,
    });
    return result;
  });
}

export async function getPropertyById(id: number): Promise<any | null> {
  const cacheKey = CK.byId(id);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();

    const property = await knex('properties as p')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as intd', 'p.developer_id', 'intd.id')
      .leftJoin('users as u', 'p.agent_id', 'u.id')
      .leftJoin('community as c', 'p.community_id', 'c.id')
      .leftJoin('sub_community as sc', 'p.sub_community_id', 'sc.id')
      .leftJoin('cities as ci', 'p.city_id', 'ci.id')
      .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
      .leftJoin(
        knex('properties_prices')
          .select(
            'property_id',
            knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'),
            knex.raw('MIN(NULLIF(listing_price, 0)) as listing_price'),
            knex.raw('MIN(NULLIF(rental_price, 0)) as rental_price'),
            knex.raw('GROUP_CONCAT(DISTINCT payment_plan_ids) as payment_plan_ids')
          )
          .groupBy('property_id')
          .as('pp'),
        'p.id',
        'pp.property_id'
      )
      .where('p.id', id)
      .first()
      .select(
        'p.*',
        'd.name as developer_name',
        'd.image as developer_logo',
        'd.country as developer_country',
        'd.website as developer_website',
        'd.informations as developer_info',
        'intd.name as intd_name',
        'intd.image as intd_logo',
        'intd.country as intd_country',
        'intd.website as intd_website',
        'intd.informations as intd_info',
        'u.full_name as agent_name',
        'u.phone as agent_phone',
        'u.photo as agent_photo',
        'u.rera_brn as agent_rera',
        'u.email as agent_email',
        'u.mobile_phone as agent_mobile',
        'u.about as agent_about',
        'c.name as community_name',
        'c.slug as community_slug',
        'c.img as community_image',
        'sc.name as sub_community_name',
        'ci.name as city_name',
        'cur.code as currency_code',
        'cur.simbol as currency_symbol',
        'pp.sale_price',
        'pp.listing_price',
        'pp.rental_price',
        'pp.payment_plan_ids'
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

    const transformed = transformProperty(property, mediaMap, plansMap, true);

    const result = {
      ...transformed,
      facilities: facilities || null,
      location_data: locationData || null,
      agent: {
        id: property.agent_id || null,
        name: property.agent_name || null,
        phone: property.agent_phone || null,
        photo_url: getAgentImageUrl(property.agent_photo),
        photo_variations: getAgentImageVariations(property.agent_photo),
        rera_brn: property.agent_rera || null,
        email: property.agent_email || null,
        mobile: property.agent_mobile || null,
        about: property.agent_about || null,
      },
      developer: {
        id: property.developer_id || null,
        name: property.intd_name || property.developer_name || null,
        country: property.intd_country || property.developer_country || null,
        website: property.intd_website || property.developer_website || null,
        informations: property.intd_info || property.developer_info || null,
        logo_url: getDeveloperImageUrl(property.intd_logo || property.developer_logo),
        logo_variations: getDeveloperImageVariations(property.intd_logo || property.developer_logo),
        is_international: !!property.intd_name,
      },
      community: {
        id: property.community_id || null,
        name: property.community_name || null,
        slug: property.community_slug || null,
        image: property.community_image ? getCommunityImageUrl(property.community_image) : null,
        image_variations: property.community_image ? getCommunityImageVariations(property.community_image) : [],
      },
    };

    await cache.set(cacheKey, result, {
      ttl: CACHE_TTL.DETAIL,
      tags: ['properties', 'detail', `property:${id}`],
    });
    return result;
  });
}

export async function getPropertyBySlug(slug: string): Promise<any | null> {
  const cacheKey = CK.bySlug(slug);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const row = await knex('properties')
    .where('property_slug', slug)
    .first()
    .select('id');

  if (!row) return null;

  const result = await getPropertyById(row.id);
  if (result) {
    await cache.set(cacheKey, result, {
      ttl: CACHE_TTL.DETAIL,
      tags: ['properties', 'detail', `slug:${slug}`],
    });
  }
  return result;
}

export async function getRelatedProperties(propertyId: number, limit = 6): Promise<PropertyListResult> {
  const cacheKey = CK.related(propertyId, limit);
  const cached = await cache.get<PropertyListResult>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const current = await knex('properties')
    .where('id', propertyId)
    .first()
    .select('property_type', 'community_id', 'listing_type', 'city_id');

  if (!current) {
    return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  }

  const filters: PropertyFilters = {
    status: 5,
    listing_type: current.listing_type || 'Off plan',
    limit,
    sort_by: 'newest',
  };

  if (current.community_id) filters.community_id = current.community_id;
  else if (current.city_id) filters.city_id = current.city_id;
  else if (current.property_type) filters.property_type = current.property_type;

  const knex2 = await db();
  const query = buildPropertyQuery(knex2, filters)
    .whereNot('p.id', propertyId)
    .limit(limit)
    .select(LIST_COLUMNS);

  const properties = await query;

  if (!properties.length) {
    return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
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
    batchFetchMedia(knex2, uniqueGalleryIds),
    batchFetchPaymentPlans(knex2, uniquePlanIds),
  ]);

  const result = {
    data: properties.map((p: any) => transformProperty(p, mediaMap, plansMap, false)),
    meta: { total: properties.length, page: 1, limit, totalPages: 1 },
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.RELATED,
    tags: ['properties', 'related', `property:${propertyId}`],
  });
  return result;
}

export async function getSearchFilters() {
  const cacheKey = CK.filters();
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [propertyTypes, cities, communities, subCommunities, priceRange, areaRange] = await Promise.all([
    knex('property_types').where('status', 1).select('id', 'types as name', 'slug'),
    knex('cities').where('status', '1').select('id', 'name', 'slug'),
    knex('community').where('status', 1).select('id', 'name', 'slug', 'img'),
    knex('sub_community').where('status', 1).select('id', 'name', 'slug'),
    knex('properties_prices')
      .whereNotNull('sale_price')
      .where('sale_price', '>', 0)
      .min('sale_price as min')
      .max('sale_price as max')
      .first(),
    knex('properties')
      .where('status', 5)
      .min('area as min')
      .max('area as max')
      .first(),
  ]);

  const result = {
    property_types: propertyTypes,
    cities,
    communities: communities.map((c: any) => ({
      ...c,
      image_url: getCommunityImageUrl(c.img),
      image_variations: getCommunityImageVariations(c.img),
    })),
    sub_communities: subCommunities,
    price_range: {
      min: priceRange?.min || 0,
      max: priceRange?.max || 10000000,
    },
    area_range: {
      min: areaRange?.min || 0,
      max: areaRange?.max || 10000,
    },
    media_base_url: UPLOAD_BASE_URL,
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.FILTERS,
    tags: ['properties', 'filters'],
  });
  return result;
}

// ─── CREATE / UPDATE / DELETE ────────────────────────────────────────────

export async function createProperty(data: any) {
  const knex = await db();
  const [id] = await knex('properties').insert({
    ...data,
    status: data.status ?? 5,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await Promise.all([
    cache.delByTag('properties'),
    cache.delByTag('list'),
    cache.delByTag('stats'),
    cache.delByTag('filters'),
    cache.delPattern('prop:list:*'),
    cache.delPattern('prop:count:*'),
    cache.delPattern('prop:stats:*'),
  ]);

  return getPropertyById(id);
}

export async function updateProperty(id: number, data: any) {
  const knex = await db();
  const existing = await knex('properties').where('id', id).first().select('property_slug');

  await knex('properties').where('id', id).update({
    ...data,
    updated_at: new Date(),
  });

  const promises: Promise<void>[] = [
    cache.del(CK.byId(id)),
    cache.delByTag('properties'),
    cache.delByTag('list'),
    cache.delByTag('related'),
    cache.delPattern('prop:list:*'),
    cache.delPattern('prop:count:*'),
    cache.delPattern('prop:related:*'),
  ];

  if (existing?.property_slug) {
    promises.push(cache.del(CK.bySlug(existing.property_slug)));
    promises.push(cache.delByTag(`slug:${existing.property_slug}`));
  }

  await Promise.all(promises);
  return getPropertyById(id);
}

export async function deleteProperty(id: number) {
  const knex = await db();
  const existing = await knex('properties').where('id', id).first().select('property_slug');

  await knex('properties').where('id', id).update({
    status: 0,
    updated_at: new Date(),
  });

  const promises: Promise<void>[] = [
    cache.del(CK.byId(id)),
    cache.delByTag('properties'),
    cache.delByTag('list'),
    cache.delByTag('archive'),
    cache.delPattern('prop:list:*'),
    cache.delPattern('prop:count:*'),
  ];

  if (existing?.property_slug) {
    promises.push(cache.del(CK.bySlug(existing.property_slug)));
  }

  await Promise.all(promises);
  return { id, deleted: true };
}

export async function permanentDeleteProperty(id: number) {
  const knex = await db();
  await knex('properties').where('id', id).delete();
  await Promise.all([
    cache.del(CK.byId(id)),
    cache.delByTag('properties'),
    cache.delPattern('prop:list:*'),
    cache.delPattern('prop:count:*'),
  ]);
  return { id, deleted: true };
}

export async function restoreArchiveProperty(id: number) {
  return updateProperty(id, { status: 5 });
}

// ─── SHORTHAND EXPORTS ──────────────────────────────────────────────────

export const getFeaturedProperties = (limit = 10) => getProperties({ featured: true, status: 5, limit });
export const getRecentProperties = (limit = 10) => getProperties({ status: 5, sort_by: 'newest', limit });
export const getOffPlanProperties = (filters: PropertyFilters = {}) =>
  getProperties({ ...filters, listing_type: 'Off plan', status: 5 });
export const getResaleProperties = (filters: PropertyFilters = {}) =>
  getProperties({ ...filters, listing_type: 'Resale', status: 5 });
export const getArchiveProperties = (filters: PropertyFilters = {}) =>
  getProperties({ ...filters, status: [0, 1, 2] as any });
export const getBuyProperties = (filters: PropertyFilters = {}) =>
  getProperties({ ...filters, status: 5, listing_type: 'Off plan' });
export const getSellProperties = (filters: PropertyFilters = {}) =>
  getProperties({ ...filters, status: 5, listing_type: 'Resale' });

// ─── OFF-PLAN FUNCTIONS ──────────────────────────────────────────────────

export async function getOffPlanPropertiesByPrice(limit: number = 20) {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    sort_by: 'price_desc',
    limit,
  });
}

export async function getOffPlanPropertiesWithCompletion(limit: number = 20) {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    has_price: true,
    sort_by: 'newest',
    limit,
  });
}

export async function getOffPlanByBedroom(bedroom: string, limit: number = 20) {
  const filters: PropertyFilters = {
    listing_type: 'Off plan',
    status: 5,
    limit,
    sort_by: 'price_desc',
  };

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

  return getProperties(filters);
}

export async function getOffPlanByPriceRange(minPrice: number, maxPrice: number, limit: number = 20) {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    min_price: minPrice,
    max_price: maxPrice,
    sort_by: 'price_desc',
    limit,
  });
}

export async function getOffPlanStatistics() {
  const cacheKey = CK.stats('offplan');
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [totalResult, priceStats, bedroomStats, occupancyStats, completionStats, priceRangeStats, locationStats] =
    await Promise.all([
      knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .count('* as total')
        .first(),

      knex('properties as p')
        .leftJoin(
          knex('properties_prices')
            .select('property_id', knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'))
            .groupBy('property_id')
            .as('pp'),
          'p.id',
          'pp.property_id'
        )
        .where('p.listing_type', 'Off plan')
        .where('p.status', 5)
        .whereNotNull('pp.sale_price')
        .where('pp.sale_price', '>', 0)
        .select(
          knex.raw('COUNT(*) as total_with_price'),
          knex.raw('MIN(pp.sale_price) as min_price'),
          knex.raw('MAX(pp.sale_price) as max_price'),
          knex.raw('AVG(pp.sale_price) as avg_price'),
          knex.raw('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pp.sale_price) as median_price')
        )
        .first(),

      knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('bedroom')
        .select(
          knex.raw(`
            CASE 
              WHEN bedroom LIKE '%Studio%' THEN 'Studio'
              WHEN bedroom = '0' THEN 'Studio'
              WHEN bedroom = '' THEN 'Studio'
              WHEN bedroom REGEXP '^[0-9]+' THEN CONCAT(CAST(REGEXP_SUBSTR(bedroom, '^[0-9]+') AS UNSIGNED), ' BHK')
              ELSE bedroom
            END as bedroom_label
          `),
          knex.raw('COUNT(*) as count')
        )
        .groupBy('bedroom_label')
        .orderByRaw('CAST(REGEXP_SUBSTR(bedroom_label, \'^[0-9]+\') AS UNSIGNED)'),

      knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .select('occupancy')
        .count('* as count')
        .groupBy('occupancy')
        .orderBy('count', 'desc'),

      knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('completion_date')
        .select(
          knex.raw(`
            CASE 
              WHEN completion_date < CURDATE() THEN 'Past Due'
              WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) THEN 'Within 3 Months'
              WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) THEN 'Within 6 Months'
              WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 1 YEAR) THEN 'Within 1 Year'
              ELSE 'Beyond 1 Year'
            END as completion_timeline
          `),
          knex.raw('COUNT(*) as count')
        )
        .groupBy('completion_timeline')
        .orderBy('completion_timeline'),

      knex('properties as p')
        .leftJoin(
          knex('properties_prices')
            .select('property_id', knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'))
            .groupBy('property_id')
            .as('pp'),
          'p.id',
          'pp.property_id'
        )
        .where('p.listing_type', 'Off plan')
        .where('p.status', 5)
        .whereNotNull('pp.sale_price')
        .where('pp.sale_price', '>', 0)
        .select(
          knex.raw(`
            CASE 
              WHEN pp.sale_price < 500000 THEN 'Below AED 500K'
              WHEN pp.sale_price BETWEEN 500000 AND 1000000 THEN 'AED 500K - AED 1M'
              WHEN pp.sale_price BETWEEN 1000001 AND 2500000 THEN 'AED 1M - AED 2.5M'
              WHEN pp.sale_price BETWEEN 2500001 AND 5000000 THEN 'AED 2.5M - AED 5M'
              WHEN pp.sale_price BETWEEN 5000001 AND 10000000 THEN 'AED 5M - AED 10M'
              WHEN pp.sale_price BETWEEN 10000001 AND 20000000 THEN 'AED 10M - AED 20M'
              WHEN pp.sale_price BETWEEN 20000001 AND 50000000 THEN 'AED 20M - AED 50M'
              WHEN pp.sale_price BETWEEN 50000001 AND 100000000 THEN 'AED 50M - AED 100M'
              ELSE 'Above AED 100M'
            END as price_range
          `),
          knex.raw('COUNT(*) as count'),
          knex.raw('AVG(pp.sale_price) as avg_price')
        )
        .groupBy('price_range')
        .orderByRaw('MIN(pp.sale_price)'),

      knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .select(
          knex.raw(`
            CASE 
              WHEN location IS NOT NULL AND location != '' THEN location
              WHEN city_id IS NOT NULL THEN CONCAT('City ID: ', city_id)
              ELSE 'Unknown Location'
            END as location_label
          `),
          knex.raw('COUNT(*) as count')
        )
        .groupBy('location_label')
        .orderBy('count', 'desc')
        .limit(20),
    ]);

  const result = {
    total: Number(totalResult?.total || 0),
    with_price: Number(priceStats?.total_with_price || 0),
    min_price: priceStats?.min_price || null,
    max_price: priceStats?.max_price || null,
    avg_price: priceStats?.avg_price || null,
    median_price: priceStats?.median_price || null,
    by_bedroom: bedroomStats || [],
    by_occupancy: occupancyStats || [],
    by_completion: completionStats || [],
    by_price_range: priceRangeStats || [],
    top_locations: locationStats || [],
    data_quality: {
      has_price: Number(priceStats?.total_with_price || 0),
      has_location: await knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('location')
        .count('* as total')
        .then((r: any) => Number(r[0]?.total || 0)),
      has_city: await knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('city_id')
        .count('* as total')
        .then((r: any) => Number(r[0]?.total || 0)),
      has_developer: await knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('developer_id')
        .count('* as total')
        .then((r: any) => Number(r[0]?.total || 0)),
      has_bedroom: await knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('bedroom')
        .count('* as total')
        .then((r: any) => Number(r[0]?.total || 0)),
      has_rera: await knex('properties')
        .where('listing_type', 'Off plan')
        .where('status', 5)
        .whereNotNull('ReraNumber')
        .count('* as total')
        .then((r: any) => Number(r[0]?.total || 0)),
    },
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'offplan'],
  });
  return result;
}

// ─── BUY PROPERTIES FUNCTIONS ────────────────────────────────────────────

export async function getBuyPropertiesByBedroom(bedroom: string, limit: number = 20) {
  return getOffPlanByBedroom(bedroom, limit);
}

export async function getBuyPropertiesByPriceRange(minPrice: number, maxPrice: number, limit: number = 20) {
  return getOffPlanByPriceRange(minPrice, maxPrice, limit);
}

export async function getBuyPropertyBySlug(slug: string) {
  return getPropertyBySlug(slug);
}

export async function getBuyPropertiesStatistics() {
  const cacheKey = CK.stats('buy');
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [totalResult, priceStats, bedroomStats, listingTypeStats] = await Promise.all([
    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Off plan')
      .whereNotNull('price')
      .where('price', '>', 0)
      .count('* as total')
      .first(),

    knex('properties as p')
      .leftJoin(
        knex('properties_prices')
          .select('property_id', knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'))
          .groupBy('property_id')
          .as('pp'),
        'p.id',
        'pp.property_id'
      )
      .where('p.status', 5)
      .where('p.listing_type', 'Off plan')
      .whereNotNull('pp.sale_price')
      .where('pp.sale_price', '>', 0)
      .select(
        knex.raw('COUNT(*) as total_with_price'),
        knex.raw('MIN(pp.sale_price) as min_price'),
        knex.raw('MAX(pp.sale_price) as max_price'),
        knex.raw('AVG(pp.sale_price) as avg_price')
      )
      .first(),

    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Off plan')
      .whereNotNull('bedroom')
      .select('bedroom')
      .count('* as count')
      .groupBy('bedroom')
      .orderBy('bedroom'),

    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Off plan')
      .whereNotNull('price')
      .where('price', '>', 0)
      .select('listing_type')
      .count('* as count')
      .groupBy('listing_type'),
  ]);

  const result = {
    total: Number(totalResult?.total || 0),
    with_price: Number(priceStats?.total_with_price || 0),
    min_price: priceStats?.min_price || null,
    max_price: priceStats?.max_price || null,
    avg_price: priceStats?.avg_price || null,
    by_bedroom: bedroomStats || [],
    by_listing_type: listingTypeStats || [],
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'buy'],
  });
  return result;
}

// ─── SELL PROPERTIES FUNCTIONS ───────────────────────────────────────────

export async function getSellPropertiesByBedroom(bedroom: string, limit: number = 20) {
  const filters: PropertyFilters = {
    listing_type: 'Resale',
    status: 5,
    limit,
    sort_by: 'price_desc',
  };

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

  return getProperties(filters);
}

export async function getSellPropertiesByPriceRange(minPrice: number, maxPrice: number, limit: number = 20) {
  return getProperties({
    listing_type: 'Resale',
    status: 5,
    min_price: minPrice,
    max_price: maxPrice,
    sort_by: 'price_desc',
    limit,
  });
}

export async function getSellPropertyBySlug(slug: string) {
  return getPropertyBySlug(slug);
}

export async function getSellPropertiesStatistics() {
  const cacheKey = CK.stats('sell');
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const [totalResult, priceStats, bedroomStats, listingTypeStats] = await Promise.all([
    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Resale')
      .whereNotNull('price')
      .where('price', '>', 0)
      .count('* as total')
      .first(),

    knex('properties as p')
      .leftJoin(
        knex('properties_prices')
          .select('property_id', knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'))
          .groupBy('property_id')
          .as('pp'),
        'p.id',
        'pp.property_id'
      )
      .where('p.status', 5)
      .where('p.listing_type', 'Resale')
      .whereNotNull('pp.sale_price')
      .where('pp.sale_price', '>', 0)
      .select(
        knex.raw('COUNT(*) as total_with_price'),
        knex.raw('MIN(pp.sale_price) as min_price'),
        knex.raw('MAX(pp.sale_price) as max_price'),
        knex.raw('AVG(pp.sale_price) as avg_price')
      )
      .first(),

    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Resale')
      .whereNotNull('bedroom')
      .select('bedroom')
      .count('* as count')
      .groupBy('bedroom')
      .orderBy('bedroom'),

    knex('properties')
      .where('status', 5)
      .where('listing_type', 'Resale')
      .whereNotNull('price')
      .where('price', '>', 0)
      .select('listing_type')
      .count('* as count')
      .groupBy('listing_type'),
  ]);

  const result = {
    total: Number(totalResult?.total || 0),
    with_price: Number(priceStats?.total_with_price || 0),
    min_price: priceStats?.min_price || null,
    max_price: priceStats?.max_price || null,
    avg_price: priceStats?.avg_price || null,
    by_bedroom: bedroomStats || [],
    by_listing_type: listingTypeStats || [],
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'sell'],
  });
  return result;
}

// ─── ARCHIVE FUNCTIONS ──────────────────────────────────────────────────

export async function getArchivePropertiesByPrice(limit: number = 20) {
  return getProperties({
    status: [0, 1, 2],
    sort_by: 'price_desc',
    limit,
  });
}

export async function getArchiveStatistics() {
  const cacheKey = CK.stats('archive');
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const ARCHIVE_STATUSES = [0, 1, 2];

  const [totalResult, priceStats, bedroomStats, statusBreakdown] = await Promise.all([
    knex('properties')
      .whereIn('status', ARCHIVE_STATUSES)
      .count('* as total')
      .first(),

    knex('properties')
      .whereIn('status', ARCHIVE_STATUSES)
      .whereNotNull('price')
      .where('price', '>', 0)
      .select(
        knex.raw('COUNT(*) as total_with_price'),
        knex.raw('MIN(price) as min_price'),
        knex.raw('MAX(price) as max_price'),
        knex.raw('AVG(price) as avg_price')
      )
      .first(),

    knex('properties')
      .whereIn('status', ARCHIVE_STATUSES)
      .whereNotNull('bedroom')
      .select('bedroom')
      .count('* as count')
      .groupBy('bedroom')
      .orderBy('bedroom'),

    knex('properties')
      .whereIn('status', ARCHIVE_STATUSES)
      .select('status')
      .count('* as count')
      .groupBy('status')
      .orderBy('status'),
  ]);

  const result = {
    total: Number(totalResult?.total || 0),
    with_price: Number(priceStats?.total_with_price || 0),
    min_price: priceStats?.min_price || null,
    max_price: priceStats?.max_price || null,
    avg_price: priceStats?.avg_price || null,
    by_bedroom: bedroomStats || [],
    by_status: statusBreakdown || [],
  };

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'archive'],
  });
  return result;
}

// ─── CONTACT / ENQUIRY FUNCTIONS ─────────────────────────────────────────

export async function createContact(data: {
  name: string;
  email: string;
  phone: string;
  message?: string;
  property_id?: number;
  property_slug?: string;
  source?: string;
  user_id?: number;
}) {
  const knex = await db();

  try {
    const [id] = await knex('contact_us').insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message || null,
      property_id: data.property_id || null,
      property_slug: data.property_slug || null,
      source: data.source || 'website',
      user_id: data.user_id || null,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { id, ...data, created_at: new Date() };
  } catch (error) {
    throw new Error('Failed to submit contact');
  }
}

export async function createEnquiry(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id?: number;
  property_slug?: string;
  enquiry_type?: string;
  source?: string;
  user_id?: number;
}) {
  const knex = await db();

  try {
    let propertyExists = false;
    if (data.property_id) {
      const [property] = await knex('properties').where('id', data.property_id).select('id');
      propertyExists = !!property;
    }

    const [id] = await knex('enquire').insert({
      contact_id: data.user_id || null,
      property_id: propertyExists ? data.property_id : null,
      type: data.enquiry_type || 'Inquiry',
      source: data.source || 'Website',
      message: data.message || null,
      contact_source: 'Website',
      lead_source: data.source || 'Website',
      status: 1,
      lead_status: 1,
      created_at: new Date(),
      updated_at: new Date(),
      zoho_synced: 0,
      zoho_lead_id: null,
      synced_at: null,
    });

    return { id, ...data, created_at: new Date() };
  } catch (error) {
    throw new Error('Failed to submit enquiry');
  }
}

// ─── OFF-PLAN DETAIL FUNCTIONS ────────────────────────────────────────────

export async function getOffPlanPropertyBySlug(slug: string): Promise<any | null> {
  const property = await getPropertyBySlug(slug);
  if (!property) return null;
  
  const isOffPlan = 
    property.listing_type === 'Off plan' ||
    property.listing_type === 'Off-plan' ||
    property.listing_type === 'Offplan' ||
    property.listing_type === 'Off Plan';
  
  return isOffPlan ? property : null;
}

export async function getOffPlanPropertyById(id: number): Promise<any | null> {
  const property = await getPropertyById(id);
  if (!property) return null;
  
  const isOffPlan = 
    property.listing_type === 'Off plan' ||
    property.listing_type === 'Off-plan' ||
    property.listing_type === 'Offplan' ||
    property.listing_type === 'Off Plan';
  
  return isOffPlan ? property : null;
}

export async function getOffPlanByDeveloper(developerId: number, limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    developer_id: developerId,
    limit,
    sort_by: 'newest',
  });
}

export async function getOffPlanByCommunity(communityId: number, limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    community_id: communityId,
    limit,
    sort_by: 'newest',
  });
}

export async function getOffPlanByCity(cityId: number, limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    city_id: cityId,
    limit,
    sort_by: 'newest',
  });
}

export async function getOffPlanFeatured(limit: number = 10): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    featured: true,
    limit,
    sort_by: 'quality',
  });
}

export async function getOffPlanLatest(limit: number = 10): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    limit,
    sort_by: 'newest',
  });
}

export async function getOffPlanWithCompletion(completionDate: string, limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    completion_date: completionDate,
    limit,
    sort_by: 'newest',
  });
}

export async function getOffPlanByExclusiveStatus(status: string, limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    exclusive_status: status,
    limit,
  });
}

export async function getOffPlanWithDLD(limit: number = 20): Promise<PropertyListResult> {
  return getProperties({
    listing_type: 'Off plan',
    status: 5,
    has_dld: true,
    limit,
  });
}

export async function getOffPlanPriceRangeStats(): Promise<any> {
  const cacheKey = 'offplan:price:stats';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const result = await knex('properties_prices as pp')
    .join('properties as p', 'pp.property_id', 'p.id')
    .where('p.listing_type', 'Off plan')
    .where('p.status', 5)
    .whereNotNull('pp.sale_price')
    .where('pp.sale_price', '>', 0)
    .select(
      knex.raw('COUNT(*) as total'),
      knex.raw('MIN(pp.sale_price) as min_price'),
      knex.raw('MAX(pp.sale_price) as max_price'),
      knex.raw('AVG(pp.sale_price) as avg_price'),
      knex.raw('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pp.sale_price) as median_price'),
      knex.raw(`
        CASE 
          WHEN pp.sale_price < 500000 THEN 'Under AED 500K'
          WHEN pp.sale_price BETWEEN 500000 AND 1000000 THEN 'AED 500K - 1M'
          WHEN pp.sale_price BETWEEN 1000001 AND 2000000 THEN 'AED 1M - 2M'
          WHEN pp.sale_price BETWEEN 2000001 AND 5000000 THEN 'AED 2M - 5M'
          WHEN pp.sale_price BETWEEN 5000001 AND 10000000 THEN 'AED 5M - 10M'
          WHEN pp.sale_price BETWEEN 10000001 AND 20000000 THEN 'AED 10M - 20M'
          WHEN pp.sale_price > 20000000 THEN 'AED 20M+'
        END as price_range
      `),
      knex.raw('COUNT(*) as count_in_range')
    )
    .groupBy('price_range')
    .orderBy('min_price');

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'offplan'],
  });

  return result;
}

export async function getOffPlanCompletionStats(): Promise<any> {
  const cacheKey = 'offplan:completion:stats';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const result = await knex('properties')
    .where('listing_type', 'Off plan')
    .where('status', 5)
    .whereNotNull('completion_date')
    .select(
      knex.raw(`
        CASE 
          WHEN completion_date < CURDATE() THEN 'Past Due'
          WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) THEN 'Within 3 Months'
          WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) THEN 'Within 6 Months'
          WHEN completion_date <= DATE_ADD(CURDATE(), INTERVAL 1 YEAR) THEN 'Within 1 Year'
          ELSE 'Beyond 1 Year'
        END as completion_timeline
      `),
      knex.raw('COUNT(*) as count'),
      knex.raw('AVG(DATEDIFF(completion_date, CURDATE())) as avg_days_remaining')
    )
    .groupBy('completion_timeline')
    .orderBy('completion_timeline');

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'offplan'],
  });

  return result;
}

export async function getOffPlanBedroomStats(): Promise<any> {
  const cacheKey = 'offplan:bedroom:stats';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const result = await knex('properties')
    .where('listing_type', 'Off plan')
    .where('status', 5)
    .whereNotNull('bedroom')
    .select(
      knex.raw(`
        CASE 
          WHEN bedroom LIKE '%Studio%' THEN 'Studio'
          WHEN bedroom = '0' THEN 'Studio'
          WHEN bedroom = '' THEN 'Studio'
          WHEN bedroom REGEXP '^[0-9]+' THEN CONCAT(CAST(REGEXP_SUBSTR(bedroom, '^[0-9]+') AS UNSIGNED), ' BHK')
          ELSE bedroom
        END as bedroom_label
      `),
      knex.raw('COUNT(*) as count')
    )
    .groupBy('bedroom_label')
    .orderByRaw('CAST(REGEXP_SUBSTR(bedroom_label, \'^[0-9]+\') AS UNSIGNED)');

  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.STATS,
    tags: ['properties', 'stats', 'offplan'],
  });

  return result;
}

// ─── DATA FIX FUNCTIONS ──────────────────────────────────────────────────

export async function fixBedroomData(): Promise<any> {
  const knex = await db();
  const properties = await knex('properties')
    .whereNotNull('bedroom')
    .select('id', 'bedroom');

  let updated = 0;
  for (const prop of properties) {
    const formatted = parseBedroom(prop.bedroom);
    if (formatted !== prop.bedroom) {
      await knex('properties')
        .where('id', prop.id)
        .update({ bedroom: formatted });
      updated++;
    }
  }

  return { updated, total: properties.length };
}

export async function updateLocationFromPropertyLocations(): Promise<any> {
  const knex = await db();
  const locations = await knex('property_locations')
    .whereNotNull('property_id')
    .select('property_id', 'latitude', 'longitude', 'address', 'city', 'community');

  let updated = 0;
  for (const loc of locations) {
    await knex('properties')
      .where('id', loc.property_id)
      .update({
        map_latitude: loc.latitude || null,
        map_longitude: loc.longitude || null,
        address: loc.address || null,
        city_id: loc.city || null,
        community_id: loc.community || null,
      });
    updated++;
  }

  return { updated, total: locations.length };
}

export async function fixCityDataFromLocation(): Promise<any> {
  const knex = await db();
  const properties = await knex('properties')
    .whereNotNull('location')
    .select('id', 'location');

  let updated = 0;
  for (const prop of properties) {
    const cityMatch = prop.location.match(/^(.*?)[,\s-]/);
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      const city = await knex('cities').where('name', 'like', `%${cityName}%`).first().select('id');
      if (city) {
        await knex('properties')
          .where('id', prop.id)
          .update({ city_id: city.id });
        updated++;
      }
    }
  }

  return { updated, total: properties.length };
}

// ─── IMAGE UTILITY EXPORTS ──────────────────────────────────────────────

export {
  UPLOAD_BASE_URL,
  getImageUrl,
  getImageUrlVariations,
  getFeaturedImage,
  getNoImageUrl,
  getDeveloperImageUrl,
  getDeveloperImageVariations,
  getAgentImageUrl,
  getAgentImageVariations,
  getCommunityImageUrl,
  getCommunityImageVariations,
  getMediaImageUrl,
  getGalleryImages,
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  PROPERTY_IMAGE_DIRS,
  USER_IMAGE_DIRS,
  AGENT_IMAGE_DIRS,
  COMMUNITY_IMAGE_DIRS,
  BLOG_IMAGE_DIRS,
  TESTIMONIAL_IMAGE_DIRS,
  extractImageUrls,
  processImageBatch,
  getProjectImageCandidates,
  getProjectImageUrl,
  getProjectImageVariations,
  getProjectGalleryImageUrl,
  getProjectGalleryImages,
  getProjectLogoUrl,
  getProjectFeaturedImage,
  buildProjectImageSet,
};

export default {
  getProperties,
  getPropertyById,
  getPropertyBySlug,
  getRelatedProperties,
  getSearchFilters,
  createProperty,
  updateProperty,
  deleteProperty,
  permanentDeleteProperty,
  restoreArchiveProperty,
  getFeaturedProperties,
  getRecentProperties,
  getOffPlanProperties,
  getResaleProperties,
  getArchiveProperties,
  getBuyProperties,
  getSellProperties,
  getBuyPropertiesByBedroom,
  getBuyPropertiesByPriceRange,
  getBuyPropertyBySlug,
  getBuyPropertiesStatistics,
  getSellPropertiesByBedroom,
  getSellPropertiesByPriceRange,
  getSellPropertyBySlug,
  getSellPropertiesStatistics,
  getArchivePropertiesByPrice,
  getArchiveStatistics,
  getOffPlanPropertyBySlug,
  getOffPlanPropertyById,
  getOffPlanByDeveloper,
  getOffPlanByCommunity,
  getOffPlanByCity,
  getOffPlanFeatured,
  getOffPlanLatest,
  getOffPlanWithCompletion,
  getOffPlanByExclusiveStatus,
  getOffPlanWithDLD,
  getOffPlanPriceRangeStats,
  getOffPlanCompletionStats,
  getOffPlanBedroomStats,
  getOffPlanPropertiesByPrice,
  getOffPlanPropertiesWithCompletion,
  getOffPlanByBedroom,
  getOffPlanByPriceRange,
  getOffPlanStatistics,
  createContact,
  createEnquiry,
  fixBedroomData,
  updateLocationFromPropertyLocations,
  fixCityDataFromLocation,
  UPLOAD_BASE_URL,
  getImageUrl,
  getImageUrlVariations,
  getFeaturedImage,
  getNoImageUrl,
  getDeveloperImageUrl,
  getDeveloperImageVariations,
  getAgentImageUrl,
  getAgentImageVariations,
  getCommunityImageUrl,
  getCommunityImageVariations,
  getMediaImageUrl,
  getGalleryImages,
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  PROPERTY_IMAGE_DIRS,
  USER_IMAGE_DIRS,
  AGENT_IMAGE_DIRS,
  COMMUNITY_IMAGE_DIRS,
  BLOG_IMAGE_DIRS,
  TESTIMONIAL_IMAGE_DIRS,
  extractImageUrls,
  processImageBatch,
  getProjectImageCandidates,
  getProjectImageUrl,
  getProjectImageVariations,
  getProjectGalleryImageUrl,
  getProjectGalleryImages,
  getProjectLogoUrl,
  getProjectFeaturedImage,
  buildProjectImageSet,
};