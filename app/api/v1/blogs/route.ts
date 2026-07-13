import { NextRequest, NextResponse } from 'next/server';
import {
    getBlogs,
    getLatestBlogs,
    getBlogCategories,
    getBlogStatistics,
    getBlogBySlug,
    getRelatedBlogs,
    createBlog,
} from '@/lib/models/blog';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const featured = searchParams.get('featured') === 'true';
        const stats = searchParams.get('stats') === 'true';
        const categories = searchParams.get('categories') === 'true';
        const slug = searchParams.get('slug');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

        if (stats) {
            const result = await getBlogStatistics();
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        if (categories) {
            const result = await getBlogCategories();
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        if (slug) {
            const blog = await getBlogBySlug(slug);
            if (!blog) {
                return NextResponse.json(
                    { success: false, message: 'Blog not found' },
                    { status: 404 }
                );
            }

            const related = await getRelatedBlogs(slug);

            return NextResponse.json({
                success: true,
                data: {
                    ...blog,
                    related,
                },
                cached: false,
            });
        }

        if (featured) {
            const result = await getLatestBlogs(limit);
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        const filters = {
            category: searchParams.get('category') || undefined,
            status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
            keyword: searchParams.get('keyword') || undefined,
            sort_by: (searchParams.get('sort_by') as any) || 'newest',
            page,
            limit,
        };

        const result = await getBlogs(filters);

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch blogs', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json(
                { success: false, message: 'Blog title is required' },
                { status: 400 }
            );
        }

        if (!body.category) {
            return NextResponse.json(
                { success: false, message: 'Blog category is required' },
                { status: 400 }
            );
        }

        if (!body.descriptions) {
            return NextResponse.json(
                { success: false, message: 'Blog description is required' },
                { status: 400 }
            );
        }

        const blog = await createBlog(body);

        return NextResponse.json({
            success: true,
            data: blog,
            message: 'Blog created successfully',
        });
    } catch (error: any) {
        console.error('Error creating blog:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create blog', error: error.message },
            { status: 500 }
        );
    }
}