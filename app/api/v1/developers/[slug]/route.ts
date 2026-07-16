import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import {
    getDeveloperImageUrl,
    getDeveloperImageThumb,
} from '@/lib/image-resolver';

function applyDeveloperImage(developer: any): any {
    if (!developer) return developer;
    developer.image_url = getDeveloperImageUrl(developer.image);
    developer.image_thumb = getDeveloperImageThumb(developer.image);
    return developer;
}

// ─── GET DEVELOPER BY SLUG ────────────────────────────────────────────

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        
        console.log("🔍 [API v1 Detail] Fetching developer with slug:", slug);

        const knex = await db();
        let developer = null;

        // ✅ Step 1: Try to find by SEO slug
        developer = await knex('internationaldevelopers')
            .where('seo_slug', slug)
            .where('status', 1)
            .first();

        if (developer) {
            console.log("✅ Found by seo_slug:", developer.id);
        }

        // ✅ Step 2: If not found and slug is numeric, try by ID
        if (!developer && !isNaN(Number(slug))) {
            const id = parseInt(slug);
            console.log("🔍 Trying by ID:", id);
            developer = await knex('internationaldevelopers')
                .where('id', id)
                .where('status', 1)
                .first();
            
            if (developer) {
                console.log("✅ Found by ID:", developer.id);
            }
        }

        // ✅ Step 3: Try by name (partial match)
        if (!developer) {
            console.log("🔍 Trying by name search:", slug);
            developer = await knex('internationaldevelopers')
                .where('name', 'like', `%${slug}%`)
                .orWhere('seo_title', 'like', `%${slug}%`)
                .where('status', 1)
                .first();
            
            if (developer) {
                console.log("✅ Found by name:", developer.id);
            }
        }

        if (!developer) {
            console.log("❌ Developer not found for slug:", slug);
            return NextResponse.json(
                { success: false, message: 'Developer not found' },
                { status: 404 }
            );
        }

        // ─── Get projects ──────────────────────────────────────────────
        // ✅ project_listing ke actual columns ke hisaab se
        const projects = await knex('project_listing')
            .where('developer_id', developer.id)
            .where('status', 1)
            .select(
                'id',
                'ProjectName as name',
                'project_slug as slug',
                'featured_image',
                'price',
                'property_type',
                'bedroom as bedrooms',
                'area',
                'area_size',
                'status',
                'created_at',
                'updated_at'
            );

        // ─── Get properties ─────────────────────────────────────────────
        // ✅ properties table ke actual columns ke hisaab se
        const properties = await knex('properties')
            .where('developer_id', developer.id)
            .where('status', 5)
            .select(
                'id',
                'property_name as name',
                'property_slug as slug',
                'featured_image',
                'price',
                'property_type',
                'bedroom as bedrooms',
                'bathrooms',
                'area',
                'area_size',
                'status',
                'created_at',
                'updated_at'
            );

        // ─── Build response ────────────────────────────────────────────

        const projectCount = projects.length;
        const propertyCount = properties.length;

        const responseData = {
            ...developer,
            project_count: projectCount,
            property_count: propertyCount,
            projects: projects,
            properties: properties,
            image_url: getDeveloperImageUrl(developer.image),
            image_thumb: getDeveloperImageThumb(developer.image),
        };

        console.log("✅ [API v1 Detail] Returning developer:", developer.id, developer.name);

        return NextResponse.json({
            success: true,
            data: responseData,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching developer:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch developer',
                error: error.message,
            },
            { status: 500 }
        );
    }
}