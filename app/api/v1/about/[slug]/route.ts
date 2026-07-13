import { NextRequest, NextResponse } from 'next/server';
import { getAboutBySlug } from '@/lib/models/about';
import { cache } from '@/lib/cache';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params;
        const { slug } = resolvedParams;

        if (!slug || typeof slug !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Valid slug is required' },
                { status: 400 }
            );
        }

        const cacheKey = `about:slug:${slug}`;
        const cached = !!(await cache.get(cacheKey));
        const about = await getAboutBySlug(slug);

        if (!about) {
            return NextResponse.json(
                { success: false, message: 'Page not found' },
                { status: 404 }
            );
        }

        const response = NextResponse.json({ 
            success: true, 
            data: about, 
            cached 
        });
        
        response.headers.set('x-cache', cached ? 'HIT' : 'MISS');
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');

        return response;
    } catch (error) {
        console.error('[API: GET /about/[slug]] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch about page' },
            { status: 500 }
        );
    }
}