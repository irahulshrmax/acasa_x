import { NextRequest, NextResponse } from 'next/server';
import { getProperties, getSearchFilters } from '@/lib/models/properties';
import type { PropertyFilters } from '@/lib/models/properties';

// ─── CORS HEADERS ────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// ─── PARAMS PARSER ───────────────────────────────────────────────────────
function parseParams(searchParams: URLSearchParams): PropertyFilters {
  const get = (key: string) => searchParams.get(key);
  const getNum = (key: string) => {
    const val = get(key);
    if (!val) return undefined;
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };
  const getInt = (key: string, def?: number) => {
    const val = get(key);
    if (!val) return def;
    const n = parseInt(val, 10);
    return isNaN(n) ? def : n;
  };

  return {
    page:            getInt('page', 1),
    limit:           Math.min(getInt('limit', 20)!, 100),
    status:          getInt('status', 5),
    listing_type:    get('listing_type') || 'Off plan',
    property_type:   get('property_type') || undefined,
    property_purpose:get('property_purpose') || undefined,
    city_id:         getInt('city_id'),
    community_id:    getInt('community_id'),
    sub_community_id:getInt('sub_community_id'),
    min_price:       getNum('min_price'),
    max_price:       getNum('max_price'),
    min_bedrooms:    getInt('min_bedrooms'),
    max_bedrooms:    getInt('max_bedrooms'),
    min_area:        getNum('min_area'),
    max_area:        getNum('max_area'),
    featured:        get('featured') === 'true' ? true : undefined,
    keyword:         get('keyword') || undefined,
    sort_by:         (get('sort_by') as any) || 'newest',
    occupancy:       get('occupancy') || undefined,
    completion_from: get('completion_from') || undefined,
    completion_to:   get('completion_to') || undefined,
    has_price:       get('has_price') === 'true' ? true : undefined,
  };
}

// ─── FIX IMAGE PATH ─────────────────────────────────────────────────────
function fixImagePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Agar image URL mein 'upload/' hai aur 'media/' nahi hai toh fix karo
  if (imageUrl.includes('upload/') && !imageUrl.includes('/media/')) {
    return imageUrl.replace('upload/', 'upload/media/');
  }
  
  return imageUrl;
}

function fixPropertyImages(property: any): any {
  if (!property) return property;
  
  // Fix featured_image
  if (property.featured_image) {
    property.featured_image = fixImagePath(property.featured_image);
  }
  
  // Fix gallery_urls
  if (property.gallery_urls && Array.isArray(property.gallery_urls)) {
    property.gallery_urls = property.gallery_urls.map((url: string) => fixImagePath(url) || url);
  }
  
  // Fix gallery_preview
  if (property.gallery_preview && Array.isArray(property.gallery_preview)) {
    property.gallery_preview = property.gallery_preview.map((url: string) => fixImagePath(url) || url);
  }
  
  // Fix images array
  if (property.images && Array.isArray(property.images)) {
    property.images = property.images.map((img: any) => ({
      ...img,
      url: fixImagePath(img.url) || img.url
    }));
  }
  
  return property;
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const filters = parseParams(req.nextUrl.searchParams);
    const result = await getProperties(filters);
    
    // ─── FIX IMAGE PATHS ──────────────────────────────────────────────
    if (result.data && Array.isArray(result.data)) {
      result.data = result.data.map((property: any) => fixPropertyImages(property));
    }

    return NextResponse.json(
      {
        success: true,
        ...result,
        meta: {
          ...result.meta,
          timestamp: new Date().toISOString(),
          filters,
        },
      },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[Apartments API]', error?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apartments' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ─── OPTIONS ─────────────────────────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';