// models/search.ts
import { db } from '@/lib/database';
import {
  UPLOAD_BASE_URL,
  getImageUrl,
  getImageUrlVariations,
  getProjectImageUrl,
  getProjectImageVariations,
  getProjectGalleryImages,
  getMediaImageUrl,
  getNoImageUrl,
  getDeveloperImageUrl,
  getCommunityImageUrl,
  getAgentImageUrl,
  getUserImageUrl,
} from '@/lib/image-resolver';

// ─── TYPES ──────────────────────────────────────────────────────────────

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
  // Project specific
  project_id?: number;
  ProjectName?: string;
  project_slug?: string;
  LogoUrl?: string | null;
  // Extra fields
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
  };
}

// ─── HELPERS ────────────────────────────────────────────────────────────

function parseCommaIds(ids: string | null): number[] {
  if (!ids) return [];
  return ids
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
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
  if (bedroom.toLowerCase().includes("studio")) return "Studio";
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
  };
  return map[occupancy.toLowerCase()] || occupancy;
}

function getCompletionStatus(completionDate: string | null): string {
  if (!completionDate) return "Date TBC";
  const now = new Date();
  const comp = new Date(completionDate);
  const diffMonths = (comp.getFullYear() - now.getFullYear()) * 12 + (comp.getMonth() - now.getMonth());
  if (diffMonths < 0) return "Ready to Move";
  if (diffMonths <= 3) return "Handover in 3 Months";
  if (diffMonths <= 6) return "Handover in 6 Months";
  if (diffMonths <= 12) return `Handover by ${comp.getFullYear()}`;
  return `Handover ${comp.getFullYear()}`;
}

// ─── IMAGE RESOLUTION ──────────────────────────────────────────────────

function resolvePropertyImage(imagePath: string | null): string {
  return getImageUrl(imagePath);
}

function resolvePropertyGallery(mediaIds: string | null, mediaRecords: any[]): string[] {
  const ids = parseCommaIds(mediaIds);
  const paths = ids
    .map((id) => {
      const record = mediaRecords.find((m) => m.id === id);
      return record?.path || null;
    })
    .filter((path): path is string => !!path);
  
  const urls = paths.map((path) => getMediaImageUrl(path));
  return uniqueStrings(urls.filter((url) => !url.includes('no-image')));
}

function resolveProjectImage(imagePath: string | null): string {
  return getProjectImageUrl(imagePath);
}

function resolveProjectGallery(galleryRecords: { Url: string | null }[]): string[] {
  return getProjectGalleryImages(galleryRecords);
}

function resolveProjectLogo(logoPath: string | null): string {
  if (!logoPath) return getNoImageUrl();
  return getProjectImageUrl(logoPath);
}

// ─── TRANSFORM PROPERTY ───────────────────────────────────────────────

function transformProperty(
  property: any,
  mediaRecords: any[] = []
): SearchResult {
  const imageUrl = resolvePropertyImage(property.featured_image);
  const imageVariations = getImageUrlVariations(property.featured_image);
  const galleryImages = resolvePropertyGallery(property.gallery_media_ids, mediaRecords);

  // Get featured image from gallery if main image is not available
  const finalImageUrl = imageUrl.includes('no-image') && galleryImages.length > 0
    ? galleryImages[0]
    : imageUrl;

  return {
    id: property.id,
    result_type: 'property',
    name: property.property_name || 'Property',
    slug: property.property_slug || `property-${property.id}`,
    listing_type: property.listing_type || null,
    price: toNullableNumber(property.price),
    price_display: formatPrice(toNullableNumber(property.price)),
    bedroom: property.bedroom ? getBedroomDisplay(property.bedroom) : null,
    bathrooms: property.bathrooms ? getBathroomDisplay(property.bathrooms) : null,
    area: toNullableNumber(property.area),
    area_display: formatArea(toNullableNumber(property.area)),
    location: property.location || null,
    city_name: property.city_name || null,
    community_name: property.community_name || null,
    developer_name: property.developer_name || null,
    description: property.description || null,
    featured_image: property.featured_image || null,
    image_url: finalImageUrl,
    image_variations: imageVariations.length > 0 ? imageVariations : [finalImageUrl],
    gallery_images: galleryImages.length > 0 ? galleryImages : [finalImageUrl],
    completion_date: property.completion_date || null,
    occupancy: property.occupancy ? getOccupancyLabel(property.occupancy) : null,
    property_type: property.property_type || null,
    furnishing: property.furnishing || null,
    parking: property.parking || null,
    rera_number: property.ReraNumber || null,
    dld_permit: property.dld_permit || null,
    video_url: property.video_url || null,
    amenities: property.amenities ? property.amenities.split(',').filter(Boolean).map((a: string) => a.trim()) : [],
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
    },
  };
}

// ─── TRANSFORM PROJECT ────────────────────────────────────────────────

function transformProject(project: any, galleryRecords: any[] = []): SearchResult {
  const imageUrl = resolveProjectImage(project.featured_image);
  const imageVariations = getProjectImageVariations(project.featured_image);
  const galleryImages = resolveProjectGallery(galleryRecords);
  const logoUrl = resolveProjectLogo(project.LogoUrl);

  // Get featured image from gallery if main image is not available
  const finalImageUrl = imageUrl.includes('no-image') && galleryImages.length > 0
    ? galleryImages[0]
    : imageUrl;

  return {
    id: project.id,
    result_type: 'project',
    name: project.ProjectName || 'Project',
    slug: project.project_slug || `project-${project.id}`,
    listing_type: project.listing_type || 'Project',
    price: toNullableNumber(project.price),
    price_display: formatPrice(toNullableNumber(project.price)),
    bedroom: project.bedroom ? getBedroomDisplay(project.bedroom) : null,
    bathrooms: project.bathrooms ? getBathroomDisplay(project.bathrooms) : null,
    area: toNullableNumber(project.area),
    area_display: formatArea(toNullableNumber(project.area)),
    location: project.LocationName || null,
    city_name: project.city_name || null,
    community_name: project.community_name || null,
    developer_name: project.developer_name || null,
    description: project.Description || null,
    featured_image: project.featured_image || null,
    image_url: finalImageUrl,
    image_variations: imageVariations.length > 0 ? imageVariations : [finalImageUrl],
    gallery_images: galleryImages.length > 0 ? galleryImages : [finalImageUrl],
    completion_date: project.completion_date || null,
    occupancy: project.occupancy ? getOccupancyLabel(project.occupancy) : null,
    property_type: project.property_type || null,
    furnishing: project.furnishing || null,
    parking: project.parking || null,
    rera_number: project.ReraNumber || null,
    dld_permit: project.dld_permit || null,
    video_url: project.video_url || null,
    amenities: project.amenities ? project.amenities.split(',').filter(Boolean).map((a: string) => a.trim()) : [],
    status: project.status || 0,
    created_at: project.created_at || null,
    updated_at: project.updated_at || null,
    // Project specific
    project_id: project.id,
    ProjectName: project.ProjectName,
    project_slug: project.project_slug,
    LogoUrl: logoUrl,
    extra: {
      completion_status: getCompletionStatus(project.completion_date),
      featured_project: project.featured_project || null,
      city_id: project.city_id || null,
      community_id: project.community_id || null,
      sub_community_id: project.sub_community_id || null,
      price_end: project.price_end || null,
      area_end: project.area_end || null,
    },
  };
}

// ─── FETCH MEDIA RECORDS ──────────────────────────────────────────────

async function fetchMediaRecords(knex: any, propertyIds: number[]): Promise<Map<number, any[]>> {
  const mediaByPropertyId = new Map<number, any[]>();
  if (!propertyIds.length) return mediaByPropertyId;

  try {
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
    // Table might not exist
  }
  return mediaByPropertyId;
}

async function fetchProjectGallery(knex: any, projectIds: number[]): Promise<Map<number, any[]>> {
  const galleryByProjectId = new Map<number, any[]>();
  if (!projectIds.length) return galleryByProjectId;

  try {
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
    // Table might not exist
  }
  return galleryByProjectId;
}

// ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────

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

  const knex = await db();
  const offset = (page - 1) * limit;
  
  let properties: any[] = [];
  let projects: any[] = [];
  let totalProperties = 0;
  let totalProjects = 0;
  let propertyIds: number[] = [];
  let projectIds: number[] = [];

  // ─── FETCH PROPERTIES ──────────────────────────────────────────────
  if (include_properties) {
    const propQuery = knex('properties as p')
      .distinct('p.id')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.status', status);

    // Search query
    if (q) {
      propQuery.where(function (this: any) {
        this.where('p.property_name', 'like', `%${q}%`)
          .orWhere('p.location', 'like', `%${q}%`)
          .orWhere('p.address', 'like', `%${q}%`)
          .orWhere('p.keyword', 'like', `%${q}%`);
      });
    }

    // Listing type
    if (type === 'rent') {
      propQuery.where('p.listing_type', 'Rent');
    } else if (type === 'buy') {
      propQuery.where('p.listing_type', 'in', ['Sale', 'Off plan']);
    } else if (listing_type) {
      propQuery.where('p.listing_type', listing_type);
    }

    // Locations
    if (locations.length > 0) {
      propQuery.where(function (this: any) {
        for (const loc of locations) {
          this.orWhere('p.location', 'like', `%${loc}%`);
        }
      });
    }

    // City
    if (city_id) propQuery.where('p.city_id', city_id);

    // Community
    if (community_id) propQuery.where('p.community_id', community_id);

    // Price
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

    // Bedrooms
    if (min_bedrooms !== undefined && min_bedrooms !== null) {
      propQuery.whereRaw('CAST(p.bedroom AS UNSIGNED) >= ?', [min_bedrooms]);
    }
    if (max_bedrooms !== undefined && max_bedrooms !== null) {
      propQuery.whereRaw('CAST(p.bedroom AS UNSIGNED) <= ?', [max_bedrooms]);
    }

    // Area
    if (min_area) propQuery.where('p.area', '>=', min_area);
    if (max_area) propQuery.where('p.area', '<=', max_area);

    // Property type
    if (property_type) propQuery.where('p.property_type', property_type);

    // Featured
    if (featured) propQuery.where('p.featured_property', '1');

    // Count
    const countQuery = propQuery.clone();
    const [{ total: propTotal }] = await countQuery.count('* as total');
    totalProperties = Number(propTotal) || 0;

    // Sort
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
      case 'newest':
      default:
        propQuery.orderBy('p.created_at', 'desc');
    }

    // Pagination
    propQuery.limit(limit).offset(offset);

    // Select
    properties = await propQuery.select(
      'p.*',
      'c.name as city_name',
      'com.name as community_name',
      knex.raw('COALESCE(d.name, idev.name) as developer_name')
    );

    propertyIds = properties.map((p) => p.id);
  }

  // ─── FETCH PROJECTS ────────────────────────────────────────────────
  if (include_projects) {
    const projQuery = knex('project_listing as pl')
      .distinct('pl.id')
      .leftJoin('cities as c', 'pl.city_id', 'c.id')
      .leftJoin('community as com', 'pl.community_id', 'com.id')
      .leftJoin('developers as d', 'pl.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
      .where('pl.status', status);

    // Search query
    if (q) {
      projQuery.where(function (this: any) {
        this.where('pl.ProjectName', 'like', `%${q}%`)
          .orWhere('pl.LocationName', 'like', `%${q}%`)
          .orWhere('pl.Description', 'like', `%${q}%`)
          .orWhere('pl.keyword', 'like', `%${q}%`);
      });
    }

    // Listing type
    if (listing_type) {
      projQuery.where('pl.listing_type', listing_type);
    }

    // Locations
    if (locations.length > 0) {
      projQuery.where(function (this: any) {
        for (const loc of locations) {
          this.orWhere('pl.LocationName', 'like', `%${loc}%`);
        }
      });
    }

    // City
    if (city_id) projQuery.where('pl.city_id', city_id);

    // Community
    if (community_id) projQuery.where('pl.community_id', community_id);

    // Price
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

    // Bedrooms
    if (min_bedrooms !== undefined && min_bedrooms !== null) {
      projQuery.whereRaw('CAST(pl.bedroom AS UNSIGNED) >= ?', [min_bedrooms]);
    }
    if (max_bedrooms !== undefined && max_bedrooms !== null) {
      projQuery.whereRaw('CAST(pl.bedroom AS UNSIGNED) <= ?', [max_bedrooms]);
    }

    // Area
    if (min_area) projQuery.where('pl.area', '>=', min_area);
    if (max_area) projQuery.where('pl.area', '<=', max_area);

    // Featured
    if (featured) projQuery.where('pl.featured_project', '1');

    // Count
    const countQuery2 = projQuery.clone();
    const [{ total: projTotal }] = await countQuery2.count('* as total');
    totalProjects = Number(projTotal) || 0;

    // Sort
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
      case 'newest':
      default:
        projQuery.orderBy('pl.created_at', 'desc');
    }

    // Pagination - take remaining
    const remainingLimit = limit - properties.length;
    projQuery.limit(Math.max(0, remainingLimit)).offset(offset);

    // Select
    projects = await projQuery.select(
      'pl.*',
      'c.name as city_name',
      'com.name as community_name',
      knex.raw('COALESCE(d.name, idev.name) as developer_name')
    );

    projectIds = projects.map((p) => p.id);
  }

  // ─── FETCH MEDIA ────────────────────────────────────────────────────
  const [mediaByPropertyId, galleryByProjectId] = await Promise.all([
    fetchMediaRecords(knex, propertyIds),
    fetchProjectGallery(knex, projectIds),
  ]);

  // ─── TRANSFORM ──────────────────────────────────────────────────────
  const transformedProperties = properties.map((p) => {
    const mediaRecords = mediaByPropertyId.get(p.id) ?? [];
    return transformProperty(p, mediaRecords);
  });

  const transformedProjects = projects.map((p) => {
    const galleryRecords = galleryByProjectId.get(p.id) ?? [];
    return transformProject(p, galleryRecords);
  });

  // Combine results
  const allResults = [...transformedProperties, ...transformedProjects];
  const total = totalProperties + totalProjects;

  // Apply sorting to combined results if needed
  if (sort_by === 'popular') {
    // Could add popularity sorting
  }

  return {
    data: allResults,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      properties_count: transformedProperties.length,
      projects_count: transformedProjects.length,
    },
  };
}

// ─── GET SINGLE RESULT ─────────────────────────────────────────────────

export async function getSearchResult(slugOrId: string): Promise<SearchResult | null> {
  const knex = await db();
  const isNumeric = /^\d+$/.test(slugOrId);

  // ─── TRY PROPERTY ──────────────────────────────────────────────────
  let property = null;
  let mediaRecords: any[] = [];

  if (isNumeric) {
    property = await knex('properties as p')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.id', parseInt(slugOrId))
      .where('p.status', 1)
      .select(
        'p.*',
        'c.name as city_name',
        'com.name as community_name',
        knex.raw('COALESCE(d.name, idev.name) as developer_name')
      )
      .first();
  } else {
    property = await knex('properties as p')
      .leftJoin('cities as c', 'p.city_id', 'c.id')
      .leftJoin('community as com', 'p.community_id', 'com.id')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.property_slug', slugOrId)
      .where('p.status', 1)
      .select(
        'p.*',
        'c.name as city_name',
        'com.name as community_name',
        knex.raw('COALESCE(d.name, idev.name) as developer_name')
      )
      .first();
  }

  if (property) {
    const media = await knex('media')
      .where('module_id', property.id)
      .where('module_type', 'property')
      .where('status', 1)
      .select('id', 'path', 'title', 'featured', 'media_order');
    mediaRecords = media || [];
    return transformProperty(property, mediaRecords);
  }

  // ─── TRY PROJECT ───────────────────────────────────────────────────
  let project = null;
  let galleryRecords: any[] = [];

  if (isNumeric) {
    project = await knex('project_listing as pl')
      .leftJoin('cities as c', 'pl.city_id', 'c.id')
      .leftJoin('community as com', 'pl.community_id', 'com.id')
      .leftJoin('developers as d', 'pl.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
      .where('pl.id', parseInt(slugOrId))
      .where('pl.status', 1)
      .select(
        'pl.*',
        'c.name as city_name',
        'com.name as community_name',
        knex.raw('COALESCE(d.name, idev.name) as developer_name')
      )
      .first();
  } else {
    project = await knex('project_listing as pl')
      .leftJoin('cities as c', 'pl.city_id', 'c.id')
      .leftJoin('community as com', 'pl.community_id', 'com.id')
      .leftJoin('developers as d', 'pl.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'pl.developer_id', 'idev.id')
      .where('pl.project_slug', slugOrId)
      .where('pl.status', 1)
      .select(
        'pl.*',
        'c.name as city_name',
        'com.name as community_name',
        knex.raw('COALESCE(d.name, idev.name) as developer_name')
      )
      .first();
  }

  if (project) {
    const gallery = await knex('project_gallery')
      .where('project_id', project.id)
      .select('id', 'Url', 'created_at');
    galleryRecords = gallery || [];
    return transformProject(project, galleryRecords);
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