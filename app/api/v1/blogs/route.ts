// app/api/v1/blogs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    getBlogs,
    getFeaturedBlogs,
    getBlogCategories,
    getBlogStatistics,
    getBlogBySlug,
    getRelatedBlogs,
    createBlog,
} from '@/lib/models/blog';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.acasa.ae';

type SortBy = 
    | 'newest' 
    | 'oldest' 
    | 'popular' 
    | 'views' 
    | 'likes' 
    | 'comments' 
    | 'title_asc' 
    | 'title_desc';

const VALID_SORT: SortBy[] = [
    'newest', 
    'oldest', 
    'popular', 
    'views', 
    'likes', 
    'comments', 
    'title_asc', 
    'title_desc'
];

function safeParseInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}

function parseSortBy(value: string | null): SortBy {
    if (value && VALID_SORT.includes(value as SortBy)) {
        return value as SortBy;
    }
    return 'newest';
}

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(),
    });
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const featured = searchParams.get('featured') === 'true';
        const stats = searchParams.get('stats') === 'true';
        const categories = searchParams.get('categories') === 'true';
        const slug = searchParams.get('slug');

        const limit = Math.min(
            safeParseInt(searchParams.get('limit'), DEFAULT_LIMIT),
            MAX_LIMIT
        );
        const page = Math.max(1, safeParseInt(searchParams.get('page'), 1));

        const headers = {
            ...getCorsHeaders(),
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            'Content-Type': 'application/json',
        };

        if (stats) {
            try {
                const result = await getBlogStatistics();
                return NextResponse.json(
                    { success: true, data: result },
                    { headers }
                );
            } catch (statsError: any) {
                return NextResponse.json(
                    { success: false, message: 'Failed to fetch statistics' },
                    { status: 500, headers }
                );
            }
        }

        if (categories) {
            try {
                const result = await getBlogCategories();
                return NextResponse.json(
                    { success: true, data: Array.isArray(result) ? result : [] },
                    { headers }
                );
            } catch (categoriesError: any) {
                return NextResponse.json(
                    { success: false, message: 'Failed to fetch categories' },
                    { status: 500, headers }
                );
            }
        }

        if (slug) {
            const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (!cleanSlug) {
                return NextResponse.json(
                    { success: false, message: 'Invalid slug provided' },
                    { status: 400, headers }
                );
            }

            try {
                const blog = await getBlogBySlug(cleanSlug);
                if (!blog) {
                    return NextResponse.json(
                        { success: false, message: 'Blog not found' },
                        { status: 404, headers }
                    );
                }

                let related: any[] = [];
                try {
                    related = await getRelatedBlogs(cleanSlug, 3);
                } catch (relatedError) {
                    console.warn('⚠️ Related blogs fetch failed:', relatedError);
                }

                return NextResponse.json(
                    {
                        success: true,
                        data: { ...blog, related: related || [] },
                    },
                    { headers }
                );
            } catch (blogError: any) {
                return NextResponse.json(
                    { success: false, message: 'Failed to fetch blog' },
                    { status: 500, headers }
                );
            }
        }

        if (featured) {
            try {
                const result = await getFeaturedBlogs(limit);
                const blogs = Array.isArray(result) ? result : [];
                return NextResponse.json(
                    {
                        success: true,
                        data: blogs,
                        meta: {
                            total: blogs.length,
                            limit,
                            featured: true,
                            timestamp: new Date().toISOString(),
                        },
                    },
                    { headers }
                );
            } catch (featuredError: any) {
                return NextResponse.json(
                    { 
                        success: true, 
                        data: [],
                        meta: { total: 0, limit, featured: true, timestamp: new Date().toISOString() }
                    },
                    { status: 200, headers }
                );
            }
        }

        const rawStatus = searchParams.get('status');
        const status = safeParseInt(rawStatus, 1);
        const validStatus = [0, 1, 2].includes(status) ? status : 1;

        const filters = {
            category: searchParams.get('category') || undefined,
            status: validStatus,
            keyword: searchParams.get('keyword') || undefined,
            sort_by: parseSortBy(searchParams.get('sort_by')),
            page,
            limit,
            featured: featured || undefined,
            author: searchParams.get('author') || undefined,
            from_date: searchParams.get('from_date') || undefined,
            to_date: searchParams.get('to_date') || undefined,
        };

        try {
            const result = await getBlogs(filters);
            
            if (!result || !result.data || !Array.isArray(result.data)) {
                return NextResponse.json(
                    { 
                        success: true, 
                        data: [],
                        meta: { total: 0, page: 1, limit, totalPages: 0 }
                    },
                    { status: 200, headers }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    data: result.data,
                    meta: {
                        ...result.meta,
                        filters: {
                            category: filters.category || null,
                            status: filters.status,
                            keyword: filters.keyword || null,
                            sort_by: filters.sort_by,
                            featured: filters.featured || null,
                        },
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: 200, headers }
            );

        } catch (getBlogsError: any) {
            return NextResponse.json(
                { 
                    success: true, 
                    data: [],
                    meta: { total: 0, page: 1, limit, totalPages: 0 }
                },
                { status: 200, headers }
            );
        }

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch blogs',
                data: [],
                meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
            },
            { 
                status: 200,
                headers: {
                    ...getCorsHeaders(),
                    'Cache-Control': 'no-cache',
                }
            }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const errors: Record<string, string> = {};

        if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
            errors.title = 'Blog title is required (min 3 characters)';
        }

        if (!body.category || typeof body.category !== 'string' || body.category.trim().length < 2) {
            errors.category = 'Blog category is required';
        }

        if (!body.descriptions || typeof body.descriptions !== 'string' || body.descriptions.trim().length < 20) {
            errors.descriptions = 'Blog description is required (min 20 characters)';
        }

        if (Object.keys(errors).length > 0) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400, headers: getCorsHeaders() }
            );
        }

        if (!body.slug && body.title) {
            body.slug = body.title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        const blog = await createBlog(body);

        if (!blog) {
            throw new Error('Blog creation returned null');
        }

        return NextResponse.json(
            {
                success: true,
                data: blog,
                message: 'Blog created successfully',
                meta: { timestamp: new Date().toISOString() },
            },
            { 
                status: 201, 
                headers: getCorsHeaders() 
            }
        );

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create blog',
            },
            { 
                status: 500, 
                headers: getCorsHeaders() 
            }
        );
    }
}