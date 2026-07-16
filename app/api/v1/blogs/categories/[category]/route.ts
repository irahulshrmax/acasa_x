import { NextRequest, NextResponse } from 'next/server';
import { getBlogsByCategory } from '@/lib/models/blog';

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
    { params }: { params: Promise<{ category: string }> }
) {
    try {
        const { category } = await params;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(
            parseInt(searchParams.get('limit') || '12'),
            50
        );

        // ─── CACHE ──────────────────────────────────────────────────────
        const cacheKey = `blogs:category:${category}:${limit}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json({
                ...cached,
                cached: true,
            });
        }

        // ─── FETCH ──────────────────────────────────────────────────────
        const blogs = await getBlogsByCategory(category, limit);

        const response = {
            success: true,
            data: blogs,
            meta: {
                total: blogs.length,
                category,
                limit,
                timestamp: new Date().toISOString(),
            },
        };

        setCached(cacheKey, response);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('❌ Error fetching blogs by category:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch blogs by category',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}