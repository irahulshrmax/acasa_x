import { NextRequest, NextResponse } from 'next/server';
import { 
  getOffPlanPropertyBySlug,
  getOffPlanPropertyById,
  getOffPlanProperties,
} from '@/lib/models/properties';

interface PropertyPrice {
  amount: number | null;
  amount_end?: number | null;
  display: string;
  display_end?: string | null;
  currency: string;
  symbol?: string;
  is_price_on_request: boolean;
  sale_price?: string | null;
  listing_price?: string | null;
  rental_price?: string | null;
}

interface PropertyArea {
  value: number | null;
  size: string | null;
  display: string;
  min_area?: string | null;
  max_area?: string | null;
  area_end?: string | null;
}

interface PropertyLocation {
  community: string | null;
  community_slug: string | null;
  sub_community: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  community_id?: number | null;
}

interface PropertyDeveloper {
  id: number | null;
  name: string | null;
  country: string | null;
  website: string | null;
  informations: string | null;
  logo_url: string | null;
  is_international: boolean;
  logo_variations?: string[];
}

interface PropertyAgent {
  id: number | null;
  name: string | null;
  phone: string | null;
  photo_url: string | null;
  photo_variations?: string[];
  rera_brn?: string | null;
  email?: string | null;
  mobile?: string | null;
  about?: string | null;
}

interface PropertyImage {
  id?: number;
  path?: string | null;
  full_url?: string;
  title?: string | null;
  description?: string | null;
  featured?: number | null;
  media_order?: number | null;
  url_variations?: string[];
}

interface PaymentPlan {
  id: number;
  name: string | null;
  percentage: string | null;
  item_id: number | null;
  item_type?: string | null;
  status?: number | null;
}

interface PropertySEO {
  title: string;
  description: string | null;
  slug: string | null;
}

interface OffPlanDetails {
  completion_date: string | null;
  occupancy: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  rera_number: string | null;
}

interface PropertyResponse {
  id: number;
  property_name: string;
  property_slug: string;
  listing_type: string | null;
  property_type: string | null;
  property_purpose: string | null;
  status: number;
  featured: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  price: PropertyPrice;
  bedrooms: string;
  bathrooms: string;
  area: PropertyArea;
  location: PropertyLocation;
  developer: PropertyDeveloper;
  agent: PropertyAgent;
  images: PropertyImage[];
  featured_image_url: string;
  gallery_images: string[];
  gallery_preview: string[];
  media_base_url: string;
  description: string | null;
  video_url: string | null;
  furnishing: string | null;
  amenities: string[];
  payment_plans: PaymentPlan[];
  facilities: any;
  location_data: any;
  is_off_plan: boolean;
  off_plan_details: OffPlanDetails;
  ref_number: string | null;
  display_title: string;
  seo: PropertySEO;
  similar_properties: any[];
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300;

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL * 1000) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCached(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(pattern?: string): void {
  if (pattern) {
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    
    const includeSimilar = searchParams.get('similar') !== 'false';
    const similarLimit = parseInt(searchParams.get('similar_limit') || '6', 10);

    const cacheKey = `offplan:property:${idOrSlug}`;
    let cachedProperty = getCached(cacheKey);
    
    if (cachedProperty) {
      return NextResponse.json({
        success: true,
        data: cachedProperty,
        cached: true,
        meta: { timestamp: new Date().toISOString() }
      });
    }

    let property: any;

    if (!isNaN(parseInt(idOrSlug))) {
      property = await getOffPlanPropertyById(parseInt(idOrSlug));
    } else {
      property = await getOffPlanPropertyBySlug(idOrSlug);
    }

    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Off-plan property not found',
          error: `No off-plan property found for: ${idOrSlug}`
        },
        { status: 404 }
      );
    }

    const responseData: PropertyResponse = {
      id: property.id,
      property_name: property.property_name || property.name || 'Property',
      property_slug: property.property_slug || property.slug || '',
      listing_type: property.listing_type || null,
      property_type: property.property_type || null,
      property_purpose: property.property_purpose || null,
      status: property.status || 5,
      featured: property.featured_property === '1' || property.featured === true,
      created_at: property.created_at || null,
      updated_at: property.updated_at || null,
      
      price: property.price || {
        amount: null,
        display: 'Price on Request',
        currency: 'AED',
        symbol: 'AED',
        is_price_on_request: true,
      },
      
      bedrooms: property.bedrooms || property.bedroom || 'Studio',
      bathrooms: property.bathrooms || '1 Bath',
      
      area: property.area || {
        value: null,
        display: 'Area on Request',
        size: null,
      },
      
      location: property.location || {
        community: null,
        community_slug: null,
        sub_community: null,
        city: null,
        latitude: property.map_latitude || null,
        longitude: property.map_longitude || null,
        community_id: property.community_id || null,
      },
      
      developer: property.developer || {
        id: null,
        name: null,
        country: null,
        website: null,
        informations: null,
        logo_url: null,
        is_international: false,
      },
      
      agent: property.agent || {
        id: null,
        name: null,
        phone: null,
        photo_url: null,
        rera_brn: null,
        email: null,
        mobile: null,
        about: null,
      },
      
      images: property.images || [],
      featured_image_url: property.featured_image_url || property.image || '',
      gallery_images: property.gallery_images || [],
      gallery_preview: property.gallery_preview || [],
      media_base_url: property.media_base_url || 'https://acasa.ae/upload',
      
      description: property.description || null,
      video_url: property.video_url || null,
      furnishing: property.furnishing || null,
      amenities: property.amenities || [],
      
      payment_plans: property.payment_plans || [],
      
      facilities: property.facilities || null,
      location_data: property.location_data || null,
      
      is_off_plan: true,
      off_plan_details: {
        completion_date: property.completion_date || null,
        occupancy: property.occupancy || null,
        exclusive_status: property.exclusive_status || null,
        dld_permit: property.dld_permit || null,
        rera_number: property.ReraNumber || null,
      },
      
      ref_number: property.RefNumber || property.ref_number || null,
      display_title: property.display_title || property.property_name || 'Property',
      
      seo: {
        title: property.seo_title || property.property_name || 'Property',
        description: property.meta_description || property.description?.slice(0, 160) || null,
        slug: property.property_slug || '',
      },
      
      similar_properties: [],
    };

    if (includeSimilar) {
      try {
        let similarResult: { data: any[]; meta: any } = { data: [], meta: {} };
        const currentPropertyId = property.id;

        if (property.community_id) {
          const result = await getOffPlanProperties({
            community_id: property.community_id,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length && property.property_type) {
          const result = await getOffPlanProperties({
            property_type: property.property_type,
            status: 5,
            limit: similarLimit + 1,
            page: 1,
          });
          similarResult = result;
        }
        
        if (!similarResult.data.length) {
          const result = await getOffPlanProperties({
            status: 5,
            limit: similarLimit + 1,
            page: 1,
            sort_by: 'newest',
          });
          similarResult = result;
        }

        responseData.similar_properties = similarResult.data
          .filter((p: any) => p.id !== currentPropertyId)
          .slice(0, similarLimit);

      } catch (error) {
        responseData.similar_properties = [];
      }
    }

    setCached(cacheKey, responseData);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      meta: {
        id: property.id,
        slug: property.property_slug,
        listing_type: 'Off plan',
        has_similar: responseData.similar_properties.length > 0,
        similar_count: responseData.similar_properties.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch off-plan property', 
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';