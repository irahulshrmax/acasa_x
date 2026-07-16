// lib/models/search.ts - COMPLETE WITH IMAGE RESOLVER + LOCATION FUNCTIONS

import { db } from '@/lib/database';
import { cache } from '@/lib/cache';
import {
  getImageUrl,
  getProjectImageUrl,
  getImageUrlVariations,
  getProjectImageVariations,
  getNoImageUrl,
  getGalleryImages,
  getProjectGalleryImages,
} from '@/lib/image-resolver';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CACHE_TTL = 300;

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface SearchResult {
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
  extra?: Record<string, any>;
}

export interface SearchFilters {
  q?: string;
  type?: 'buy' | 'rent' | 'all';
  locations?: string[];
  city_id?: number;
  community_id?: number;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_area?: number;
  max_area?: number;
  listing_type?: string;
  property_type?: string;
  status?: number;
  featured?: boolean;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
  include_properties?: boolean;
  include_projects?: boolean;
}

export interface SearchResponse {
  data: SearchResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    properties_count: number;
    projects_count: number;
    total_properties?: number;
    total_projects?: number;
    cached?: boolean;
  };
}

export interface LocationWithCount {
  id: number;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  property_count: number;
  is_popular: number;
  city_name?: string;
  city_id?: number;
}

// ─── CACHE KEYS ─────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  search: (filters: SearchFilters) => `search:${JSON.stringify(filters)}`,
  single: (id: string) => `search:single:${id}`,
  locations: (cityId: number, search: string, limit: number) =>
    `locations:${cityId}:${search}:${limit}`,
  popularLocations: (cityId: number) => `locations:popular:${cityId}`,
  searchLocations: (query: string, cityId: number, limit: number) =>
    `locations:search:${cityId}:${query}:${limit}`,
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isFinite(num) ? num : null;
  }
  return null;
}

function formatPrice(price: number | null): string | null {
  if (!price) return null;
  if (price >= 1_000_000) return `AED ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `AED ${(price / 1_000).toFixed(0)}K`;
  return `AED ${price.toLocaleString()}`;
}

function formatArea(area: number | null): string | null {
  if (!area) return null;
  return `${area.toLocaleString()} sq.ft`;
}

function getBedroomDisplay(bedroom: string | null): string {
  if (!bedroom) return 'Studio';
  const t = bedroom.toLowerCase().trim();
  if (t.includes('studio')) return 'Studio';
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return 'Studio';
    if (num === 1) return '1 Bed';
    return `${num} Beds`;
  }
  return bedroom;
}

function getBathroomDisplay(bathrooms: string | null): string {
  if (!bathrooms) return '1 Bath';
  const match = bathrooms.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return '1 Bath';
    return `${num} Bath${num > 1 ? 's' : ''}`;
  }
  return bathrooms;
}

function getOccupancyLabel(occupancy: string | null): string {
  if (!occupancy) return 'Available';
  const map: Record<string, string> = {
    'under construction': 'Under Construction',
    'ready to move': 'Ready to Move',
    vacant: 'Vacant',
    ready: 'Ready to Move',
    'off plan': 'Off Plan',
  };
  const key = occupancy.toLowerCase().trim();
  return map[key] || occupancy;
}

function getCompletionStatus(completionDate: string | null): string {
  if (!completionDate) return 'Date TBC';
  try {
    const now = new Date();
    const comp = new Date(completionDate);
    if (isNaN(comp.getTime())) return 'Date TBC';
    const diffMonths =
      (comp.getFullYear() - now.getFullYear()) * 12 +
      (comp.getMonth() - now.getMonth());
    if (diffMonths < 0) return 'Ready to Move';
    if (diffMonths <= 3) return 'Handover in 3 Months';
    if (diffMonths <= 6) return 'Handover in 6 Months';
    return `Handover ${comp.getFullYear()}`;
  } catch {
    return 'Date TBC';
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

// ─── TABLE CHECK HELPERS ────────────────────────────────────────────────────

async function tableExists(knex: any, tableName: string): Promise<boolean> {
  try {
    const result = await knex.raw(`SHOW TABLES LIKE '${tableName}'`);
    return result[0]?.length > 0;
  } catch {
    return false;
  }
}

// ─── FETCH FUNCTIONS ──────────────────────────────────────────────────────

async function fetchMediaRecords(
  knex: any,
  propertyIds: number[]
): Promise<Map<number, any[]>> {
  const mediaByPropertyId = new Map<number, any[]>();
  if (!propertyIds.length) return mediaByPropertyId;

  try {
    const exists = await tableExists(knex, 'media');
    if (!exists) return mediaByPropertyId;

    const rows = await knex('media')
      .whereIn('module_id', propertyIds)
      .where('module_type', 'property')
      .where('status', 1)
      .select('id', 'module_id', 'path', 'title', 'featured', 'media_order');

    for (const row of rows) {
      if (row.module_id) {
        const existing = mediaByPropertyId.get(row.module_id) ?? [];
        existing.push(row);
        mediaByPropertyId.set(row.module_id, existing);
      }
    }
  } catch (error) {
    // Silent fail
  }

  return mediaByPropertyId;
}

async function fetchProjectGallery(
  knex: any,
  projectIds: number[]
): Promise<Map<number, any[]>> {
  const galleryByProjectId = new Map<number, any[]>();
  if (!projectIds.length) return galleryByProjectId;

  try {
    const exists = await tableExists(knex, 'project_gallery');
    if (!exists) return galleryByProjectId;

    const rows = await knex('project_gallery')
      .whereIn('project_id', projectIds)
      .select('id', 'project_id', 'Url', 'created_at');

    for (const row of rows) {
      if (row.project_id) {
        const existing = galleryByProjectId.get(row.project_id) ?? [];
        existing.push(row);
        galleryByProjectId.set(row.project_id, existing);
      }
    }
  } catch (error) {
    // Silent fail
  }

  return galleryByProjectId;
}

// ─── TRANSFORM FUNCTIONS WITH IMAGE RESOLVER ──────────────────────────────

function transformProperty(
  property: any,
  mediaRecords: any[] = []
): SearchResult {
  // ✅ Use image helper for property images
  const imagePath = property.featured_image || property.image || null;

  // Get image URL using helper
  const imageUrl = getImageUrl(imagePath);

  // Get image variations
  const imageVariations = getImageUrlVariations(imagePath);

  // Get gallery images from media records
  const galleryImages =
    mediaRecords.length > 0 ? getGalleryImages(mediaRecords) : [imageUrl];

  console.log(`🖼️ [Property ${property.id}] Image:`, {
    featured_image: property.featured_image,
    image_path: imagePath,
    resolved_url: imageUrl,
    variations_count: imageVariations.length,
    gallery_count: galleryImages.length,
  });

  return {
    id: property.id,
    result_type: 'property',
    name: property.property_name || 'Property',
    slug: property.property_slug || `property-${property.id}`,
    listing_type: property.listing_type || null,
    price: toNullableNumber(property.price),
    price_display: formatPrice(toNullableNumber(property.price)),
    bedroom: property.bedroom ? getBedroomDisplay(property.bedroom) : null,
    bathrooms: property.bathrooms
      ? getBathroomDisplay(property.bathrooms)
      : null,
    area: toNullableNumber(property.area),
    area_display: formatArea(toNullableNumber(property.area)),
    location: property.location || property.address || null,
    city_name: property.city_name || null,
    community_name: property.community_name || null,
    developer_name: property.developer_name || null,
    description: property.description || null,
    featured_image: imagePath,
    image_url: imageUrl,
    image_variations:
      imageVariations.length > 0 ? imageVariations : [imageUrl],
    gallery_images: galleryImages.length > 0 ? galleryImages : [imageUrl],
    completion_date: property.completion_date || null,
    occupancy: property.occupancy
      ? getOccupancyLabel(property.occupancy)
      : null,
    property_type: property.property_type || null,
    furnishing: property.furnishing || null,
    parking: property.parking || null,
    rera_number: property.ReraNumber || null,
    dld_permit: property.dld_permit || null,
    video_url: property.video_url || null,
    amenities: property.amenities
      ? property.amenities
          .split(',')
          .filter(Boolean)
          .map((a: string) => a.trim())
      : [],
    status: property.status || 0,
    created_at: property.created_at || null,
    updated_at: property.updated_at || null,
    extra: {
      completion_status: getCompletionStatus(property.completion_date),
      project_id: property.project_id || null,
      city_id: property.city_id || null,
      community_id: property.community_id || null,
    },
  };
}

function transformProject(
  project: any,
  galleryRecords: any[] = []
): SearchResult {
  // ✅ Use image helper for project images
  const imagePath = project.featured_image || project.image || null;

  // Get image URL using project image helper
  const imageUrl = getProjectImageUrl(imagePath);

  // Get image variations
  const imageVariations = getProjectImageVariations(imagePath);

  // Get gallery images from project gallery records
  const galleryImages =
    galleryRecords.length > 0
      ? getProjectGalleryImages(galleryRecords)
      : [imageUrl];

  console.log(`🖼️ [Project ${project.id}] Image:`, {
    featured_image: project.featured_image,
    image_path: imagePath,
    resolved_url: imageUrl,
    variations_count: imageVariations.length,
    gallery_count: galleryImages.length,
  });

  return {
    id: project.id,
    result_type: 'project',
    name: project.name || 'Project',
    slug: project.slug || `project-${project.id}`,
    listing_type: project.listing_type || 'Project',
    price: toNullableNumber(project.price),
    price_display: formatPrice(toNullableNumber(project.price)),
    bedroom: project.bedroom ? getBedroomDisplay(project.bedroom) : null,
    bathrooms: project.bathrooms
      ? getBathroomDisplay(project.bathrooms)
      : null,
    area: toNullableNumber(project.area),
    area_display: formatArea(toNullableNumber(project.area)),
    location: project.location || null,
    city_name: project.city_name || null,
    community_name: project.community_name || null,
    developer_name: project.developer_name || null,
    description: project.description || null,
    featured_image: imagePath,
    image_url: imageUrl,
    image_variations:
      imageVariations.length > 0 ? imageVariations : [imageUrl],
    gallery_images: galleryImages.length > 0 ? galleryImages : [imageUrl],
    completion_date: project.completion_date || null,
    occupancy: project.occupancy ? getOccupancyLabel(project.occupancy) : null,
    property_type: project.property_type || null,
    furnishing: project.furnishing || null,
    parking: project.parking || null,
    rera_number: project.ReraNumber || null,
    dld_permit: project.dld_permit || null,
    video_url: project.video_url || null,
    amenities: project.amenities
      ? project.amenities
          .split(',')
          .filter(Boolean)
          .map((a: string) => a.trim())
      : [],
    status: project.status || 0,
    created_at: project.created_at || null,
    updated_at: project.updated_at || null,
    project_id: project.id,
    extra: {
      completion_status: getCompletionStatus(project.completion_date),
      city_id: project.city_id || null,
      community_id: project.community_id || null,
    },
  };
}

// ─── MAIN SEARCH FUNCTION ──────────────────────────────────────────────────

export async function search(
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const {
    q = '',
    type = 'buy',
    locations = [],
    city_id,
    community_id,
    min_price,
    max_price,
    min_bedrooms,
    max_bedrooms,
    min_area,
    max_area,
    listing_type,
    property_type,
    status = 1,
    featured,
    sort_by = 'newest',
    page = 1,
    limit = 100,
    include_properties = true,
    include_projects = true,
  } = filters;

  const cacheKey = CACHE_KEYS.search(filters);
  const cached = await cache.get<SearchResponse>(cacheKey);
  if (cached) {
    return { ...cached, meta: { ...cached.meta, cached: true } };
  }

  const knex = await db();
  const offset = (page - 1) * limit;

  let properties: any[] = [];
  let projects: any[] = [];
  let totalProperties = 0;
  let totalProjects = 0;
  let propertyIds: number[] = [];
  let projectIds: number[] = [];

  // ─── SEARCH PROPERTIES ──────────────────────────────────────────────────
  if (include_properties) {
    const propQuery = knex('properties as p')
      .distinct('p.id')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.status', status);

    if (q) {
      propQuery.where(function (this: any) {
        const searchTerm = `%${q}%`;
        this.where('p.property_name', 'like', searchTerm)
          .orWhere('p.location', 'like', searchTerm)
          .orWhere('p.address', 'like', searchTerm)
          .orWhere('p.keyword', 'like', searchTerm)
          .orWhere('p.property_slug', 'like', searchTerm)
          .orWhere('p.description', 'like', searchTerm)
          .orWhere('p.title_deep', 'like', searchTerm)
          .orWhere('p.building', 'like', searchTerm)
          .orWhere('p.landmark', 'like', searchTerm)
          .orWhere('p.property_locations', 'like', searchTerm);
      });
    }

    if (type === 'rent') {
      propQuery.where('p.listing_type', 'Rent');
    } else if (type === 'buy') {
      propQuery.whereIn('p.listing_type', [
        'Sale',
        'Off plan',
        'Off-plan',
        'Offplan',
      ]);
    } else if (listing_type) {
      propQuery.where('p.listing_type', listing_type);
    }

    if (locations.length > 0) {
      propQuery.where(function (this: any) {
        for (const loc of locations) {
          this.orWhere('p.location', 'like', `%${loc}%`)
            .orWhere('p.address', 'like', `%${loc}%`)
            .orWhere('p.property_slug', 'like', `%${loc}%`);
        }
      });
    }

    if (city_id) propQuery.where('p.city_id', city_id);
    if (community_id) propQuery.where('p.community_id', community_id);

    if (min_price) propQuery.where('p.price', '>=', min_price);
    if (max_price) propQuery.where('p.price', '<=', max_price);

    if (min_bedrooms !== undefined && min_bedrooms !== null) {
      propQuery.whereRaw('CAST(p.bedroom AS UNSIGNED) >= ?', [min_bedrooms]);
    }
    if (max_bedrooms !== undefined && max_bedrooms !== null) {
      propQuery.whereRaw('CAST(p.bedroom AS UNSIGNED) <= ?', [max_bedrooms]);
    }

    if (min_area) propQuery.where('p.area', '>=', min_area);
    if (max_area) propQuery.where('p.area', '<=', max_area);

    if (property_type) propQuery.where('p.property_type', property_type);
    if (featured) propQuery.where('p.featured_property', '1');

    const countQuery = propQuery.clone();
    const [{ total: propTotal }] = await countQuery.count('* as total');
    totalProperties = Number(propTotal) || 0;

    switch (sort_by) {
      case 'price_asc':
        propQuery.orderBy('p.price', 'asc');
        break;
      case 'price_desc':
        propQuery.orderBy('p.price', 'desc');
        break;
      case 'oldest':
        propQuery.orderBy('p.created_at', 'asc');
        break;
      default:
        propQuery.orderBy('p.created_at', 'desc');
    }

    propQuery.limit(limit).offset(offset);

    properties = await propQuery.select(
      'p.*',
      'c.name as city_name',
      'com.name as community_name',
      knex.raw('COALESCE(d.name, idev.name) as developer_name')
    );

    propertyIds = properties.map((p) => p.id);
  }

  // ─── SEARCH PROJECTS ────────────────────────────────────────────────────
  if (include_projects) {
    try {
      const projQuery = knex('project_data as pl')
        .distinct('pl.id')
        .where('pl.status', status);

      if (q) {
        projQuery.where(function (this: any) {
          const searchTerm = `%${q}%`;
          this.where('pl.name', 'like', searchTerm);
        });
      }

      const countQuery2 = projQuery.clone();
      const [{ total: projTotal }] = await countQuery2.count('* as total');
      totalProjects = Number(projTotal) || 0;

      const projectLimit = Math.ceil(limit / 2);
      projQuery.limit(projectLimit).offset(offset);

      projects = await projQuery.select('pl.*');
      projectIds = projects.map((p) => p.id);
    } catch (err) {
      console.log('⚠️ Error in project search:', err);
      totalProjects = 0;
      projects = [];
    }
  }

  // ─── FETCH MEDIA & GALLERY ──────────────────────────────────────────────
  const [mediaByPropertyId, galleryByProjectId] = await Promise.all([
    fetchMediaRecords(knex, propertyIds),
    fetchProjectGallery(knex, projectIds),
  ]);

  // ─── TRANSFORM WITH IMAGES ──────────────────────────────────────────────
  const transformedProperties = properties.map((p) => {
    const mediaRecords = mediaByPropertyId.get(p.id) ?? [];
    return transformProperty(p, mediaRecords);
  });

  const transformedProjects = projects.map((p) => {
    const galleryRecords = galleryByProjectId.get(p.id) ?? [];
    return transformProject(p, galleryRecords);
  });

  // ─── COMBINE RESULTS ───────────────────────────────────────────────────
  const allResults = [...transformedProperties, ...transformedProjects];
  const total = totalProperties + totalProjects;

  console.log(
    `📊 [Search] Final: ${allResults.length} results (${transformedProperties.length} properties, ${transformedProjects.length} projects)`
  );

  const response: SearchResponse = {
    data: allResults,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      properties_count: transformedProperties.length,
      projects_count: transformedProjects.length,
      total_properties: totalProperties,
      total_projects: totalProjects,
    },
  };

  await cache.set(cacheKey, response, { ttl: CACHE_TTL, tags: ['search', 'list'] });

  return response;
}

// ─── GET SINGLE RESULT ──────────────────────────────────────────────────────

export async function getSearchResult(
  slugOrId: string
): Promise<SearchResult | null> {
  const cacheKey = CACHE_KEYS.single(slugOrId);
  const cached = await cache.get<SearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const knex = await db();
  const isNumeric = /^\d+$/.test(slugOrId);

  // ─── TRY PROPERTY FIRST ─────────────────────────────────────────────────
  try {
    let property = null;

    const propertyQuery = knex('properties as p')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.status', 1);

    if (isNumeric) {
      property = await propertyQuery
        .where('p.id', parseInt(slugOrId))
        .first();
    } else {
      property = await propertyQuery
        .where('p.property_slug', slugOrId)
        .first();
    }

    if (property) {
      let mediaRecords: any[] = [];
      try {
        const exists = await tableExists(knex, 'media');
        if (exists) {
          mediaRecords = await knex('media')
            .where('module_id', property.id)
            .where('module_type', 'property')
            .where('status', 1)
            .select('id', 'path', 'title', 'featured', 'media_order');
        }
      } catch (err) {
        // Silent fail
      }

      const fullProperty = await knex('properties as p')
        .leftJoin('cities as c', 'p.city_id', 'c.id')
        .leftJoin('community as com', 'p.community_id', 'com.id')
        .leftJoin('developers as d', 'p.developer_id', 'd.id')
        .leftJoin(
          'internationaldevelopers as idev',
          'p.developer_id',
          'idev.id'
        )
        .where('p.id', property.id)
        .select(
          'p.*',
          'c.name as city_name',
          'com.name as community_name',
          knex.raw('COALESCE(d.name, idev.name) as developer_name')
        )
        .first();

      const result = transformProperty(fullProperty || property, mediaRecords);
      await cache.set(cacheKey, result, { ttl: CACHE_TTL * 2 });
      return result;
    }
  } catch (err) {
    console.log('⚠️ Error in property lookup:', err);
  }

  // ─── TRY PROJECT ────────────────────────────────────────────────────────
  try {
    const projectQuery = knex('project_data').where('status', 1);

    let project = null;
    if (isNumeric) {
      project = await projectQuery.where('id', parseInt(slugOrId)).first();
    } else {
      project = await projectQuery.where('slug', slugOrId).first();
    }

    if (project) {
      let galleryRecords: any[] = [];
      try {
        const exists = await tableExists(knex, 'project_gallery');
        if (exists) {
          galleryRecords = await knex('project_gallery')
            .where('project_id', project.id)
            .select('id', 'Url', 'created_at');
        }
      } catch (err) {
        // Silent fail
      }

      const result = transformProject(project, galleryRecords);
      await cache.set(cacheKey, result, { ttl: CACHE_TTL * 2 });
      return result;
    }
  } catch (err) {
    console.log('⚠️ Error in project lookup:', err);
  }

  return null;
}

// ─── GET LOCATIONS WITH PROPERTY COUNTS ──────────────────────────────────

export async function getLocationsWithCounts(
  cityId: number = 71,
  search: string = '',
  limit: number = 20
): Promise<LocationWithCount[]> {
  const cacheKey = CACHE_KEYS.locations(cityId, search, limit);
  const cached = await cache.get<LocationWithCount[]>(cacheKey);
  if (cached) return cached;

  try {
    const knex = await db();

    let query = knex('community as c')
      .leftJoin('properties as p', function (this: any) {
        this.on('p.community_id', '=', 'c.id').andOn(
          knex.raw('p.status = 1')
        );
      })
      .select(
        'c.id',
        'c.name',
        'c.slug',
        'c.latitude',
        'c.longitude',
        knex.raw('COUNT(p.id) as property_count'),
        knex.raw(`
          CASE
            WHEN c.name LIKE '%Palm%Jumeirah%' THEN 1
            WHEN c.name LIKE '%Dubai%Marina%' THEN 1
            WHEN c.name LIKE '%Downtown%Dubai%' THEN 1
            WHEN c.name LIKE '%Yas%Island%' THEN 1
            WHEN c.name LIKE '%Dubai Hills%' THEN 1
            WHEN c.name LIKE '%Jumeirah%' THEN 1
            ELSE 0
          END as is_popular
        `)
      )
      .where('c.city_id', cityId)
      .where('c.status', 1)
      .groupBy('c.id', 'c.name', 'c.slug', 'c.latitude', 'c.longitude')
      .having(knex.raw('COUNT(p.id)'), '>', 0);

    if (search && search.length > 0) {
      query = query.where('c.name', 'like', `%${search}%`);
    }

    const locations = await query
      .orderBy('property_count', 'desc')
      .limit(limit);

    const result = locations.map((loc: any) => ({
      ...loc,
      property_count: Number(loc.property_count) || 0,
      is_popular: Number(loc.is_popular) || 0,
    }));

    await cache.set(cacheKey, result, { ttl: CACHE_TTL, tags: ['locations'] });

    return result;
  } catch (error) {
    console.error('Error fetching locations with counts:', error);
    return [];
  }
}

// ─── GET POPULAR LOCATIONS ───────────────────────────────────────────────

export async function getPopularLocations(
  cityId: number = 71
): Promise<LocationWithCount[]> {
  const cacheKey = CACHE_KEYS.popularLocations(cityId);
  const cached = await cache.get<LocationWithCount[]>(cacheKey);
  if (cached) return cached;

  try {
    const knex = await db();

    const locations = await knex('community as c')
      .leftJoin('properties as p', function (this: any) {
        this.on('p.community_id', '=', 'c.id').andOn(
          knex.raw('p.status = 1')
        );
      })
      .select(
        'c.id',
        'c.name',
        'c.slug',
        knex.raw('COUNT(p.id) as property_count'),
        knex.raw(`
          CASE
            WHEN c.name LIKE '%Palm%Jumeirah%' THEN 1
            WHEN c.name LIKE '%Dubai%Marina%' THEN 1
            WHEN c.name LIKE '%Downtown%Dubai%' THEN 1
            WHEN c.name LIKE '%Yas%Island%' THEN 1
            WHEN c.name LIKE '%Dubai Hills%' THEN 1
            WHEN c.name LIKE '%Jumeirah%' THEN 1
            ELSE 0
          END as is_popular
        `)
      )
      .where('c.city_id', cityId)
      .where('c.status', 1)
      .groupBy('c.id', 'c.name', 'c.slug')
      .having(knex.raw('COUNT(p.id)'), '>', 0)
      .orderBy('property_count', 'desc')
      .limit(10);

    const mapped = locations.map((loc: any) => ({
      ...loc,
      latitude: null,
      longitude: null,
      property_count: Number(loc.property_count) || 0,
      is_popular: Number(loc.is_popular) || 0,
    }));

    // Popular locations filter karo
    const popular = mapped.filter((loc: LocationWithCount) => loc.is_popular === 1);

    let result: LocationWithCount[];

    if (popular.length < 4) {
      const remaining = mapped
        .filter((loc: LocationWithCount) => loc.is_popular !== 1)
        .slice(0, 4 - popular.length);
      result = [...popular, ...remaining];
    } else {
      result = popular.slice(0, 4);
    }

    await cache.set(cacheKey, result, {
      ttl: CACHE_TTL * 2,
      tags: ['locations', 'popular'],
    });

    return result;
  } catch (error) {
    console.error('Error fetching popular locations:', error);
    return [];
  }
}

// ─── SEARCH LOCATIONS (Autocomplete) ────────────────────────────────────

export async function searchLocations(
  query: string,
  cityId: number = 71,
  limit: number = 10
): Promise<LocationWithCount[]> {
  if (!query || query.length < 2) return [];

  const cacheKey = CACHE_KEYS.searchLocations(query, cityId, limit);
  const cached = await cache.get<LocationWithCount[]>(cacheKey);
  if (cached) return cached;

  try {
    const knex = await db();

    const locations = await knex('community as c')
      .leftJoin('properties as p', function (this: any) {
        this.on('p.community_id', '=', 'c.id').andOn(
          knex.raw('p.status = 1')
        );
      })
      .select(
        'c.id',
        'c.name',
        'c.slug',
        'c.latitude',
        'c.longitude',
        knex.raw('COUNT(p.id) as property_count'),
        knex.raw('0 as is_popular')
      )
      .where('c.city_id', cityId)
      .where('c.status', 1)
      .where('c.name', 'like', `%${query}%`)
      .groupBy('c.id', 'c.name', 'c.slug', 'c.latitude', 'c.longitude')
      .having(knex.raw('COUNT(p.id)'), '>', 0)
      .orderBy('property_count', 'desc')
      .limit(limit);

    const result = locations.map((loc: any) => ({
      ...loc,
      property_count: Number(loc.property_count) || 0,
      is_popular: Number(loc.is_popular) || 0,
    }));

    // Short TTL for search queries
    await cache.set(cacheKey, result, {
      ttl: 60,
      tags: ['locations', 'search'],
    });

    return result;
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

// ─── DEFAULT EXPORT ──────────────────────────────────────────────────────

export default {
  search,
  getSearchResult,
  transformProperty,
  transformProject,
  getLocationsWithCounts,
  getPopularLocations,
  searchLocations,
};