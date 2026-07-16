// lib/models/neighborhood/index.ts

import { db } from '@/lib/database';
import { cache } from '@/lib/cache';

const UPLOAD_BASE_URL = 'https://acasa.ae/upload';

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

const CACHE_KEYS = {
  list: (filters: NeighborhoodFilters) => `neighborhood:list:${JSON.stringify(filters)}`,
  byId: (id: number) => `neighborhood:id:${id}`,
  bySlug: (slug: string) => `neighborhood:slug:${slug}`,
  featured: () => `neighborhood:featured`,
  cities: () => `neighborhood:cities`,
  byCity: (citySlug: string, filters: any) => `neighborhood:city:${citySlug}:${JSON.stringify(filters)}`,
};

function getImageUrl(rawPath: string | null | undefined): string {
  if (!rawPath || /no-image/i.test(rawPath)) {
    return `${UPLOAD_BASE_URL}/no-image.png`;
  }
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  
  const clean = rawPath.replace(/^\/+/, '');
  const baseName = clean.replace(/\.[^.]+$/, '');
  
  return `${UPLOAD_BASE_URL}/locations/${baseName}.jpg`;
}

function buildNeighborhoodQuery(knex: any, filters: NeighborhoodFilters) {
  const {
    city_id,
    featured,
    keyword,
    status = 1,
  } = filters;

  const query = knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.status', status);

  if (city_id) query.where('c.city_id', city_id);
  if (featured) query.where('c.featured', 1);
  if (keyword) {
    query.where(function(this: any) {
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
    knex.raw('(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count')
  );

  query.orderBy('c.featured', 'desc').orderBy('c.name', 'asc');

  return query;
}

export async function getNeighborhoods(filters: NeighborhoodFilters = {}): Promise<NeighborhoodListResult> {
  const { page = 1, limit = 20 } = filters;

  const cacheKey = CACHE_KEYS.list(filters);
  const cached = await cache.get<NeighborhoodListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  return cache.dedupe(cacheKey, async () => {
    const knex = await db();
    const query = buildNeighborhoodQuery(knex, filters);
    const countKey = `neighborhood:count:${JSON.stringify({ city_id: filters.city_id, featured: filters.featured, keyword: filters.keyword, status: filters.status })}`;

    const [countResult, communities] = await Promise.all([
      cache.get<number>(countKey).then(async cachedCount => {
        if (cachedCount !== null) return cachedCount;
        const countQ = buildNeighborhoodQuery(knex, filters);
        const [{ total }] = await countQ.clone().clearSelect().count('c.id as total');
        const count = Number(total);
        await cache.set(countKey, count, { ttl: 300, tags: ['neighborhood', 'count'] });
        return count;
      }),
      query.limit(limit).offset((page - 1) * limit),
    ]);

    const data = communities.map((row: any) => ({
      ...row,
      image: getImageUrl(row.image),
      property_count: Number(row.property_count) || 0,
    }));

    const result: NeighborhoodListResult = {
      data,
      meta: {
        total: countResult,
        page,
        limit,
        totalPages: Math.ceil(countResult / limit),
      },
    };

    const tags = ['neighborhood', 'list'];
    if (filters.city_id) tags.push(`city:${filters.city_id}`);
    if (filters.featured) tags.push('featured');

    await cache.set(cacheKey, result, { ttl: 300, tags });
    return result;
  });
}

export async function getNeighborhoodById(id: number): Promise<Neighborhood | null> {
  const cacheKey = CACHE_KEYS.byId(id);
  const cached = await cache.get<Neighborhood>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const community = await knex('community as c')
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
      knex.raw('(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count')
    )
    .first();

  if (!community) return null;

  const result = {
    ...community,
    image: getImageUrl(community.image),
    property_count: Number(community.property_count) || 0,
  };

  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', `id:${id}`] });
  return result;
}

export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | null> {
  const cacheKey = CACHE_KEYS.bySlug(slug);
  const cached = await cache.get<Neighborhood>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const community = await knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.slug', slug)
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
      knex.raw('(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count')
    )
    .first();

  if (!community) return null;

  const result = {
    ...community,
    image: getImageUrl(community.image),
    property_count: Number(community.property_count) || 0,
  };

  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', `slug:${slug}`] });
  return result;
}

export async function getFeaturedNeighborhoods(limit: number = 6): Promise<Neighborhood[]> {
  const cacheKey = CACHE_KEYS.featured();
  const cached = await cache.get<Neighborhood[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const communities = await knex('community as c')
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
      knex.raw('(SELECT COUNT(*) FROM properties WHERE community_id = c.id AND status = 5) as property_count')
    )
    .orderBy('c.name', 'asc')
    .limit(limit);

  const result = communities.map((row: any) => ({
    ...row,
    image: getImageUrl(row.image),
    property_count: Number(row.property_count) || 0,
  }));

  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', 'featured'] });
  return result;
}

export async function getNeighborhoodCities(): Promise<{ id: number; name: string; slug: string; count: number }[]> {
  const cacheKey = CACHE_KEYS.cities();
  const cached = await cache.get<{ id: number; name: string; slug: string; count: number }[]>(cacheKey);
  if (cached) return cached;

  const knex = await db();
  const cities = await knex('community as c')
    .leftJoin('cities as ci', 'c.city_id', 'ci.id')
    .where('c.status', 1)
    .select('ci.id', 'ci.name', 'ci.slug')
    .count('c.id as count')
    .groupBy('ci.id', 'ci.name', 'ci.slug')
    .orderBy('count', 'desc');

  const result = cities.map((row: any) => ({
    id: row.id,
    name: row.name || 'Dubai',
    slug: row.slug || 'dubai',
    count: Number(row.count),
  }));

  await cache.set(cacheKey, result, { ttl: 600, tags: ['neighborhood', 'cities'] });
  return result;
}

export async function getNeighborhoodsByCity(citySlug: string, filters: Omit<NeighborhoodFilters, 'city_id'> = {}) {
  const cacheKey = CACHE_KEYS.byCity(citySlug, filters);
  const cached = await cache.get<NeighborhoodListResult>(cacheKey);
  if (cached) return { ...cached, meta: { ...cached.meta, cached: true } };

  const knex = await db();
  const city = await knex('cities').where('slug', citySlug).first();
  
  if (!city) {
    return { data: [], meta: { total: 0, page: filters.page || 1, limit: filters.limit || 20, totalPages: 0 } };
  }

  return getNeighborhoods({
    ...filters,
    city_id: city.id,
  });
}