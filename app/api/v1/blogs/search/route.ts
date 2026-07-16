import { NextRequest, NextResponse } from 'next/server';
import { getBlogs } from '@/lib/models/blog';

const CACHE_TTL = 60; // Short cache for search

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const keyword = searchParams.get('q') || searchParams.get('keyword') || '';
        const category = searchParams.get('category') || undefined;
        const limit = Math.min(
            parseInt(searchParams.get('limit') || '10'),
            50
        );
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

        // ─── VALIDATION ──────────────────────────────────────────────────
        if (!keyword || keyword.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                    keyword: keyword || '',
                    message: 'Please provide at least 2 characters for search',
                },
            });
        }

        // ─── SEARCH ──────────────────────────────────────────────────────
        const result = await getBlogs({
            keyword,
            category,
            status: 1,
            sort_by: 'newest',
            page,
            limit,
        });

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: {
                ...result.meta,
                keyword,
                category: category || null,
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error: any) {
        console.error('❌ Error searching blogs:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to search blogs',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}