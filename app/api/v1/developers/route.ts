// app/api/developers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    getDevelopers,
    getFeaturedDevelopers,
    getDeveloperStatistics,
    getDeveloperById,
    getDeveloperBySlug,  // ✅ Added
    createDeveloper,
    updateDeveloperById,
    deleteDeveloperById,
    permanentDeleteDeveloperById,
    restoreDeveloperById,
} from '@/lib/models/developer';

// ─── Helper: Fix image URL ──────────────────────────────────────────────

function fixDeveloperImage(developer: any): any {
    if (!developer) return developer;
    
    let imageUrl = developer.image_url;
    let variations = developer.image_variations || [];

    // If image_url doesn't exist or is invalid, build from image field
    if (!imageUrl || imageUrl === 'h' || imageUrl === '' || imageUrl.includes('no-image')) {
        if (developer.image) {
            const cleanPath = developer.image.replace(/^\/+/, '');
            // ✅ Extension already in filename, just add base URL
            imageUrl = `https://acasa.ae/upload/developers/${cleanPath}`;
            variations = [
                `https://acasa.ae/upload/developers/${cleanPath}`,
                `https://acasa.ae/upload/developer/${cleanPath}`,
                `https://acasa.ae/upload/media/${cleanPath}`,
                `https://acasa.ae/upload/logos/${cleanPath}`,
            ];
        } else {
            imageUrl = 'https://acasa.ae/upload/no-image.png';
            variations = ['https://acasa.ae/upload/no-image.png'];
        }
    }

    return {
        ...developer,
        image_url: imageUrl,
        image_variations: variations,
    };
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const featured = searchParams.get('featured') === 'true';
        const stats = searchParams.get('stats') === 'true';
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const showAll = searchParams.get('show_all') === 'true';

        // ─── Statistics ──────────────────────────────────────────────
        if (stats) {
            const result = await getDeveloperStatistics();
            return NextResponse.json({
                success: true,
                data: result,
                cached: false,
            });
        }

        // ─── Get by ID ──────────────────────────────────────────────
        if (id) {
            const developer = await getDeveloperById(parseInt(id));
            if (!developer) {
                return NextResponse.json(
                    { success: false, message: 'Developer not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({
                success: true,
                data: fixDeveloperImage(developer),
                cached: false,
            });
        }

        // ─── Get by Slug ─────────────────────────────────────────────
        if (slug) {
            const developer = await getDeveloperBySlug(slug);  // ✅ Now works
            if (!developer) {
                return NextResponse.json(
                    { success: false, message: 'Developer not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({
                success: true,
                data: fixDeveloperImage(developer),
                cached: false,
            });
        }

        // ─── Featured Developers ─────────────────────────────────────
        if (featured) {
            const result = await getFeaturedDevelopers(limit);
            const fixedData = result.data.map(fixDeveloperImage);
            
            return NextResponse.json({
                success: true,
                data: fixedData,
                meta: result.meta,
                cached: false,
            });
        }

        // ─── Get All International Developers ───────────────────────
        const filters = {
            status: searchParams.get('status') ? parseInt(searchParams.get('status')!) : 1,
            keyword: searchParams.get('keyword') || undefined,
            sort_by: (searchParams.get('sort_by') as any) || 'name_asc',
            page,
            limit: showAll ? 9999 : limit,
        };

        const result = await getDevelopers(filters);
        const fixedData = result.data.map(fixDeveloperImage);

        return NextResponse.json({
            success: true,
            data: fixedData,
            meta: result.meta,
            cached: false,
        });
        
    } catch (error: any) {
        console.error('Error fetching developers:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch developers', error: error.message },
            { status: 500 }
        );
    }
}

// ─── POST Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { success: false, message: 'Developer name is required' },
                { status: 400 }
            );
        }

        const developer = await createDeveloper(body);

        return NextResponse.json({
            success: true,
            data: fixDeveloperImage(developer),
            message: 'Developer created successfully',
        });
    } catch (error: any) {
        console.error('Error creating developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create developer', error: error.message },
            { status: 500 }
        );
    }
}

// ─── PUT Handler ─────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const id = body.id || request.nextUrl.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Developer ID is required' },
                { status: 400 }
            );
        }

        const existing = await getDeveloperById(parseInt(id));
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        const developer = await updateDeveloperById(parseInt(id), body);

        return NextResponse.json({
            success: true,
            data: fixDeveloperImage(developer),
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

// ─── DELETE Handler ──────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id');
        const permanent = request.nextUrl.searchParams.get('permanent') === 'true';

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Developer ID is required' },
                { status: 400 }
            );
        }

        const existing = await getDeveloperById(parseInt(id));
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        let result;
        if (permanent) {
            result = await permanentDeleteDeveloperById(parseInt(id));
        } else {
            result = await deleteDeveloperById(parseInt(id));
        }

        return NextResponse.json({
            success: true,
            data: result,
            message: permanent ? 'Developer permanently deleted' : 'Developer archived',
        });
    } catch (error: any) {
        console.error('Error deleting developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete developer', error: error.message },
            { status: 500 }
        );
    }
}

// ─── PATCH Handler (Restore) ────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Developer ID is required' },
                { status: 400 }
            );
        }

        const existing = await getDeveloperById(parseInt(id));
        if (!existing) {
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        const developer = await restoreDeveloperById(parseInt(id));

        return NextResponse.json({
            success: true,
            data: fixDeveloperImage(developer),
            message: 'Developer restored successfully',
        });
    } catch (error: any) {
        console.error('Error restoring developer:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to restore developer', error: error.message },
            { status: 500 }
        );
    }
}