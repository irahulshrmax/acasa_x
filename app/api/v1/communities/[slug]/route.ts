import { NextRequest, NextResponse } from 'next/server';
import {
  getCommunityBySlug,
  updateCommunityBySlug,
  deleteCommunityBySlug,
  restoreCommunityBySlug,
  permanentDeleteCommunityBySlug,
  type CommunityWithRelations,
} from '@/lib/models/communities';
import { cache } from '@/lib/cache';
import { db } from '@/lib/database';

// ─── HELPER: Extract actual slug from URL pattern ────────────────────

function extractActualSlug(slug: string): string {
  let actualSlug = slug;
  
  const prefix = 'apartments-for-sale-in-';
  if (slug.startsWith(prefix)) {
    actualSlug = slug.replace(prefix, '');
  }
  
  try {
    actualSlug = decodeURIComponent(actualSlug);
  } catch {
    // If decoding fails, use as-is
  }
  
  return actualSlug.trim().replace(/\/+$/, '');
}

// ─── GET: Fetch community by Slug ──────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const actualSlug = extractActualSlug(slug);
    const includeProperties = searchParams.get('include_properties') === 'true';
    const includeRelated = searchParams.get('include_related') === 'true';
    const noCache = searchParams.get('no_cache') === 'true';

    const cacheKey = `community:${actualSlug}:${String(includeProperties)}:${String(includeRelated)}`;
    let community: CommunityWithRelations | null = null;
    let cached = false;

    // ─── Check cache ─────────────────────────────────────────────
    
    if (!noCache && actualSlug) {
      try {
        const cachedData = await cache.get<CommunityWithRelations>(cacheKey);
        if (cachedData) {
          community = cachedData;
          cached = true;
        }
      } catch {
        // Cache read error - continue to fetch from database
      }
    }

    // ─── Fetch from database ─────────────────────────────────────
    
    if (!community) {
      community = await getCommunityBySlug(actualSlug);
      
      // Fallback: Direct DB query if getCommunityBySlug fails
      if (!community) {
        try {
          const knex = await db();
          
          const directCommunity = await knex('community as c')
            .leftJoin('cities as ci', 'c.city_id', 'ci.id')
            .leftJoin('state as s', 'c.state_id', 's.id')
            .leftJoin('country as co', 'c.country_id', 'co.id')
            .where('c.slug', actualSlug)
            .orWhere('c.seo_slug', actualSlug)
            .orWhere('c.seo_slug', slug)
            .first()
            .select(
              'c.*',
              'ci.name as city_name',
              'ci.slug as city_slug',
              's.name as state_name',
              'co.name as country_name'
            );
          
          if (directCommunity) {
            community = directCommunity as CommunityWithRelations;
            
            const propertyCount = await knex('properties')
              .where('community_id', community.id)
              .where('status', 5)
              .count('* as count')
              .first();
            community.property_count = Number(propertyCount?.count || 0);
          }
        } catch {
          // Fallback query error - continue
        }
      }
      
      // Cache if found
      if (community && !noCache && actualSlug) {
        try {
          await cache.set(cacheKey, community, { ttl: 3600 });
        } catch {
          // Cache write error - continue
        }
      }
    }

    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // ─── Build response ──────────────────────────────────────────
    
    let responseData: any = { ...community };

    if (includeProperties && community.id) {
      try {
        const knex = await db();
        const properties = await knex('properties')
          .where('community_id', community.id)
          .where('status', 5)
          .select(
            'id',
            'property_name',
            'property_slug',
            'price',
            'bedroom',
            'bathrooms',
            'area',
            'area_size',
            'featured_image',
            'listing_type'
          )
          .orderBy('price', 'desc')
          .limit(20);

        responseData.properties = properties;
        responseData.property_count = properties.length;
      } catch {
        // Property fetch error - continue without properties
      }
    }

    if (includeRelated && community.similar_location) {
      try {
        const similarIds = community.similar_location
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id));

        if (similarIds.length > 0) {
          const knex = await db();
          const similar = await knex('community')
            .whereIn('id', similarIds)
            .where('status', 1)
            .select('id', 'name', 'slug', 'img', 'latitude', 'longitude')
            .limit(10);

          responseData.similar_communities = similar.map((s: any) => ({
            ...s,
            image_url: s.img ? `/uploads/communities/${s.img}` : null,
          }));
        }
      } catch {
        // Related fetch error - continue without related
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: cached,
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch community', error: error.message },
      { status: 500 }
    );
  }
}

// ─── PUT: Update community by slug ────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const actualSlug = extractActualSlug(slug);

    const existingCommunity = await getCommunityBySlug(actualSlug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    let newSlug = body.slug;
    if (body.name && body.name !== existingCommunity.name) {
      newSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (newSlug && newSlug !== actualSlug) {
      const knex = await db();
      const duplicate = await knex('community')
        .where('slug', newSlug)
        .first()
        .select('id');

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'Community with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const community = await updateCommunityBySlug(actualSlug, {
      name: body.name,
      community_id: body.community_id,
      country_id: body.country_id,
      state_id: body.state_id,
      city_id: body.city_id,
      slug: newSlug || body.slug,
      latitude: body.latitude,
      longitude: body.longitude,
      img: body.img,
      school_img: body.school_img,
      hotel_img: body.hotel_img,
      hospital_img: body.hospital_img,
      train_img: body.train_img,
      bus_img: body.bus_img,
      description: body.description,
      top_community: body.top_community,
      top_projects: body.top_projects,
      featured_project: body.featured_project,
      related_blog: body.related_blog,
      properties: body.properties,
      similar_location: body.similar_location,
      sales_diretor: body.sales_diretor,
      seo_slug: body.seo_slug,
      seo_title: body.seo_title,
      seo_keywork: body.seo_keywork,
      seo_description: body.seo_description,
      featured: body.featured,
      status: body.status,
    });

    if (actualSlug) {
      try {
        await cache.delPattern(`community:${actualSlug}:*`);
        if (newSlug && newSlug !== actualSlug) {
          await cache.delPattern(`community:${newSlug}:*`);
        }
      } catch {
        // Cache clear error - continue
      }
    }

    return NextResponse.json({
      success: true,
      data: community,
      message: 'Community updated successfully',
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update community', error: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete community by slug ─────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const permanent = searchParams.get('permanent') === 'true';
    const actualSlug = extractActualSlug(slug);

    const existingCommunity = await getCommunityBySlug(actualSlug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    let result;

    if (permanent) {
      result = await permanentDeleteCommunityBySlug(actualSlug);
    } else {
      result = await deleteCommunityBySlug(actualSlug);
    }

    if (actualSlug) {
      try {
        await cache.delPattern(`community:${actualSlug}:*`);
      } catch {
        // Cache clear error - continue
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: permanent ? 'Community permanently deleted' : 'Community archived successfully',
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete community', error: error.message },
      { status: 500 }
    );
  }
}

// ─── PATCH: Partial update ────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const actualSlug = extractActualSlug(slug);

    const existingCommunity = await getCommunityBySlug(actualSlug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    let community: CommunityWithRelations | null = null;
    let message = '';

    if (body.action === 'restore') {
      community = await restoreCommunityBySlug(actualSlug);
      message = 'Community restored successfully';
    } else if (body.featured !== undefined) {
      community = await updateCommunityBySlug(actualSlug, {
        featured: body.featured ? 1 : 0,
      });
      message = `Community ${body.featured ? 'featured' : 'unfeatured'} successfully`;
    } else if (body.status !== undefined) {
      community = await updateCommunityBySlug(actualSlug, {
        status: body.status,
      });
      message = `Community ${body.status === 1 ? 'activated' : 'deactivated'} successfully`;
    } else {
      return NextResponse.json(
        { success: false, message: 'No valid action specified' },
        { status: 400 }
      );
    }

    if (community && actualSlug) {
      try {
        await cache.delPattern(`community:${actualSlug}:*`);
      } catch {
        // Cache clear error - continue
      }
    }

    return NextResponse.json({
      success: true,
      data: community,
      message: message,
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to update community', error: error.message },
      { status: 500 }
    );
  }
}