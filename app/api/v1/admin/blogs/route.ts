import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
    getBlogs,
    getBlogById,
    getBlogBySlug,
    createBlog,
    updateBlogById,
    deleteBlogById,
    permanentDeleteBlogById,
    type BlogFilters,
} from '@/lib/models/blog';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';

// ============================================================
// Constants
// ============================================================
const ADMIN_TOKEN_COOKIE = 'admin_token';
const CACHE_TTL = 300;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;
const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 20;
const VALID_STATUSES = [0, 1, 2];

// ============================================================
// Cache Keys
// ============================================================
const CACHE_KEYS = {
    blogs: (params: string) => `blogs:admin:${params}`,
    blog: (id: number) => `blog:admin:${id}`,
    blogBySlug: (slug: string) => `blog:admin:slug:${slug}`,
    blogsList: 'blogs:admin:list',
};

// ============================================================
// Helpers
// ============================================================

/**
 * Safe parseInt - NaN hone pe default return karta hai
 */
function safeParseInt(value: string | null | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Production logger
 */
function logError(context: string, error: unknown) {
    console.error(`[BlogAPI][${context}]`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Cache se safe get - failure pe null return
 */
async function safeGetCache<T>(key: string): Promise<T | null> {
    try {
        const data = await cache.get(key);
        return (data as T) || null;
    } catch (error) {
        logError('CacheGet', error);
        return null;
    }
}

/**
 * Cache me safe set - failure pe silent
 */
async function safeSetCache(key: string, value: unknown, ttl: number): Promise<void> {
    try {
        await cache.set(key, value, { ttl });
    } catch (error) {
        logError('CacheSet', error);
    }
}

/**
 * Cache se safe delete
 */
async function safeDelCache(key: string): Promise<void> {
    try {
        await cache.del(key);
    } catch (error) {
        logError('CacheDel', error);
    }
}

// ============================================================
// Authentication
// ============================================================
interface AuthSuccess {
    success: true;
    payload: ReturnType<typeof verifyToken> & {};
}

interface AuthFailure {
    success: false;
    message: string;
    status: 401 | 403;
}

type AuthResult = AuthSuccess | AuthFailure;

async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
    const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

    if (!token) {
        return { success: false, message: 'Unauthorized - Token missing', status: 401 };
    }

    let payload: ReturnType<typeof verifyToken>;
    try {
        payload = verifyToken(token);
    } catch {
        return { success: false, message: 'Token verification failed', status: 401 };
    }

    if (!payload) {
        return { success: false, message: 'Invalid or expired token', status: 401 };
    }

    const usertype = (payload as any).usertype?.toLowerCase?.() || '';
    const isAdmin = usertype === 'admin' || usertype === 'super_admin';

    if (!isAdmin) {
        return { success: false, message: 'Admin access required', status: 403 };
    }

    return { success: true, payload: payload as any };
}

// ============================================================
// Validation
// ============================================================
interface ValidationResult {
    errors: Record<string, string>;
    isValid: boolean;
}

function validateBlogData(body: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};

    // Title check
    const title = body.title?.trim?.() || '';
    if (!title || title.length < MIN_TITLE_LENGTH) {
        errors.title = `Title is required (minimum ${MIN_TITLE_LENGTH} characters)`;
    }

    // Category check
    const category = body.category?.trim?.() || '';
    if (!category) {
        errors.category = 'Category is required';
    }

    // Description check
    const description = body.descriptions?.trim?.() || '';
    if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
        errors.descriptions = `Description is required (minimum ${MIN_DESCRIPTION_LENGTH} characters)`;
    }

    // Image check
    const imageurl = body.imageurl?.trim?.() || '';
    if (!imageurl) {
        errors.imageurl = 'Featured image URL is required';
    }

    // Status check
    if (body.status !== undefined && body.status !== null) {
        const statusValue = parseInt(String(body.status), 10);
        if (isNaN(statusValue) || !VALID_STATUSES.includes(statusValue)) {
            errors.status = `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`;
        }
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
}

// ============================================================
// Cache Invalidation - FIXED (wildcard remove kiya)
// ============================================================

// In-memory blog cache keys tracker
// Kyunki wildcard cache support nahi hota production me
const activeBlogCacheKeys = new Set<string>();

async function invalidateBlogCaches(id?: number, slug?: string): Promise<void> {
    const deletePromises: Promise<void>[] = [];

    // Tracked list cache keys invalidate karo
    for (const key of activeBlogCacheKeys) {
        deletePromises.push(safeDelCache(key));
    }
    activeBlogCacheKeys.clear();

    // Specific blog cache
    if (id) {
        deletePromises.push(safeDelCache(CACHE_KEYS.blog(id)));
    }

    // Specific slug cache
    if (slug) {
        deletePromises.push(safeDelCache(CACHE_KEYS.blogBySlug(slug)));
    }

    // Static caches
    deletePromises.push(
        safeDelCache('blog:categories:admin'),
        safeDelCache('blog:stats:admin'),
        safeDelCache(CACHE_KEYS.blogsList),
    );

    await Promise.allSettled(deletePromises);
}

// ============================================================
// URL Params Builder
// ============================================================
function buildCacheKey(searchParams: URLSearchParams): string {
    const params = new URLSearchParams();

    // Sirf relevant params include karo
    const relevantKeys = ['page', 'limit', 'status', 'category', 'search', 'sort_by'];
    for (const key of relevantKeys) {
        const value = searchParams.get(key);
        if (value && value !== '' && value !== 'all') {
            params.set(key, value);
        }
    }

    params.sort();
    return params.toString() || 'default';
}

// ============================================================
// GET Handler
// ============================================================
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const auth = await authenticateAdmin(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');

        // Single blog by ID
        if (id) {
            const blogId = safeParseInt(id, 0);

            if (blogId <= 0) {
                return NextResponse.json(
                    { success: false, message: 'Invalid blog ID' },
                    { status: 400 }
                );
            }

            const cacheKey = CACHE_KEYS.blog(blogId);
            const cached = await safeGetCache(cacheKey);

            if (cached) {
                return NextResponse.json({ success: true, data: cached, cached: true });
            }

            const blog = await getBlogById(blogId);

            if (!blog) {
                return NextResponse.json(
                    { success: false, message: 'Blog not found' },
                    { status: 404 }
                );
            }

            await safeSetCache(cacheKey, blog, CACHE_TTL);
            return NextResponse.json({ success: true, data: blog });
        }

        // Single blog by Slug
        if (slug) {
            const cleanSlug = slug.trim();

            if (!cleanSlug) {
                return NextResponse.json(
                    { success: false, message: 'Invalid slug' },
                    { status: 400 }
                );
            }

            const cacheKey = CACHE_KEYS.blogBySlug(cleanSlug);
            const cached = await safeGetCache(cacheKey);

            if (cached) {
                return NextResponse.json({ success: true, data: cached, cached: true });
            }

            const blog = await getBlogBySlug(cleanSlug);

            if (!blog) {
                return NextResponse.json(
                    { success: false, message: 'Blog not found' },
                    { status: 404 }
                );
            }

            await safeSetCache(cacheKey, blog, CACHE_TTL);
            return NextResponse.json({ success: true, data: blog });
        }

        // Blog list with filters
        const page = Math.max(DEFAULT_PAGE, safeParseInt(searchParams.get('page'), DEFAULT_PAGE));
        const limit = Math.min(MAX_LIMIT, Math.max(1, safeParseInt(searchParams.get('limit'), DEFAULT_LIMIT)));

        const statusParam = searchParams.get('status');
        const categoryParam = searchParams.get('category');
        const searchParam = searchParams.get('search');
        const sortParam = searchParams.get('sort_by') || 'newest';

        // FIXED: Changed 'title' to 'title_asc' and 'title_desc' to match BlogFilters type
        const validSortOptions: BlogFilters['sort_by'][] = ['newest', 'oldest', 'popular', 'title_asc', 'title_desc'];
        const sort_by = validSortOptions.includes(sortParam as any)
            ? (sortParam as BlogFilters['sort_by'])
            : 'newest';

        const filters: BlogFilters = {
            page,
            limit,
            sort_by,
            status:
                statusParam && statusParam !== 'all' && statusParam !== ''
                    ? safeParseInt(statusParam, -1)
                    : undefined,
            category:
                categoryParam && categoryParam !== 'all' && categoryParam !== ''
                    ? categoryParam.trim()
                    : undefined,
            keyword: searchParam?.trim() || undefined,
        };

        // Status invalid hone pe undefined rakh do
        if (filters.status === -1) {
            filters.status = undefined;
        }

        const cacheKey = CACHE_KEYS.blogs(buildCacheKey(searchParams));
        activeBlogCacheKeys.add(cacheKey); // Track for invalidation

        const cached = await safeGetCache(cacheKey);
        if (cached) {
            return NextResponse.json({ ...(cached as object), cached: true });
        }

        const result = await getBlogs(filters);

        const response = {
            success: true,
            data: result.data,
            meta: result.meta,
        };

        await safeSetCache(cacheKey, response, CACHE_TTL);
        return NextResponse.json(response);

    } catch (error) {
        logError('GET', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================
// POST Handler
// ============================================================
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateAdmin(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status }
            );
        }

        // Safe body parse
        let body: Record<string, any>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { errors, isValid } = validateBlogData(body);
        if (!isValid) {
            return NextResponse.json(
                { success: false, message: 'Validation failed', errors },
                { status: 400 }
            );
        }

        const newBlog = await createBlog({
            title: body.title.trim(),
            slug: body.slug?.trim() || '',
            sub_title: body.sub_title?.trim() || null,
            writer: body.writer?.trim() || null,
            publish_date: body.publish_date || null,
            category: body.category.trim(),
            imageurl: body.imageurl.trim(),
            descriptions: body.descriptions,
            status: body.status !== undefined ? parseInt(String(body.status), 10) : 1,
            seo_title: body.seo_title?.trim() || null,
            seo_keywork: body.seo_keywork?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
        });

        await invalidateBlogCaches();

        return NextResponse.json(
            {
                success: true,
                message: 'Blog created successfully',
                data: newBlog,
            },
            { status: 201 }
        );

    } catch (error) {
        logError('POST', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create blog' },
            { status: 500 }
        );
    }
}

// ============================================================
// PUT Handler
// ============================================================
export async function PUT(request: NextRequest) {
    try {
        const auth = await authenticateAdmin(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status }
            );
        }

        let body: Record<string, any>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const blogId = safeParseInt(String(body.id || ''), 0);

        if (blogId <= 0) {
            return NextResponse.json(
                { success: false, message: 'Valid Blog ID is required' },
                { status: 400 }
            );
        }

        // Blog exist karta hai?
        const existing = await getBlogById(blogId);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        const { errors, isValid } = validateBlogData(body);
        if (!isValid) {
            return NextResponse.json(
                { success: false, message: 'Validation failed', errors },
                { status: 400 }
            );
        }

        const updatedBlog = await updateBlogById(blogId, {
            title: body.title.trim(),
            slug: body.slug?.trim() || '',
            sub_title: body.sub_title?.trim() || null,
            writer: body.writer?.trim() || null,
            publish_date: body.publish_date || null,
            category: body.category.trim(),
            imageurl: body.imageurl.trim(),
            descriptions: body.descriptions,
            status: body.status !== undefined ? parseInt(String(body.status), 10) : 1,
            seo_title: body.seo_title?.trim() || null,
            seo_keywork: body.seo_keywork?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
        });

        // Old aur new dono slugs invalidate karo
        await invalidateBlogCaches(blogId, existing.slug);
        if (body.slug && body.slug !== existing.slug) {
            await safeDelCache(CACHE_KEYS.blogBySlug(body.slug.trim()));
        }

        return NextResponse.json({
            success: true,
            message: 'Blog updated successfully',
            data: updatedBlog,
        });

    } catch (error) {
        logError('PUT', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update blog' },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE Handler
// ============================================================
export async function DELETE(request: NextRequest) {
    try {
        const auth = await authenticateAdmin(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const permanent = searchParams.get('permanent') === 'true';

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Blog ID is required' },
                { status: 400 }
            );
        }

        const blogId = safeParseInt(id, 0);

        if (blogId <= 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid Blog ID' },
                { status: 400 }
            );
        }

        const existing = await getBlogById(blogId);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        if (permanent) {
            await permanentDeleteBlogById(blogId);
        } else {
            await deleteBlogById(blogId);
        }

        await invalidateBlogCaches(blogId, existing.slug);

        return NextResponse.json({
            success: true,
            message: permanent
                ? 'Blog permanently deleted'
                : 'Blog soft deleted successfully',
            data: { id: blogId, title: existing.title },
        });

    } catch (error) {
        logError('DELETE', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete blog' },
            { status: 500 }
        );
    }
}

// ============================================================
// OPTIONS Handler (CORS)
// ============================================================
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
            'Access-Control-Max-Age': '86400',
        },
    });
}