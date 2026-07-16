// app/api/v1/jobs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getJobs,
  createJob,
  getJobStatistics,
  getJobBySlug,
  getFeaturedJobs,
  getJobByTitle,
} from '@/lib/models/jobs';
import { JobFilters } from '@/types/jobs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('stats') === 'true') {
      const stats = await getJobStatistics();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    if (searchParams.get('featured') === 'true') {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6;
      const jobs = await getFeaturedJobs(limit);
      return NextResponse.json({
        success: true,
        data: jobs,
      });
    }

    const slug = searchParams.get('slug');
    if (slug) {
      let job = await getJobBySlug(slug);
      
      if (!job) {
        const titleSearch = slug.replace(/-/g, ' ');
        job = await getJobByTitle(titleSearch);
      }
      
      if (!job) {
        const fallbackJobs = await getJobs({ status: 1, limit: 1, page: 1 });
        job = fallbackJobs.data && fallbackJobs.data.length > 0 ? fallbackJobs.data[0] : null;
      }

      return NextResponse.json({
        success: true,
        data: job,
      });
    }

    const filters: JobFilters = {
      type: searchParams.get('type') || undefined,
      city_name: searchParams.get('city_name') || undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
      keyword: searchParams.get('keyword') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 9,
      sort_by: searchParams.get('sort_by') as any || 'created_at_desc',
    };

    const result = await getJobs(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch jobs', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, message: 'Job title is required' },
        { status: 400 }
      );
    }

    const job = await createJob(body);

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job created successfully',
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create job', error: error.message },
      { status: 500 }
    );
  }
}