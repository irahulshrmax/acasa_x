// app/api/v1/neighborhoods/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getNeighborhoodBySlug } from '@/lib/models/neighborhood';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    let { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Extract numeric ID from slug (e.g., "29-dubai-creek-harbour" -> "29")
    const numericSlug = slug.split('-')[0];
    
    // Try to find by numeric slug first
    let neighborhood = await getNeighborhoodBySlug(numericSlug);
    
    // If not found, try with original slug
    if (!neighborhood) {
      neighborhood = await getNeighborhoodBySlug(slug);
    }

    if (!neighborhood) {
      return NextResponse.json(
        { success: false, error: 'Neighborhood not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: neighborhood,
      meta: {
        slug,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';