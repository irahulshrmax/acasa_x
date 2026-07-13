// app/api/properties/buy/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

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
    
    // FORMAT PRICE
    const formatPrice = (amount: number | null): string => {
      if (!amount || amount <= 0) return 'Price on Request';
      return `AED ${amount.toLocaleString('en-US')}`;
    };
    
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
          amount: property.price || null,
          currency: property.currency_code || 'AED',
          symbol: property.currency_symbol || 'AED',
          display: formatPrice(property.price),
          is_price_on_request: !property.price || property.price <= 0,
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