import { NextRequest, NextResponse } from 'next/server';
import {
    getDeveloperById,
    updateDeveloperById,
    deleteDeveloperById,
    restoreDeveloperById,
    permanentDeleteDeveloperById,
} from '@/lib/models/developer';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const idNum = parseInt(id);

        const developer = await getDeveloperById(idNum);
        if (!developer) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: developer,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch developer', error: error.message },
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

        const existingDeveloper = await getDeveloperById(idNum);
        if (!existingDeveloper) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        const developer = await updateDeveloperById(idNum, body);

        return NextResponse.json({
            success: true,
            data: developer,
            message: 'Developer updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update developer', error: error.message },
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

        const existingDeveloper = await getDeveloperById(idNum);
        if (!existingDeveloper) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        let result;
        if (permanent) {
            result = await permanentDeleteDeveloperById(idNum);
            return NextResponse.json({
                success: true,
                data: result,
                message: 'Developer permanently deleted',
            });
        } else {
            result = await deleteDeveloperById(idNum);
            return NextResponse.json({
                success: true,
                data: result,
                message: 'Developer archived successfully',
            });
        }
    } catch (error: any) {
        console.error('Error deleting developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete developer', error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const idNum = parseInt(id);
        const body = await request.json();

        const existingDeveloper = await getDeveloperById(idNum);
        if (!existingDeveloper) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        if (body.action === 'restore') {
            const developer = await restoreDeveloperById(idNum);
            return NextResponse.json({
                success: true,
                data: developer,
                message: 'Developer restored successfully',
            });
        }

        if (body.status !== undefined) {
            const developer = await updateDeveloperById(idNum, { status: body.status });
            return NextResponse.json({
                success: true,
                data: developer,
                message: `Developer ${body.status === 1 ? 'activated' : 'deactivated'} successfully`,
            });
        }

        return NextResponse.json(
            { success: false, message: 'No valid action specified' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error updating developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update developer', error: error.message },
            { status: 500 }
        );
    }
}