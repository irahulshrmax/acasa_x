// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  getProjectById, 
  getProjectBySlug, 
  updateProject, 
  deleteProject 
} from '@/lib/models/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Project ID or slug is required' },
        { status: 400 }
      );
    }

    let project;

    if (!isNaN(parseInt(id))) {
      project = await getProjectById(parseInt(id));
    } else {
      project = await getProjectBySlug(id);
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch project', error: error.message },
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

    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existingProject = await getProjectById(idNum);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    const project = await updateProject(idNum, body);

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update project', error: error.message },
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

    if (isNaN(idNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const existingProject = await getProjectById(idNum);
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      );
    }

    const result = await deleteProject(idNum);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete project', error: error.message },
      { status: 500 }
    );
  }
}