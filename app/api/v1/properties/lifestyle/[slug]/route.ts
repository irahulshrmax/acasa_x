import { NextRequest, NextResponse } from 'next/server';
import { getLifestylePropertyBySlug } from '@/lib/models/lifestyle-properties';

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

    const cacheKey = `lifestyle:detail:${slug}`;
    const cachedData = getCached(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        meta: {
          slug,
          listing_type: 'Lifestyle',
          timestamp: new Date().toISOString()
        }
      });
    }

    const property = await getLifestylePropertyBySlug(slug);

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Lifestyle property not found' },
        { status: 404 }
      );
    }

    setCached(cacheKey, property);

    return NextResponse.json({
      success: true,
      data: property,
      meta: {
        slug,
        listing_type: 'Lifestyle',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch lifestyle property',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';