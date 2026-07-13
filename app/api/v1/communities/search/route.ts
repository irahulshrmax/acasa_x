// app/api/v1/communities/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCommunities } from '@/lib/models/communities';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const keyword = searchParams.get('q') || searchParams.get('keyword') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const cityId = searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!) : undefined;

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

    const result = await getCommunities({
      keyword,
      city_id: cityId,
      status: 1,
      sort_by: 'featured_desc',
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
    console.error('Error searching communities:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search communities', error: error.message },
      { status: 500 }
    );
  }
}