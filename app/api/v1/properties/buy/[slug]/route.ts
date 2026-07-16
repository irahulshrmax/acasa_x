// app/api/properties/buy/[slug]/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

// ─── STRONG PRICE FIXER ───────────────────────────────────────────────

function fixPropertyPrice(property: any): any {
  if (!property) return property;

  // If price doesn't exist or is null, create it
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

// ─── FORMAT PRICE FOR DISPLAY ─────────────────────────────────────────

function formatPriceDisplay(price: any): string {
  if (!price) return FALLBACK_DISPLAY;
  
  if (price.display && !price.display.includes('null') && !price.display.startsWith('null ')) {
    return price.display;
  }
  
  const amount = price.amount || price.sale_price || price.listing_price || price.rental_price;
  if (!amount) return FALLBACK_DISPLAY;
  
  const currency = price.currency || DEFAULT_CURRENCY;
  const symbol = price.symbol || DEFAULT_SYMBOL;
  const prefix = (symbol && symbol !== 'null') ? symbol : currency;
  
  return `${prefix} ${Number(amount).toLocaleString()}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const knex = await db();
    let property = null;
    let foundMethod = '';
    
    // METHOD 1: Search by property_slug
    try {
      const result = await knex('properties as p')
        .leftJoin('developers as d', 'p.developer_id', 'd.id')
        .leftJoin('internationaldevelopers as id', 'p.developer_id', 'id.id')
        .leftJoin('users as u', 'p.agent_id', 'u.id')
        .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
        .select(
          'p.*',
          'd.name as developer_name',
          'd.image as developer_image',
          'id.name as international_developer_name',
          'id.image as international_developer_image',
          'u.full_name as agent_name',
          'u.phone as agent_phone',
          'u.photo as agent_photo',
          'u.email as agent_email',
          'u.rera_brn as agent_rera',
          'cur.code as currency_code',
          'cur.simbol as currency_symbol'
        )
        .where('p.property_slug', slug)
        .where('p.status', 5)
        .first();
      
      if (result) {
        property = result;
        foundMethod = 'slug';
      }
    } catch (error: any) {
      console.error("METHOD 1 Error:", error.message);
    }
    
    // METHOD 2: Extract ID from LN123 format
    if (!property) {
      const idMatch = slug.match(/LN(\d+)/i);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        
        try {
          const result = await knex('properties as p')
            .leftJoin('developers as d', 'p.developer_id', 'd.id')
            .leftJoin('internationaldevelopers as id', 'p.developer_id', 'id.id')
            .leftJoin('users as u', 'p.agent_id', 'u.id')
            .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
            .select(
              'p.*',
              'd.name as developer_name',
              'd.image as developer_image',
              'id.name as international_developer_name',
              'id.image as international_developer_image',
              'u.full_name as agent_name',
              'u.phone as agent_phone',
              'u.photo as agent_photo',
              'u.email as agent_email',
              'u.rera_brn as agent_rera',
              'cur.code as currency_code',
              'cur.simbol as currency_symbol'
            )
            .where('p.id', id)
            .where('p.status', 5)
            .first();
          
          if (result) {
            property = result;
            foundMethod = 'id';
          }
        } catch (error: any) {
          console.error("METHOD 2 Error:", error.message);
        }
      }
    }
    
    // METHOD 3: Search by property_name
    if (!property) {
      let searchName = slug
        .replace(/-ln\d+$/i, '')
        .replace(/-/g, ' ');
      
      const removeWords = ['for', 'sale', 'in', 'by', 'city', 'dubai', 'uae', 'apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'bedroom', 'bed', 'bhk'];
      for (const word of removeWords) {
        searchName = searchName.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
      }
      searchName = searchName.trim().replace(/\s+/g, ' ');
      
      try {
        const result = await knex('properties as p')
          .leftJoin('developers as d', 'p.developer_id', 'd.id')
          .leftJoin('internationaldevelopers as id', 'p.developer_id', 'id.id')
          .leftJoin('users as u', 'p.agent_id', 'u.id')
          .leftJoin('currency as cur', 'p.currency_id', 'cur.id')
          .select(
            'p.*',
            'd.name as developer_name',
            'd.image as developer_image',
            'id.name as international_developer_name',
            'id.image as international_developer_image',
            'u.full_name as agent_name',
            'u.phone as agent_phone',
            'u.photo as agent_photo',
            'u.email as agent_email',
            'u.rera_brn as agent_rera',
            'cur.code as currency_code',
            'cur.simbol as currency_symbol'
          )
          .where('p.property_name', 'like', `%${searchName}%`)
          .where('p.status', 5)
          .first();
        
        if (result) {
          property = result;
          foundMethod = 'name_search';
        }
      } catch (error: any) {
        console.error("METHOD 3 Error:", error.message);
      }
    }
    
    if (!property) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Property not found",
          debug: { slug, foundMethod }
        },
        { status: 404 }
      );
    }
    
    // ─── FIX PRICE ──────────────────────────────────────────────────
    // Convert property to have proper price structure
    const priceData = {
      amount: property.price || null,
      amount_end: property.price_end || null,
      display: null,
      display_end: '',
      currency: property.currency_code || 'AED',
      symbol: property.currency_symbol || 'AED',
      is_price_on_request: !property.price || property.price <= 0,
      sale_price: property.sale_price || null,
      listing_price: property.listing_price || null,
      rental_price: property.rental_price || null,
    };

    // Fix the price
    const fixedPriceData = fixPropertyPrice({ price: priceData });
    const formattedPrice = formatPriceDisplay(fixedPriceData.price);
    
    // FETCH MEDIA / GALLERY IMAGES
    let galleryImages: string[] = [];
    let featuredImage: string | null = null;
    
    try {
      const mediaResults = await knex('media')
        .where('module_id', property.id)
        .where('module_type', 'property')
        .where('status', 1)
        .orderBy('media_order', 'asc')
        .orderBy('id', 'asc')
        .select('id', 'path', 'featured');
      
      for (const media of mediaResults) {
        let imageUrl = null;
        
        if (media.path) {
          if (media.path.startsWith('http')) {
            imageUrl = media.path;
          } else if (media.path.startsWith('/')) {
            imageUrl = `https://acasa.ae${media.path}`;
          } else if (media.path.includes('upload/')) {
            imageUrl = `https://acasa.ae/${media.path}`;
          } else {
            const folders = ['media', 'properties', 'property', 'thumbnail', 'gallery'];
            const extensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];
            
            if (media.path.includes('.')) {
              for (const folder of folders) {
                const testUrl = `https://acasa.ae/upload/${folder}/${media.path}`;
                imageUrl = testUrl;
                break;
              }
            } else {
              for (const folder of folders) {
                for (const ext of extensions) {
                  const testUrl = `https://acasa.ae/upload/${folder}/${media.path}${ext}`;
                  if (ext === '.webp') {
                    imageUrl = testUrl;
                    break;
                  }
                }
                if (imageUrl) break;
              }
            }
          }
        }
        
        if (imageUrl) {
          if (media.featured === 1 && !featuredImage) {
            featuredImage = imageUrl;
          }
          if (!galleryImages.includes(imageUrl)) {
            galleryImages.push(imageUrl);
          }
        }
      }
      
      if (property.featured_image) {
        let featuredUrl = property.featured_image;
        if (!featuredUrl.startsWith('http')) {
          if (featuredUrl.startsWith('/')) {
            featuredUrl = `https://acasa.ae${featuredUrl}`;
          } else if (featuredUrl.includes('upload/')) {
            featuredUrl = `https://acasa.ae/${featuredUrl}`;
          } else {
            featuredUrl = `https://acasa.ae/upload/media/${featuredUrl}`;
          }
        }
        if (!featuredImage) {
          featuredImage = featuredUrl;
        }
        if (!galleryImages.includes(featuredUrl)) {
          galleryImages.unshift(featuredUrl);
        }
      }
      
      if (galleryImages.length === 0) {
        const fallbackUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(property.property_name || 'property')},real-estate`;
        galleryImages.push(fallbackUrl);
        featuredImage = featuredImage || fallbackUrl;
      }
      
      galleryImages = [...new Set(galleryImages)];
      
    } catch (error: any) {
      console.error("Error fetching media:", error.message);
      const fallbackUrl = `https://source.unsplash.com/1200x800/?${encodeURIComponent(property.property_name || 'property')},real-estate`;
      galleryImages = [fallbackUrl];
      featuredImage = fallbackUrl;
    }
    
    // FETCH PAYMENT PLANS
    let paymentPlans: any[] = [];
    try {
      const priceRow = await knex('properties_prices')
        .where('property_id', property.id)
        .first();
      
      if (priceRow?.payment_plan_ids) {
        const planIds = priceRow.payment_plan_ids.split(',').filter(Boolean);
        if (planIds.length) {
          paymentPlans = await knex('payment_plan')
            .whereIn('id', planIds)
            .where('status', 1)
            .select('id', 'name', 'percentage', 'status');
        }
      }
    } catch (error: any) {
      console.error("Error fetching payment plans:", error.message);
    }
    
    // BUILD RESPONSE
    const developerName = property.international_developer_name || property.developer_name;
    const developerImage = property.international_developer_image || property.developer_image;
    
    const response = {
      success: true,
      data: {
        id: property.id,
        name: property.property_name || 'Property',
        slug: property.property_slug || '',
        ref_number: property.RefNumber || null,
        listing_type: property.listing_type || 'Off plan',
        status: property.status || 5,
        featured: property.featured_property === '1' || property.featured_property === 1,
        description: property.description || null,
        type: {
          id: property.property_type || null,
          name: property.property_type || null,
        },
        price: {
          amount: fixedPriceData.price.amount,
          amount_end: fixedPriceData.price.amount_end,
          currency: fixedPriceData.price.currency,
          symbol: fixedPriceData.price.symbol,
          display: formattedPrice,
          display_end: fixedPriceData.price.display_end || null,
          is_price_on_request: fixedPriceData.price.is_price_on_request,
          sale_price: fixedPriceData.price.sale_price,
          listing_price: fixedPriceData.price.listing_price,
          rental_price: fixedPriceData.price.rental_price,
        },
        bedrooms: property.bedroom || 'Studio',
        bathrooms: property.bathrooms || '1 Bath',
        area: {
          value: property.area || null,
          size: property.area_size || 'sq. ft.',
          display: property.area ? `${Number(property.area).toLocaleString('en-US')} sq. ft.` : 'Area on Request',
        },
        location: {
          community: property.location || null,
          city: property.location || 'Dubai',
          latitude: property.map_latitude || null,
          longitude: property.map_longitude || null,
        },
        developer: {
          id: property.developer_id || null,
          name: developerName || null,
          image: developerImage || null,
        },
        agent: {
          id: property.agent_id || null,
          name: property.agent_name || null,
          phone: property.agent_phone || null,
          email: property.agent_email || null,
          photo: property.agent_photo || null,
          rera: property.agent_rera || null,
        },
        image: galleryImages[0] || null,
        gallery_images: galleryImages,
        featured_image_url: featuredImage || galleryImages[0] || null,
        amenities: property.amenities ? property.amenities.split(',').filter(Boolean) : [],
        video_url: property.video_url || null,
        created_at: property.created_at || null,
        handover_date: property.completion_date || null,
        payment_plans: paymentPlans,
        dld_permit: property.dld_permit || null,
        rera_number: property.ReraNumber || null,
        furnishing: property.furnishing || null,
        parking: property.parking || null,
      },
      meta: {
        id: property.id,
        slug: property.property_slug,
        found_by: foundMethod,
        listing_type: property.listing_type,
        price_fixed: true,
        timestamp: new Date().toISOString(),
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}