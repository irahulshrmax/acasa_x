// app/api/v1/properties/apartments/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { fixPropertyPrice, formatPriceDisplay } from '@/lib/utils/formatPrice';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// ─── CONSTANTS ──────────────────────────────────────────────────────────
const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

// ─── FIX IMAGE PATH ─────────────────────────────────────────────────────
function fixImagePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Clean the URL
  imageUrl = imageUrl.trim();
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Fix path: upload/ -> upload/media/
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
    property.gallery_urls = property.gallery_urls
      .map((url: string) => fixImagePath(url))
      .filter(Boolean);
  }
  
  // Fix gallery_preview
  if (property.gallery_preview && Array.isArray(property.gallery_preview)) {
    property.gallery_preview = property.gallery_preview
      .map((url: string) => fixImagePath(url))
      .filter(Boolean);
  }
  
  // Fix images array
  if (property.images && Array.isArray(property.images)) {
    property.images = property.images
      .map((img: any) => ({
        ...img,
        url: fixImagePath(img.url) || img.url
      }))
      .filter((img: any) => img.url);
  }
  
  return property;
}

// ─── FIX PRICE WITH STRONG LOGIC ──────────────────────────────────────
function fixPropertyPriceStrong(property: any): any {
  if (!property) return property;

  // If price doesn't exist, create it
  if (!property.price) {
    property.price = {
      amount: null,
      amount_end: null,
      display: FALLBACK_DISPLAY,
      display_end: '',
      currency: DEFAULT_CURRENCY,
      symbol: DEFAULT_SYMBOL,
      is_price_on_request: true,
      sale_price: null,
      listing_price: null,
      rental_price: null,
    };
    return property;
  }

  const price = property.price;

  // ─── TRY TO GET AMOUNT FROM VARIOUS SOURCES ──────────────────────
  let amount = null;
  
  // Check all possible price fields
  if (price.amount && price.amount !== 'null' && !isNaN(parseFloat(price.amount))) {
    amount = parseFloat(price.amount);
  } else if (price.sale_price && price.sale_price !== 'null' && !isNaN(parseFloat(price.sale_price))) {
    amount = parseFloat(price.sale_price);
  } else if (price.listing_price && price.listing_price !== 'null' && !isNaN(parseFloat(price.listing_price))) {
    amount = parseFloat(price.listing_price);
  } else if (price.rental_price && price.rental_price !== 'null' && !isNaN(parseFloat(price.rental_price))) {
    amount = parseFloat(price.rental_price);
  } else if (price.amount_from && price.amount_from !== 'null' && !isNaN(parseFloat(price.amount_from))) {
    amount = parseFloat(price.amount_from);
  }

  // Store the amount
  price.amount = amount;

  // ─── GET CURRENCY AND SYMBOL ──────────────────────────────────────
  let currency = price.currency || DEFAULT_CURRENCY;
  let symbol = price.symbol || DEFAULT_SYMBOL;

  // Clean up null strings
  if (currency === 'null' || !currency) currency = DEFAULT_CURRENCY;
  if (symbol === 'null' || !symbol) symbol = DEFAULT_SYMBOL;

  price.currency = currency;
  price.symbol = symbol;

  // ─── GENERATE DISPLAY ─────────────────────────────────────────────
  if (amount && amount > 0) {
    // Format the amount with proper locale
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Use symbol if available, otherwise use currency code
    const prefix = (symbol && symbol !== 'null') ? symbol : currency;
    price.display = `${prefix} ${formattedAmount}`;

    // If there's an end amount, add range
    let amountEnd = null;
    if (price.amount_end && price.amount_end !== 'null' && !isNaN(parseFloat(price.amount_end))) {
      amountEnd = parseFloat(price.amount_end);
    } else if (price.amount_to && price.amount_to !== 'null' && !isNaN(parseFloat(price.amount_to))) {
      amountEnd = parseFloat(price.amount_to);
    }

    if (amountEnd && amountEnd > 0 && amountEnd !== amount) {
      const formattedEnd = Number(amountEnd).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      price.display = `${prefix} ${formattedAmount} - ${formattedEnd}`;
      price.display_end = `${prefix} ${formattedEnd}`;
      price.amount_end = amountEnd;
    }

    price.is_price_on_request = false;
  } else {
    // No valid amount found
    price.display = FALLBACK_DISPLAY;
    price.is_price_on_request = true;
  }

  // ─── FIX AMOUNT_END ───────────────────────────────────────────────
  if (!price.amount_end || price.amount_end === 'null') {
    price.amount_end = null;
  }

  return property;
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    console.log('🔍 [Property Detail] Fetching slug:', slug);
    
    const knex = await db();
    
    // ─── SEARCH PROPERTY ─────────────────────────────────────────────
    let property = await knex('properties')
      .where('property_slug', slug)
      .first();
    
    // If not found, try LIKE search
    if (!property) {
      console.log('🔍 [Property Detail] Trying LIKE search...');
      property = await knex('properties')
        .where('property_slug', 'like', `%${slug}%`)
        .first();
    }
    
    // If still not found, try to extract ID from slug
    if (!property) {
      const idMatch = slug.match(/ln(\d+)/i) || slug.match(/property-(\d+)/i) || slug.match(/-(\d+)$/);
      if (idMatch && idMatch[1]) {
        const id = parseInt(idMatch[1]);
        console.log(`🔍 [Property Detail] Trying ID search: ${id}`);
        property = await knex('properties').where('id', id).first();
      }
    }
    
    console.log('📡 [Property Detail] Found:', property ? 'YES' : 'NO');
    
    if (!property) {
      // Check if this is a project
      const project = await knex('project_listing')
        .where('project_slug', slug)
        .first();
      
      if (project) {
        console.log('📡 [Property Detail] Found as PROJECT:', project.ProjectName);
        
        // Fix project price
        let projectPrice = null;
        if (project.price) {
          const amount = parseFloat(project.price);
          if (!isNaN(amount) && amount > 0) {
            projectPrice = {
              amount: amount,
              amount_end: null,
              display: `AED ${amount.toLocaleString()}`,
              display_end: '',
              currency: 'AED',
              symbol: 'AED',
              is_price_on_request: false,
              sale_price: amount,
              listing_price: amount,
              rental_price: null,
            };
          }
        }

        if (!projectPrice) {
          projectPrice = {
            amount: null,
            amount_end: null,
            display: FALLBACK_DISPLAY,
            display_end: '',
            currency: 'AED',
            symbol: 'AED',
            is_price_on_request: true,
            sale_price: null,
            listing_price: null,
            rental_price: null,
          };
        }
        
        return NextResponse.json({
          success: true,
          data: {
            id: project.id,
            property_name: project.ProjectName,
            property_slug: project.project_slug || slug,
            listing_type: project.listing_type || 'Off plan',
            price: projectPrice,
            bedrooms: project.bedroom,
            description: project.Description,
            developer_name: 'Developer',
            location: {
              city: project.CityName || 'Dubai',
              community: project.LocationName,
            },
            gallery_images: [],
            featured_image: project.featured_image || project.LogoUrl,
          },
          type: 'project',
        }, { headers: CORS_HEADERS });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found',
          slug: slug 
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    
    // ─── TRANSFORM PROPERTY ──────────────────────────────────────────
    const transformedProperty = {
      id: property.id,
      property_name: property.property_name || property.name || 'Property',
      property_slug: property.property_slug || slug,
      listing_type: property.listing_type || 'Off plan',
      occupancy: property.occupancy,
      status: property.status || 5,
      featured: property.featured_property === '1' || property.featured_property === 'yes',
      created_at: property.created_at,
      completion_date: property.completion_date,
      exclusive_status: property.exclusive_status,
      dld_permit: property.dld_permit,
      ref_number: property.RefNumber || property.ref_number,
      rera_number: property.ReraNumber || property.rera_number,
      price: {
        // Try to get price from multiple sources
        amount: property.price ? parseFloat(property.price) : 
                property.sale_price ? parseFloat(property.sale_price) :
                property.listing_price ? parseFloat(property.listing_price) :
                property.amount ? parseFloat(property.amount) : null,
        amount_end: property.price_end ? parseFloat(property.price_end) :
                    property.amount_end ? parseFloat(property.amount_end) : null,
        display: property.price_display || null,
        display_end: null,
        currency: property.currency || 'AED',
        symbol: property.symbol || 'AED',
        is_price_on_request: !property.price && !property.sale_price && !property.listing_price,
        sale_price: property.sale_price ? parseFloat(property.sale_price) : null,
        listing_price: property.listing_price ? parseFloat(property.listing_price) : null,
        rental_price: property.rental_price ? parseFloat(property.rental_price) : null,
      },
      bedrooms: property.bedroom || 'Studio',
      bathrooms: property.bathrooms || '1',
      area: {
        value: property.area ? parseFloat(property.area) : null,
        display: property.area ? `${property.area} sq.ft` : null,
        size: property.area_size,
      },
      location: {
        community: property.community_name || property.location || null,
        city: property.city_name || 'Dubai',
        address: property.address || property.location,
        latitude: property.map_latitude,
        longitude: property.map_longitude,
      },
      developer: {
        name: property.developer_name || property.developer || null,
      },
      agent: {
        name: property.agent_name || null,
        phone: property.agent_phone || null,
      },
      featured_image: property.featured_image || property.imageurl || property.img,
      images: [],
      gallery_urls: property.gallery_media_ids 
        ? property.gallery_media_ids.split(',').map((id: string) => `/upload/media/property-${id}.webp`) 
        : [],
      gallery_preview: [],
      description: property.description || property.descriptions,
      amenities: property.amenities ? property.amenities.split(',').map((a: string) => a.trim()) : [],
      furnishing: property.furnishing,
      parking: property.parking,
      video_url: property.video_url,
      payment_plans: [],
      display_title: `${property.bedroom || 'Studio'} | ${property.bathrooms || '1'} Bath | ${property.area || 'N/A'} sq.ft`,
    };
    
    // ─── FIX PRICE WITH STRONG LOGIC ────────────────────────────────
    const fixedProperty = fixPropertyPriceStrong(transformedProperty);
    
    // ─── FIX IMAGES ──────────────────────────────────────────────────
    const finalProperty = fixPropertyImages(fixedProperty);
    
    console.log('✅ [Property Detail] Returning:', finalProperty.property_name);
    console.log('💰 [Property Detail] Price:', finalProperty.price?.display);
    
    return NextResponse.json(
      {
        success: true,
        data: finalProperty,
      },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ [Property Detail API]', error?.message, error?.stack);
    
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch property',
        ...(isDev && { details: error?.message }),
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