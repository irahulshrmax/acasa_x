// app/api/v1/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/auth/jwt';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';

async function checkAdminAuth(request: NextRequest) {
    try {
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
    } catch (error) {
        console.error('[Dashboard Auth] Error:', error);
        return { success: false, message: 'Auth error', status: 500 };
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = await checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const cacheKey = 'dashboard:admin:data';
        const cached = await cache.get(cacheKey);

        if (cached) {
            return NextResponse.json({
                success: true,
                data: cached,
                source: 'cache',
            });
        }

        // ✅ Blog stats
        const blogStats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as archived
            FROM blogs
        `);

        // ✅ Property count
        const propertyCount = await query(`SELECT COUNT(*) as total FROM properties`);

        // ✅ User count
        const userCount = await query(`SELECT COUNT(*) as total FROM users`);

        // ✅ Developer count
        const developerCount = await query(`SELECT COUNT(*) as total FROM developers`);

        // ✅ Community count - TRY-CATCH for missing table
        let communityCount = 0;
        try {
            const communityResult = await query(`SELECT COUNT(*) as total FROM communities`);
            communityCount = communityResult[0]?.total || 0;
        } catch (error) {
            console.log('[Dashboard] Communities table not found, using 0');
            communityCount = 0;
        }

        // ✅ Contact count
        const contactCount = await query(`SELECT COUNT(*) as total FROM contacts WHERE status = 0`);

        // ✅ Admin count
        const adminCount = await query(`SELECT COUNT(*) as total FROM users WHERE LOWER(usertype) IN ('admin', 'super_admin')`);

        // ✅ Recent blogs
        const recentBlogs = await query(`
            SELECT id, title, slug, status, views, created_at, publish_date 
            FROM blogs 
            WHERE status = 1
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        // ✅ Recent properties
        const recentProperties = await query(`
            SELECT id, title, name, price, location, created_at 
            FROM properties 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        // ✅ Blog categories
        const categories = await query(`
            SELECT category, COUNT(*) as count
            FROM blogs
            WHERE status = 1 AND category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
        `);

        const data = {
            stats: {
                blogs: blogStats[0] || { total: 0, published: 0, draft: 0, archived: 0 },
                properties: propertyCount[0]?.total || 0,
                users: userCount[0]?.total || 0,
                developers: developerCount[0]?.total || 0,
                communities: communityCount,
                contacts: contactCount[0]?.total || 0,
                admins: adminCount[0]?.total || 0,
            },
            recent: {
                blogs: recentBlogs || [],
                properties: recentProperties || [],
            },
            categories: categories || [],
        };

        await cache.set(cacheKey, data, { ttl: 300, tags: ['dashboard'] });

        return NextResponse.json({
            success: true,
            data,
            source: 'database',
        });

    } catch (error: any) {
        console.error('[Dashboard API] Error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || 'Failed to fetch dashboard data' 
            },
            { status: 500 }
        );
    }
}