import { NextRequest, NextResponse } from 'next/server';
import {
    getCommunities,
    getFeaturedCommunities,
    getCommunitiesByCity,
    getCommunityStatistics,
    getCommunitySearchFilters,
    getCommunityBySlug,
} from '@/lib/models/communities';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const featured = searchParams.get('featured') === 'true';
        const stats = searchParams.get('stats') === 'true';
        const filters = searchParams.get('filters') === 'true';
        const cityId = searchParams.get('city_id');
        const slug = searchParams.get('slug');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

        if (stats) {
            const result = await getCommunityStatistics();
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        if (filters) {
            const result = await getCommunitySearchFilters();
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        if (slug) {
            // 🔥 Handle full slug pattern
            let actualSlug = slug;
            if (slug.startsWith('apartments-for-sale-in-')) {
                actualSlug = slug.replace('apartments-for-sale-in-', '');
            }
            
            const community = await getCommunityBySlug(actualSlug);
            if (!community) {
                return NextResponse.json(
                    { success: false, message: 'Community not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: community,
                cached: false,
            });
        }

        if (cityId) {
            const result = await getCommunitiesByCity(parseInt(cityId), limit);
            return NextResponse.json({
                success: true,
                data: result.data,
                meta: result.meta,
                cached: false,
            });
        }

        if (featured) {
            const result = await getFeaturedCommunities(limit);
            return NextResponse.json({
                success: true,
                data: result.data,
                meta: result.meta,
                cached: false,
            });
        }

        const filtersObj = {
            city_id: searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!) : undefined,
            state_id: searchParams.get('state_id') ? parseInt(searchParams.get('state_id')!) : undefined,
            country_id: searchParams.get('country_id') ? parseInt(searchParams.get('country_id')!) : undefined,
            status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
            featured: searchParams.get('featured') === 'true' ? true : undefined,
            keyword: searchParams.get('keyword') || undefined,
            sort_by: (searchParams.get('sort_by') as any) || 'featured_desc',
            page,
            limit,
        };

        const result = await getCommunities(filtersObj);

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: result.meta,
            cached: false,
        });
        
    } catch (error: any) {
        console.error('Error fetching communities:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch communities', error: error.message },
            { status: 500 }
        );
    }
}