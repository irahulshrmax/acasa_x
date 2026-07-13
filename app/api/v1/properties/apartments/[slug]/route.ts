import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── FIX IMAGE PATH ─────────────────────────────────────────────────────
function fixImagePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.includes('upload/') && !imageUrl.includes('/media/')) {
    return imageUrl.replace('upload/', 'upload/media/');
  }
  return imageUrl;
}

function fixPropertyImages(property: any): any {
  if (!property) return property;
  
  if (property.featured_image) {
    property.featured_image = fixImagePath(property.featured_image);
  }
  
  if (property.gallery_urls && Array.isArray(property.gallery_urls)) {
    property.gallery_urls = property.gallery_urls.map((url: string) => fixImagePath(url) || url);
  }
  
  if (property.gallery_preview && Array.isArray(property.gallery_preview)) {
    property.gallery_preview = property.gallery_preview.map((url: string) => fixImagePath(url) || url);
  }
  
  if (property.images && Array.isArray(property.images)) {
    property.images = property.images.map((img: any) => ({
      ...img,
      url: fixImagePath(img.url) || img.url
    }));
  }
  
  return property;
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }  // ← YAHAN CHANGE: Promise type
) {
  try {
    // ─── IMPORTANT: await params ──────────────────────────────────────
    const { slug } = await params;  // ← YAHAN await LAGANA HAI
    
    console.log('===== FETCHING PROPERTY =====');
    console.log('Slug:', slug);
    
    // ─── DATABASE SE FETCH KARO ──────────────────────────────────────
    // NOTE: Database mein column name `property_slug` nahi hai, `slug` hai
    // Apne database model ke hisaab se column name change karo
    
    // Example with your database:
    // const property = await db('properties').where('slug', slug).first();
    
    // Temporary: All properties se filter
    const allPropertiesRes = await fetch(
      `http://localhost:3000/api/v1/properties/apartments?page=1&limit=100&listing_type=Off plan&status=5`,
      {
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
    
    const allPropertiesData = await allPropertiesRes.json();
    
    if (!allPropertiesData.success) {
      throw new Error('Failed to fetch properties');
    }
    
    // Find property by slug - database mein column name `slug` hai
    const property = allPropertiesData.data.find(
      (p: any) => p.slug === slug  // ← `property_slug` nahi, `slug` use karo
    );
    
    console.log('Property found:', property ? 'YES' : 'NO');
    
    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found',
          slug: slug 
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    
    // Transform to match detail page interface
    const transformedProperty = {
      id: property.id,
      property_name: property.name,
      property_slug: property.slug,
      listing_type: property.listing_type,
      occupancy: property.occupancy,
      status: property.status,
      featured: property.featured,
      created_at: property.created_at,
      completion_date: property.completion_date,
      exclusive_status: property.exclusive_status,
      dld_permit: property.dld_permit,
      ref_number: property.ref_number,
      rera_number: property.rera_number,
      price: {
        amount: property.price?.amount,
        display: property.price?.display,
        currency: property.price?.currency,
        symbol: property.price?.symbol,
        is_price_on_request: property.price?.is_price_on_request || false,
      },
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: {
        value: property.area?.value,
        display: property.area?.display,
        size: property.area?.size,
        min_area: property.area?.min_area,
        max_area: property.area?.max_area,
      },
      location: {
        community: property.location?.community,
        city: property.location?.city || 'Dubai',
        address: property.location?.address,
        latitude: property.location?.latitude,
        longitude: property.location?.longitude,
        community_id: property.location?.community_id,
        community_slug: property.location?.community_slug,
        sub_community: property.location?.sub_community,
        landmark: property.location?.landmark,
      },
      developer: {
        id: property.developer?.id,
        name: property.developer?.name,
        logo: property.developer?.logo_url,
        country: property.developer?.country,
        website: property.developer?.website,
        informations: property.developer?.informations,
        is_international: property.developer?.is_international,
      },
      agent: {
        id: property.agent?.id,
        name: property.agent?.name,
        phone: property.agent?.phone,
        photo: property.agent?.photo_url,
        rera_brn: property.agent?.rera_brn,
        email: property.agent?.email,
        mobile: property.agent?.mobile,
        about: property.agent?.about,
      },
      featured_image: property.featured_image,
      images: property.images,
      gallery_images: property.gallery_urls || [],
      gallery_urls: property.gallery_urls || [],
      gallery_preview: property.gallery_preview || [],
      description: property.description || null,
      amenities: property.amenities || [],
      furnishing: property.furnishing,
      flooring: property.flooring,
      parking: property.parking,
      video_url: property.video_url,
      whatsapp_url: property.whatsapp_url,
      payment_plans: property.payment_plans || [],
      display_title: property.display_title,
      facilities: property.facilities,
      seo: {
        title: property.name,
        description: property.description,
        keywords: property.keywords,
        slug: property.slug,
      },
    };
    
    // Fix image paths
    const fixedProperty = fixPropertyImages(transformedProperty);
    
    console.log('Returning property:', fixedProperty.property_name);
    
    return NextResponse.json(
      {
        success: true,
        data: fixedProperty,
      },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[Property Detail API]', error?.message);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch property',
        details: error?.message 
      },
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