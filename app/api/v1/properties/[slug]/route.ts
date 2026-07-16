import { NextRequest, NextResponse } from 'next/server';
import { 
  getPropertyBySlug, 
  getPropertyById,
  getProperties,
  getRelatedProperties,
} from '@/lib/models/properties';
import { db } from '@/lib/database';
import {
  UPLOAD_BASE_URL,
  getImageUrl,
  getImageUrlVariations,
  getFeaturedImage,
  getNoImageUrl,
  getDeveloperImageUrl,
  getDeveloperImageVariations,
  getAgentImageUrl,
  getAgentImageVariations,
  getCommunityImageUrl,
  getCommunityImageVariations,
  getMediaImageUrl,
  getGalleryImages,
  isValidImageUrl,
  validateImagePath,
  sanitizeImagePath,
  IMAGE_EXTENSIONS,
  PROPERTY_IMAGE_DIRS,
  USER_IMAGE_DIRS,
  AGENT_IMAGE_DIRS,
  COMMUNITY_IMAGE_DIRS,
  BLOG_IMAGE_DIRS,
  TESTIMONIAL_IMAGE_DIRS,
  extractImageUrls,
  processImageBatch,
  getProjectImageCandidates,
  getProjectImageUrl,
  getProjectImageVariations,
  getProjectGalleryImageUrl,
  getProjectGalleryImages,
  getProjectLogoUrl,
  getProjectFeaturedImage,
  buildProjectImageSet,
} from '@/lib/image-resolver';
import { fixPropertyPrice } from '@/lib/utils/formatPrice';

interface PropertyPrice {
  amount: number | null;
  amount_end: number | null;
  display: string;
  display_end: string;
  currency: string;
  symbol: string;
  is_price_on_request: boolean;
  sale_price: number | null;
  listing_price: number | null;
  rental_price: number | null;
}

interface PropertyArea {
  value: number | null;
  display: string;
  size: string | null;
  min_area: number | null;
  max_area: number | null;
  area_end: number | null;
}

interface PropertyLocation {
  community: string | null;
  community_slug: string | null;
  sub_community: string | null;
  city: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  community_id: number | null;
  city_id: number | null;
  community_image: string | null;
  community_image_variations: string[];
}

interface PropertyDeveloper {
  id: number | null;
  name: string | null;
  country: string | null;
  is_international: boolean;
  logo_url: string | null;
  logo_variations: string[];
  website: string | null;
  informations: string | null;
}

interface PropertyAgent {
  id: number | null;
  name: string | null;
  phone: string | null;
  photo_url: string | null;
  photo_variations: string[];
  rera_brn: string | null;
  email: string | null;
  mobile: string | null;
  about: string | null;
}

interface PropertyImage {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  featured: number;
}

interface PropertyResponse {
  id: number;
  name: string;
  slug: string;
  listing_type: string | null;
  occupancy: string | null;
  status: number;
  featured: boolean;
  created_at: string | null;
  updated_at: string | null;
  completion_date: string | null;
  exclusive_status: string | null;
  dld_permit: string | null;
  ref_number: string | null;
  rera_number: string | null;
  price: PropertyPrice;
  bedrooms: string;
  bathrooms: string;
  area: PropertyArea;
  location: PropertyLocation;
  developer: PropertyDeveloper;
  agent: PropertyAgent;
  featured_image: string | null;
  featured_image_variations: string[];
  images: PropertyImage[];
  gallery_urls: string[];
  gallery_preview: string[];
  media_base_url: string;
  description: string | null;
  amenities: string[];
  furnishing: string | null;
  flooring: string | null;
  parking: string | null;
  video_url: string | null;
  payment_plans: any[];
  display_title: string;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    slug: string;
  };
  similar_properties: any[];
  image_candidates: {
    featured: string[];
    gallery: string[];
    community: string[];
  };
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (typeof value === 'string') {
    if (/price on request|poa|contact|upon request|call|ask/i.test(value.trim())) return null;
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    return isFinite(num) ? num : null;
  }
  return null;
}

function parseCommaIds(ids: string | null | undefined): number[] {
  if (!ids) return [];
  return ids
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

function formatPrice(
  amount: number | string | null | undefined,
  currency = 'AED',
  symbol = 'AED'
): string {
  const num = parseNumber(amount);
  if (num === null) return 'Price on Request';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const cur = symbol || currency;
  if (['AED', 'د.إ'].includes(cur)) return `AED ${formatted}`;
  if (['USD', '$'].includes(cur)) return `$${formatted}`;
  if (['EUR', '€'].includes(cur)) return `€${formatted}`;
  if (['GBP', '£'].includes(cur)) return `£${formatted}`;
  return `${cur} ${formatted}`;
}

function parseBedroom(val: string | null | undefined): string {
  if (!val) return 'Studio';
  const t = val.trim();
  if (/studio/i.test(t)) return 'Studio';
  const match = t.match(/^(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    return `${n} Bedroom${n !== 1 ? 's' : ''}`;
  }
  return t;
}

function parseBathroom(val: string | null | undefined): string {
  if (!val) return '1 Bath';
  const t = val.trim();
  if (/studio/i.test(t)) return '1 Bath';
  const match = t.match(/^(\d+\.?\d*)/);
  if (match) {
    const n = parseFloat(match[1]);
    if (n === 0) return '1 Bath';
    return `${n} Bath${n !== 1 ? 's' : ''}`;
  }
  return '1 Bath';
}

function parseArea(area: number | null | undefined, areaSize: string | null | undefined): string {
  if (area && area > 0) return `${area.toLocaleString('en-US')} sq. ft.`;
  if (areaSize) {
    const n = parseFloat(areaSize);
    if (!isNaN(n) && n > 0) return `${n.toLocaleString('en-US')} sq. ft.`;
  }
  return 'Area on Request';
}

function parseAmenities(amenities: any): string[] {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities;
  if (typeof amenities === 'string') {
    return amenities.split(',').map((a: string) => a.trim()).filter(Boolean);
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    let property = await getPropertyBySlug(slug);
    
    if (!property) {
      const knex = await db();
      const dbProperty = await knex('properties')
        .where('property_slug', 'like', `%${slug}%`)
        .orWhere('slug', 'like', `%${slug}%`)
        .first();
      
      if (dbProperty) {
        property = await getPropertyById(dbProperty.id);
      }
    }

    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Property not found',
          slug: slug 
        },
        { status: 404 }
      );
    }

    property = fixPropertyPrice(property);

    const priceAmount = parseNumber(property.price?.amount || property.price);
    const priceEndAmount = parseNumber(property.price?.amount_end);
    const salePrice = parseNumber(property.price?.sale_price);
    const listingPrice = parseNumber(property.price?.listing_price);
    const rentalPrice = parseNumber(property.price?.rental_price);
    
    const areaValue = parseNumber(property.area?.value || property.area);
    const areaSize = property.area?.size || null;
    const minArea = parseNumber(property.area?.min_area);
    const maxArea = parseNumber(property.area?.max_area);
    const areaEnd = parseNumber(property.area?.area_end);
    
    const amenities = parseAmenities(property.amenities);
    
    // ✅ Get gallery images from property.images
    const galleryImages = property.images || [];
    const galleryUrls = galleryImages.map((img: any) => img.url || getMediaImageUrl(img.path));
    const galleryPreview = galleryUrls.slice(0, 3);
    
    // ✅ Featured image
    const featuredImage = getFeaturedImage(
      property.featured_image,
      galleryUrls
    );
    
    const communityImage = property.location?.community_image || null;
    let communityImageUrl: string | null = null;
    let communityImageVariations: string[] = [];
    
    if (communityImage) {
      const communityUrls = getCommunityImageUrl(communityImage);
      if (Array.isArray(communityUrls)) {
        communityImageUrl = communityUrls[0] || null;
        communityImageVariations = communityUrls;
      } else {
        communityImageUrl = communityUrls || null;
        communityImageVariations = communityImageUrl ? [communityImageUrl] : [];
      }
    }

    const responseData: PropertyResponse = {
      id: property.id,
      name: property.name || 'Property',
      slug: property.slug || '',
      listing_type: property.listing_type || null,
      occupancy: property.occupancy || null,
      status: property.status || 5,
      featured: property.featured || false,
      created_at: property.created_at || null,
      updated_at: property.updated_at || null,
      completion_date: property.completion_date || null,
      exclusive_status: property.exclusive_status || null,
      dld_permit: property.dld_permit || null,
      ref_number: property.ref_number || null,
      rera_number: property.rera_number || null,
      
      price: {
        amount: priceAmount,
        amount_end: priceEndAmount,
        display: formatPrice(priceAmount, property.price?.currency || 'AED', property.price?.symbol || 'AED'),
        display_end: formatPrice(priceEndAmount, property.price?.currency || 'AED', property.price?.symbol || 'AED'),
        currency: property.price?.currency || 'AED',
        symbol: property.price?.symbol || 'AED',
        is_price_on_request: priceAmount === null,
        sale_price: salePrice,
        listing_price: listingPrice,
        rental_price: rentalPrice,
      },
      
      bedrooms: parseBedroom(property.bedrooms || property.bedroom),
      bathrooms: parseBathroom(property.bathrooms || property.bathroom),
      
      area: {
        value: areaValue,
        display: parseArea(areaValue, areaSize),
        size: areaSize,
        min_area: minArea,
        max_area: maxArea,
        area_end: areaEnd,
      },
      
      location: {
        community: property.location?.community || null,
        community_slug: property.location?.community_slug || null,
        sub_community: property.location?.sub_community || null,
        city: property.location?.city || 'Dubai',
        address: property.location?.address || null,
        latitude: property.location?.latitude || null,
        longitude: property.location?.longitude || null,
        community_id: property.location?.community_id || null,
        city_id: property.location?.city_id || null,
        community_image: communityImageUrl,
        community_image_variations: communityImageVariations,
      },
      
      developer: {
        id: property.developer?.id || null,
        name: property.developer?.name || null,
        country: property.developer?.country || null,
        is_international: property.developer?.is_international || false,
        logo_url: property.developer?.logo_url || null,
        logo_variations: property.developer?.logo_variations || [],
        website: property.developer?.website || null,
        informations: property.developer?.informations || null,
      },
      
      agent: {
        id: property.agent?.id || null,
        name: property.agent?.name || null,
        phone: property.agent?.phone || null,
        photo_url: property.agent?.photo_url || null,
        photo_variations: property.agent?.photo_variations || [],
        rera_brn: property.agent?.rera_brn || null,
        email: property.agent?.email || null,
        mobile: property.agent?.mobile || null,
        about: property.agent?.about || null,
      },
      
      featured_image: featuredImage,
      featured_image_variations: getImageUrlVariations(property.featured_image || galleryUrls[0] || null),
      
      // ✅ Use galleryImages from property
      images: galleryImages.map((img: any) => ({
        id: img.id || 0,
        url: img.url || getMediaImageUrl(img.path),
        title: img.title || null,
        description: img.description || null,
        featured: img.featured || 0,
      })),
      
      gallery_urls: galleryUrls,
      gallery_preview: galleryPreview,
      media_base_url: UPLOAD_BASE_URL,
      
      description: property.description || null,
      amenities: amenities,
      furnishing: property.furnishing || null,
      flooring: property.flooring || null,
      parking: property.parking || null,
      video_url: property.video_url || null,
      
      payment_plans: property.payment_plans || [],
      
      display_title: `${parseBedroom(property.bedrooms || property.bedroom)} | ${parseBathroom(property.bathrooms || property.bathroom)} | ${parseArea(areaValue, areaSize)}`,
      
      seo: {
        title: property.seo?.title || property.name || null,
        description: property.seo?.description || property.description?.slice(0, 160) || null,
        keywords: property.seo?.keywords || null,
        slug: property.slug || '',
      },
      
      similar_properties: [],
      
      image_candidates: {
        featured: getImageUrlVariations(property.featured_image || galleryUrls[0] || null),
        gallery: galleryUrls,
        community: communityImageVariations,
      },
    };

    // ✅ Similar properties
    try {
      const similarResult = await getProperties({
        listing_type: property.listing_type || 'Off plan',
        status: 5,
        limit: 6,
        page: 1,
      });
      
      responseData.similar_properties = similarResult.data
        .filter((p: any) => p.id !== property.id)
        .slice(0, 3)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area: p.area,
          featured_image: p.featured_image,
          location: p.location,
        }));
    } catch (err) {
      responseData.similar_properties = [];
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        id: property.id,
        slug: property.slug,
        listing_type: property.listing_type,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch property', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300;