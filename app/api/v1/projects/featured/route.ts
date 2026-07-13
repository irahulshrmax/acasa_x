// app/api/projects/featured/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedProjects } from '@/lib/models/projects';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    const result = await getFeaturedProjects(limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch featured projects', error: error.message },
      { status: 500 }
    );
  }
}