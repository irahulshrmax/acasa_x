// app/api/v1/communities/[slug]/route.ts
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

// ─── GET: Fetch community by Slug ──────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    const includeProperties = searchParams.get('include_properties') === 'true';
    const includeRelated = searchParams.get('include_related') === 'true';
    const noCache = searchParams.get('no_cache') === 'true';

    // ─── Check cache first ─────────────────────────────────────────────
    
    const cacheKey = `community:${slug}:${String(includeProperties)}:${String(includeRelated)}`;
    let community: CommunityWithRelations | null = null;
    let cached = false;

    if (!noCache && slug) {
      try {
        const cachedData = await cache.get<CommunityWithRelations>(cacheKey);
        if (cachedData) {
          community = cachedData;
          cached = true;
        }
      } catch (error) {
        console.warn('Cache read error:', error);
      }
    }

    // ─── If not in cache, fetch from database ─────────────────────────
    
    if (!community) {
      community = await getCommunityBySlug(slug);
      
      if (community && !noCache && slug) {
        try {
          // ✅ FIX: Pass object with ttl property
          await cache.set(cacheKey, community, { ttl: 3600 }); // Cache for 1 hour
        } catch (error) {
          console.warn('Cache write error:', error);
        }
      }
    }

    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // ─── Include properties if requested ──────────────────────────────
    
    let responseData: any = { ...community };

    if (includeProperties && community.id) {
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
    }

    // ─── Include related communities if requested ─────────────────────
    
    if (includeRelated && community.similar_location) {
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
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: cached,
    });
  } catch (error: any) {
    console.error('Error fetching community:', error);
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

    // ─── Check if community exists ─────────────────────────────────────
    
    const existingCommunity = await getCommunityBySlug(slug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    // ─── Generate new slug if name changes ────────────────────────────
    
    let newSlug = body.slug;
    if (body.name && body.name !== existingCommunity.name) {
      newSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // ─── Check slug uniqueness ─────────────────────────────────────────
    
    if (newSlug && newSlug !== slug) {
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

    // ─── Update community ──────────────────────────────────────────────
    
    const community = await updateCommunityBySlug(slug, {
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

    // ─── Clear cache for this community ───────────────────────────────
    
    if (slug) {
      try {
        // Clear all cache variations for this slug
        await cache.delPattern(`community:${slug}:*`);
        
        // Also clear the new slug cache if it changed
        if (newSlug && newSlug !== slug) {
          await cache.delPattern(`community:${newSlug}:*`);
        }
      } catch (error) {
        console.warn('Cache clear error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: community,
      message: 'Community updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating community:', error);
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

    const existingCommunity = await getCommunityBySlug(slug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    let result;

    if (permanent) {
      result = await permanentDeleteCommunityBySlug(slug);
    } else {
      result = await deleteCommunityBySlug(slug);
    }

    // ─── Clear cache for this community ───────────────────────────────
    
    if (slug) {
      try {
        await cache.delPattern(`community:${slug}:*`);
      } catch (error) {
        console.warn('Cache clear error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: permanent ? 'Community permanently deleted' : 'Community archived successfully',
    });
  } catch (error: any) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete community', error: error.message },
      { status: 500 }
    );
  }
}

// ─── PATCH: Partial update (featured, status, restore) ──────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const existingCommunity = await getCommunityBySlug(slug);
    if (!existingCommunity) {
      return NextResponse.json(
        { success: false, message: 'Community not found' },
        { status: 404 }
      );
    }

    let community: CommunityWithRelations | null = null;
    let message = '';

    // ─── Restore community ─────────────────────────────────────────────
    
    if (body.action === 'restore') {
      community = await restoreCommunityBySlug(slug);
      message = 'Community restored successfully';
    }

    // ─── Update featured status ────────────────────────────────────────
    
    else if (body.featured !== undefined) {
      community = await updateCommunityBySlug(slug, {
        featured: body.featured ? 1 : 0,
      });
      message = `Community ${body.featured ? 'featured' : 'unfeatured'} successfully`;
    }

    // ─── Update status ──────────────────────────────────────────────────
    
    else if (body.status !== undefined) {
      community = await updateCommunityBySlug(slug, {
        status: body.status,
      });
      message = `Community ${body.status === 1 ? 'activated' : 'deactivated'} successfully`;
    }

    else {
      return NextResponse.json(
        { success: false, message: 'No valid action specified' },
        { status: 400 }
      );
    }

    // ─── Clear cache for this community ───────────────────────────────
    
    if (community && slug) {
      try {
        await cache.delPattern(`community:${slug}:*`);
      } catch (error) {
        console.warn('Cache clear error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: community,
      message: message,
    });
  } catch (error: any) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update community', error: error.message },
      { status: 500 }
    );
  }
}