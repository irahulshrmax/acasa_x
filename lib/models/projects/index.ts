// lib/models/projects/index.ts
import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const UPLOAD_BASE_URL = 'https://acasa.ae/upload';
const IMAGE_DIRS = ['media', 'media/thumbnail', 'media/medium', 'projects', 'blogs'] as const;

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface Project {
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
}

export interface ProjectFilters {
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
  sort_by?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'units';
  page?: number;
  limit?: number;
  property_type?: string;
}

export interface ProjectListResult {
  data: ProjectWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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
  user_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ProjectData {
  id: number;
  sub_community_id: number;
  name: string;
  status: number;
}

export interface ProjectMediaRecord {
  id: number;
  path: string | null;
  title: string | null;
  featured: number | null;
  media_order: number | null;
  full_url: string;
}

export interface ProjectWithRelations extends Project {
  gallery: ProjectGallery[];
  contacts: ProjectContact[];
  specs: ProjectSpecs | null;
  data: ProjectData;
  total_gallery_images: number;
  image_url: string;
  image_variations: string[];
  logo_url: string | null;
  gallery_images: string[];
  image_candidates: string[];
  media_records: ProjectMediaRecord[];
  price_display: string;
  price_end_display: string | null;
  bedrooms_label: string;
  area_display: string;
  formatted_price: string;
}

// ─── NEIGHBORHOOD TYPES ──────────────────────────────────────────────────────

export interface Neighborhood {
  id: number;
  name: string;
  slug: string;
  image: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
  city_id: number | null;
  city_name?: string | null;
  status: number;
  featured: number;
  property_count: number;
}

export interface NeighborhoodFilters {
  page?: number;
  limit?: number;
  city_id?: number;
  featured?: boolean;
  keyword?: string;
  status?: number;
}

export interface NeighborhoodListResult {
  data: Neighborhood[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    cached?: boolean;
  };
}

// ─── CACHE KEYS ─────────────────────────────────────────────────────────────

const NEIGHBORHOOD_CACHE_KEYS = {
  list:     (filters: NeighborhoodFilters) => `neighborhood:list:${JSON.stringify(filters)}`,
  byId:     (id: number)                   => `neighborhood:id:${id}`,
  bySlug:   (slug: string)                 => `neighborhood:slug:${slug}`,
  featured: ()                             => `neighborhood:featured`,
  cities:   ()                             => `neighborhood:cities`,
};

const PROJECT_CACHE_KEYS = {
  list:    (f: ProjectFilters)              => `projects:list:${JSON.stringify(f)}`,
  byId:    (id: number)                     => `projects:id:${id}`,
  bySlug:  (slug: string)                   => `projects:slug:${slug}`,
  count:   (f: ProjectFilters)              => `projects:count:${JSON.stringify(f)}`,
  related: (id: number, limit: number)      => `projects:related:${id}:${limit}`,
  filters: ()                               => `projects:filters`,
  media:   (ids: number[])                  => `projects:media:${ids.slice().sort().join(',')}`,
  stats:   (type: string)                   => `projects:stats:${type}`,
};

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

// ─── NEIGHBORHOOD HELPERS ────────────────────────────────────────────────────

function getNeighborhoodImageUrl(rawPath: string | null | undefined): string {
  if (!rawPath || /no-image/i.test(rawPath)) {
    return `${UPLOAD_BASE_URL}/no-image.png`;
  }

  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const clean    = rawPath.replace(/^\/+/, '');
  const baseName = clean.replace(/\.[^.]+$/, '');

  return `${UPLOAD_BASE_URL}/locations/${baseName}.jpg`;
}

function buildNeighborhoodQuery(knex: any, filters: NeighborhoodFilters) {
  const { city_id, featured, keyword, status = 1 } = filters;

  const query = knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.status', status);

  if (city_id)  query.where('c.city_id', city_id);
  if (featured) query.where('c.featured', 1);

  if (keyword) {
    query.where(function (this: any) {
      this.where('c.name', 'like', `%${keyword}%`)
        .orWhere('c.description', 'like', `%${keyword}%`)
        .orWhere('ci.name', 'like', `%${keyword}%`);
    });
  }

  query.select(
    'c.id',
    'c.name',
    'c.slug',
    'c.img as image',
    'c.latitude',
    'c.longitude',
    'c.description',
    'c.city_id',
    'ci.name as city_name',
    'c.status',
    'c.featured',
    knex.raw(
      '(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count'
    )
  );

  query.orderBy('c.featured', 'desc').orderBy('c.name', 'asc');

  return query;
}

function normalizeNeighborhood(row: any): Neighborhood {
  return {
    ...row,
    image:          getNeighborhoodImageUrl(row.image),
    property_count: Number(row.property_count) || 0,
  };
}

// ─── NEIGHBORHOOD FUNCTIONS ──────────────────────────────────────────────────

export async function getNeighborhoods(
  filters: NeighborhoodFilters = {}
): Promise<NeighborhoodListResult> {
  const { page = 1, limit = 20 } = filters;
  const cacheKey = NEIGHBORHOOD_CACHE_KEYS.list(filters);

  const cached = await cache.get<NeighborhoodListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex    = await db();
    const query   = buildNeighborhoodQuery(knex, filters);
    const countKey = `neighborhood:count:${JSON.stringify({
      city_id:  filters.city_id,
      featured: filters.featured,
      keyword:  filters.keyword,
      status:   filters.status,
    })}`;

    const [total, communities] = await Promise.all([
      cache.get<number>(countKey).then(async (cachedCount) => {
        if (cachedCount !== null) return cachedCount;

        const countQ    = buildNeighborhoodQuery(knex, filters);
        const [{ total }] = await countQ.clone().clearSelect().count('c.id as total');
        const count     = Number(total);

        await cache.set(countKey, count, { ttl: 300, tags: ['neighborhood', 'count'] });
        return count;
      }),
      query.limit(limit).offset((page - 1) * limit),
    ]);

    const data   = communities.map(normalizeNeighborhood);
    const result: NeighborhoodListResult = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    const tags = ['neighborhood', 'list'];
    if (filters.city_id)  tags.push(`city:${filters.city_id}`);
    if (filters.featured) tags.push('featured');

    await cache.set(cacheKey, result, { ttl: 300, tags });
    return result;
  });
}

export async function getNeighborhoodById(id: number): Promise<Neighborhood | null> {
  const cacheKey = NEIGHBORHOOD_CACHE_KEYS.byId(id);
  const cached   = await cache.get<Neighborhood>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const row = await knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.id', id)
    .where('c.status', 1)
    .select(
      'c.id',
      'c.name',
      'c.slug',
      'c.img as image',
      'c.latitude',
      'c.longitude',
      'c.description',
      'c.city_id',
      'ci.name as city_name',
      'c.status',
      'c.featured',
      knex.raw(
        '(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count'
      )
    )
    .first();

  if (!row) return null;

  const result = normalizeNeighborhood(row);
  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', `id:${id}`] });
  return result;
}

export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  const cacheKey = NEIGHBORHOOD_CACHE_KEYS.bySlug(slug);
  const cached   = await cache.get<Neighborhood>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const neighborhoodSelect = (q: any) =>
    q.select(
      'c.id',
      'c.name',
      'c.slug',
      'c.img as image',
      'c.latitude',
      'c.longitude',
      'c.description',
      'c.city_id',
      'ci.name as city_name',
      'c.status',
      'c.featured',
      knex.raw(
        '(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count'
      )
    );

  const baseQuery = () =>
    knex('community as c')
      .leftJoin('cities as ci', 'c.city_id', 'ci.id')
      .where('c.status', 1);

  let row = await neighborhoodSelect(baseQuery().where('c.slug', slug)).first();

  // Fallback: try numeric ID
  if (!row && !isNaN(parseInt(slug, 10))) {
    row = await neighborhoodSelect(baseQuery().where('c.id', parseInt(slug, 10))).first();
  }

  if (!row) return null;

  const result = normalizeNeighborhood(row);
  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', `slug:${slug}`] });
  return result;
}

export async function getFeaturedNeighborhoods(limit = 6): Promise<Neighborhood[]> {
  const cacheKey = NEIGHBORHOOD_CACHE_KEYS.featured();
  const cached   = await cache.get<Neighborhood[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const rows = await knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.status', 1)
    .where('c.featured', 1)
    .select(
      'c.id',
      'c.name',
      'c.slug',
      'c.img as image',
      'c.latitude',
      'c.longitude',
      'c.description',
      'c.city_id',
      'ci.name as city_name',
      'c.status',
      'c.featured',
      knex.raw(
        '(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count'
      )
    )
    .orderBy('c.name', 'asc')
    .limit(limit);

  const result = rows.map(normalizeNeighborhood);
  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', 'featured'] });
  return result;
}

export async function getNeighborhoodCities(): Promise<
  { id: number; name: string; count: number }[]
> {
  const cacheKey = NEIGHBORHOOD_CACHE_KEYS.cities();
  const cached   = await cache.get<{ id: number; name: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  const rows = await knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.status', 1)
    .select('ci.id', 'ci.name')
    .count('c.id as count')
    .groupBy('ci.id', 'ci.name')
    .orderBy('count', 'desc');

  const result = rows.map((row: any) => ({
    id:    row.id,
    name:  row.name || 'Dubai',
    count: Number(row.count),
  }));

  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', 'cities'] });
  return result;
}

// ─── PROJECT HELPERS ─────────────────────────────────────────────────────────

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isFinite(num) ? num : null;
  }
  return null;
}

function formatPrice(amount: number | null | undefined, currency = 'AED'): string {
  const num = toNumber(amount);
  if (num === null) return 'Price on Request';
  return `${currency} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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

function parseArea(area: number | null | undefined): string {
  if (area && area > 0) return `${area.toLocaleString('en-US')} sq. ft.`;
  return 'Area on Request';
}

function parseCommaIds(ids: string | null): number[] {
  if (!ids) return [];
  return ids
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
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

function getProjectImageUrl(rawPath: string | null | undefined): string {
  if (!rawPath || /no-image/i.test(rawPath)) return `${UPLOAD_BASE_URL}/no-image.png`;
  if (isAbsoluteUrl(rawPath)) return rawPath;

  const clean = stripUploadPrefix(rawPath);
  if (!clean) return `${UPLOAD_BASE_URL}/no-image.png`;

  if (!clean.includes('/') || clean.split('/')[0] === 'project') {
    return `${UPLOAD_BASE_URL}/media/${clean}`;
  }
  return `${UPLOAD_BASE_URL}/${clean}`;
}

function getProjectImageVariations(rawPath: string | null | undefined): string[] {
  if (!rawPath || /no-image/i.test(rawPath)) return [`${UPLOAD_BASE_URL}/no-image.png`];
  if (isAbsoluteUrl(rawPath)) return [rawPath];

  const clean = stripUploadPrefix(rawPath);
  if (!clean) return [`${UPLOAD_BASE_URL}/no-image.png`];

  const urls = IMAGE_DIRS.map((dir) => `${UPLOAD_BASE_URL}/${dir}/${clean}`);
  urls.push(`${UPLOAD_BASE_URL}/${clean}`);
  return [...new Set(urls)];
}

// ─── PROJECT DB HELPERS ──────────────────────────────────────────────────────

async function fetchMediaByIds(
  knex: any,
  mediaIds: number[]
): Promise<Map<number, any>> {
  const result = new Map<number, any>();
  if (!mediaIds.length) return result;

  const cacheKey = PROJECT_CACHE_KEYS.media(mediaIds);
  const cached   = await cache.get<Map<number, any>>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await knex('media')
      .whereIn('id', mediaIds)
      .where('status', 1)
      .select('id', 'module_id', 'module_type', 'path', 'title', 'featured', 'media_order');

    for (const row of rows) result.set(row.id, row);

    await cache.set(cacheKey, result, { ttl: 300, tags: ['projects', 'media'] });
  } catch {
    // media table might not exist — silently ignore
  }

  return result;
}

async function fetchProjectGallery(
  knex: any,
  projectIds: number[]
): Promise<Map<number, ProjectGallery[]>> {
  const result = new Map<number, ProjectGallery[]>();
  if (!projectIds.length) return result;

  try {
    const rows: ProjectGallery[] = await knex('project_gallery')
      .whereIn('project_id', projectIds)
      .select('id', 'project_id', 'Url', 'created_at', 'updated_at')
      .orderBy('id', 'asc');

    for (const row of rows) {
      if (row.project_id !== null) {
        const list = result.get(row.project_id) ?? [];
        list.push(row);
        result.set(row.project_id, list);
      }
    }
  } catch {
    // table might not exist
  }

  return result;
}

async function fetchProjectSpecs(
  knex: any,
  projectIds: number[]
): Promise<Map<number, ProjectSpecs>> {
  const result = new Map<number, ProjectSpecs>();
  if (!projectIds.length) return result;

  try {
    const rows: ProjectSpecs[] = await knex('project_specs')
      .whereIn('project_id', projectIds)
      .select('*');

    for (const row of rows) {
      if (row.project_id) result.set(row.project_id, row);
    }
  } catch {
    // table might not exist
  }

  return result;
}

async function fetchProjectContacts(
  knex: any,
  projectIds: number[]
): Promise<Map<number, ProjectContact[]>> {
  const result = new Map<number, ProjectContact[]>();
  if (!projectIds.length) return result;

  try {
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
  } catch {
    // table might not exist
  }

  return result;
}

// ─── PROJECT QUERY BUILDER ───────────────────────────────────────────────────

function buildProjectQuery(knex: any, filters: ProjectFilters) {
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
  } = filters;

  const query = knex('project_listing as pl');

  if (status !== undefined && status !== null) {
    query.where('pl.status', status);
  }

  if (listing_type)    query.where('pl.listing_type', listing_type);
  if (city_id)         query.where('pl.city_id', city_id);
  if (community_id)    query.where('pl.community_id', community_id);
  if (sub_community_id) query.where('pl.sub_community_id', sub_community_id);
  if (bedroom)         query.where('pl.bedroom', 'like', `%${bedroom}%`);
  if (featured)        query.where('pl.featured_project', '1');
  if (property_type)   query.where('pl.property_type', property_type);

  if (min_price) {
    query.where(function (this: any) {
      this.whereRaw('CAST(pl.price AS DECIMAL) >= ?', [min_price])
        .orWhereRaw('CAST(pl.price_end AS DECIMAL) >= ?', [min_price]);
    });
  }

  if (max_price) {
    query.where(function (this: any) {
      this.whereRaw('CAST(pl.price AS DECIMAL) <= ?', [max_price])
        .orWhereRaw('CAST(pl.price_end AS DECIMAL) <= ?', [max_price]);
    });
  }

  if (keyword) {
    query.where(function (this: any) {
      this.where('pl.ProjectName', 'like', `%${keyword}%`)
        .orWhere('pl.description', 'like', `%${keyword}%`)
        .orWhere('pl.keyword', 'like', `%${keyword}%`)
        .orWhere('pl.CityName', 'like', `%${keyword}%`)
        .orWhere('pl.CommunityName', 'like', `%${keyword}%`);
    });
  }

  switch (sort_by) {
    case 'price_asc':
      query.orderByRaw('CAST(pl.price AS DECIMAL) ASC NULLS LAST');
      break;
    case 'price_desc':
      query.orderByRaw('CAST(pl.price AS DECIMAL) DESC NULLS LAST');
      break;
    case 'oldest':
      query.orderBy('pl.created_at', 'asc');
      break;
    case 'units':
      query.orderByRaw('CAST(pl.total_units AS DECIMAL) DESC NULLS LAST');
      break;
    case 'newest':
    default:
      query.orderBy('pl.created_at', 'desc');
  }

  return query;
}

// ─── PROJECT TRANSFORM ───────────────────────────────────────────────────────

function transformProject(
  project: Project,
  specs: ProjectSpecs | null,
  gallery: ProjectGallery[],
  contacts: ProjectContact[],
  mediaRecords: any[] = []
): ProjectWithRelations {
  const mediaPaths     = mediaRecords.map((m) => m.path).filter((p): p is string => !!p);
  const featuredMedia  = mediaRecords.find((m) => m.featured === 1);
  const featuredPath   = featuredMedia?.path ?? project.featured_image;
  const galleryPaths   = gallery.map((g) => g.Url).filter((u): u is string => !!u);

  // Primary image — fall back through media → gallery
  let primaryImage = getProjectImageUrl(featuredPath);
  if (primaryImage.includes('no-image') && mediaPaths.length) {
    primaryImage = getProjectImageUrl(mediaPaths[0]);
  }
  if (primaryImage.includes('no-image') && galleryPaths.length) {
    primaryImage = getProjectImageUrl(galleryPaths[0]);
  }

  const galleryImages =
    mediaRecords.length > 0
      ? mediaRecords
          .map((m) => getProjectImageUrl(m.path))
          .filter((url) => !url.includes('no-image'))
      : galleryPaths
          .map(getProjectImageUrl)
          .filter((url) => !url.includes('no-image'));

  const logoUrl         = project.LogoUrl ? getProjectImageUrl(project.LogoUrl) : null;
  const imageVariations = uniqueStrings([primaryImage, ...galleryImages]);

  const priceAmount    = toNumber(project.price);
  const priceEndAmount = toNumber(project.price_end);
  const priceDisplay   = formatPrice(priceAmount);
  const priceEndDisplay = priceEndAmount ? formatPrice(priceEndAmount) : null;

  const transformedMedia: ProjectMediaRecord[] = mediaRecords.map((m) => ({
    id:          m.id,
    path:        m.path,
    title:       m.title,
    featured:    m.featured,
    media_order: m.media_order,
    full_url:    getProjectImageUrl(m.path),
  }));

  const projectData: ProjectData = {
    id:               project.id,
    sub_community_id: Number(project.sub_community_id) || 0,
    name:             project.ProjectName,
    status:           project.status ?? 0,
  };

  return {
    ...project,
    specs,
    gallery,
    contacts,
    data:                 projectData,
    total_gallery_images: mediaRecords.length || gallery.length,
    image_url:            primaryImage,
    image_variations:     imageVariations,
    logo_url:             logoUrl,
    gallery_images:       galleryImages.length > 0 ? galleryImages : [primaryImage],
    image_candidates:     imageVariations,
    media_records:        transformedMedia,
    price_display:        priceDisplay,
    price_end_display:    priceEndDisplay,
    bedrooms_label:       parseBedroom(project.bedroom),
    area_display:         parseArea(project.area),
    formatted_price:      priceDisplay,
  };
}

// ─── PROJECT FUNCTIONS ────────────────────────────────────────────────────────

export async function getProjects(
  filters: ProjectFilters = {}
): Promise<ProjectListResult> {
  const { page = 1, limit = 12 } = filters;
  const cacheKey = PROJECT_CACHE_KEYS.list(filters);

  const cached = await cache.get<ProjectListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex     = await db();
    const query    = buildProjectQuery(knex, filters);
    const countKey = PROJECT_CACHE_KEYS.count(filters);

    const [total, projects] = await Promise.all([
      cache.get<number>(countKey).then(async (cachedCount) => {
        if (cachedCount !== null) return cachedCount;

        const countQ      = buildProjectQuery(knex, filters);
        const [{ total }] = await countQ.count('* as total');
        const count       = Number(total);

        await cache.set(countKey, count, { ttl: 120, tags: ['projects', 'list', 'count'] });
        return count;
      }),
      query.clone().select('pl.*').limit(limit).offset((page - 1) * limit),
    ]);

    if (!projects.length) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const projectIds         = projects.map((p: any) => p.id as number);
   const allGalleryMediaIds: number[] = [
  ...new Set<number>(
    projects.flatMap((p: any) => parseCommaIds(p.gallery_media_ids))
  ),
];

    const [galleryById, specsById, contactsById, mediaById] = await Promise.all([
      fetchProjectGallery(knex, projectIds),
      fetchProjectSpecs(knex, projectIds),
      fetchProjectContacts(knex, projectIds),
      fetchMediaByIds(knex, allGalleryMediaIds),
    ]);

    const data = projects.map((project: any) => {
      const mediaRecords = parseCommaIds(project.gallery_media_ids)
        .map((id: number) => mediaById.get(id))
        .filter((m): m is any => !!m);

      return transformProject(
        project,
        specsById.get(project.id) ?? null,
        galleryById.get(project.id) ?? [],
        contactsById.get(project.id) ?? [],
        mediaRecords
      );
    });

    const result: ProjectListResult = {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    const tags = ['projects', 'list'];
    if (filters.listing_type)  tags.push(filters.listing_type);
    if (filters.city_id)       tags.push(`city:${filters.city_id}`);
    if (filters.community_id)  tags.push(`community:${filters.community_id}`);
    if (filters.featured)      tags.push('featured');

    await cache.set(cacheKey, result, { ttl: 120, tags });
    return result;
  });
}

export async function getProjectById(id: number): Promise<ProjectWithRelations | null> {
  const cacheKey = PROJECT_CACHE_KEYS.byId(id);
  const cached   = await cache.get<ProjectWithRelations>(cacheKey);
  if (cached) return cached;

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();

    try {
      const project = await knex('project_listing').where('id', id).first();
      if (!project) return null;

      const galleryMediaIds = parseCommaIds(project.gallery_media_ids);

      const [gallery, specs, contacts, mediaById] = await Promise.all([
        fetchProjectGallery(knex, [id]),
        fetchProjectSpecs(knex, [id]),
        fetchProjectContacts(knex, [id]),
        fetchMediaByIds(knex, galleryMediaIds),
      ]);

      const mediaRecords = galleryMediaIds
        .map((mediaId: number) => mediaById.get(mediaId))
        .filter((m): m is any => !!m);

      const result = transformProject(
        project,
        specs.get(id) ?? null,
        gallery.get(id) ?? [],
        contacts.get(id) ?? [],
        mediaRecords
      );

      await cache.set(cacheKey, result, {
        ttl: 600,
        tags: ['projects', 'detail', `project:${id}`],
      });

      return result;
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }
  });
}

export async function getProjectBySlug(slug: string): Promise<ProjectWithRelations | null> {
  const cacheKey = PROJECT_CACHE_KEYS.bySlug(slug);
  const cached   = await cache.get<ProjectWithRelations>(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const row = await knex('project_listing').where('project_slug', slug).first();
    if (!row) return null;

    const result = await getProjectById(row.id);
    if (result) {
      await cache.set(cacheKey, result, {
        ttl: 600,
        tags: ['projects', 'detail', `slug:${slug}`],
      });
    }
    return result;
  } catch (error) {
    console.error('Error fetching project by slug:', error);
    return null;
  }
}

export async function createProject(
  data: Partial<Project>
): Promise<ProjectWithRelations | null> {
  const knex = await db();

  try {
    const [id] = await knex('project_listing').insert({
      ...data,
      status:     data.status   ?? 1,
      template:   data.template ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await invalidateProjectListCache();
    return getProjectById(id);
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(
  id: number,
  data: Partial<Project>
): Promise<ProjectWithRelations | null> {
  const knex = await db();

  try {
    await knex('project_listing')
      .where('id', id)
      .update({ ...data, updated_at: new Date() });

    await Promise.all([
      cache.del(PROJECT_CACHE_KEYS.byId(id)),
      invalidateProjectListCache(),
    ]);

    return getProjectById(id);
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProject(
  id: number,
  permanent = false
): Promise<{ id: number; deleted: boolean }> {
  const knex = await db();

  try {
    const project = await knex('project_listing').where('id', id).first();
    if (!project) return { id, deleted: false };

    if (permanent) {
      await knex('project_listing').where('id', id).delete();
    } else {
      await knex('project_listing')
        .where('id', id)
        .update({ status: 0, updated_at: new Date() });
    }

    const delOps: Promise<any>[] = [
      cache.del(PROJECT_CACHE_KEYS.byId(id)),
      invalidateProjectListCache(),
    ];
    if (project.project_slug) {
      delOps.push(cache.del(PROJECT_CACHE_KEYS.bySlug(project.project_slug)));
    }

    await Promise.all(delOps);
    return { id, deleted: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { id, deleted: false };
  }
}

export async function restoreProject(id: number): Promise<ProjectWithRelations | null> {
  return updateProject(id, { status: 1 });
}

export async function getFeaturedProjects(limit = 10): Promise<ProjectListResult> {
  return getProjects({ featured: true, status: 1, limit });
}

export async function getRecentProjects(limit = 10): Promise<ProjectListResult> {
  return getProjects({ status: 1, sort_by: 'newest', limit });
}

export async function getRelatedProjects(
  projectId: number,
  limit = 6
): Promise<ProjectListResult> {
  const cacheKey = PROJECT_CACHE_KEYS.related(projectId, limit);
  const cached   = await cache.get<ProjectListResult>(cacheKey);
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

    const filters: ProjectFilters = { status: 1, limit };
    if (project.property_type) filters.property_type = project.property_type;
    if (project.city_id)       filters.city_id       = Number(project.city_id);
    if (project.community_id)  filters.community_id  = Number(project.community_id);

    const { data } = await getProjects(filters);
    const filtered  = data.filter((p) => p.id !== projectId).slice(0, limit);

    const result: ProjectListResult = {
      data:    filtered,
      meta: {
        total:      filtered.length,
        page:       1,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };

    await cache.set(cacheKey, result, {
      ttl: 300,
      tags: ['projects', 'related', `project:${projectId}`],
    });

    return result;
  } catch (error) {
    console.error('Error fetching related projects:', error);
    return { data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
  }
}

export async function getProjectSearchFilters(): Promise<any> {
  const cacheKey = PROJECT_CACHE_KEYS.filters();
  const cached   = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const [
      listingTypes,
      propertyTypes,
      cities,
      communities,
      subCommunities,
      bedrooms,
      priceRange,
      areaRange,
    ] = await Promise.all([
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
      knex('community').where('status', 1).select('id', 'name', 'slug'),
      knex('sub_community').where('status', 1).select('id', 'name', 'slug'),
      knex('project_listing')
        .distinct('bedroom')
        .whereNotNull('bedroom')
        .where('bedroom', '!=', '')
        .pluck('bedroom'),
      knex('project_listing')
        .where('status', 1)
        .min('price as minPrice')
        .max('price as maxPrice'),
      knex('project_listing')
        .where('status', 1)
        .min('area as minArea')
        .max('area as maxArea'),
    ]);

    const result = {
      listing_types:   listingTypes,
      property_types:  propertyTypes,
      cities,
      communities,
      sub_communities: subCommunities,
      bedrooms:        uniqueStrings(bedrooms),
      price_range: {
        min: Number(priceRange?.[0]?.minPrice) || 0,
        max: Number(priceRange?.[0]?.maxPrice) || 0,
      },
      area_range: {
        min: Number(areaRange?.[0]?.minArea) || 0,
        max: Number(areaRange?.[0]?.maxArea) || 0,
      },
    };

    await cache.set(cacheKey, result, { ttl: 900, tags: ['projects', 'filters'] });
    return result;
  } catch (error) {
    console.error('Error fetching search filters:', error);
    return {
      listing_types:   [],
      property_types:  [],
      cities:          [],
      communities:     [],
      sub_communities: [],
      bedrooms:        [],
      price_range:     { min: 0, max: 0 },
      area_range:      { min: 0, max: 0 },
    };
  }
}

// ─── ENQUIRY FUNCTIONS ───────────────────────────────────────────────────────

export async function createProjectEnquiry(data: {
  project_id: number;
  name: string;
  email: string;
  phone: string;
  message?: string;
  user_id?: number | null;
}): Promise<{ id: number; message: string }> {
  const knex = await db();

  try {
    const [id] = await knex('enquire').insert({
      property_id: data.project_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message ?? null,
      user_id: data.user_id ?? null,
      status: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { id, message: 'Enquiry submitted successfully' };
  } catch (error) {
    console.error('Error creating enquiry:', error);
    throw new Error('Failed to submit enquiry');
  }
}

// ─── CONTACT FUNCTIONS ───────────────────────────────────────────────────────

export async function createProjectContact(data: {
  project_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  user_id?: number | null;
}): Promise<{ id: number; message: string }> {
  const knex = await db();

  try {
    const [id] = await knex('project_contacts').insert({
      project_id: data.project_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      user_id: data.user_id ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return { id, message: 'Contact submitted successfully' };
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error('Failed to submit contact');
  }
}

// ─── STATISTICS FUNCTIONS ────────────────────────────────────────────────────

export async function getProjectStatistics(type = 'all'): Promise<any> {
  const cacheKey = PROJECT_CACHE_KEYS.stats(type);
  const cached   = await cache.get(cacheKey);
  if (cached) return cached;

  const knex = await db();

  try {
    const [total, byStatus, byListingType, byPropertyType, priceStats, areaStats] =
      await Promise.all([
        knex('project_listing').count('* as total').first(),
        knex('project_listing').select('status').count('* as count').groupBy('status'),
        knex('project_listing')
          .select('listing_type')
          .count('* as count')
          .whereNotNull('listing_type')
          .groupBy('listing_type'),
        knex('project_listing')
          .select('property_type')
          .count('* as count')
          .whereNotNull('property_type')
          .groupBy('property_type'),
        knex('project_listing')
          .where('status', 1)
          .whereNotNull('price')
          .select(
            knex.raw('MIN(price) as min_price'),
            knex.raw('MAX(price) as max_price'),
            knex.raw('AVG(price) as avg_price')
          )
          .first(),
        knex('project_listing')
          .where('status', 1)
          .whereNotNull('area')
          .select(
            knex.raw('MIN(area) as min_area'),
            knex.raw('MAX(area) as max_area'),
            knex.raw('AVG(area) as avg_area')
          )
          .first(),
      ]);

    const result = {
      total:            Number(total?.total || 0),
      by_status:        byStatus        || [],
      by_listing_type:  byListingType   || [],
      by_property_type: byPropertyType  || [],
      price_stats: {
        min: Number(priceStats?.min_price || 0),
        max: Number(priceStats?.max_price || 0),
        avg: Number(priceStats?.avg_price || 0),
      },
      area_stats: {
        min: Number(areaStats?.min_area || 0),
        max: Number(areaStats?.max_area || 0),
        avg: Number(areaStats?.avg_area || 0),
      },
    };

    await cache.set(cacheKey, result, { ttl: 3600, tags: ['projects', 'stats', type] });
    return result;
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    return {
      total:            0,
      by_status:        [],
      by_listing_type:  [],
      by_property_type: [],
      price_stats:      { min: 0, max: 0, avg: 0 },
      area_stats:       { min: 0, max: 0, avg: 0 },
    };
  }
}

// ─── PRIVATE UTILITIES ───────────────────────────────────────────────────────

async function invalidateProjectListCache(): Promise<void> {
  await Promise.all([
    cache.delByTag('projects'),
    cache.delByTag('list'),
    cache.delPattern('projects:list:*'),
    cache.delPattern('projects:count:*'),
  ]);
}