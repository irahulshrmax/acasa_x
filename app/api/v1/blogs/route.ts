import { NextRequest, NextResponse } from 'next/server';
import {
    getBlogs,
    getLatestBlogs,
    getFeaturedBlogs,
    getBlogCategories,
    getBlogStatistics,
    getBlogBySlug,
    getRelatedBlogs,
    createBlog,
} from '@/lib/models/blog';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;
const CACHE_TTL = 300;

// ─── CACHE ──────────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; timestamp: number }>();

function getCached(key: string): any | null {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL * 1000) {
        cache.delete(key);
        return null;
    }
    return cached.data;
}

function setCached(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
}

function getCacheKey(req: NextRequest): string {
    const url = new URL(req.url);
    return url.pathname + url.search;
}

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // ─── PARAMS ──────────────────────────────────────────────────────
        const featured = searchParams.get('featured') === 'true';
        const stats = searchParams.get('stats') === 'true';
        const categories = searchParams.get('categories') === 'true';
        const slug = searchParams.get('slug');
        const limit = Math.min(
            parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
            MAX_LIMIT
        );
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

        const cacheKey = getCacheKey(request);
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json({
                ...cached,
                cached: true,
            });
        }

        // ─── STATISTICS ──────────────────────────────────────────────────
        if (stats) {
            const result = await getBlogStatistics();
            const response = { success: true, data: result };
            setCached(cacheKey, response);
            return NextResponse.json(response);
        }

        // ─── CATEGORIES ──────────────────────────────────────────────────
        if (categories) {
            const result = await getBlogCategories();
            const response = { success: true, data: result };
            setCached(cacheKey, response);
            return NextResponse.json(response);
        }

        // ─── SINGLE BLOG BY SLUG ────────────────────────────────────────
        if (slug) {
            const blog = await getBlogBySlug(slug);
            if (!blog) {
                return NextResponse.json(
                    { success: false, message: 'Blog not found' },
                    { status: 404 }
                );
            }

            const related = await getRelatedBlogs(slug, 3);
            const response = {
                success: true,
                data: {
                    ...blog,
                    related,
                },
            };
            setCached(cacheKey, response);
            return NextResponse.json(response);
        }

        // ─── FEATURED BLOGS ──────────────────────────────────────────────
        if (featured) {
            const result = await getFeaturedBlogs(limit);
            const response = {
                success: true,
                data: result,
                meta: {
                    total: result.length,
                    limit,
                    featured: true,
                },
            };
            setCached(cacheKey, response);
            return NextResponse.json(response);
        }

        // ─── LIST BLOGS ──────────────────────────────────────────────────
        const filters = {
            category: searchParams.get('category') || undefined,
            status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
            keyword: searchParams.get('keyword') || undefined,
            sort_by: (searchParams.get('sort_by') as any) || 'newest',
            page,
            limit,
            featured: searchParams.get('featured') === 'true' ? true : undefined,
            author: searchParams.get('author') || undefined,
            from_date: searchParams.get('from_date') || undefined,
            to_date: searchParams.get('to_date') || undefined,
        };

        const result = await getBlogs(filters);
        const response = {
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
        };

        setCached(cacheKey, response);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('❌ Error fetching blogs:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch blogs',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// ─── POST ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // ─── VALIDATION ──────────────────────────────────────────────────
        const errors: Record<string, string> = {};

        if (!body.title || body.title.trim().length < 3) {
            errors.title = 'Blog title is required and must be at least 3 characters';
        }

        if (!body.category || body.category.trim().length < 2) {
            errors.category = 'Blog category is required';
        }

        if (!body.descriptions || body.descriptions.trim().length < 20) {
            errors.descriptions = 'Blog description is required and must be at least 20 characters';
        }

        if (Object.keys(errors).length > 0) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400 }
            );
        }

        // ─── AUTO-GENERATE SLUG ──────────────────────────────────────────
        if (!body.slug && body.title) {
            body.slug = body.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        // ─── CREATE BLOG ──────────────────────────────────────────────────
        const blog = await createBlog(body);

        // ─── CLEAR CACHE ──────────────────────────────────────────────────
        cache.clear();

        return NextResponse.json({
            success: true,
            data: blog,
            message: 'Blog created successfully',
            meta: {
                timestamp: new Date().toISOString(),
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Error creating blog:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create blog',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}