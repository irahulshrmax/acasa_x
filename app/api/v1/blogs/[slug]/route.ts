import { NextRequest, NextResponse } from 'next/server';
import {
    getBlogBySlug,
    getRelatedBlogs,
    updateBlogById,
    deleteBlogById,
    permanentDeleteBlogById,
} from '@/lib/models/blog';

const CACHE_TTL = 300;
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(
            parseInt(searchParams.get('limit') || '3'),
            20
        );

        // ─── CACHE ──────────────────────────────────────────────────────
        const cacheKey = `blog:${slug}:${limit}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json({
                ...cached,
                cached: true,
            });
        }

        // ─── FETCH BLOG ──────────────────────────────────────────────────
        const blog = await getBlogBySlug(slug);

        if (!blog) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Blog not found',
                    slug,
                },
                { status: 404 }
            );
        }

        // ─── RELATED BLOGS ────────────────────────────────────────────────
        const related = await getRelatedBlogs(slug, limit);

        const response = {
            success: true,
            data: {
                ...blog,
                related,
            },
            meta: {
                slug,
                related_count: related.length,
                timestamp: new Date().toISOString(),
            },
        };

        setCached(cacheKey, response);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('❌ Error fetching blog:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch blog',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();

        // ─── VALIDATION ──────────────────────────────────────────────────
        const existing = await getBlogBySlug(slug);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        // ─── UPDATE ──────────────────────────────────────────────────────
        const blog = await updateBlogById(existing.id, body);

        // ─── CLEAR CACHE ──────────────────────────────────────────────────
        cache.clear();

        return NextResponse.json({
            success: true,
            data: blog,
            message: 'Blog updated successfully',
            meta: {
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error: any) {
        console.error('❌ Error updating blog:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update blog',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        // ─── VALIDATION ──────────────────────────────────────────────────
        const existing = await getBlogBySlug(slug);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        // ─── DELETE ──────────────────────────────────────────────────────
        let result;
        let message;

        if (permanent) {
            result = await permanentDeleteBlogById(existing.id);
            message = 'Blog permanently deleted';
        } else {
            result = await deleteBlogById(existing.id);
            message = 'Blog archived successfully';
        }

        // ─── CLEAR CACHE ──────────────────────────────────────────────────
        cache.clear();

        return NextResponse.json({
            success: true,
            data: result,
            message,
            meta: {
                permanent,
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error: any) {
        console.error('❌ Error deleting blog:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete blog',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}