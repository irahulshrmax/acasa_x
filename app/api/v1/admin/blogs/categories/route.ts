import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth/jwt';
import { cache } from '@/lib/cache';

const CACHE_KEY = 'blog:categories:admin';
const CACHE_TTL = 600;

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

        const categories = await query(`
            SELECT 
                category,
                COUNT(*) as count,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as published_count,
                COALESCE(SUM(views), 0) as total_views
            FROM blogs
            WHERE status IN (0, 1, 2)
                AND category IS NOT NULL 
                AND category != ''
            GROUP BY category
            ORDER BY count DESC
        `);

        await cache.set(CACHE_KEY, categories, { ttl: CACHE_TTL, tags: ['blog', 'categories'] });

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch blog categories' },
            { status: 500 }
        );
    }
}