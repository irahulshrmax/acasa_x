// models/developer.ts
import { db } from '@/lib/database';
import {
    getDeveloperImageUrl,
    getDeveloperImageVariations,
    getDeveloperImageCandidates,
    UPLOAD_BASE_URL,
} from '@/lib/image-resolver';

export interface Developer {
    id: number;
    name: string | null;
    year_established: string | null;
    country: string | null;
    website: string | null;
    responsible_agent: string | null;
    ceo_name: string | null;
    email: string | null;
    mobile: string | null;
    address: string | null;
    image: string | null;
    total_project: string | null;
    total_project_withus: string | null;
    total_url: string | null;
    informations: string | null;
    seo_slug: string | null;
    seo_title: string | null;
    seo_keywork: string | null;
    seo_description: string | null;
    created_at: Date | null;
    updated_at: Date | null;
    status: number;
}

export interface DeveloperWithRelations extends Developer {
    project_count?: number;
    property_count?: number;
    image_url?: string;
    image_variations?: string[];
    image_candidates?: string[];
    upload_base_url?: string;
    projects?: any[];
    properties?: any[];
}

export interface DeveloperFilters {
    status?: number;
    keyword?: string;
    sort_by?: 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'project_count';
    page?: number;
    limit?: number;
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────

function toNumber(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    return typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
}

function transformDeveloper(row: any): DeveloperWithRelations {
    // Get primary image URL with proper extension
    const imageUrl = getDeveloperImageUrl(row.image);
    
    // Get all image variations (thumbnails, sizes, etc.)
    const variations = getDeveloperImageVariations(row.image);
    
    // Get all possible image candidates for fallback
    const candidates = getDeveloperImageCandidates(row.image);

    return {
        id: row.id,
        name: row.name,
        year_established: row.year_established,
        country: row.country,
        website: row.website,
        responsible_agent: row.responsible_agent,
        ceo_name: row.ceo_name,
        email: row.email,
        mobile: row.mobile,
        address: row.address,
        image: row.image,
        total_project: row.total_project,
        total_project_withus: row.total_project_withus,
        total_url: row.total_url,
        informations: row.informations,
        seo_slug: row.seo_slug,
        seo_title: row.seo_title,
        seo_keywork: row.seo_keywork,
        seo_description: row.seo_description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status: row.status,
        project_count: row.project_count || 0,
        property_count: row.property_count || 0,
        image_url: imageUrl,
        image_variations: variations,
        image_candidates: candidates,
        upload_base_url: UPLOAD_BASE_URL,
    };
}

// ─── BASE QUERY BUILDER ──────────────────────────────────────────────

function buildBaseQuery(knex: any, filters: DeveloperFilters = {}) {
    const { status = 1, keyword } = filters;
    
    const query = knex('internationaldevelopers as d');

    // Status filter
    if (status !== undefined && status !== null) {
        query.where('d.status', status);
    }

    // Keyword search
    if (keyword?.trim()) {
        const searchTerm = `%${keyword.trim()}%`;
        query.where(function (this: any) {
            this.where('d.name', 'like', searchTerm)
                .orWhere('d.informations', 'like', searchTerm)
                .orWhere('d.seo_keywork', 'like', searchTerm)
                .orWhere('d.ceo_name', 'like', searchTerm)
                .orWhere('d.country', 'like', searchTerm);
        });
    }

    return query;
}

function applySorting(query: any, sort_by: string = 'name_asc') {
    switch (sort_by) {
        case 'name_asc':
            query.orderBy('d.name', 'asc');
            break;
        case 'name_desc':
            query.orderBy('d.name', 'desc');
            break;
        case 'newest':
            query.orderBy('d.created_at', 'desc');
            break;
        case 'oldest':
            query.orderBy('d.created_at', 'asc');
            break;
        case 'project_count':
            query.orderBy('d.total_project', 'desc');
            break;
        default:
            query.orderBy('d.name', 'asc');
    }
    return query;
}

async function getDeveloperCounts(knex: any, developerIds: number[]) {
    if (!developerIds.length) {
        return { projectMap: new Map(), propertyMap: new Map() };
    }

    const [projectCounts, propertyCounts] = await Promise.all([
        knex('project_listing')
            .whereIn('developer_id', developerIds)
            .where('status', 1)
            .select('developer_id')
            .count('* as count')
            .groupBy('developer_id'),
        knex('properties')
            .whereIn('developer_id', developerIds)
            .where('status', 5)
            .select('developer_id')
            .count('* as count')
            .groupBy('developer_id'),
    ]);

    const projectMap = new Map<number, number>();
    projectCounts.forEach((pc: any) => {
        projectMap.set(pc.developer_id, toNumber(pc.count));
    });

    const propertyMap = new Map<number, number>();
    propertyCounts.forEach((pc: any) => {
        propertyMap.set(pc.developer_id, toNumber(pc.count));
    });

    return { projectMap, propertyMap };
}

// ─── GET INTERNATIONAL DEVELOPERS ─────────────────────────────────────

export async function getDevelopers(filters: DeveloperFilters = {}) {
    const {
        status = 1,
        keyword,
        sort_by = 'name_asc',
        page = 1,
        limit = 20,
    } = filters;

    const knex = await db();
    const query = buildBaseQuery(knex, { status, keyword });
    applySorting(query, sort_by);

    // Count total
    const countQuery = query.clone();
    const [{ total }] = await countQuery.count('* as total');

    // Apply pagination
    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);

    // Select fields
    const developers = await query.select(
        'd.id',
        'd.name',
        'd.year_established',
        'd.country',
        'd.website',
        'd.responsible_agent',
        'd.ceo_name',
        'd.email',
        'd.mobile',
        'd.address',
        'd.image',
        'd.total_project',
        'd.total_project_withus',
        'd.total_url',
        'd.informations',
        'd.seo_slug',
        'd.seo_title',
        'd.seo_keywork',
        'd.seo_description',
        'd.created_at',
        'd.updated_at',
        'd.status'
    );

    // Get counts for developers
    const developerIds = developers.map((d: any) => d.id);
    const { projectMap, propertyMap } = await getDeveloperCounts(knex, developerIds);

    // Attach counts to developers
    developers.forEach((d: any) => {
        d.project_count = projectMap.get(d.id) || 0;
        d.property_count = propertyMap.get(d.id) || 0;
    });

    const transformed = developers.map(transformDeveloper);

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

// ─── GET INTERNATIONAL DEVELOPER BY ID ──────────────────────────────

export async function getDeveloperById(id: number): Promise<DeveloperWithRelations | null> {
    try {
        const knex = await db();

        const developer = await knex('internationaldevelopers as d')
            .where('d.id', id)
            .first()
            .select(
                'd.id',
                'd.name',
                'd.year_established',
                'd.country',
                'd.website',
                'd.responsible_agent',
                'd.ceo_name',
                'd.email',
                'd.mobile',
                'd.address',
                'd.image',
                'd.total_project',
                'd.total_project_withus',
                'd.total_url',
                'd.informations',
                'd.seo_slug',
                'd.seo_title',
                'd.seo_keywork',
                'd.seo_description',
                'd.created_at',
                'd.updated_at',
                'd.status'
            );

        if (!developer) return null;

        // Get counts and related data
        const [projectCount, propertyCount, projects, properties] = await Promise.all([
            knex('project_listing')
                .where('developer_id', developer.id)
                .where('status', 1)
                .count('* as count')
                .first(),
            knex('properties')
                .where('developer_id', developer.id)
                .where('status', 5)
                .count('* as count')
                .first(),
            knex('project_listing')
                .where('developer_id', developer.id)
                .where('status', 1)
                .select('id', 'ProjectName as name', 'project_slug as slug', 'featured_image', 'price')
                .limit(10),
            knex('properties')
                .where('developer_id', developer.id)
                .where('status', 5)
                .select('id', 'property_name as name', 'property_slug as slug', 'featured_image', 'price')
                .limit(10),
        ]);

        developer.project_count = toNumber(projectCount?.count);
        developer.property_count = toNumber(propertyCount?.count);
        developer.projects = projects;
        developer.properties = properties;

        return transformDeveloper(developer);
    } catch (error) {
        console.error('getDeveloperById error:', error);
        throw error;
    }
}

// ─── GET INTERNATIONAL DEVELOPER BY SLUG ─────────────────────────────

export async function getDeveloperBySlug(slug: string): Promise<DeveloperWithRelations | null> {
    try {
        const knex = await db();
        const id = parseInt(slug, 10);

        if (!isNaN(id)) {
            return getDeveloperById(id);
        }

        const developer = await knex('internationaldevelopers')
            .where('name', 'like', `%${slug}%`)
            .orWhere('seo_title', 'like', `%${slug}%`)
            .orWhere('seo_slug', 'like', `%${slug}%`)
            .first()
            .select('id');

        if (!developer) return null;
        return getDeveloperById(developer.id);
    } catch (error) {
        console.error('getDeveloperBySlug error:', error);
        throw error;
    }
}

// ─── GET FEATURED INTERNATIONAL DEVELOPERS ────────────────────────────

export async function getFeaturedDevelopers(limit: number = 6) {
    return getDevelopers({
        status: 1,
        sort_by: 'project_count',
        limit,
    });
}

// ─── GET INTERNATIONAL DEVELOPER STATISTICS ───────────────────────────

export async function getDeveloperStatistics() {
    const knex = await db();

    const [totalResult, activeResult, projectStats, propertyStats] = await Promise.all([
        knex('internationaldevelopers').count('* as total').first(),
        knex('internationaldevelopers').where('status', 1).count('* as active').first(),
        knex('project_listing')
            .where('status', 1)
            .select('developer_id')
            .count('* as count')
            .groupBy('developer_id'),
        knex('properties')
            .where('status', 5)
            .select('developer_id')
            .count('* as count')
            .groupBy('developer_id'),
    ]);

    const total = toNumber(totalResult?.total);
    const active = toNumber(activeResult?.active);

    return {
        total,
        active,
        inactive: total - active,
        developers_with_projects: projectStats?.length || 0,
        developers_with_properties: propertyStats?.length || 0,
    };
}

// ─── CREATE INTERNATIONAL DEVELOPER ──────────────────────────────────

export async function createDeveloper(data: Partial<Developer>): Promise<DeveloperWithRelations> {
    const knex = await db();

    const [id] = await knex('internationaldevelopers').insert({
        ...data,
        status: data.status ?? 1,
        created_at: new Date(),
        updated_at: new Date(),
    });

    const developer = await getDeveloperById(id);
    if (!developer) throw new Error('Failed to create developer');
    return developer;
}

// ─── UPDATE INTERNATIONAL DEVELOPER ──────────────────────────────────

export async function updateDeveloperById(
    id: number,
    data: Partial<Developer>
): Promise<DeveloperWithRelations> {
    const knex = await db();

    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) {
        throw new Error('Developer not found');
    }

    await knex('internationaldevelopers')
        .where('id', id)
        .update({
            ...data,
            updated_at: new Date(),
        });

    const developer = await getDeveloperById(id);
    if (!developer) throw new Error('Developer not found');
    return developer;
}

// ─── DELETE INTERNATIONAL DEVELOPER (Soft Delete) ────────────────────

export async function deleteDeveloperById(id: number): Promise<{ id: number; deleted: boolean }> {
    const knex = await db();
    
    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) {
        throw new Error('Developer not found');
    }

    await knex('internationaldevelopers')
        .where('id', id)
        .update({ status: 0 });
    
    return { id, deleted: true };
}

// ─── PERMANENT DELETE INTERNATIONAL DEVELOPER ────────────────────────

export async function permanentDeleteDeveloperById(
    id: number
): Promise<{ id: number; deleted: boolean }> {
    const knex = await db();
    
    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) {
        throw new Error('Developer not found');
    }

    await knex('internationaldevelopers').where('id', id).delete();
    return { id, deleted: true };
}

// ─── RESTORE INTERNATIONAL DEVELOPER ──────────────────────────────────

export async function restoreDeveloperById(id: number): Promise<DeveloperWithRelations> {
    const knex = await db();
    
    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id', 'status');

    if (!existing) {
        throw new Error('Developer not found');
    }

    await knex('internationaldevelopers')
        .where('id', id)
        .update({ status: 1 });
    
    const developer = await getDeveloperById(id);
    if (!developer) throw new Error('Developer not found');
    return developer;
}