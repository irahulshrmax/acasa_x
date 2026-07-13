import { NextRequest, NextResponse } from 'next/server';
import {
    getBlogBySlug,
    getRelatedBlogs,
    updateBlogById,
    deleteBlogById,
    permanentDeleteBlogById,
} from '@/lib/models/blog';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 3;

        const blog = await getBlogBySlug(slug);

        if (!blog) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        const related = await getRelatedBlogs(slug, limit);

        return NextResponse.json({
            success: true,
            data: {
                ...blog,
                related,
            },
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching blog:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch blog', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const body = await request.json();

        const existing = await getBlogBySlug(slug);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        const blog = await updateBlogById(existing.id, body);

        return NextResponse.json({
            success: true,
            data: blog,
            message: 'Blog updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating blog:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update blog', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        const existing = await getBlogBySlug(slug);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Blog not found' },
                { status: 404 }
            );
        }

        let result;
        if (permanent) {
            result = await permanentDeleteBlogById(existing.id);
            return NextResponse.json({
                success: true,
                data: result,
                message: 'Blog permanently deleted',
            });
        } else {
            result = await deleteBlogById(existing.id);
            return NextResponse.json({
                success: true,
                data: result,
                message: 'Blog archived successfully',
            });
        }
    } catch (error: any) {
        console.error('Error deleting blog:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete blog', error: error.message },
            { status: 500 }
        );
    }
}