//app/api/v1/blogs/categories/[category]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBlogsByCategory } from '@/lib/models/blog';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    try {
        const { category } = await params;
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12;

        const blogs = await getBlogsByCategory(category, limit);

        return NextResponse.json({
            success: true,
            data: blogs,
            meta: {
                total: blogs.length,
                category,
                limit,
            },
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching blogs by category:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch blogs by category', error: error.message },
            { status: 500 }
        );
    }
}