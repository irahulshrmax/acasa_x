//app/api/v1/blogs/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBlogs } from '@/lib/models/blog';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const keyword = searchParams.get('q') || searchParams.get('keyword') || '';
        const category = searchParams.get('category') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

        if (!keyword || keyword.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
                cached: false,
            });
        }

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
            meta: result.meta,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error searching blogs:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to search blogs', error: error.message },
            { status: 500 }
        );
    }
}