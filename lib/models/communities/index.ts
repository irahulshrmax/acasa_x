import { db } from '@/lib/database';
import {
    getCommunityImageUrl,
    getCommunityImageVariations,
    getNoImageUrl,
} from '@/lib/image-resolver';

const UPLOAD_BASE_URL = 'https://acasa.ae/upload';

export interface Community {
    id: number;
    community_id: number | null;
    name: string;
    country_id: number;
    state_id: number | null;
    city_id: number;
    slug: string | null;
    latitude: string | null;
    longitude: string | null;
    img: string | null;
    school_img: string | null;
    hotel_img: string;
    hospital_img: string | null;
    train_img: string | null;
    bus_img: string | null;
    description: string | null;
    top_community: string | null;
    top_projects: string | null;
    featured_project: string | null;
    related_blog: string | null;
    properties: string | null;
    similar_location: string | null;
    sales_diretor: string | null;
    seo_slug: string | null;
    seo_title: string | null;
    seo_keywork: string | null;
    seo_description: string | null;
    featured: number | null;
    status: number;
}

export interface CommunityWithRelations extends Community {
    city_name?: string;
    city_slug?: string;
    state_name?: string;
    country_name?: string;
    property_count?: number;
    top_community_names?: string[];
    top_projects_names?: string[];
    featured_project_names?: string[];
    related_blog_names?: string[];
    properties_details?: any[];
    similar_location_names?: string[];
    image_variations?: string[];
    image_url?: string;
}

export interface CommunityFilters {
    city_id?: number;
    state_id?: number;
    country_id?: number;
    status?: number;
    featured?: boolean;
    keyword?: string;
    sort_by?: 'name_asc' | 'name_desc' | 'featured_desc' | 'newest' | 'oldest';
    page?: number;
    limit?: number;
}

function parseCommaIds(ids: string | null): number[] {
    if (!ids) return [];
    return ids
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));
}

function buildCommunityImageSet(params: {
    img: string | null;
    extraRawPaths?: Array<string | null | undefined>;
}) {
    const { img, extraRawPaths = [] } = params;

    const imageUrls = getCommunityImageUrl(img, undefined);
    const variations = getCommunityImageVariations(img);

    let featured = imageUrls[0] || getNoImageUrl();

    if (featured.includes('no-image')) {
        for (const extra of extraRawPaths) {
            if (extra) {
                const extraUrls = getCommunityImageUrl(extra, undefined);
                if (extraUrls[0] && !extraUrls[0].includes('no-image')) {
                    featured = extraUrls[0];
                    break;
                }
            }
        }
    }

    const allVariations = [...variations];
    for (const extra of extraRawPaths) {
        if (extra) {
            const extraVariations = getCommunityImageVariations(extra);
            for (const v of extraVariations) {
                if (!allVariations.includes(v) && !v.includes('no-image')) {
                    allVariations.push(v);
                }
            }
        }
    }

    if (allVariations.length === 0 || allVariations.every(v => v.includes('no-image'))) {
        allVariations.push(getNoImageUrl());
    }

    return {
        featured,
        variations: allVariations,
        candidates: allVariations,
        image_url: featured,
        image_variations: allVariations,
    };
}

function transformCommunity(row: any): CommunityWithRelations {
    const imageSet = buildCommunityImageSet({
        img: row.img as string | null,
        extraRawPaths: [
            row.featured_image,
            row.image,
            row.cover_image,
        ],
    });

    return {
        id: row.id,
        community_id: row.community_id,
        name: row.name,
        country_id: row.country_id,
        state_id: row.state_id,
        city_id: row.city_id,
        slug: row.slug,
        latitude: row.latitude,
        longitude: row.longitude,
        img: row.img,
        school_img: row.school_img,
        hotel_img: row.hotel_img,
        hospital_img: row.hospital_img,
        train_img: row.train_img,
        bus_img: row.bus_img,
        description: row.description,
        top_community: row.top_community,
        top_projects: row.top_projects,
        featured_project: row.featured_project,
        related_blog: row.related_blog,
        properties: row.properties,
        similar_location: row.similar_location,
        sales_diretor: row.sales_diretor,
        seo_slug: row.seo_slug,
        seo_title: row.seo_title,
        seo_keywork: row.seo_keywork,
        seo_description: row.seo_description,
        featured: row.featured,
        status: row.status,
        city_name: row.city_name || null,
        city_slug: row.city_slug || null,
        state_name: row.state_name || null,
        country_name: row.country_name || null,
        property_count: row.property_count || 0,
        image_url: imageSet.image_url,
        image_variations: imageSet.image_variations,
    };
}

export async function getCommunities(filters: CommunityFilters = {}) {
    const {
        city_id,
        state_id,
        country_id,
        status = 1,
        featured,
        keyword,
        sort_by = 'featured_desc',
        page = 1,
        limit = 20,
    } = filters;

    const knex = await db();

    const query = knex('community as c')
        .leftJoin('cities as ci', 'c.city_id', 'ci.id')
        .leftJoin('state as s', 'c.state_id', 's.id')
        .leftJoin('country as co', 'c.country_id', 'co.id');

    if (status !== undefined && status !== null) {
        query.where('c.status', status);
    }

    if (city_id) {
        query.where('c.city_id', city_id);
    }

    if (state_id) {
        query.where('c.state_id', state_id);
    }

    if (country_id) {
        query.where('c.country_id', country_id);
    }

    if (featured !== undefined) {
        query.where('c.featured', featured ? 1 : 0);
    }

    if (keyword) {
        query.where(function (this: any) {
            this.where('c.name', 'like', `%${keyword}%`)
                .orWhere('c.description', 'like', `%${keyword}%`)
                .orWhere('c.seo_keywork', 'like', `%${keyword}%`)
                .orWhere('c.seo_title', 'like', `%${keyword}%`);
        });
    }

    switch (sort_by) {
        case 'name_asc':
            query.orderBy('c.name', 'asc');
            break;
        case 'name_desc':
            query.orderBy('c.name', 'desc');
            break;
        case 'featured_desc':
            query.orderBy('c.featured', 'desc').orderBy('c.name', 'asc');
            break;
        case 'newest':
            query.orderBy('c.id', 'desc');
            break;
        case 'oldest':
            query.orderBy('c.id', 'asc');
            break;
        default:
            query.orderBy('c.featured', 'desc').orderBy('c.name', 'asc');
    }

    const countQuery = query.clone();
    const [{ total }] = await countQuery.count('* as total');

    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);

    const communities = await query.select(
        'c.id',
        'c.community_id',
        'c.name',
        'c.country_id',
        'c.state_id',
        'c.city_id',
        'c.slug',
        'c.latitude',
        'c.longitude',
        'c.img',
        'c.school_img',
        'c.hotel_img',
        'c.hospital_img',
        'c.train_img',
        'c.bus_img',
        'c.description',
        'c.top_community',
        'c.top_projects',
        'c.featured_project',
        'c.related_blog',
        'c.properties',
        'c.similar_location',
        'c.sales_diretor',
        'c.seo_slug',
        'c.seo_title',
        'c.seo_keywork',
        'c.seo_description',
        'c.featured',
        'c.status',
        'ci.name as city_name',
        'ci.slug as city_slug',
        's.name as state_name',
        'co.name as country_name'
    );

    const communityIds = communities.map((c: any) => c.id);

    if (communityIds.length > 0) {
        const propertyCounts = await knex('properties')
            .whereIn('community_id', communityIds)
            .where('status', 5)
            .select('community_id')
            .count('* as count')
            .groupBy('community_id');

        const countMap = new Map();
        propertyCounts.forEach((pc: any) => {
            countMap.set(pc.community_id, Number(pc.count));
        });

        communities.forEach((c: any) => {
            c.property_count = countMap.get(c.id) || 0;
        });
    }

    const transformed = communities.map(transformCommunity);

    return {
        data: transformed,
        meta: {
            total: Number(total),
            page,
            limit,
            totalPages: Math.ceil(Number(total) / limit),
        },
    };
}

export async function getCommunityBySlug(slug: string): Promise<CommunityWithRelations | null> {
    try {
        const knex = await db();

        const community = await knex('community as c')
            .leftJoin('cities as ci', 'c.city_id', 'ci.id')
            .leftJoin('state as s', 'c.state_id', 's.id')
            .leftJoin('country as co', 'c.country_id', 'co.id')
            .where('c.slug', slug)
            .orWhere('c.seo_slug', slug)
            .first()
            .select(
                'c.*',
                'ci.name as city_name',
                'ci.slug as city_slug',
                's.name as state_name',
                'co.name as country_name'
            );

        if (!community) return null;

        const propertyCount = await knex('properties')
            .where('community_id', community.id)
            .where('status', 5)
            .count('* as count')
            .first();

        community.property_count = Number(propertyCount?.count || 0);

        const topCommunityIds = parseCommaIds(community.top_community);
        const topProjectIds = parseCommaIds(community.top_projects);
        const featuredProjectIds = parseCommaIds(community.featured_project);
        const relatedBlogIds = parseCommaIds(community.related_blog);
        const propertyIds = parseCommaIds(community.properties);
        const similarLocationIds = parseCommaIds(community.similar_location);

        if (topCommunityIds.length > 0) {
            const topCommunities = await knex('community')
                .whereIn('id', topCommunityIds)
                .where('status', 1)
                .select('id', 'name', 'slug', 'img');
            community.top_community_names = topCommunities.map((tc: any) => tc.name);
        }

        if (topProjectIds.length > 0) {
            const topProjects = await knex('project_listing')
                .whereIn('id', topProjectIds)
                .select('id', 'ProjectName as name', 'Url as slug');
            community.top_projects_names = topProjects.map((tp: any) => tp.name);
        }

        if (featuredProjectIds.length > 0) {
            const featuredProjects = await knex('project_listing')
                .whereIn('id', featuredProjectIds)
                .select('id', 'ProjectName as name', 'Url as slug');
            community.featured_project_names = featuredProjects.map((fp: any) => fp.name);
        }

        if (propertyIds.length > 0) {
            const properties = await knex('properties')
                .whereIn('id', propertyIds)
                .where('status', 5)
                .select('id', 'property_name', 'property_slug', 'price', 'bedroom', 'bathrooms', 'area');
            community.properties_details = properties;
        }

        if (similarLocationIds.length > 0) {
            const similarLocations = await knex('community')
                .whereIn('id', similarLocationIds)
                .where('status', 1)
                .select('id', 'name', 'slug', 'img');
            community.similar_location_names = similarLocations.map((sl: any) => sl.name);
        }

        return transformCommunity(community);
    } catch (error) {
        console.error('getCommunityBySlug error:', error);
        throw error;
    }
}

export async function getCommunityById(id: number): Promise<CommunityWithRelations | null> {
    const knex = await db();
    const community = await knex('community')
        .where('id', id)
        .first()
        .select('slug');

    if (!community) return null;
    return getCommunityBySlug(community.slug);
}

export async function getFeaturedCommunities(limit: number = 10) {
    return getCommunities({
        featured: true,
        status: 1,
        sort_by: 'featured_desc',
        limit,
    });
}

export async function getCommunitiesByCity(cityId: number, limit: number = 20) {
    return getCommunities({
        city_id: cityId,
        status: 1,
        sort_by: 'name_asc',
        limit,
    });
}

export async function getCommunitiesWithProperties(filters: CommunityFilters = {}) {
    const result = await getCommunities(filters);

    const communitiesWithProps = await Promise.all(
        result.data.map(async (community) => {
            const knex = await db();
            const properties = await knex('properties')
                .where('community_id', community.id)
                .where('status', 5)
                .select('id', 'property_name', 'property_slug', 'price', 'bedroom', 'bathrooms', 'area')
                .limit(6);

            return {
                ...community,
                properties: properties,
            };
        })
    );

    return {
        ...result,
        data: communitiesWithProps,
    };
}

export async function getCommunityStatistics() {
    const knex = await db();

    const [
        totalResult,
        activeResult,
        featuredResult,
        cityStats,
        propertyStats,
    ] = await Promise.all([
        knex('community').count('* as total').first(),
        knex('community').where('status', 1).count('* as active').first(),
        knex('community').where('featured', 1).where('status', 1).count('* as featured').first(),
        knex('community')
            .where('status', 1)
            .select('city_id')
            .count('* as count')
            .groupBy('city_id')
            .orderBy('count', 'desc'),
        knex('properties')
            .where('status', 5)
            .select('community_id')
            .count('* as count')
            .groupBy('community_id'),
    ]);

    return {
        total: Number(totalResult?.total || 0),
        active: Number(activeResult?.active || 0),
        inactive: Number(totalResult?.total || 0) - Number(activeResult?.active || 0),
        featured: Number(featuredResult?.featured || 0),
        by_city: cityStats || [],
        communities_with_properties: propertyStats?.length || 0,
    };
}

export async function createCommunity(data: Partial<Community>): Promise<CommunityWithRelations> {
    const knex = await db();

    if (!data.slug && data.name) {
        data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    if (data.slug) {
        const existing = await knex('community')
            .where('slug', data.slug)
            .first()
            .select('id');

        if (existing) {
            data.slug = `${data.slug}-${Date.now()}`;
        }
    }

    const [id] = await knex('community').insert({
        ...data,
        status: data.status || 1,
        featured: data.featured || 0,
        hotel_img: data.hotel_img || 'hotal.png',
    });

    const community = await getCommunityById(id);
    if (!community) throw new Error('Failed to create community');
    return community;
}

export async function updateCommunityBySlug(slug: string, data: Partial<Community>): Promise<CommunityWithRelations> {
    const knex = await db();

    const existing = await knex('community')
        .where('slug', slug)
        .first()
        .select('id');

    if (!existing) {
        throw new Error('Community not found');
    }

    if (data.name && !data.slug) {
        data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    await knex('community')
        .where('slug', slug)
        .update({
            ...data,
            updated_at: new Date(),
        });

    const community = await getCommunityBySlug(data.slug || slug);
    if (!community) throw new Error('Community not found');
    return community;
}

export async function deleteCommunityBySlug(slug: string): Promise<{ slug: string; deleted: boolean }> {
    const knex = await db();
    await knex('community')
        .where('slug', slug)
        .update({ status: 0 });
    return { slug, deleted: true };
}

export async function permanentDeleteCommunityBySlug(slug: string): Promise<{ slug: string; deleted: boolean }> {
    const knex = await db();
    await knex('community').where('slug', slug).delete();
    return { slug, deleted: true };
}

export async function restoreCommunityBySlug(slug: string): Promise<CommunityWithRelations> {
    const knex = await db();
    await knex('community')
        .where('slug', slug)
        .update({ status: 1 });
    const community = await getCommunityBySlug(slug);
    if (!community) throw new Error('Community not found');
    return community;
}

export async function getCommunitySearchFilters() {
    const knex = await db();

    const [cities, countries, states] = await Promise.all([
        knex('cities')
            .where('status', '1')
            .select('id', 'name', 'slug'),
        knex('country')
            .select('id', 'name'),
        knex('state')
            .select('id', 'name'),
    ]);

    return {
        cities,
        countries,
        states,
        media_base_url: UPLOAD_BASE_URL,
    };
}

export async function getCommunitiesPaginated(page: number = 1, limit: number = 20, search: string = '', filters: any = {}) {
    return getCommunities({
        keyword: search || undefined,
        status: filters.status ?? 1,
        city_id: filters.city_id,
        state_id: filters.state_id,
        country_id: filters.country_id,
        featured: filters.featured,
        page,
        limit,
    });
}