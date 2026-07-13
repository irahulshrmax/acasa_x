// app/api/v1/neighborhoods/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getNeighborhoodBySlug, getNeighborhoodById } from '@/lib/models/neighborhood';
import { db } from '@/lib/database';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeProperties = searchParams.get('properties') !== 'false';
    const includeSimilar = searchParams.get('similar') !== 'false';

    let neighborhood = null;

    // Case 1: Slug is numeric ID (e.g., "29")
    if (!isNaN(parseInt(slug))) {
      neighborhood = await getNeighborhoodById(parseInt(slug));
    } 
    // Case 2: Slug is slug-format (e.g., "29-dubai-creek-harbour")
    else {
      // Try to extract numeric ID from slug
      const numericSlug = slug.split('-')[0];
      if (!isNaN(parseInt(numericSlug))) {
        neighborhood = await getNeighborhoodById(parseInt(numericSlug));
      }
      
      // If not found by ID, try by slug
      if (!neighborhood) {
        neighborhood = await getNeighborhoodBySlug(slug);
      }
    }

    if (!neighborhood) {
      return NextResponse.json(
        { success: false, error: 'Neighborhood not found' },
        { status: 404 }
      );
    }

    // ─── BUILD RESPONSE ──────────────────────────────────────────────
    const responseData: any = {
      ...neighborhood,
    };

    // ─── ADD SIMILAR NEIGHBORHOODS ────────────────────────────────
    if (includeSimilar) {
      try {
        const knex = await db();
        const similar = await knex('community')
          .where('status', 1)
          .where('id', '!=', neighborhood.id)
          .where('city_id', neighborhood.city_id || 1)
          .select('id', 'name', 'slug', 'img as image', 'city_id')
          .orderBy('name', 'asc')
          .limit(6);

        responseData.similar_neighborhoods = similar.map((s: any) => ({
          ...s,
          image: s.image ? getImageUrl(s.image) : null,
        }));
      } catch (error) {
        responseData.similar_neighborhoods = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        slug,
        id: neighborhood.id,
        timestamp: new Date().toISOString(),
        has_similar: responseData.similar_neighborhoods?.length > 0,
        similar_count: responseData.similar_neighborhoods?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('Error fetching neighborhood:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch neighborhood',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function for image URL (same as model)
function getImageUrl(rawPath: string | null | undefined): string {
  if (!rawPath || /no-image/i.test(rawPath)) {
    return 'https://acasa.ae/upload/no-image.png';
  }
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  
  const clean = rawPath.replace(/^\/+/, '');
  const baseName = clean.replace(/\.[^.]+$/, '');
  
  return `https://acasa.ae/upload/locations/${baseName}.jpg`;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';