// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  getProjects, 
  createProject, 
  getProjectSearchFilters 
} from '@/lib/models/projects';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get filters
    if (searchParams.get('filters') === 'true') {
      const filters = await getProjectSearchFilters();
      return NextResponse.json({
        success: true,
        data: filters,
      });
    }

    // Build filters
    const filters = {
      listing_type: searchParams.get('listing_type') || undefined,
      city_id: searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!) : undefined,
      community_id: searchParams.get('community_id') ? parseInt(searchParams.get('community_id')!) : undefined,
      sub_community_id: searchParams.get('sub_community_id') ? parseInt(searchParams.get('sub_community_id')!) : undefined,
      min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
      bedroom: searchParams.get('bedroom') || undefined,
      property_type: searchParams.get('property_type') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
      featured: searchParams.get('featured') === 'true',
      keyword: searchParams.get('keyword') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'newest',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
    };

    const result = await getProjects(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch projects', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.ProjectName) {
      return NextResponse.json(
        { success: false, message: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!body.project_slug) {
      return NextResponse.json(
        { success: false, message: 'Project slug is required' },
        { status: 400 }
      );
    }

    const project = await createProject({
      ...body,
      status: body.status || 1,
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create project', error: error.message },
      { status: 500 }
    );
  }
}