import { NextRequest, NextResponse } from 'next/server';
import { getCommunityBySlug } from '@/lib/models/communities';
import { getProperties } from '@/lib/models/properties';

// ─── HELPER: Extract actual slug ──────────────────────────────────────

function extractActualSlug(slug: string): string {
    let actualSlug = slug;
    if (slug.startsWith('apartments-for-sale-in-')) {
        actualSlug = slug.replace('apartments-for-sale-in-', '');
    }
    actualSlug = decodeURIComponent(actualSlug);
    actualSlug = actualSlug.trim().replace(/\/+$/, '');
    return actualSlug;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // 🔥 Extract actual slug
    const actualSlug = extractActualSlug(slug);

    // ─── Check if community exists ─────────────────────────────────────
    
    const community = await getCommunityBySlug(actualSlug);
    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // ─── Get properties in this community ─────────────────────────────
    
    const filters = {
      community_id: community.id,
      status: 5,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      sort_by: (searchParams.get('sort_by') as any) || 'newest',
      property_type: searchParams.get('property_type') || undefined,
      property_purpose: searchParams.get('property_purpose') || undefined,
      min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? parseInt(searchParams.get('min_bedrooms')!) : undefined,
      max_bedrooms: searchParams.get('max_bedrooms') ? parseInt(searchParams.get('max_bedrooms')!) : undefined,
    };

    const result = await getProperties(filters);

    return NextResponse.json({
      success: true,
      data: {
        community: {
          name: community.name,
          slug: community.slug,
          image: community.image_url,
          description: community.description,
        },
        properties: result.data,
        meta: {
          ...result.meta,
          community_slug: slug,
          community_name: community.name,
        },
      },
      cached: false,
    });
    
  } catch (error: any) {
    console.error('Error fetching community properties:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch community properties', error: error.message },
      { status: 500 }
    );
  }
}