// lib/models/developer.ts
import { db } from '@/lib/database';
import {
    getDeveloperImageUrl,
    getDeveloperImageVariations,
    getDeveloperImageCandidates,
    getDeveloperImageThumb,
    UPLOAD_BASE_URL,
} from '@/lib/image-resolver';

// ─── TYPES ──────────────────────────────────────────────────────────────

export interface InternationalDeveloper {
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

export interface DeveloperProject {
    id: number;
    name: string;
    slug: string;
    featured_image: string | null;
    price: string | null;
    location: string | null;
    property_type: string | null;
    status: number;
    bedrooms: string | null;
    bathrooms: string | null;
    area: string | null;
    developer_id: number;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface DeveloperProperty {
    id: number;
    name: string;
    slug: string;
    featured_image: string | null;
    price: number | null;
    location: string | null;
    property_type: string | null;
    status: number;
    bedrooms: string | null;
    bathrooms: string | null;
    area: string | null;
    developer_id: number;
    created_at: Date | null;
    updated_at: Date | null;
}

export interface DeveloperWithFullDetails extends InternationalDeveloper {
    // Stats
    project_count: number;
    property_count: number;
    total_properties_count: number;
    active_properties_count: number;
    inactive_properties_count: number;

    // Image
    image_url: string | null;
    image_thumb: string | null;        // ✅ Added
    image_variations: string[];
    image_candidates: string[];
    upload_base_url: string;

    // Related Data
    projects: DeveloperProject[];
    properties: DeveloperProperty[];
    featured_projects: DeveloperProject[];
    featured_properties: DeveloperProperty[];

    // SEO
    seo_data: {
        title: string | null;
        description: string | null;
        keywords: string | null;
        slug: string | null;
    };

    // Contact
    contact_info: {
        email: string | null;
        mobile: string | null;
        website: string | null;
        address: string | null;
        ceo_name: string | null;
        responsible_agent: string | null;
    };

    // Metadata
    meta: {
        established_years_ago: number | null;
        has_website: boolean;
        has_contact: boolean;
        has_social: boolean;
        is_active: boolean;
        completeness_score: number;
    };
}

export interface DeveloperFilters {
    status?: number;
    keyword?: string;
    country?: string;
    has_projects?: boolean;
    has_properties?: boolean;
    sort_by?: 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'project_count' | 'property_count';
    page?: number;
    limit?: number;
}

export interface DeveloperStats {
    total: number;
    active: number;
    inactive: number;
    developers_with_projects: number;
    developers_with_properties: number;
    top_countries: Array<{ country: string; count: number }>;
    total_projects: number;
    total_properties: number;
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────

function toNumber(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    return typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
}

function calculateCompleteness(developer: any): number {
    let score = 0;
    const fields = [
        developer.name,
        developer.informations,
        developer.image,
        developer.email,
        developer.mobile,
        developer.website,
        developer.address,
        developer.ceo_name,
        developer.year_established,
        developer.country,
        developer.seo_title,
        developer.seo_description,
    ];

    fields.forEach((field) => {
        if (
            field &&
            field !== '' &&
            field !== 'null' &&
            field !== 'NULL' &&
            field !== 'undefined'
        ) {
            score += 8.33;
        }
    });

    return Math.min(Math.round(score), 100);
}

function transformDeveloper(
    row: any,
    projects: any[] = [],
    properties: any[] = []
): DeveloperWithFullDetails {
    // ✅ Image URLs
    const imageUrl = getDeveloperImageUrl(row.image);
    const imageThumb = getDeveloperImageThumb(row.image);
    const variations = getDeveloperImageVariations(row.image);
    const candidates = getDeveloperImageCandidates(row.image);

    const establishedYear = row.year_established
        ? parseInt(row.year_established, 10)
        : null;
    const currentYear = new Date().getFullYear();

    const featuredProjects = projects
        .filter((p) => p.status === 1 && p.featured_image)
        .slice(0, 6);

    const featuredProperties = properties
        .filter((p) => p.status === 5 && p.featured_image)
        .slice(0, 6);

    const activeProps = properties.filter((p) => p.status === 5).length;
    const inactiveProps = properties.filter((p) => p.status !== 5).length;

    const hasWebsite = !!(row.website && row.website !== '');
    const hasContact = !!(row.email || row.mobile);

    return {
        // ─── Base Fields ───────────────────────────────────────────
        id: row.id,
        name: row.name,
        year_established: row.year_established,
        country: row.country || 'United Arab Emirates',
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

        // ─── Stats ─────────────────────────────────────────────────
        project_count: projects.length,
        property_count: properties.length,
        total_properties_count: properties.length,
        active_properties_count: activeProps,
        inactive_properties_count: inactiveProps,

        // ─── Image ─────────────────────────────────────────────────
        image_url: imageUrl,
        image_thumb: imageThumb,    // ✅ Fixed
        image_variations: variations,
        image_candidates: candidates,
        upload_base_url: UPLOAD_BASE_URL,

        // ─── Related Data ──────────────────────────────────────────
        projects: projects,
        properties: properties,
        featured_projects: featuredProjects,
        featured_properties: featuredProperties,

        // ─── SEO ───────────────────────────────────────────────────
        seo_data: {
            title: row.seo_title || row.name,
            description:
                row.seo_description ||
                (row.informations
                    ? row.informations.substring(0, 160)
                    : null),
            keywords: row.seo_keywork,
            slug: row.seo_slug || row.total_url,
        },

        // ─── Contact ───────────────────────────────────────────────
        contact_info: {
            email: row.email,
            mobile: row.mobile,
            website: row.website,
            address: row.address,
            ceo_name: row.ceo_name,
            responsible_agent: row.responsible_agent,
        },

        // ─── Meta ──────────────────────────────────────────────────
        meta: {
            established_years_ago: establishedYear
                ? currentYear - establishedYear
                : null,
            has_website: hasWebsite,
            has_contact: hasContact,
            has_social: false,
            is_active: row.status === 1,
            completeness_score: calculateCompleteness(row),
        },
    };
}

// ─── BASE QUERY BUILDER ──────────────────────────────────────────────

function buildBaseQuery(knex: any, filters: DeveloperFilters = {}) {
    const { status = 1, keyword, country } = filters;

    const query = knex('internationaldevelopers as d');

    if (status !== undefined && status !== null) {
        query.where('d.status', status);
    }

    if (country) {
        query.where('d.country', country);
    }

    if (keyword?.trim()) {
        const searchTerm = `%${keyword.trim()}%`;
        query.where(function (this: any) {
            this.where('d.name', 'like', searchTerm)
                .orWhere('d.informations', 'like', searchTerm)
                .orWhere('d.seo_keywork', 'like', searchTerm)
                .orWhere('d.ceo_name', 'like', searchTerm)
                .orWhere('d.country', 'like', searchTerm)
                .orWhere('d.email', 'like', searchTerm)
                .orWhere('d.mobile', 'like', searchTerm);
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
        case 'property_count':
            query.orderBy('d.total_project_withus', 'desc');
            break;
        default:
            query.orderBy('d.name', 'asc');
    }
    return query;
}

// ─── GET RELATED DATA ──────────────────────────────────────────────────

async function getDeveloperRelatedData(knex: any, developerIds: number[]) {
    if (!developerIds.length) {
        return { projectMap: new Map(), propertyMap: new Map() };
    }

    const [projects, properties] = await Promise.all([
        knex('project_listing')
            .whereIn('developer_id', developerIds)
            .select(
                'id',
                'developer_id',
                'ProjectName as name',
                'project_slug as slug',
                'featured_image',
                'price',
                'location',
                'property_type',
                'status',
                'bedrooms',
                'bathrooms',
                'area',
                'created_at',
                'updated_at'
            ),
        knex('properties')
            .whereIn('developer_id', developerIds)
            .whereNotNull('developer_id')
            .select(
                'id',
                'developer_id',
                'property_name as name',
                'property_slug as slug',
                'featured_image',
                'price',
                'location',
                'property_type',
                'status',
                'bedroom as bedrooms',
                'bathrooms',
                'area',
                'created_at',
                'updated_at'
            ),
    ]);

    const projectMap = new Map<number, any[]>();
    const propertyMap = new Map<number, any[]>();

    projects.forEach((p: any) => {
        const devId = p.developer_id;
        if (!projectMap.has(devId)) projectMap.set(devId, []);
        projectMap.get(devId)!.push(p);
    });

    properties.forEach((p: any) => {
        const devId = p.developer_id;
        if (!propertyMap.has(devId)) propertyMap.set(devId, []);
        propertyMap.get(devId)!.push(p);
    });

    return { projectMap, propertyMap };
}

// ─── SELECT FIELDS ─────────────────────────────────────────────────────

const DEVELOPER_SELECT_FIELDS = [
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
    'd.status',
];

// ─── GET ALL DEVELOPERS ─────────────────────────────────────────────────

export async function getInternationalDevelopers(
    filters: DeveloperFilters = {}
) {
    const {
        status = 1,
        keyword,
        country,
        sort_by = 'name_asc',
        page = 1,
        limit = 20,
        has_projects,
        has_properties,
    } = filters;

    const knex = await db();
    const query = buildBaseQuery(knex, { status, keyword, country });

    const countQuery = query.clone();
    const [{ total }] = await countQuery.count('* as total');

    applySorting(query, sort_by);

    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);

    const developers = await query.select(DEVELOPER_SELECT_FIELDS);

    const developerIds = developers.map((d: any) => d.id);
    const { projectMap, propertyMap } = await getDeveloperRelatedData(
        knex,
        developerIds
    );

    const transformed = developers
        .map((d: any) => {
            const projects = projectMap.get(d.id) || [];
            const properties = propertyMap.get(d.id) || [];

            if (has_projects && projects.length === 0) return null;
            if (has_properties && properties.length === 0) return null;

            return transformDeveloper(d, projects, properties);
        })
        .filter(Boolean);

    return {
        data: transformed,
        meta: {
            total: Number(total),
            page,
            limit,
            totalPages: Math.ceil(Number(total) / limit),
            has_more: page * limit < Number(total),
        },
    };
}

// ─── GET DEVELOPER BY ID ───────────────────────────────────────────────

export async function getInternationalDeveloperById(
    id: number
): Promise<DeveloperWithFullDetails | null> {
    try {
        const knex = await db();

        const developer = await knex('internationaldevelopers as d')
            .where('d.id', id)
            .first()
            .select(DEVELOPER_SELECT_FIELDS);

        if (!developer) return null;

        const { projectMap, propertyMap } = await getDeveloperRelatedData(
            knex,
            [developer.id]
        );

        const projects = projectMap.get(developer.id) || [];
        const properties = propertyMap.get(developer.id) || [];

        return transformDeveloper(developer, projects, properties);
    } catch (error) {
        console.error('getInternationalDeveloperById error:', error);
        throw error;
    }
}

// ─── GET DEVELOPER BY SLUG ─────────────────────────────────────────────

export async function getInternationalDeveloperBySlug(
    slug: string
): Promise<DeveloperWithFullDetails | null> {
    try {
        const knex = await db();
        const id = parseInt(slug, 10);

        if (!isNaN(id)) {
            return getInternationalDeveloperById(id);
        }

        const developer = await knex('internationaldevelopers')
            .where('seo_slug', slug)
            .orWhere('total_url', slug)
            .orWhere('name', 'like', `%${slug}%`)
            .orWhere('seo_title', 'like', `%${slug}%`)
            .first()
            .select('id');

        if (!developer) return null;
        return getInternationalDeveloperById(developer.id);
    } catch (error) {
        console.error('getInternationalDeveloperBySlug error:', error);
        throw error;
    }
}

// ─── GET FEATURED DEVELOPERS ────────────────────────────────────────────

export async function getFeaturedInternationalDevelopers(
    limit: number = 6
) {
    return getInternationalDevelopers({
        status: 1,
        sort_by: 'project_count',
        limit,
        has_projects: true,
    });
}

// ─── GET STATISTICS ─────────────────────────────────────────────────────

export async function getInternationalDeveloperStatistics(): Promise<DeveloperStats> {
    const knex = await db();

    const [
        totalResult,
        activeResult,
        projectStats,
        propertyStats,
        countryStats,
    ] = await Promise.all([
        knex('internationaldevelopers').count('* as total').first(),
        knex('internationaldevelopers')
            .where('status', 1)
            .count('* as active')
            .first(),
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
        knex('internationaldevelopers')
            .select('country')
            .count('* as count')
            .whereNotNull('country')
            .where('country', '!=', '')
            .groupBy('country')
            .orderBy('count', 'desc')
            .limit(10),
    ]);

    const total = toNumber(totalResult?.total);
    const active = toNumber(activeResult?.active);

    const typedCountryStats: { country: string; count: number }[] = (
        countryStats || []
    ).map((item: any) => ({
        country: String(item.country || 'Unknown'),
        count: toNumber(item.count),
    }));

    return {
        total,
        active,
        inactive: total - active,
        developers_with_projects: projectStats?.length || 0,
        developers_with_properties: propertyStats?.length || 0,
        top_countries: typedCountryStats,
        total_projects:
            projectStats?.reduce(
                (sum: number, p: any) => sum + toNumber(p.count),
                0
            ) || 0,
        total_properties:
            propertyStats?.reduce(
                (sum: number, p: any) => sum + toNumber(p.count),
                0
            ) || 0,
    };
}

// ─── GET DEVELOPERS BY COUNTRY ─────────────────────────────────────────

export async function getInternationalDevelopersByCountry(
    country: string,
    limit: number = 20
) {
    return getInternationalDevelopers({ country, status: 1, limit });
}

// ─── GET DEVELOPERS WITH PROJECTS ──────────────────────────────────────

export async function getInternationalDevelopersWithProjects(
    limit: number = 20
) {
    return getInternationalDevelopers({
        status: 1,
        has_projects: true,
        sort_by: 'project_count',
        limit,
    });
}

// ─── GET DEVELOPERS WITH PROPERTIES ────────────────────────────────────

export async function getInternationalDevelopersWithProperties(
    limit: number = 20
) {
    return getInternationalDevelopers({
        status: 1,
        has_properties: true,
        sort_by: 'property_count',
        limit,
    });
}

// ─── SEARCH DEVELOPERS ──────────────────────────────────────────────────

export async function searchInternationalDevelopers(
    keyword: string,
    limit: number = 20
) {
    return getInternationalDevelopers({ keyword, status: 1, limit });
}

// ─── CREATE DEVELOPER ──────────────────────────────────────────────────

export async function createInternationalDeveloper(
    data: Partial<InternationalDeveloper>
): Promise<DeveloperWithFullDetails> {
    const knex = await db();

    const [id] = await knex('internationaldevelopers').insert({
        ...data,
        status: data.status ?? 1,
        created_at: new Date(),
        updated_at: new Date(),
    });

    const developer = await getInternationalDeveloperById(id);
    if (!developer) throw new Error('Failed to create developer');
    return developer;
}

// ─── UPDATE DEVELOPER ──────────────────────────────────────────────────

export async function updateInternationalDeveloperById(
    id: number,
    data: Partial<InternationalDeveloper>
): Promise<DeveloperWithFullDetails> {
    const knex = await db();

    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) throw new Error('Developer not found');

    await knex('internationaldevelopers')
        .where('id', id)
        .update({ ...data, updated_at: new Date() });

    const developer = await getInternationalDeveloperById(id);
    if (!developer) throw new Error('Developer not found');
    return developer;
}

// ─── SOFT DELETE DEVELOPER ─────────────────────────────────────────────

export async function deleteInternationalDeveloperById(
    id: number
): Promise<{ id: number; deleted: boolean }> {
    const knex = await db();

    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) throw new Error('Developer not found');

    await knex('internationaldevelopers')
        .where('id', id)
        .update({ status: 0, updated_at: new Date() });

    return { id, deleted: true };
}

// ─── PERMANENT DELETE DEVELOPER ────────────────────────────────────────

export async function permanentDeleteInternationalDeveloperById(
    id: number
): Promise<{ id: number; deleted: boolean }> {
    const knex = await db();

    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id');

    if (!existing) throw new Error('Developer not found');

    const [projectCount, propertyCount] = await Promise.all([
        knex('project_listing')
            .where('developer_id', id)
            .count('* as count')
            .first(),
        knex('properties')
            .where('developer_id', id)
            .count('* as count')
            .first(),
    ]);

    const hasProjects = toNumber(projectCount?.count) > 0;
    const hasProperties = toNumber(propertyCount?.count) > 0;

    if (hasProjects || hasProperties) {
        throw new Error(
            `Cannot delete developer with ${hasProjects ? 'projects' : ''}${
                hasProjects && hasProperties ? ' and ' : ''
            }${hasProperties ? 'properties' : ''}. Archive first.`
        );
    }

    await knex('internationaldevelopers').where('id', id).delete();
    return { id, deleted: true };
}

// ─── RESTORE DEVELOPER ──────────────────────────────────────────────────

export async function restoreInternationalDeveloperById(
    id: number
): Promise<DeveloperWithFullDetails> {
    const knex = await db();

    const existing = await knex('internationaldevelopers')
        .where('id', id)
        .first()
        .select('id', 'status');

    if (!existing) throw new Error('Developer not found');

    await knex('internationaldevelopers')
        .where('id', id)
        .update({ status: 1, updated_at: new Date() });

    const developer = await getInternationalDeveloperById(id);
    if (!developer) throw new Error('Developer not found');
    return developer;
}

// ─── BULK OPERATIONS ────────────────────────────────────────────────────

export async function bulkUpdateDeveloperStatus(
    ids: number[],
    status: number
): Promise<{ updated: number }> {
    const knex = await db();

    if (!ids.length) return { updated: 0 };

    await knex('internationaldevelopers')
        .whereIn('id', ids)
        .update({ status, updated_at: new Date() });

    return { updated: ids.length };
}

export async function bulkDeleteDevelopers(
    ids: number[]
): Promise<{ deleted: number }> {
    const knex = await db();

    if (!ids.length) return { deleted: 0 };

    await knex('internationaldevelopers')
        .whereIn('id', ids)
        .update({ status: 0, updated_at: new Date() });

    return { deleted: ids.length };
}

// ─── SYNC DEVELOPER COUNTS ─────────────────────────────────────────────

export async function syncDeveloperCounts(): Promise<{ synced: number }> {
    const knex = await db();

    const developers = await knex('internationaldevelopers')
        .select('id', 'total_project', 'total_project_withus')
        .where('status', 1);

    let synced = 0;

    for (const developer of developers) {
        const [projectCount, propertyCount] = await Promise.all([
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
        ]);

        const totalProject = toNumber(projectCount?.count);
        const totalProperty = toNumber(propertyCount?.count);

        if (
            String(totalProject) !== developer.total_project ||
            String(totalProperty) !== developer.total_project_withus
        ) {
            await knex('internationaldevelopers')
                .where('id', developer.id)
                .update({
                    total_project: String(totalProject),
                    total_project_withus: String(totalProperty),
                    updated_at: new Date(),
                });
            synced++;
        }
    }

    return { synced };
}

// ─── EXPORT DEFAULT ─────────────────────────────────────────────────────

export default {
    getInternationalDevelopers,
    getInternationalDeveloperById,
    getInternationalDeveloperBySlug,
    getFeaturedInternationalDevelopers,
    getInternationalDeveloperStatistics,
    getInternationalDevelopersByCountry,
    getInternationalDevelopersWithProjects,
    getInternationalDevelopersWithProperties,
    searchInternationalDevelopers,
    createInternationalDeveloper,
    updateInternationalDeveloperById,
    deleteInternationalDeveloperById,
    permanentDeleteInternationalDeveloperById,
    restoreInternationalDeveloperById,
    bulkUpdateDeveloperStatus,
    bulkDeleteDevelopers,
    syncDeveloperCounts,
};