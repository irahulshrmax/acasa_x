// lib/models/search.ts
import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const UPLOAD_BASE_URL = 'https://acasa.ae/upload';
const IMAGE_DIRS = ['media', 'media/thumbnail', 'media/medium', 'properties', 'blogs'] as const;
const CACHE_TTL = 300;
const MAX_RESULTS = 100;

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
  ProjectName?: string;
  project_slug?: string;
  LogoUrl?: string | null;
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

export interface ProjectSpecs {
  id: number;
  project_id: number;
  kitchen_open_plan: string | null;
  kitchen_closed: string | null;
  maid_quarters: string | null;
  storage_room: string | null;
  laundry_room: string | null;
  study_room: string | null;
  furnished: string | null;
  swimming_pool: string | null;
  gymnasium: string | null;
  tennis_court: string | null;
  basketball_court: string | null;
  parking: string | null;
  child_play_area: string | null;
  allocated_parking_qty: string | null;
  status: number;
}

export interface ProjectGallery {
  id: number;
  project_id: number | null;
  Url: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ProjectContact {
  id: number;
  project_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// ─── CACHE KEYS ─────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  search: (filters: SearchFilters) => `search:${JSON.stringify(filters)}`,
  single: (id: string) => `search:single:${id}`,
  stats: () => `search:stats`,
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
  if (!bedroom) return "Studio";
  const t = bedroom.toLowerCase().trim();
  if (t.includes("studio")) return "Studio";
  const match = bedroom.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "Studio";
    if (num === 1) return "1 Bed";
    return `${num} Beds`;
  }
  return bedroom;
}

function getBathroomDisplay(bathrooms: string | null): string {
  if (!bathrooms) return "1 Bath";
  const match = bathrooms.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (num === 0) return "1 Bath";
    return `${num} Bath${num > 1 ? 's' : ''}`;
  }
  return bathrooms;
}

function getOccupancyLabel(occupancy: string | null): string {
  if (!occupancy) return "Available";
  const map: Record<string, string> = {
    "under construction": "Under Construction",
    "ready to move": "Ready to Move",
    vacant: "Vacant",
    "ready": "Ready to Move",
    "off plan": "Off Plan",
  };
  const key = occupancy.toLowerCase().trim();
  return map[key] || occupancy;
}

function getCompletionStatus(completionDate: string | null): string {
  if (!completionDate) return "Date TBC";
  try {
    const now = new Date();
    const comp = new Date(completionDate);
    if (isNaN(comp.getTime())) return "Date TBC";
    const diffMonths = (comp.getFullYear() - now.getFullYear()) * 12 + (comp.getMonth() - now.getMonth());
    if (diffMonths < 0) return "Ready to Move";
    if (diffMonths <= 3) return "Handover in 3 Months";
    if (diffMonths <= 6) return "Handover in 6 Months";
    return `Handover ${comp.getFullYear()}`;
  } catch {
    return "Date TBC";
  }
}

function parseCommaIds(ids: string | null): number[] {
  if (!ids) return [];
  return ids
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
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

// ─── IMAGE HELPERS ──────────────────────────────────────────────────────────

export function getNoImageUrl(): string {
  return `${UPLOAD_BASE_URL}/no-image.png`;
}

function resolvePropertyImage(imagePath: string | null): string {
  if (!imagePath) return getNoImageUrl();
  if (isAbsoluteUrl(imagePath)) return imagePath;

  const clean = stripUploadPrefix(imagePath);
  if (!clean) return getNoImageUrl();

  const paths = [
    `${UPLOAD_BASE_URL}/media/${clean}`,
    `${UPLOAD_BASE_URL}/properties/${clean}`,
    `${UPLOAD_BASE_URL}/uploads/${clean}`,
    `${UPLOAD_BASE_URL}/${clean}`,
  ];

  for (const path of paths) {
    if (!path.includes('no-image')) {
      return path;
    }
  }

  return getNoImageUrl();
}

function resolveProjectImage(imagePath: string | null): string {
  if (!imagePath) return getNoImageUrl();
  if (isAbsoluteUrl(imagePath)) return imagePath;

  const clean = stripUploadPrefix(imagePath);
  if (!clean) return getNoImageUrl();

  const paths = [
    `${UPLOAD_BASE_URL}/media/${clean}`,
    `${UPLOAD_BASE_URL}/projects/${clean}`,
    `${UPLOAD_BASE_URL}/uploads/${clean}`,
    `${UPLOAD_BASE_URL}/${clean}`,
  ];

  for (const path of paths) {
    if (!path.includes('no-image')) {
      return path;
    }
  }

  return getNoImageUrl();
}

function getImageUrlVariations(imagePath: string | null): string[] {
  if (!imagePath) return [getNoImageUrl()];

  const mainUrl = resolvePropertyImage(imagePath);
  const variations = [mainUrl];

  const clean = stripUploadPrefix(imagePath);
  if (clean) {
    const sizes = ['thumbnail', 'medium', 'large'];
    for (const size of sizes) {
      const url = `${UPLOAD_BASE_URL}/media/${size}/${clean}`;
      if (!url.includes('no-image')) {
        variations.push(url);
      }
    }
  }

  return uniqueStrings(variations);
}

function getProjectImageVariations(imagePath: string | null): string[] {
  if (!imagePath) return [getNoImageUrl()];

  const mainUrl = resolveProjectImage(imagePath);
  const variations = [mainUrl];

  const clean = stripUploadPrefix(imagePath);
  if (clean) {
    const sizes = ['thumbnail', 'medium', 'large'];
    for (const size of sizes) {
      const url = `${UPLOAD_BASE_URL}/media/${size}/${clean}`;
      if (!url.includes('no-image')) {
        variations.push(url);
      }
    }
  }

  return uniqueStrings(variations);
}

// ─── TABLE CHECK HELPERS ────────────────────────────────────────────────────

async function tableExists(knex: any, tableName: string): Promise<boolean> {
  try {
    return await knex.schema.hasTable(tableName);
  } catch {
    return false;
  }
}

// ─── FETCH FUNCTIONS WITH SAFE TABLE CHECKS ───────────────────────────────

async function fetchMediaRecords(knex: any, propertyIds: number[]): Promise<Map<number, any[]>> {
  const mediaByPropertyId = new Map<number, any[]>();
  if (!propertyIds.length) return mediaByPropertyId;

  try {
    const exists = await tableExists(knex, 'media');
    if (!exists) {
      return mediaByPropertyId;
    }

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
  } catch (error: any) {
    // Silent fail
  }
  return mediaByPropertyId;
}

async function fetchProjectGallery(knex: any, projectIds: number[]): Promise<Map<number, any[]>> {
  const galleryByProjectId = new Map<number, any[]>();
  if (!projectIds.length) return galleryByProjectId;

  try {
    const exists = await tableExists(knex, 'project_gallery');
    if (!exists) {
      return galleryByProjectId;
    }

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
  } catch (error: any) {
    // Silent fail
  }
  return galleryByProjectId;
}

async function fetchProjectSpecs(knex: any, projectIds: number[]): Promise<Map<number, ProjectSpecs>> {
  const result = new Map<number, ProjectSpecs>();
  if (!projectIds.length) return result;

  try {
    const exists = await tableExists(knex, 'project_specs');
    if (!exists) {
      return result;
    }

    const rows: ProjectSpecs[] = await knex('project_specs')
      .whereIn('project_id', projectIds)
      .select('*');

    for (const row of rows) {
      if (row.project_id) result.set(row.project_id, row);
    }
  } catch (error: any) {
    // Silent fail
  }
  return result;
}

async function fetchProjectContacts(knex: any, projectIds: number[]): Promise<Map<number, ProjectContact[]>> {
  const result = new Map<number, ProjectContact[]>();
  if (!projectIds.length) return result;

  try {
    const exists = await tableExists(knex, 'project_contacts');
    if (!exists) {
      return result;
    }

    const rows: ProjectContact[] = await knex('project_contacts')
      .whereIn('project_id', projectIds)
      .select('*')
      .orderBy('created_at', 'desc');

    for (const row of rows) {
      if (row.project_id !== null) {
        const list = result.get(row.project_id) ?? [];
        list.push(row);
        result.set(row.project_id, list);
      }
    }
  } catch (error: any) {
    // Silent fail
  }
  return result;
}

// ─── TRANSFORM FUNCTIONS ────────────────────────────────────────────────────

function transformProperty(property: any, mediaRecords: any[] = []): SearchResult {
  const imagePath = property.featured_image || property.image || property.imageurl || property.img || null;
  let imageUrl = resolvePropertyImage(imagePath);

  let galleryImages: string[] = [];
  if (mediaRecords && mediaRecords.length > 0) {
    galleryImages = mediaRecords
      .map((m) => resolvePropertyImage(m.path))
      .filter((url) => !url.includes('no-image'));
  }

  if (imageUrl.includes('no-image') && galleryImages.length > 0) {
    imageUrl = galleryImages[0];
  }

  const imageVariations = getImageUrlVariations(imagePath);
  const finalGallery = galleryImages.length > 0 ? galleryImages : [imageUrl];

  return {
    id: property.id,
    result_type: 'property',
    name: property.property_name || property.name || 'Property',
    slug: property.property_slug || property.slug || `property-${property.id}`,
    listing_type: property.listing_type || null,
    price: toNullableNumber(property.price),
    price_display: formatPrice(toNullableNumber(property.price)),
    bedroom: property.bedroom ? getBedroomDisplay(property.bedroom) : null,
    bathrooms: property.bathrooms ? getBathroomDisplay(property.bathrooms) : null,
    area: toNullableNumber(property.area),
    area_display: formatArea(toNullableNumber(property.area)),
    location: property.location || property.address || null,
    city_name: property.city_name || property.city || null,
    community_name: property.community_name || property.community || null,
    developer_name: property.developer_name || property.developer || null,
    description: property.description || property.descriptions || null,
    featured_image: imagePath,
    image_url: imageUrl,
    image_variations: imageVariations.length > 0 ? imageVariations : [imageUrl],
    gallery_images: finalGallery,
    completion_date: property.completion_date || null,
    occupancy: property.occupancy ? getOccupancyLabel(property.occupancy) : null,
    property_type: property.property_type || null,
    furnishing: property.furnishing || null,
    parking: property.parking || null,
    rera_number: property.ReraNumber || property.rera_number || null,
    dld_permit: property.dld_permit || null,
    video_url: property.video_url || null,
    amenities: property.amenities
      ? property.amenities.split(',').filter(Boolean).map((a: string) => a.trim())
      : [],
    status: property.status || 0,
    created_at: property.created_at || null,
    updated_at: property.updated_at || null,
    extra: {
      completion_status: getCompletionStatus(property.completion_date),
      p_id: property.p_id || null,
      project_id: property.project_id || null,
      featured_property: property.featured_property || null,
      agent_id: property.agent_id || null,
      user_id: property.user_id || null,
      community_id: property.community_id || null,
      city_id: property.city_id || null,
    },
  };
}

function transformProject(project: any, galleryRecords: any[] = []): SearchResult {
  const imagePath = project.featured_image || project.image || project.imageurl || project.Img || project.LogoUrl || null;
  let imageUrl = resolveProjectImage(imagePath);

  let galleryImages: string[] = [];
  if (galleryRecords && galleryRecords.length > 0) {
    galleryImages = galleryRecords
      .map((g) => resolveProjectImage(g.Url))
      .filter((url) => !url.includes('no-image'));
  }

  if (imageUrl.includes('no-image') && galleryImages.length > 0) {
    imageUrl = galleryImages[0];
  }

  const imageVariations = getProjectImageVariations(imagePath);
  const finalGallery = galleryImages.length > 0 ? galleryImages : [imageUrl];

  const logoUrl = project.LogoUrl ? resolveProjectImage(project.LogoUrl) : null;

  return {
    id: project.id,
    result_type: 'project',
    name: project.ProjectName || project.name || 'Project',
    slug: project.project_slug || project.slug || `project-${project.id}`,
    listing_type: project.listing_type || 'Project',
    price: toNullableNumber(project.price),
    price_display: formatPrice(toNullableNumber(project.price)),
    bedroom: project.bedroom ? getBedroomDisplay(project.bedroom) : null,
    bathrooms: project.bathrooms ? getBathroomDisplay(project.bathrooms) : null,
    area: toNullableNumber(project.area),
    area_display: formatArea(toNullableNumber(project.area)),
    location: project.LocationName || project.location || project.address || null,
    city_name: project.city_name || project.CityName || project.city || null,
    community_name: project.community_name || project.CommunityName || project.community || null,
    developer_name: project.developer_name || project.developer || null,
    description: project.Description || project.description || null,
    featured_image: imagePath,
    image_url: imageUrl,
    image_variations: imageVariations.length > 0 ? imageVariations : [imageUrl],
    gallery_images: finalGallery,
    completion_date: project.completion_date || null,
    occupancy: project.occupancy ? getOccupancyLabel(project.occupancy) : null,
    property_type: project.property_type || null,
    furnishing: project.furnishing || null,
    parking: project.parking || null,
    rera_number: project.ReraNumber || null,
    dld_permit: project.dld_permit || null,
    video_url: project.video_url || null,
    amenities: project.amenities
      ? project.amenities.split(',').filter(Boolean).map((a: string) => a.trim())
      : [],
    status: project.status || 0,
    created_at: project.created_at || null,
    updated_at: project.updated_at || null,
    project_id: project.id,
    ProjectName: project.ProjectName || project.name,
    project_slug: project.project_slug || project.slug,
    LogoUrl: logoUrl,
    extra: {
      completion_status: getCompletionStatus(project.completion_date),
      featured_project: project.featured_project || null,
      city_id: project.city_id || null,
      community_id: project.community_id || null,
      sub_community_id: project.sub_community_id || null,
      price_end: project.price_end || null,
      area_end: project.area_end || null,
      total_units: project.total_units || null,
    },
  };
}

// ─── MAIN SEARCH FUNCTION ──────────────────────────────────────────────────

export async function search(filters: SearchFilters = {}): Promise<SearchResponse> {
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
    limit = 12,
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
        this.where('p.property_name', 'like', `%${q}%`)
          .orWhere('p.location', 'like', `%${q}%`)
          .orWhere('p.address', 'like', `%${q}%`)
          .orWhere('p.keyword', 'like', `%${q}%`)
          .orWhere('p.property_slug', 'like', `%${q}%`);
      });
    }

    if (type === 'rent') {
      propQuery.where('p.listing_type', 'Rent');
    } else if (type === 'buy') {
      propQuery.where('p.listing_type', 'in', ['Sale', 'Off plan', 'Off-plan', 'Offplan']);
    } else if (listing_type) {
      propQuery.where('p.listing_type', listing_type);
    }

    if (locations.length > 0) {
      propQuery.where(function (this: any) {
        for (const loc of locations) {
          this.orWhere('p.location', 'like', `%${loc}%`)
            .orWhere('p.address', 'like', `%${loc}%`);
        }
      });
    }

    if (city_id) propQuery.where('p.city_id', city_id);
    if (community_id) propQuery.where('p.community_id', community_id);

    if (min_price) {
      propQuery.where(function (this: any) {
        this.where('p.price', '>=', min_price)
          .orWhere('p.price_end', '>=', min_price);
      });
    }
    if (max_price) {
      propQuery.where(function (this: any) {
        this.where('p.price', '<=', max_price)
          .orWhere('p.price_end', '<=', max_price);
      });
    }

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
      case 'popular':
        propQuery.orderBy('p.featured_property', 'desc');
        break;
      default:
        propQuery.orderBy('p.created_at', 'desc');
    }

    const propertyLimit = Math.ceil(limit / 2);
    propQuery.limit(propertyLimit).offset(offset);

    properties = await propQuery.select(
      'p.*',
      'c.name as city_name',
      'com.name as community_name',
      knex.raw('COALESCE(d.name, idev.name) as developer_name')
    );

    propertyIds = properties.map((p) => p.id);
  }

  if (include_projects) {
    const projQuery = knex('project_listing as pl')
      .distinct('pl.id')
      .leftJoin('cities as c', 'pl.city_id', 'c.id')
      .leftJoin('community as com', 'pl.community_id', 'com.id')
      .leftJoin('developers as d', 'pl.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
      .where('pl.status', status);

    if (q) {
      projQuery.where(function (this: any) {
        this.where('pl.ProjectName', 'like', `%${q}%`)
          .orWhere('pl.LocationName', 'like', `%${q}%`)
          .orWhere('pl.Description', 'like', `%${q}%`)
          .orWhere('pl.keyword', 'like', `%${q}%`)
          .orWhere('pl.project_slug', 'like', `%${q}%`);
      });
    }

    if (listing_type) {
      projQuery.where('pl.listing_type', listing_type);
    } else if (type === 'buy') {
      projQuery.where('pl.listing_type', 'in', ['Sale', 'Off plan', 'Off-plan', 'Offplan']);
    } else if (type === 'rent') {
      projQuery.where('pl.listing_type', 'Rent');
    }

    if (locations.length > 0) {
      projQuery.where(function (this: any) {
        for (const loc of locations) {
          this.orWhere('pl.LocationName', 'like', `%${loc}%`);
        }
      });
    }

    if (city_id) projQuery.where('pl.city_id', city_id);
    if (community_id) projQuery.where('pl.community_id', community_id);

    if (min_price) {
      projQuery.where(function (this: any) {
        this.where('pl.price', '>=', min_price)
          .orWhere('pl.price_end', '>=', min_price);
      });
    }
    if (max_price) {
      projQuery.where(function (this: any) {
        this.where('pl.price', '<=', max_price)
          .orWhere('pl.price_end', '<=', max_price);
      });
    }

    if (min_bedrooms !== undefined && min_bedrooms !== null) {
      projQuery.whereRaw('CAST(pl.bedroom AS UNSIGNED) >= ?', [min_bedrooms]);
    }
    if (max_bedrooms !== undefined && max_bedrooms !== null) {
      projQuery.whereRaw('CAST(pl.bedroom AS UNSIGNED) <= ?', [max_bedrooms]);
    }

    if (min_area) projQuery.where('pl.area', '>=', min_area);
    if (max_area) projQuery.where('pl.area', '<=', max_area);

    if (featured) projQuery.where('pl.featured_project', '1');

    const countQuery2 = projQuery.clone();
    const [{ total: projTotal }] = await countQuery2.count('* as total');
    totalProjects = Number(projTotal) || 0;

    switch (sort_by) {
      case 'price_asc':
        projQuery.orderBy('pl.price', 'asc');
        break;
      case 'price_desc':
        projQuery.orderBy('pl.price', 'desc');
        break;
      case 'oldest':
        projQuery.orderBy('pl.created_at', 'asc');
        break;
      case 'popular':
        projQuery.orderBy('pl.featured_project', 'desc');
        break;
      default:
        projQuery.orderBy('pl.created_at', 'desc');
    }

    const projectLimit = Math.ceil(limit / 2);
    projQuery.limit(projectLimit).offset(offset);

    projects = await projQuery.select(
      'pl.*',
      'c.name as city_name',
      'com.name as community_name',
      knex.raw('COALESCE(d.name, idev.name) as developer_name')
    );

    projectIds = projects.map((p) => p.id);
  }

  const [mediaByPropertyId, galleryByProjectId] = await Promise.all([
    fetchMediaRecords(knex, propertyIds),
    fetchProjectGallery(knex, projectIds),
  ]);

  const transformedProperties = properties.map((p) => {
    const mediaRecords = mediaByPropertyId.get(p.id) ?? [];
    return transformProperty(p, mediaRecords);
  });

  const transformedProjects = projects.map((p) => {
    const galleryRecords = galleryByProjectId.get(p.id) ?? [];
    return transformProject(p, galleryRecords);
  });

  const allResults = [...transformedProperties, ...transformedProjects];
  const total = totalProperties + totalProjects;

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

export async function getSearchResult(slugOrId: string): Promise<SearchResult | null> {
  const cacheKey = CACHE_KEYS.single(slugOrId);
  const cached = await cache.get<SearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const knex = await db();
  const isNumeric = /^\d+$/.test(slugOrId);

  try {
    let property = null;

    const propertyQuery = knex('properties as p')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.status', 1);

    if (isNumeric) {
      property = await propertyQuery.where('p.id', parseInt(slugOrId)).first();
    } else {
      property = await propertyQuery
        .where('p.property_slug', slugOrId)
        .orWhere('p.slug', slugOrId)
        .first();
    }

    if (property) {
      let mediaRecords: any[] = [];
      try {
        const exists = await knex.schema.hasTable('media');
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
        .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
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
    // Silent fail
  }

  try {
    let project = null;

    const projectQuery = knex('project_listing as pl')
      .leftJoin('cities as c', 'pl.city_id', 'c.id')
      .leftJoin('community as com', 'pl.community_id', 'com.id')
      .leftJoin('developers as d', 'pl.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
      .where('pl.status', 1);

    if (isNumeric) {
      project = await projectQuery.where('pl.id', parseInt(slugOrId)).first();
    } else {
      project = await projectQuery
        .where('pl.project_slug', slugOrId)
        .orWhere('pl.slug', slugOrId)
        .first();
    }

    if (project) {
      let galleryRecords: any[] = [];
      try {
        const exists = await knex.schema.hasTable('project_gallery');
        if (exists) {
          galleryRecords = await knex('project_gallery')
            .where('project_id', project.id)
            .select('id', 'Url', 'created_at');
        }
      } catch (err) {
        // Silent fail
      }

      const fullProject = await knex('project_listing as pl')
        .leftJoin('cities as c', 'pl.city_id', 'c.id')
        .leftJoin('community as com', 'pl.community_id', 'com.id')
        .leftJoin('developers as d', 'pl.developer_id', 'd.id')
        .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
        .where('pl.id', project.id)
        .select(
          'pl.*',
          'c.name as city_name',
          'com.name as community_name',
          knex.raw('COALESCE(d.name, idev.name) as developer_name')
        )
        .first();

      const result = transformProject(fullProject || project, galleryRecords);
      await cache.set(cacheKey, result, { ttl: CACHE_TTL * 2 });
      return result;
    }
  } catch (err) {
    // Silent fail
  }

  return null;
}

// ─── EXPORT ─────────────────────────────────────────────────────────────

export default {
  search,
  getSearchResult,
  transformProperty,
  transformProject,
};