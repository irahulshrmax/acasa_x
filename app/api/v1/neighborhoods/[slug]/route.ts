// app/api/v1/neighborhoods/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getNeighborhoodBySlug, getNeighborhoodById } from '@/lib/models/neighborhood';
import { db } from '@/lib/database';

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

    let neighborhood = await getNeighborhoodBySlug(slug);
    
    if (!neighborhood) {
      const numericId = parseInt(slug, 10);
      if (!isNaN(numericId)) {
        neighborhood = await getNeighborhoodById(numericId);
      }
    }

    if (!neighborhood) {
      const searchSlug = slug.replace(/-/g, ' ');
      const knex = await db();
      const found = await knex('community')
        .where('name', 'like', `%${searchSlug}%`)
        .where('status', 1)
        .first();
      
      if (found) {
        neighborhood = await getNeighborhoodById(found.id);
      }
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