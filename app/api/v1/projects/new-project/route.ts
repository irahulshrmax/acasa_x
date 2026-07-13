// app/api/v1/new-projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getProjects,
  getFeaturedProjects,
  getRecentProjects,
  getProjectSearchFilters,
  getProjectStatistics,
  createProject,
  type ProjectFilters,
} from '@/lib/models/projects';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const stats = searchParams.get('stats');
    const filters = searchParams.get('filters');

    // ─── STATISTICS ──────────────────────────────────────────────────
    if (stats === 'true') {
      const type = searchParams.get('type') || 'all';
      const result = await getProjectStatistics(type);
      return NextResponse.json({
        success: true,
        data: result,
        meta: { type: 'statistics', timestamp: new Date().toISOString() },
      });
    }

    // ─── SEARCH FILTERS ─────────────────────────────────────────────
    if (filters === 'true') {
      const result = await getProjectSearchFilters();
      return NextResponse.json({
        success: true,
        data: result,
        meta: { type: 'filters', timestamp: new Date().toISOString() },
      });
    }

    // ─── FEATURED ────────────────────────────────────────────────────
    if (action === 'featured') {
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getFeaturedProjects(limit);
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: { ...result.meta, action: 'featured' },
      });
    }

    // ─── RECENT ──────────────────────────────────────────────────────
    if (action === 'recent') {
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const result = await getRecentProjects(limit);
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: { ...result.meta, action: 'recent' },
      });
    }

    // ─── DEFAULT: ALL PROJECTS ──────────────────────────────────────
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    );

    const projectFilters: ProjectFilters = {
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
      page,
      limit,
    };

    const result = await getProjects(projectFilters);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        ...result.meta,
        filters: projectFilters,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch projects',
        error: error.message,
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
      body.project_slug = body.ProjectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const project = await createProject({
      ...body,
      status: body.status || 1,
      template: body.template || 1,
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';