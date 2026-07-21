// app/api/v1/admin/communities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth/jwt';
import { cache } from '@/lib/cache';
import {
    getCommunities,
    getFeaturedCommunities,
    getCommunitiesByCity,
    getCommunityStatistics,
    getCommunitySearchFilters,
    getCommunityBySlug,
    getCommunityById,
    createCommunity,
    updateCommunityBySlug,
    deleteCommunityBySlug,
    permanentDeleteCommunityBySlug,
    restoreCommunityBySlug,
} from '@/lib/models/communities';

export const runtime = 'nodejs';

// ─── Types ──────────────────────────────────────────────────────────────
interface Community {
    id: number;
    name: string;
    slug: string;
    city_id: number;
    state_id: number | null;
    country_id: number;
    status: number;
    featured: number;
    description: string | null;
    img: string | null;
    created_at?: string;
    updated_at?: string;
}

// ─── Auth Check ──────────────────────────────────────────────────────────
async function checkAdminAuth(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token) {
            return { success: false, message: 'Unauthorized - No token', status: 401 };
        }

        const payload = verifyToken(token);
        if (!payload) {
            return { success: false, message: 'Invalid token', status: 401 };
        }

        const usertype = payload.usertype?.toLowerCase() || '';
        const isAdmin = usertype === 'admin' || usertype === 'super_admin';

        if (!isAdmin) {
            return { success: false, message: 'Admin access required', status: 403 };
        }

        return { success: true, payload };
    } catch (error) {
        console.error('[Communities Auth] Error:', error);
        return { success: false, message: 'Auth error', status: 500 };
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function validateCommunityData(body: any): { errors: Record<string, string>; isValid: boolean } {
    const errors: Record<string, string> = {};

    if (!body.name || body.name.trim().length < 2) {
        errors.name = 'Community name is required (min 2 characters)';
    }
    if (!body.city_id || isNaN(parseInt(body.city_id))) {
        errors.city_id = 'City is required';
    }
    if (!body.country_id || isNaN(parseInt(body.country_id))) {
        errors.country_id = 'Country is required';
    }
    if (body.status !== undefined && ![0, 1].includes(parseInt(body.status))) {
        errors.status = 'Invalid status value (0 or 1)';
    }
    if (body.featured !== undefined && ![0, 1].includes(parseInt(body.featured))) {
        errors.featured = 'Invalid featured value (0 or 1)';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
    };
}

// ─── GET - List Communities ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        console.log('[Communities API] GET request received');

        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
        const status = searchParams.get('status') !== null ? parseInt(searchParams.get('status')!) : 1;
        const city_id = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!) : undefined;
        const state_id = searchParams.get('state_id') ? parseInt(searchParams.get('state_id')!) : undefined;
        const country_id = searchParams.get('country_id') ? parseInt(searchParams.get('country_id')!) : undefined;
        const featured = searchParams.get('featured') !== null ? searchParams.get('featured') === 'true' : undefined;
        const keyword = searchParams.get('search') || undefined;
        const sort_by = searchParams.get('sort_by') as any || 'featured_desc';
        const stats = searchParams.get('stats') === 'true';

        // ✅ Get single community by ID
        if (id) {
            const community = await getCommunityById(parseInt(id));
            if (!community) {
                return NextResponse.json(
                    { success: false, message: 'Community not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: community,
            });
        }

        // ✅ Get single community by Slug
        if (slug) {
            const community = await getCommunityBySlug(slug);
            if (!community) {
                return NextResponse.json(
                    { success: false, message: 'Community not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: community,
            });
        }

        // ✅ Get statistics
        if (stats) {
            const statistics = await getCommunityStatistics();
            return NextResponse.json({
                success: true,
                data: statistics,
            });
        }

        // ✅ Get search filters
        const filters = searchParams.get('filters') === 'true';
        if (filters) {
            const searchFilters = await getCommunitySearchFilters();
            return NextResponse.json({
                success: true,
                data: searchFilters,
            });
        }

        // ✅ List communities with pagination
        const result = await getCommunities({
            page,
            limit,
            status,
            city_id,
            state_id,
            country_id,
            featured,
            keyword,
            sort_by,
        });

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
        });

    } catch (error: any) {
        console.error('[Communities API] GET Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch communities' },
            { status: 500 }
        );
    }
}

// ─── POST - Create Community ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        console.log('[Communities API] POST request received');

        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const body = await request.json();
        console.log('[Communities API] Body:', body);

        // ✅ Validate
        const { errors, isValid } = validateCommunityData(body);
        if (!isValid) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400 }
            );
        }

        // ✅ Generate slug if not provided
        let slug = body.slug || generateSlug(body.name);

        // ✅ Check if slug exists
        const existing = await query<{ id: number }[]>(
            'SELECT id FROM community WHERE slug = ?',
            [slug]
        );
        if (existing.length > 0) {
            slug = `${slug}-${Date.now().toString().slice(-6)}`;
        }

        // ✅ Create community
        const community = await createCommunity({
            name: body.name.trim(),
            slug,
            city_id: parseInt(body.city_id),
            state_id: body.state_id ? parseInt(body.state_id) : null,
            country_id: parseInt(body.country_id),
            description: body.description || null,
            img: body.img || null,
            status: body.status ?? 1,
            featured: body.featured ?? 0,
            seo_title: body.seo_title || null,
            seo_keywork: body.seo_keywork || null,
            seo_description: body.seo_description || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
        });

        // ✅ Clear cache
        await cache.delPattern('communities:list:*');
        await cache.delPattern('communities:stats');

        return NextResponse.json({
            success: true,
            message: 'Community created successfully',
            data: community,
        }, { status: 201 });

    } catch (error: any) {
        console.error('[Communities API] POST Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create community' },
            { status: 500 }
        );
    }
}

// ─── PUT - Update Community ──────────────────────────────────────────────
export async function PUT(request: NextRequest) {
    try {
        console.log('[Communities API] PUT request received');

        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const body = await request.json();
        const { id, slug } = body;

        if (!id && !slug) {
            return NextResponse.json(
                { success: false, message: 'Community ID or Slug is required' },
                { status: 400 }
            );
        }

        // ✅ Get existing community
        let existingCommunity;
        if (id) {
            existingCommunity = await getCommunityById(parseInt(id));
        } else if (slug) {
            existingCommunity = await getCommunityBySlug(slug);
        }

        if (!existingCommunity) {
            return NextResponse.json(
                { success: false, message: 'Community not found' },
                { status: 404 }
            );
        }

        // ✅ Validate
        const { errors, isValid } = validateCommunityData(body);
        if (!isValid) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400 }
            );
        }

        // ✅ Generate new slug if name changed
        let newSlug = body.slug || existingCommunity.slug;
        if (body.name && body.name !== existingCommunity.name) {
            newSlug = generateSlug(body.name);
            // Check if new slug exists
            const existing = await query<{ id: number }[]>(
                'SELECT id FROM community WHERE slug = ? AND id != ?',
                [newSlug, existingCommunity.id]
            );
            if (existing.length > 0) {
                newSlug = `${newSlug}-${Date.now().toString().slice(-6)}`;
            }
        }

        // ✅ Update community
        const updatedCommunity = await updateCommunityBySlug(
            existingCommunity.slug as string,
            {
                name: body.name?.trim(),
                slug: newSlug,
                city_id: body.city_id ? parseInt(body.city_id) : undefined,
                state_id: body.state_id ? parseInt(body.state_id) : null,
                country_id: body.country_id ? parseInt(body.country_id) : undefined,
                description: body.description || null,
                img: body.img || null,
                status: body.status ?? 1,
                featured: body.featured ?? 0,
                seo_title: body.seo_title || null,
                seo_keywork: body.seo_keywork || null,
                seo_description: body.seo_description || null,
                latitude: body.latitude || null,
                longitude: body.longitude || null,
            }
        );

        // ✅ Clear cache
        await cache.delPattern('communities:list:*');
        await cache.delPattern('communities:stats');
        await cache.del(`community:slug:${existingCommunity.slug}`);
        await cache.del(`community:slug:${newSlug}`);

        return NextResponse.json({
            success: true,
            message: 'Community updated successfully',
            data: updatedCommunity,
        });

    } catch (error: any) {
        console.error('[Communities API] PUT Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update community' },
            { status: 500 }
        );
    }
}

// ─── DELETE - Delete Community ────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        console.log('[Communities API] DELETE request received');

        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');
        const permanent = searchParams.get('permanent') === 'true';
        const restore = searchParams.get('restore') === 'true';

        if (!id && !slug) {
            return NextResponse.json(
                { success: false, message: 'Community ID or Slug is required' },
                { status: 400 }
            );
        }

        // ✅ Get existing community
        let existingCommunity;
        if (id) {
            existingCommunity = await getCommunityById(parseInt(id));
        } else if (slug) {
            existingCommunity = await getCommunityBySlug(slug);
        }

        if (!existingCommunity) {
            return NextResponse.json(
                { success: false, message: 'Community not found' },
                { status: 404 }
            );
        }

        // ✅ Restore community
        if (restore) {
            const restored = await restoreCommunityBySlug(existingCommunity.slug as string);
            await cache.delPattern('communities:list:*');
            return NextResponse.json({
                success: true,
                message: 'Community restored successfully',
                data: restored,
            });
        }

        // ✅ Permanent delete
        if (permanent) {
            await permanentDeleteCommunityBySlug(existingCommunity.slug as string);
            await cache.delPattern('communities:list:*');
            return NextResponse.json({
                success: true,
                message: 'Community permanently deleted',
                data: { id: existingCommunity.id, slug: existingCommunity.slug },
            });
        }

        // ✅ Soft delete (set status = 0)
        const result = await deleteCommunityBySlug(existingCommunity.slug as string);
        await cache.delPattern('communities:list:*');
        await cache.delPattern('communities:stats');

        return NextResponse.json({
            success: true,
            message: 'Community deleted successfully (soft delete)',
            data: result,
        });

    } catch (error: any) {
        console.error('[Communities API] DELETE Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete community' },
            { status: 500 }
        );
    }
}

// ─── OPTIONS - CORS ─────────────────────────────────────────────────────
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        },
    });
}