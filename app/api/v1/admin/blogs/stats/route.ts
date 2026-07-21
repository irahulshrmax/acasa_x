import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth/jwt';
import { cache } from '@/lib/cache';

const CACHE_KEY = 'blog:stats:admin';
const CACHE_TTL = 300;

async function checkAdminAuth(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
        return { success: false, message: 'Unauthorized', status: 401 };
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
}

export async function GET(request: NextRequest) {
    try {
        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status }
            );
        }

        const cached = await cache.get(CACHE_KEY);
        if (cached) {
            return NextResponse.json({
                success: true,
                data: cached,
            });
        }

        const stats = await query(`
            SELECT 
                COUNT(*) as total_blogs,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as published_blogs,
                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as draft_blogs,
                SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as archived_blogs,
                COALESCE(SUM(views), 0) as total_views,
                COALESCE(SUM(likes), 0) as total_likes,
                COALESCE(SUM(comments_count), 0) as total_comments,
                COALESCE(AVG(views), 0) as avg_views_per_blog,
                COALESCE(AVG(likes), 0) as avg_likes_per_blog,
                COALESCE(MAX(views), 0) as most_viewed_blog_views,
                COUNT(DISTINCT category) as total_categories,
                COUNT(DISTINCT writer) as total_writers,
                MIN(publish_date) as first_blog_date,
                MAX(publish_date) as latest_blog_date
            FROM blogs
            WHERE status IN (0, 1, 2)
        `);

        const result = stats[0] || {};
        await cache.set(CACHE_KEY, result, { ttl: CACHE_TTL, tags: ['blog', 'stats'] });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch blog stats' },
            { status: 500 }
        );
    }
}