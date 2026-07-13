import { NextRequest, NextResponse } from 'next/server';
import {
    getAboutUs,
    getAboutPages,
    getAboutStatistics,
    getAboutBySlug,
    updateAbout,
    type About,
} from '@/lib/models/about';
import { cache } from '@/lib/cache';

// ============================================================
// TYPES
// ============================================================

interface AboutImage {
    id: number;
    url: string;
    label: string;
    filename: string;
}

interface AboutWithImages extends About {
    all_images: AboutImage[];
    primary_image: string;
}

type AllowedUpdateKey =
    | 'title'
    | 'slug'
    | 'heading'
    | 'imageurl'
    | 'descriptions'
    | 'descriptions_other'
    | 'enable_modules'
    | 'seo_title'
    | 'seo_keywork'
    | 'seo_description'
    | 'status';

interface UpdateRequestBody {
    id: number;
    title?: string;
    slug?: string;
    heading?: string | null;
    imageurl?: string | null;
    descriptions?: string | null;
    descriptions_other?: string | null;
    enable_modules?: string | null;
    seo_title?: string | null;
    seo_keywork?: string | null;
    seo_description?: string | null;
    status?: number | string;
}

// ============================================================
// CONSTANTS
// ============================================================

// ✅ Local images - no external URL needed
const ABOUT_IMAGES: AboutImage[] = [
    { id: 1, filename: 'about.png',  url: '/about/about.png',  label: 'Our Office' },
    { id: 2, filename: 'about2.png', url: '/about/about2.png', label: 'Our Team' },
    { id: 3, filename: 'about3.png', url: '/about/about3.png', label: 'Our Work' },
    { id: 4, filename: 'about4.png', url: '/about/about4.png', label: 'Our Vision' },
    { id: 5, filename: 'about5.png', url: '/about/about5.png', label: 'Our Values' },
];

const ALLOWED_UPDATE_FIELDS: AllowedUpdateKey[] = [
    'title',
    'slug',
    'heading',
    'imageurl',
    'descriptions',
    'descriptions_other',
    'enable_modules',
    'seo_title',
    'seo_keywork',
    'seo_description',
    'status',
];

const CACHE_TTL = 300; // 5 minutes

// ============================================================
// HELPERS
// ============================================================

/**
 * imageurl se local primary image path banata hai
 */
function resolvePrimaryImage(imageurl: string | null | undefined): string {
    if (!imageurl) return ABOUT_IMAGES[0].url;

    // Already local path
    if (imageurl.startsWith('/about/')) {
        return imageurl;
    }

    // Relative path - /upload/about/about2.png → /about/about2.png
    if (imageurl.startsWith('/upload/about/')) {
        const filename = imageurl.split('/').pop();
        return filename ? `/about/${filename}` : ABOUT_IMAGES[0].url;
    }

    // Full URL → extract filename → local path
    if (imageurl.startsWith('http')) {
        try {
            const filename = new URL(imageurl).pathname.split('/').pop();
            if (filename && filename.includes('about')) {
                return `/about/${filename}`;
            }
        } catch {
            // ignore
        }
    }

    return ABOUT_IMAGES[0].url;
}

/**
 * About data pe images attach karta hai
 */
function attachImages(data: About): AboutWithImages {
    return {
        ...data,
        primary_image: resolvePrimaryImage(data.imageurl),
        all_images: ABOUT_IMAGES,
    };
}

/**
 * Success Response Builder
 */
function successResponse<T>(
    data: T,
    options: {
        cached?: boolean;
        status?: number;
        message?: string;
    } = {}
) {
    const { cached = false, status = 200, message } = options;

    const body: Record<string, unknown> = {
        success: true,
        data,
        ...(message && { message }),
        meta: {
            timestamp: new Date().toISOString(),
            cached,
        },
    };

    const response = NextResponse.json(body, { status });
    response.headers.set('x-cache', cached ? 'HIT' : 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');

    return response;
}

/**
 * Error Response Builder
 */
function errorResponse(message: string, status: number) {
    return NextResponse.json(
        {
            success: false,
            message,
            meta: {
                timestamp: new Date().toISOString(),
            },
        },
        { status }
    );
}

/**
 * Cache Helper - pehle cache check, nahi mila to fetch
 * ✅ Fixed: cache.set() ko object pass karo
 */
async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
    try {
        const hit = await cache.get(key);
        if (hit) return { data: hit as T, cached: true };
    } catch {
        // Cache fail hone pe fresh data fetch karo
    }

    const fresh = await fetcher();

    if (fresh !== null && fresh !== undefined) {
        try {
            // ✅ Fixed: { ttl: CACHE_TTL } - number nahi, object
            await cache.set(key, fresh, { ttl: CACHE_TTL });
        } catch {
            // Cache set fail - ignore karo
        }
    }

    return { data: fresh, cached: false };
}

/**
 * Cache Keys clear karta hai update ke baad
 */
async function invalidateCache(slug?: string) {
    const keys = [
        'about:pages',
        'about:stats',
        'about:slug:about-us',
        ...(slug ? [`about:slug:${slug}`] : []),
    ];

    await Promise.allSettled(
        keys.map(key => cache.del(key))
    );
}

// ============================================================
// GET Handler
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const wantStats  = searchParams.get('stats')  === 'true';
        const wantAll    = searchParams.get('all')    === 'true';
        const wantImages = searchParams.get('images') === 'true';
        const slug       = searchParams.get('slug');

        // ─── Only Images ───────────────────────────────────────
        if (wantImages) {
            return successResponse({
                images: ABOUT_IMAGES,
                total: ABOUT_IMAGES.length,
            });
        }

        // ─── Statistics ────────────────────────────────────────
        if (wantStats) {
            const { data, cached } = await getCachedData(
                'about:stats',
                getAboutStatistics
            );
            return successResponse(data, { cached });
        }

        // ─── By Slug ───────────────────────────────────────────
        if (slug) {
            const { data, cached } = await getCachedData(
                `about:slug:${slug}`,
                () => getAboutBySlug(slug)
            );

            if (!data) {
                return errorResponse('Page not found', 404);
            }

            return successResponse(attachImages(data), { cached });
        }

        // ─── All Pages ─────────────────────────────────────────
        if (wantAll) {
            const { data, cached } = await getCachedData(
                'about:pages',
                getAboutPages
            );
            return successResponse(data, { cached });
        }

        // ─── Default: About Us ─────────────────────────────────
        const { data, cached } = await getCachedData(
            'about:slug:about-us',
            getAboutUs
        );

        if (!data) {
            return errorResponse('About page not found', 404);
        }

        return successResponse(attachImages(data), { cached });

    } catch (error) {
        console.error('[GET /api/v1/about]', error);
        return errorResponse('Failed to fetch about data', 500);
    }
}

// ============================================================
// PUT Handler
// ============================================================

export async function PUT(request: NextRequest) {
    try {
        // ─── Parse Body ────────────────────────────────────────
        let body: UpdateRequestBody;

        try {
            body = await request.json();
        } catch {
            return errorResponse('Invalid JSON body', 400);
        }

        // ─── Validate ID ───────────────────────────────────────
        if (!body.id || typeof body.id !== 'number' || body.id <= 0) {
            return errorResponse('Valid numeric page ID is required', 400);
        }

        // ─── Sanitize Fields ───────────────────────────────────
        const sanitizedData: Partial<About> = {};

        for (const key of ALLOWED_UPDATE_FIELDS) {
            const value = body[key];
            if (value === undefined) continue;

            if (key === 'status') {
                const parsed = typeof value === 'string'
                    ? parseInt(value, 10)
                    : value;

                if (isNaN(parsed as number)) {
                    return errorResponse('status must be a valid number', 400);
                }

                sanitizedData.status = parsed as number;
            } else {
                (sanitizedData as Record<string, unknown>)[key] = value;
            }
        }

        // ─── Empty Check ───────────────────────────────────────
        if (Object.keys(sanitizedData).length === 0) {
            return errorResponse('No valid fields provided to update', 400);
        }

        // ─── Update DB ─────────────────────────────────────────
        const updated = await updateAbout(body.id, sanitizedData);

        if (!updated) {
            return errorResponse('About page not found', 404);
        }

        // ─── Cache Clear ───────────────────────────────────────
        await invalidateCache(updated.slug);

        return successResponse(
            attachImages(updated),
            { message: 'Page updated successfully' }
        );

    } catch (error: unknown) {
        console.error('[PUT /api/v1/about]', error);

        if (error instanceof Error && error.message.includes('not found')) {
            return errorResponse('About page not found', 404);
        }

        return errorResponse('Failed to update about page', 500);
    }
}