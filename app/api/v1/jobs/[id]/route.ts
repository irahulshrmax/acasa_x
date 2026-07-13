// app/api/jobs/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getJobById,
  getJobBySlug,
  updateJob,
  deleteJob,
  permanentDeleteJob,
} from '@/lib/models/jobs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let job;

    // Check if ID is numeric
    if (!isNaN(parseInt(id))) {
      job = await getJobById(parseInt(id));
    } else {
      job = await getJobBySlug(id);
    }

    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch job', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const body = await request.json();

    const existing = await getJobById(idNum);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    const job = await updateJob(idNum, body);

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update job', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    const existing = await getJobById(idNum);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }

    let result;
    if (permanent) {
      result = await permanentDeleteJob(idNum);
    } else {
      result = await deleteJob(idNum);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: permanent ? 'Job permanently deleted' : 'Job archived',
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete job', error: error.message },
      { status: 500 }
    );
  }
}