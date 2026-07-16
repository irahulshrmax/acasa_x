// lib/models/archive-projects/index.ts

import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

const UPLOAD_BASE_URL = 'https://acasa.ae/upload/media';
const CACHE_TTL = 300;
const LIST_CACHE_TTL = 120;

export interface ArchiveProject {
  id: number;
  ProjectName: string;
  project_slug: string;
  listing_type: string | null;
  property_type: string | null;
  bedroom: string | null;
  price: number | null;
  price_end: number | null;
  area: number | null;
  area_end: number | null;
  min_area: number | null;
  max_area: number | null;
  city_id: number | null;
  community_id: number | null;
  sub_community_id: number | null;
  developer_id: number | null;
  featured_project: string | null;
  status: number;
  description: string | null;
  keyword: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_tags: string | null;
  gallery_media_ids: string | null;
  featured_image: string | null;
  LogoUrl: string | null;
  CityName: string | null;
  CommunityName: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  occupancy: string | null;
  total_units: number | null;
  template: number | null;
  latitude: string | null;
  longitude: string | null;
  views: number | null;
  ProjectNumber: string | null;
  LocationName: string | null;
  amenities: string | null;
  video_url: string | null;
  verified: string | null;
}

export interface ArchiveProjectFilters {
  listing_type?: string;
  city_id?: number;
  community_id?: number;
  sub_community_id?: number;
  min_price?: number;
  max_price?: number;
  bedroom?: string;
  status?: number;
  featured?: boolean;
  keyword?: string;
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'units' | 'popular' | 'completion_early' | 'completion_late';
  page?: number;
  limit?: number;
  property_type?: string;
  developer_id?: number;
}

export interface ArchiveProjectListResult {
  data: ArchiveProjectWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    cached?: boolean;
  };
}

export interface ArchiveProjectWithRelations extends ArchiveProject {
  image_url: string;
  gallery_images: string[];
  price_display: string;
  bedrooms_label: string;
  area_display: string;
  handover_display: string;
  developer_name: string | null;
  developer_logo: string | null;
  developer_website: string | null;
  developer_description: string | null;
  media_paths: string[];
  formatted_price: string;
  all_media_paths?: string;
  media_path?: string;
}

const ARCHIVE_CACHE_KEYS = {
  list: (f: ArchiveProjectFilters) => `archive:list:${JSON.stringify(f)}`,
  byId: (id: number) => `archive:id:${id}`,
  bySlug: (slug: string) => `archive:slug:${slug}`,
  count: (f: ArchiveProjectFilters) => `archive:count:${JSON.stringify(f)}`,
  related: (id: number, limit: number) => `archive:related:${id}:${limit}`,
  stats: () => `archive:stats`,
  filters: () => `archive:filters`,
};

function cleanImagePath(path: string | null | undefined): string {
  if (!path) return '';
  let cleaned = path.trim();
  cleaned = cleaned.replace(/^\/+/g, '');
  cleaned = cleaned.replace(/^uploads\//, '');
  cleaned = cleaned.replace(/^media\//, '');
  cleaned = cleaned.replace(/^projects\//, '');
  cleaned = cleaned.replace(/^upload\/media\//, '');
  return cleaned;
}

function getArchiveImageUrl(path: string | null | undefined): string {
  if (!path) return `${UPLOAD_BASE_URL}/no-image.png`;
  if (path.startsWith('http')) return path;
  const clean = cleanImagePath(path);
  if (!clean) return `${UPLOAD_BASE_URL}/no-image.png`;
  return `${UPLOAD_BASE_URL}/${clean}`;
}

function getUnsplashFallback(title?: string | null): string {
  const query = encodeURIComponent(title || 'luxury project dubai');
  return `https://source.unsplash.com/800x600/?${query},real-estate,property,development`;
}

function formatPrice(price: any): string {
  const num = parseFloat(price);
  if (!num || isNaN(num)) return 'Price on Request';
  return `AED ${num.toLocaleString()}`;
}

function parseBedroom(val: any): string {
  if (!val) return 'N/A';
  const str = String(val);
  if (/studio/i.test(str)) return 'Studio';
  const match = str.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    return `${n} Bed${n > 1 ? 's' : ''}`;
  }
  return str;
}

function parseArea(val: any): string {
  const num = parseFloat(val);
  if (!num || isNaN(num)) return 'N/A';
  return `${num.toLocaleString()} sq. ft.`;
}

function parseHandover(val: any): string {
  if (!val) return 'TBA';
  if (val === '0000-00-00') return 'TBA';
  if (val === '1970-01-01') return 'TBA';
  return val;
}

function parseCommaIds(ids: string | null): number[] {
  if (!ids) return [];
  return ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
}

function parseBoolean(val: any): boolean {
  if (val === null || val === undefined) return false;
  return val === '1' || val === 'yes' || val === true || val === 1;
}

function buildArchiveQuery(knex: any, filters: ArchiveProjectFilters) {
  const {
    listing_type,
    city_id,
    community_id,
    sub_community_id,
    min_price,
    max_price,
    bedroom,
    status = 1,
    featured,
    keyword,
    sort_by = 'newest',
    property_type,
    developer_id,
  } = filters;

  const query = knex('project_listing as p');

  if (status !== undefined && status !== null) {
    query.where('p.status', status);
  }

  if (listing_type) query.where('p.listing_type', listing_type);
  if (city_id) query.where('p.city_id', city_id);
  if (community_id) query.where('p.community_id', community_id);
  if (sub_community_id) query.where('p.sub_community_id', sub_community_id);
  if (bedroom) query.where('p.bedroom', 'like', `%${bedroom}%`);
  if (featured) query.where('p.featured_project', '1');
  if (property_type) query.where('p.property_type', property_type);
  if (developer_id) query.where('p.developer_id', developer_id);

  if (min_price) {
    query.where(function (this: any) {
      this.whereRaw('CAST(p.price AS DECIMAL) >= ?', [min_price])
        .orWhereRaw('CAST(p.price_end AS DECIMAL) >= ?', [min_price]);
    });
  }

  if (max_price) {
    query.where(function (this: any) {
      this.whereRaw('CAST(p.price AS DECIMAL) <= ?', [max_price])
        .orWhereRaw('CAST(p.price_end AS DECIMAL) <= ?', [max_price]);
    });
  }

  if (keyword) {
    query.where(function (this: any) {
      this.where('p.ProjectName', 'like', `%${keyword}%`)
        .orWhere('p.description', 'like', `%${keyword}%`)
        .orWhere('p.keyword', 'like', `%${keyword}%`)
        .orWhere('p.CityName', 'like', `%${keyword}%`)
        .orWhere('p.CommunityName', 'like', `%${keyword}%`)
        .orWhere('p.LocationName', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'price_asc':
      query.orderByRaw('CAST(p.price AS DECIMAL) ASC NULLS LAST');
      break;
    case 'price_desc':
      query.orderByRaw('CAST(p.price AS DECIMAL) DESC NULLS LAST');
      break;
    case 'oldest':
      query.orderBy('p.created_at', 'asc');
      break;
    case 'units':
      query.orderByRaw('CAST(p.total_units AS DECIMAL) DESC NULLS LAST');
      break;
    case 'popular':
      query.orderByRaw('CAST(p.views AS DECIMAL) DESC NULLS LAST');
      break;
    case 'completion_early':
      query.orderBy('p.completion_date', 'asc');
      break;
    case 'completion_late':
      query.orderBy('p.completion_date', 'desc');
      break;
    case 'newest':
    default:
      query.orderBy('p.created_at', 'desc');
  }

  query.select(
    'p.*',
    knex.raw('(SELECT path FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids) LIMIT 1) as media_path'),
    knex.raw('(SELECT GROUP_CONCAT(path SEPARATOR " | ") FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids)) as all_media_paths'),
    knex.raw('COALESCE(d.name, idev.name) as developer_name'),
    knex.raw('COALESCE(d.image, idev.image) as developer_logo'),
    knex.raw('d.website as developer_website')
  );

  query.leftJoin('developers as d', 'p.developer_id', 'd.id');
  query.leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id');

  return query;
}

function transformArchiveProject(project: any): ArchiveProjectWithRelations {
  const mediaIds = parseCommaIds(project.gallery_media_ids);
  
  let galleryImages: string[] = [];
  if (project.all_media_paths) {
    const paths = project.all_media_paths.split(' | ');
    galleryImages = paths
      .filter((p: string) => p && !p.includes('no-image'))
      .map((p: string) => getArchiveImageUrl(p));
  }

  let featuredImage = getArchiveImageUrl(project.media_path) || getArchiveImageUrl(project.featured_image);
  if (featuredImage.includes('no-image') && galleryImages.length > 0) {
    featuredImage = galleryImages[0];
  }
  if (featuredImage.includes('no-image')) {
    featuredImage = getUnsplashFallback(project.ProjectName);
  }

  if (galleryImages.length === 0 && featuredImage) {
    galleryImages = [featuredImage];
  }

  const developerLogo = project.developer_logo ? getArchiveImageUrl(project.developer_logo) : null;

  return {
    ...project,
    image_url: featuredImage,
    gallery_images: galleryImages,
    price_display: formatPrice(project.price),
    bedrooms_label: parseBedroom(project.bedroom),
    area_display: parseArea(project.area),
    handover_display: parseHandover(project.completion_date),
    developer_name: project.developer_name || null,
    developer_logo: developerLogo,
    developer_website: project.developer_website || null,
    developer_description: null,
    media_paths: mediaIds.map(id => `${UPLOAD_BASE_URL}/${id}`),
    formatted_price: formatPrice(project.price),
    all_media_paths: project.all_media_paths,
    media_path: project.media_path,
  };
}

export async function getArchiveProjects(filters: ArchiveProjectFilters = {}): Promise<ArchiveProjectListResult> {
  const { page = 1, limit = 12 } = filters;
  const cacheKey = ARCHIVE_CACHE_KEYS.list(filters);

  const cached = await cache.get<ArchiveProjectListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();
    const query = buildArchiveQuery(knex, filters);
    const countKey = ARCHIVE_CACHE_KEYS.count(filters);

    const [total, projects] = await Promise.all([
      cache.get<number>(countKey).then(async (cachedCount) => {
        if (cachedCount !== null) return cachedCount;
        const countQ = buildArchiveQuery(knex, filters);
        const [{ total }] = await countQ.clone().clearSelect().count('p.id as total');
        const count = Number(total);
        await cache.set(countKey, count, { ttl: LIST_CACHE_TTL, tags: ['archive', 'count'] });
        return count;
      }),
      query.clone().limit(limit).offset((page - 1) * limit),
    ]);

    const data = projects.map(transformArchiveProject);

    const result: ArchiveProjectListResult = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    const tags = ['archive', 'list'];
    if (filters.listing_type) tags.push(filters.listing_type);
    if (filters.city_id) tags.push(`city:${filters.city_id}`);
    if (filters.featured) tags.push('featured');

    await cache.set(cacheKey, result, { ttl: LIST_CACHE_TTL, tags });
    return result;
  });
}

export async function getArchiveProjectById(id: number): Promise<ArchiveProjectWithRelations | null> {
  const cacheKey = ARCHIVE_CACHE_KEYS.byId(id);
  const cached = await cache.get<ArchiveProjectWithRelations>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const project = await knex('project_listing as p')
      .select(
        'p.*',
        knex.raw('(SELECT path FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids) LIMIT 1) as media_path'),
        knex.raw('(SELECT GROUP_CONCAT(path SEPARATOR " | ") FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids)) as all_media_paths'),
        knex.raw('COALESCE(d.name, idev.name) as developer_name'),
        knex.raw('COALESCE(d.image, idev.image) as developer_logo'),
        knex.raw('d.website as developer_website')
      )
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.id', id)
      .first();

    if (!project) return null;

    const result = transformArchiveProject(project);
    await cache.set(cacheKey, result, { ttl: 600, tags: ['archive', 'detail', `id:${id}`] });
    return result;
  } catch (error) {
    console.error('Error fetching archive project by ID:', error);
    return null;
  }
}

export async function getArchiveProjectBySlug(slug: string): Promise<ArchiveProjectWithRelations | null> {
  const cacheKey = ARCHIVE_CACHE_KEYS.bySlug(slug);
  const cached = await cache.get<ArchiveProjectWithRelations>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const project = await knex('project_listing as p')
      .select(
        'p.*',
        knex.raw('(SELECT path FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids) LIMIT 1) as media_path'),
        knex.raw('(SELECT GROUP_CONCAT(path SEPARATOR " | ") FROM media WHERE FIND_IN_SET(id, p.gallery_media_ids)) as all_media_paths'),
        knex.raw('COALESCE(d.name, idev.name) as developer_name'),
        knex.raw('COALESCE(d.image, idev.image) as developer_logo'),
        knex.raw('d.website as developer_website')
      )
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('internationaldevelopers as idev', 'p.developer_id', 'idev.id')
      .where('p.project_slug', slug)
      .where('p.status', 1)
      .first();

    if (!project) {
      const numericId = parseInt(slug, 10);
      if (!isNaN(numericId)) {
        return getArchiveProjectById(numericId);
      }
      return null;
    }

    const result = transformArchiveProject(project);
    await cache.set(cacheKey, result, { ttl: 600, tags: ['archive', 'detail', `slug:${slug}`] });
    return result;
  } catch (error) {
    console.error('Error fetching archive project by slug:', error);
    return null;
  }
}

export async function getFeaturedArchiveProjects(limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ featured: true, status: 1, limit });
}

export async function getRecentArchiveProjects(limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ status: 1, sort_by: 'newest', limit });
}

export async function getPopularArchiveProjects(limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ status: 1, sort_by: 'popular', limit });
}

export async function getArchiveProjectStatistics(): Promise<any> {
  const cacheKey = ARCHIVE_CACHE_KEYS.stats();
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const [total, byListingType, byStatus, priceStats] = await Promise.all([
      knex('project_listing').count('* as total').where('status', 1).first(),
      knex('project_listing')
        .select('listing_type')
        .count('* as count')
        .where('status', 1)
        .whereNotNull('listing_type')
        .groupBy('listing_type'),
      knex('project_listing')
        .select('status')
        .count('* as count')
        .groupBy('status'),
      knex('project_listing')
        .where('status', 1)
        .whereNotNull('price')
        .select(
          knex.raw('MIN(price) as min_price'),
          knex.raw('MAX(price) as max_price'),
          knex.raw('AVG(price) as avg_price')
        )
        .first(),
    ]);

    const result = {
      total: Number(total?.total || 0),
      by_listing_type: byListingType || [],
      by_status: byStatus || [],
      price_stats: {
        min: Number(priceStats?.min_price || 0),
        max: Number(priceStats?.max_price || 0),
        avg: Number(priceStats?.avg_price || 0),
      },
    };

    await cache.set(cacheKey, result, { ttl: 3600, tags: ['archive', 'stats'] });
    return result;
  } catch (error) {
    console.error('Error fetching archive project statistics:', error);
    return {
      total: 0,
      by_listing_type: [],
      by_status: [],
      price_stats: { min: 0, max: 0, avg: 0 },
    };
  }
}

export async function getRelatedArchiveProjects(
  projectId: number,
  limit: number = 6
): Promise<ArchiveProjectListResult> {
  const cacheKey = ARCHIVE_CACHE_KEYS.related(projectId, limit);
  const cached = await cache.get<ArchiveProjectListResult>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const project = await knex('project_listing')
      .where('id', projectId)
      .select('property_type', 'city_id', 'community_id')
      .first();

    if (!project) {
      return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
    }

    const filters: ArchiveProjectFilters = { status: 1, limit };
    if (project.property_type) filters.property_type = project.property_type;
    if (project.city_id) filters.city_id = Number(project.city_id);
    if (project.community_id) filters.community_id = Number(project.community_id);

    const { data } = await getArchiveProjects(filters);
    const filtered = data.filter((p) => p.id !== projectId).slice(0, limit);

    const result: ArchiveProjectListResult = {
      data: filtered,
      meta: {
        total: filtered.length,
        page: 1,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };

    await cache.set(cacheKey, result, { ttl: 300, tags: ['archive', 'related', `project:${projectId}`] });
    return result;
  } catch (error) {
    console.error('Error fetching related archive projects:', error);
    return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  }
}

export async function incrementArchiveProjectViews(id: number): Promise<void> {
  const knex = await db();
  try {
    await knex('project_listing')
      .where('id', id)
      .increment('views', 1);
  } catch (error) {
    console.error('Error incrementing archive project views:', error);
  }
}

export async function getArchiveProjectsByDeveloper(developerId: number, limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ developer_id: developerId, status: 1, limit });
}

export async function getArchiveProjectsByListingType(listingType: string, limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ listing_type: listingType, status: 1, limit });
}

export async function getArchiveProjectsByCity(cityId: number, limit: number = 10): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ city_id: cityId, status: 1, limit });
}

export async function searchArchiveProjects(keyword: string, limit: number = 12): Promise<ArchiveProjectListResult> {
  return getArchiveProjects({ keyword, status: 1, limit });
}

export async function getArchiveProjectFilters(): Promise<any> {
  const cacheKey = ARCHIVE_CACHE_KEYS.filters();
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const [listingTypes, propertyTypes, cities, developers] = await Promise.all([
      knex('project_listing')
        .distinct('listing_type')
        .whereNotNull('listing_type')
        .where('listing_type', '!=', '')
        .pluck('listing_type'),
      knex('project_listing')
        .distinct('property_type')
        .whereNotNull('property_type')
        .where('property_type', '!=', '')
        .pluck('property_type'),
      knex('cities').where('status', '1').select('id', 'name', 'slug'),
      knex('developers')
        .where('status', 1)
        .select('id', 'name', 'image')
        .whereNotNull('name'),
    ]);

    const result = {
      listing_types: listingTypes || [],
      property_types: propertyTypes || [],
      cities: cities || [],
      developers: developers || [],
    };

    await cache.set(cacheKey, result, { ttl: 3600, tags: ['archive', 'filters'] });
    return result;
  } catch (error) {
    console.error('Error fetching archive project filters:', error);
    return {
      listing_types: [],
      property_types: [],
      cities: [],
      developers: [],
    };
  }
}