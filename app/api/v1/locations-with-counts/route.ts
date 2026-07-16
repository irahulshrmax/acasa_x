// app/api/v1/locations-with-counts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getLocationsWithCounts,
  getPopularLocations,
  searchLocations,
  type LocationWithCount
} from '@/lib/models/search';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const cityId = parseInt(searchParams.get('city_id') || '71', 10);
    const search = searchParams.get('search') || '';
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let locations: LocationWithCount[] = [];

    if (popular) {
      // Popular locations for quick buttons
      locations = await getPopularLocations(cityId);
    } else if (search && search.length > 1) {
      // Search locations for autocomplete
      locations = await searchLocations(search, cityId, limit);
    } else {
      // All locations with counts
      locations = await getLocationsWithCounts(cityId, search, limit);
    }

    // ✅ Log for debugging
    console.log(`📍 [Locations] Found ${locations.length} locations for city_id: ${cityId}`);

    return NextResponse.json({
      success: true,
      data: locations,
      meta: {
        total: locations.length,
        city_id: cityId,
        searched: search || null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in locations API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch locations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}