// app/api/projects/related/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getRelatedProjects } from '@/lib/models/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6;

    const result = await getRelatedProjects(projectId, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('Error fetching related projects:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch related projects', error: error.message },
      { status: 500 }
    );
  }
}