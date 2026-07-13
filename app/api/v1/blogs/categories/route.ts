//app/api/v1/blogs/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBlogCategories } from '@/lib/models/blog';

export async function GET(request: NextRequest) {
    try {
        const categories = await getBlogCategories();

        return NextResponse.json({
            success: true,
            data: categories,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching blog categories:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch blog categories', error: error.message },
            { status: 500 }
        );
    }
}