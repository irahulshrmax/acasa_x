// app/api/v1/developers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import {
    getDeveloperImageUrl,
    getDeveloperImageThumb,
} from '@/lib/image-resolver';

// ─── TYPES ──────────────────────────────────────────────────────────────

interface Developer {
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
    project_count?: number;
    property_count?: number;
    image_url?: string | null;
    image_thumb?: string | null;
}

interface ApiResponse {
    success: boolean;
    data: Developer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
        sortBy: string;
    };
    message?: string;
    error?: string;
    timestamp?: string;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────

const VALID_SORT_FIELDS = [
    'name_asc',
    'name_desc',
    'newest',
    'oldest',
    'project_count',
    'property_count',
];
const VALID_STATUS = [0, 1];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

// ─── HELPERS ──────────────────────────────────────────────────────────

function toNumber(value: any): number {
    if (value === undefined || value === null) return 0;
    return typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
}

function formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    try {
        return new Date(date).toISOString();
    } catch {
        return null;
    }
}

function truncateText(
    text: string | null,
    length: number = 200
): string | null {
    if (!text) return null;
    // Remove HTML tags first
    const plain = text.replace(/<[^>]*>/g, '').trim();
    return plain.length > length ? plain.substring(0, length) + '...' : plain;
}

// ✅ FIXED: Ab getDeveloperImageUrl aur getDeveloperImageThumb use ho raha hai
// jo extension properly add karta hai
function applyDeveloperImage(developer: any): any {
    if (!developer) return developer;

    developer.image_url = getDeveloperImageUrl(developer.image);
    developer.image_thumb = getDeveloperImageThumb(developer.image);

    return developer;
}

function sanitizeDeveloper(developer: any): any {
    const sanitized = { ...developer };

    // Remove sensitive/internal fields
    delete sanitized.admin_notes;
    delete sanitized.internal_rating;
    delete sanitized.sales_agent;

    // Truncate long descriptions for listing
    if (sanitized.informations) {
        sanitized.informations = truncateText(sanitized.informations, 200);
    }

    // Format dates
    sanitized.created_at = formatDate(sanitized.created_at);
    sanitized.updated_at = formatDate(sanitized.updated_at);

    return sanitized;
}

// ─── VALIDATION ────────────────────────────────────────────────────────

function validateParams(searchParams: URLSearchParams) {
    const page = Math.max(
        1,
        parseInt(searchParams.get('page') || '1')
    );
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)))
    );
    const status = parseInt(searchParams.get('status') || '1');
    const keyword = searchParams.get('keyword')?.trim() || undefined;
    const sortBy = searchParams.get('sort_by') || 'name_asc';
    const country = searchParams.get('country')?.trim() || undefined;
    const showAll = searchParams.get('show_all') === 'true';
    const hasProjects = searchParams.get('has_projects') === 'true';
    const hasProperties = searchParams.get('has_properties') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const stats = searchParams.get('stats') === 'true';

    // Validate
    const validSort = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'name_asc';
    const validStatus = VALID_STATUS.includes(status) ? status : 1;

    return {
        page,
        limit,
        status: validStatus,
        keyword,
        sortBy: validSort,
        country,
        showAll,
        hasProjects,
        hasProperties,
        featured,
        stats,
    };
}

// ─── GET DEVELOPERS WITH COUNTS ──────────────────────────────────────

async function getDevelopersWithCounts(knex: any, developerIds: number[]) {
    if (!developerIds.length) {
        return {
            projectMap: new Map<number, number>(),
            propertyMap: new Map<number, number>(),
        };
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

// ─── GET STATISTICS ────────────────────────────────────────────────────

async function getDeveloperStats() {
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
            .limit(5),
    ]);

    const total = toNumber(totalResult?.total);
    const active = toNumber(activeResult?.active);

    return {
        total,
        active,
        inactive: total - active,
        developers_with_projects: projectStats?.length || 0,
        developers_with_properties: propertyStats?.length || 0,
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
        top_countries: (countryStats || []).map((c: any) => ({
            country: c.country || 'Unknown',
            count: toNumber(c.count),
        })),
    };
}

// ─── GET FEATURED DEVELOPERS ──────────────────────────────────────────

async function getFeaturedDevelopers(limit: number = 6) {
    const knex = await db();

    const developers = await knex('internationaldevelopers as d')
        .where('d.status', 1)
        .orderBy('d.total_project', 'desc')
        .limit(limit)
        .select(DEVELOPER_SELECT_FIELDS);

    const developerIds = developers.map((d: any) => d.id);
    const { projectMap, propertyMap } = await getDevelopersWithCounts(
        knex,
        developerIds
    );

    return developers.map((d: any) => {
        const projectCount = projectMap.get(d.id) || 0;
        const propertyCount = propertyMap.get(d.id) || 0;

        // ✅ applyDeveloperImage use karo — extension sahi aayegi
        return sanitizeDeveloper(
            applyDeveloperImage({
                ...d,
                project_count: projectCount,
                property_count: propertyCount,
            })
        );
    });
}

// ─── GET ALL DEVELOPERS ────────────────────────────────────────────────

async function getAllDevelopers(params: ReturnType<typeof validateParams>) {
    const {
        page,
        limit,
        status,
        keyword,
        sortBy,
        country,
        showAll,
        hasProjects,
        hasProperties,
    } = params;

    const knex = await db();
    const query = knex('internationaldevelopers as d');

    // ─── Filters ───────────────────────────────────────────────
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
                .orWhere('d.mobile', 'like', searchTerm)
                .orWhere('d.seo_title', 'like', searchTerm);
        });
    }

    // ─── Count Total ───────────────────────────────────────────
    const countQuery = query.clone();
    const [{ total }] = await countQuery.count('* as total');

    // ─── Sorting ───────────────────────────────────────────────
    switch (sortBy) {
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

    // ─── Pagination ────────────────────────────────────────────
    const offset = (page - 1) * limit;
    if (!showAll) {
        query.limit(limit).offset(offset);
    }

    // ─── Execute ───────────────────────────────────────────────
    const developers = await query.select(DEVELOPER_SELECT_FIELDS);

    // ─── Get Counts ────────────────────────────────────────────
    const developerIds = developers.map((d: any) => d.id);
    const { projectMap, propertyMap } = await getDevelopersWithCounts(
        knex,
        developerIds
    );

    // ─── Transform ─────────────────────────────────────────────
    let transformed = developers.map((d: any) => {
        const projectCount = projectMap.get(d.id) || 0;
        const propertyCount = propertyMap.get(d.id) || 0;

        // ✅ applyDeveloperImage use karo — extension sahi aayegi
        return sanitizeDeveloper(
            applyDeveloperImage({
                ...d,
                project_count: projectCount,
                property_count: propertyCount,
            })
        );
    });

    // ─── Filter by has_projects / has_properties ───────────────
    if (hasProjects) {
        transformed = transformed.filter((d: any) => d.project_count > 0);
    }
    if (hasProperties) {
        transformed = transformed.filter((d: any) => d.property_count > 0);
    }

    return {
        data: transformed,
        meta: {
            total: Number(total),
            page,
            limit: showAll ? Number(total) : limit,
            totalPages: showAll ? 1 : Math.ceil(Number(total) / limit),
            hasMore: showAll ? false : page * limit < Number(total),
            sortBy,
        },
    };
}

// ─── MAIN GET HANDLER ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const params = validateParams(searchParams);

        // ─── Handle Statistics ──────────────────────────────────
        if (params.stats) {
            const stats = await getDeveloperStats();
            return NextResponse.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            });
        }

        // ─── Handle Featured ────────────────────────────────────
        if (params.featured) {
            const developers = await getFeaturedDevelopers(params.limit);
            return NextResponse.json({
                success: true,
                data: developers,
                meta: {
                    total: developers.length,
                    page: 1,
                    limit: developers.length,
                    totalPages: 1,
                    hasMore: false,
                    sortBy: 'project_count',
                },
                timestamp: new Date().toISOString(),
            });
        }

        // ─── Handle All Developers ──────────────────────────────
        const result = await getAllDevelopers(params);

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching developers:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch developers',
                error:
                    process.env.NODE_ENV === 'development'
                        ? error.message
                        : 'Internal server error',
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0,
                    hasMore: false,
                    sortBy: 'name_asc',
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// ─── OPTIONS (CORS) ────────────────────────────────────────────────────

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}