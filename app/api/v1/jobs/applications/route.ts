// app/api/jobs/applications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getJobApplications,
  createJobApplication,
  getApplicationsByEmail,
  getApplicationsByJob,
} from '@/lib/models/jobs';
import { JobApplicationFilters } from '@/types/jobs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for email lookup
    const email = searchParams.get('email');
    if (email) {
      const applications = await getApplicationsByEmail(email);
      return NextResponse.json({
        success: true,
        data: applications,
      });
    }

    // Check for job_id lookup
    const jobId = searchParams.get('job_id');
    if (jobId) {
      const filters: JobApplicationFilters = {
        job_id: parseInt(jobId),
        status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      };
      const result = await getApplicationsByJob(parseInt(jobId), filters);
      return NextResponse.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    }

    // Build filters
    const filters: JobApplicationFilters = {
      job_id: searchParams.get('job_id') ? parseInt(searchParams.get('job_id')!) : undefined,
      status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined,
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      sort_by: searchParams.get('sort_by') as any || 'apply_date_desc',
    };

    const result = await getJobApplications(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.job_id) {
      return NextResponse.json(
        { success: false, message: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!body.first_name) {
      return NextResponse.json(
        { success: false, message: 'First name is required' },
        { status: 400 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const application = await createJobApplication(body);

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating job application:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}