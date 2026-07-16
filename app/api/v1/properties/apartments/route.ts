import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { fixPropertiesPrices } from '@/lib/utils/formatPrice';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const listingType = searchParams.get('listing_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const status = searchParams.get('status');
    const featured = searchParams.get('featured') === 'true';
    const keyword = searchParams.get('keyword');
    
    console.log('[Apartments API] Params:', { status, listingType, limit, page });

    const knex = await db();
    
    let query = knex('properties as p')
      .leftJoin('developers as d', 'p.developer_id', 'd.id')
      .leftJoin('users as u', 'p.agent_id', 'u.id')
      .leftJoin('community as c', 'p.community_id', 'c.id')
      .leftJoin('cities as ci', 'p.city_id', 'ci.id')
      .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
      .leftJoin(
        knex('properties_prices')
          .select(
            'property_id',
            knex.raw('MIN(NULLIF(sale_price, 0)) as sale_price'),
            knex.raw('MIN(NULLIF(listing_price, 0)) as listing_price'),
            knex.raw('MIN(NULLIF(rental_price, 0)) as rental_price')
          )
          .groupBy('property_id')
          .as('pp'),
        'p.id',
        'pp.property_id'
      );

    // ✅ Include both status=1 (Active) and status=5 (Off Plan)
    if (status) {
      query = query.where('p.status', parseInt(status));
    } else {
      query = query.whereIn('p.status', [1, 5]);
    }

    // ✅ Only apply listing_type if provided and not "All"
    if (listingType && listingType !== 'All' && listingType !== 'all') {
      query = query.where('p.listing_type', listingType);
    }

    if (featured) {
      query = query.where(function() {
        this.where('p.featured_property', '1')
          .orWhere('p.featured_property', 'yes')
          .orWhere('p.featured_property', 'true');
      });
    }

    if (keyword) {
      query = query.where('p.property_name', 'like', `%${keyword}%`);
    }

    query = query.orderBy('p.created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const properties = await query.select(
      'p.id',
      'p.property_name as name',
      'p.property_slug as slug',
      'p.listing_type',
      'p.status',
      'p.featured_property as featured',
      'p.price',
      'p.bedroom as bedrooms',
      'p.bathrooms',
      'p.area',
      'p.featured_image',
      'p.gallery_media_ids',
      'p.created_at',
      'p.RefNumber as ref_number',
      'd.name as developer_name',
      'u.full_name as agent_name',
      'c.name as community_name',
      'ci.name as city_name',
      'pp.sale_price',
      'pp.listing_price',
      'pp.rental_price'
    );

    // ✅ Fetch media for gallery IDs
    const allMediaIds: number[] = [];
    for (const p of properties) {
      if (p.gallery_media_ids) {
        const ids = p.gallery_media_ids.split(',').map((id: string) => parseInt(id.trim(), 10));
        allMediaIds.push(...ids);
      }
    }

    const mediaMap = new Map<number, any>();
    if (allMediaIds.length > 0) {
      const uniqueIds = [...new Set(allMediaIds)].filter(id => id > 0);
      const mediaRecords = await knex('media')
        .whereIn('id', uniqueIds)
        .where('status', 1)
        .select('id', 'path', 'title', 'description', 'featured', 'media_order');
      
      for (const m of mediaRecords) {
        mediaMap.set(m.id, m);
      }
    }

    // Get total count
    let countQuery = knex('properties');
    if (status) {
      countQuery = countQuery.where('status', parseInt(status));
    } else {
      countQuery = countQuery.whereIn('status', [1, 5]);
    }
    if (listingType && listingType !== 'All' && listingType !== 'all') {
      countQuery = countQuery.where('listing_type', listingType);
    }
    if (featured) {
      countQuery = countQuery.where(function() {
        this.where('featured_property', '1')
          .orWhere('featured_property', 'yes')
          .orWhere('featured_property', 'true');
      });
    }
    if (keyword) {
      countQuery = countQuery.where('property_name', 'like', `%${keyword}%`);
    }
    const [countResult] = await countQuery.count('* as total');
    const total = Number(countResult?.total || 0);

    console.log('[Apartments API] Found:', properties.length, 'Total:', total);

    // ✅ Transform with proper image URLs
    const data = properties.map((p: any) => {
      // ✅ Build gallery images from mediaMap
      const galleryIds = p.gallery_media_ids ? 
        p.gallery_media_ids.split(',').map((id: string) => parseInt(id.trim(), 10)) : 
        [];
      
      // ✅ Create gallery URLs with proper path from mediaMap
      const galleryUrls = galleryIds
        .map((id: number) => mediaMap.get(id))
        .filter(Boolean)
        .map((m: any) => `https://acasa.ae/upload/media/${m.path}`);

      // ✅ Featured image - try to get from mediaMap
      let featuredImage = null;
      if (p.featured_image) {
        if (p.featured_image.includes('.') || p.featured_image.includes('/')) {
          featuredImage = `https://acasa.ae/upload/media/${p.featured_image}`;
        } else {
          const mediaId = parseInt(p.featured_image, 10);
          if (!isNaN(mediaId) && mediaMap.has(mediaId)) {
            const media = mediaMap.get(mediaId);
            featuredImage = `https://acasa.ae/upload/media/${media.path}`;
          }
        }
      }
      
      if (!featuredImage && galleryUrls.length > 0) {
        featuredImage = galleryUrls[0];
      }

      const priceAmount = p.sale_price || p.price;
      const isPriceOnRequest = !priceAmount || priceAmount === 0;

      return {
        id: p.id,
        name: p.name || 'Property',
        slug: p.slug || '',
        listing_type: p.listing_type || null,
        status: p.status,
        featured: Boolean(p.featured),
        created_at: p.created_at,
        ref_number: p.ref_number || null,
        price: {
          amount: priceAmount ? Number(priceAmount) : null,
          display: isPriceOnRequest ? 'Price on Request' : `AED ${Number(priceAmount).toLocaleString()}`,
          currency: 'AED',
          symbol: 'AED',
          is_price_on_request: isPriceOnRequest,
          sale_price: p.sale_price ? Number(p.sale_price) : null,
        },
        bedrooms: p.bedrooms || 'Studio',
        bathrooms: p.bathrooms || '1 Bath',
        display_title: `${p.bedrooms || 'Studio'} | ${p.bathrooms || '1 Bath'} | ${p.area ? Number(p.area).toLocaleString() : 'N/A'} sq. ft.`,
        area: {
          value: p.area ? Number(p.area) : null,
          display: p.area ? `${Number(p.area).toLocaleString()} sq. ft.` : 'Area on Request',
        },
        location: {
          community: p.community_name || null,
          city: p.city_name || 'Dubai',
        },
        developer: {
          name: p.developer_name || null,
        },
        agent: {
          name: p.agent_name || null,
        },
        featured_image: featuredImage,
        gallery_urls: galleryUrls,
        images: galleryIds
          .map((id: number) => mediaMap.get(id))
          .filter(Boolean)
          .map((m: any) => ({
            id: m.id,
            url: `https://acasa.ae/upload/media/${m.path}`,
            title: m.title || null,
            description: m.description || null,
            featured: m.featured || 0,
          })),
        gallery_preview: galleryUrls.slice(0, 3),
        amenities: [],
        payment_plans: [],
        project_id: null,
      };
    });

    const fixedData = fixPropertiesPrices(data);

    return NextResponse.json({
      success: true,
      data: fixedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
        filters: {
          status: status || '1,5 (Active + Off Plan)',
          listing_type: listingType || 'All',
          featured: featured || false,
        },
      },
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[Apartments API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';